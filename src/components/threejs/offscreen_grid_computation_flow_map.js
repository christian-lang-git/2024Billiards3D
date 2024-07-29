import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import { OffscreenRenderer } from "@/components/threejs/offscreen_renderer"


const glsl = x => x[0];
/**
 * TODO
 * SHARES RenderTarget with seeds
 * One render call computes a single return map.
 * Input can be either seeds, or the result of a previous return map.
 * The resulting texture stores return position and direction as well as success indicator, advection time, arc length and step counter:
 * 
 * size 2*domain_pixel_x, 2*domain_pixel_y
 * 
 * --> 4 vec4 per grid node
 * 
 * 1. vec4: 3 floats for end position (in case we do not terminate on the plane)
 * 2. vec4: 3 floats for end velocity
 * 3. vec4: 1 float for success indicator (0=no return, 1=return) --> for first slice: later in a second step: overwrite this with number of succesfull returns (this might be an interesting number to plot as scalar field)
 *          1 float for advection time
 *          1 float for arc length
 *          1 float for step counter
 * 4. vec4: [value=0] 1 float for ftle value (computed later)
 *  	    3 placeholder
 */
class OffscreenGridComputationFlowMap extends OffscreenGridComputation {


    constructor(renderer, simulationParameters, useAnglePlane, signum) {
        super(renderer, simulationParameters, useAnglePlane)
        this.signum = signum;
    }

    link(offscreenRendererSeedsAndReturns){
        this.offscreenRendererSeedsAndReturns = offscreenRendererSeedsAndReturns;
    }

    getNumPixelsPerNodeX() {
        return 2;
    }

    getNumPixelsPerNodeY() {
        return 2;
    }

    getNumLayers(){
        return 1;
    }

    addAdditionalUniforms() {
        this.uniforms["texture_seeds_and_returns"] = { type: 'sampler3D', value: this.offscreenRendererSeedsAndReturns.renderTarget.texture};
        this.uniforms["max_steps"] = { type: 'int', value: 0};
        this.uniforms["step_size"] = { type: 'float', value: 0};
        this.uniforms["signum"] = { type: 'float', value: 1.0};//TODO: must be set when switching to forward/backward direction  
        
        console.warn("FLOW MAP uniforms", this.uniforms);
    }

    setAdditionalUniforms() {
        this.dummy_plane_mesh.material.uniforms.texture_seeds_and_returns.value = this.offscreenRendererSeedsAndReturns.renderTarget.texture;     
        this.dummy_plane_mesh.material.uniforms.max_steps.value = this.simulationParameters.max_steps;       
        this.dummy_plane_mesh.material.uniforms.step_size.value = this.simulationParameters.step_size;    
        this.dummy_plane_mesh.material.uniforms.signum.value = this.signum;//use signum from constructor          
 
    }

    fragmentShaderMethodComputation() {
        return glsl`

            ivec3 pointer = ivec3(x_pixel_mod, y_pixel_mod, target_layer_index-1);
            vec3 seed_position = texelFetch(texture_seeds_and_returns, pointer, 0).xyz;
            float x = seed_position.x;
            float y = seed_position.y;
            float z = seed_position.z;
            vec3 seed_direction = texelFetch(texture_seeds_and_returns, pointer+ivec3(int(planeDimensionsPixel.x),0,0), 0).xyz;
            vec4 data3 = texelFetch(texture_seeds_and_returns, pointer+ivec3(0,int(planeDimensionsPixel.y),0),0);
            float old_success_float = data3.x;
            float advection_time = data3.y;
            float arc_length = data3.z;
            float hamiltonian_smallest = texelFetch(texture_seeds_and_returns, pointer, 0).w;
            float hamiltonian_largest = texelFetch(texture_seeds_and_returns, pointer+ivec3(int(planeDimensionsPixel.x),0,0), 0).w;
            

            vec3 current_position = seed_position;
            current_position.z = 0.0;
            vec3 current_direction = seed_direction;

            bool success = false;//do we reach the plane intersection
            float success_float = 0.0;
            bool isOnPositiveZ = f_direction(current_position, current_direction, signum).z > 0.0;

            //if this is not the first return --> only continue if previous was success
            //if this is the first return --> only continue if seed was ok
            if(old_success_float < 0.5){
                outputColor = vec4(0.0, 0.0, 0.0, 1.0); 
                return;
            }

            for (int i = 0; i < max_steps; i++) {

                //---------- START OF RK4 ----------
                vec3 k1 = step_size * f_position(current_position, current_direction, signum);
                vec3 l1 = step_size * f_direction(current_position, current_direction, signum);

                vec3 k2 = step_size * f_position(current_position + k1/2.0, current_direction + l1/2.0, signum);
                vec3 l2 = step_size * f_direction(current_position + k1/2.0, current_direction + l1/2.0, signum);

                vec3 k3 = step_size * f_position(current_position + k2/2.0, current_direction + l2/2.0, signum);
                vec3 l3 = step_size * f_direction(current_position + k2/2.0, current_direction + l2/2.0, signum);

                vec3 k4 = step_size * f_position(current_position + k3, current_direction + l3, signum);
                vec3 l4 = step_size * f_direction(current_position + k3, current_direction + l3, signum);

                //CALCULATE: vec3 next = current + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6;
                vec3 add_position = k1 / 6.0 + k2 / 3.0 + k3 / 3.0 + k4 / 6.0;
                vec3 add_direction = l1 / 6.0 + l2 / 3.0 + l3 / 3.0 + l4 / 6.0;
                vec3 next_position = current_position + add_position;
                vec3 next_direction = current_direction + add_direction;

                //debug: hamiltonian
                float H = calculateHamiltonian(current_position[0], current_position[1], current_position[2],
                    current_direction[0], current_direction[1], current_direction[2],
                    mu, angular_velocity);
                hamiltonian_smallest = min(H, hamiltonian_smallest);
                hamiltonian_largest = max(H, hamiltonian_largest);

                float segment_length = length(add_position);
                float next_arc_length = arc_length + segment_length;
                float next_advection_time = advection_time + step_size;

                //TODO check alternative termination conditions
                if(false){
                    success = false;//we did not reach the plane
                    break;
                }
                
                //check plane intersection termination condition
                if(current_position.z > 0.0){
                    //we are currently at z > 0
                    if(next_position.z <= 0.0){
                        success = true;//we did reach the plane
                        break;
                    }
                }
                if (current_position.z < 0.0){
                    //we are currently at z < 0
                    if(next_position.z >= 0.0){
                        success = true;//we did reach the plane
                        break;
                    }
                }


                //set values for next iteration
                current_position = next_position;
                current_direction = next_direction;
                arc_length = next_arc_length;
                advection_time = next_advection_time;
            }


            if(success){
                //TODO find better intersection point with either bisection or interpolation
                success_float = 1.0;
            }

            if(virtual_texture_y == 0){
                if(virtual_texture_x == 0){
                    outputColor = vec4(current_position, hamiltonian_smallest); 
                    //outputColor = vec4(0.0, current_position.y, 0.0, 1.0); 
                }
                else{
                    outputColor = vec4(current_direction, hamiltonian_largest); 
                }
            }
            else{
                if(virtual_texture_x == 0){
                    outputColor = vec4(success_float, advection_time, arc_length, 1.0); 
                }
                else{
                    outputColor = vec4(1.0, 0.5, 1.0, 1.0); 
                }
            }
            
        `
    }

    fragmentShaderAdditionalMethodDeclarations(){
        return glsl`
        vec3 f_position(vec3 position, vec3 direction, float signum);
        vec3 f_direction(vec3 position, vec3 direction, float signum);
        float calculateHamiltonian(float x, float y, float z, float px, float py, float pz, float mu, float n);
        `;
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return glsl`
        vec3 f_position(vec3 position, vec3 direction, float signum) {
            float n = angular_velocity;
    
            float x = position.x;
            float y = position.y;
            //float z = position.z;
    
            float px = direction.x;
            float py = direction.y;
            float pz = direction.z;
    
            //equations of motion
            float u = px + n * y;
            float v = py - n * x;
            float w = pz;
    
            return vec3(u * signum, v * signum, w * signum);
        }
    
        vec3 f_direction(vec3 position, vec3 direction, float signum) {
            float n = angular_velocity;
            
    
            float x = position.x;
            float y = position.y;
            float z = position.z;
    
            float px = direction.x;
            float py = direction.y;
            float pz = direction.z;
    
            //helper variables
            float muplusx = mu + x;
            float muminusone = mu - 1.0;
            float muplusxminusone = muplusx - 1.0;
            float left_denominator = pow((muplusxminusone * muplusxminusone + y * y + z * z), (3.0 / 2.0));
            float right_denominator = pow((muplusx * muplusx + y * y + z * z), (3.0 / 2.0));
    
            float dphi_dx = (mu * muplusxminusone) / left_denominator - (muminusone * muplusx) / right_denominator;
            float dphi_dy = (mu * y) / left_denominator - (muminusone * y) / right_denominator;
            float dphi_dz = (mu * z) / left_denominator - (muminusone * z) / right_denominator;
    
            //equations of motion
            float u = n * py - dphi_dx;
            float v = -n * px - dphi_dy;
            float w = - dphi_dz;
    
            return vec3(u * signum, v * signum, w * signum);
        }

        float calculateHamiltonian(float x, float y, float z, float px, float py, float pz, float mu, float n){
            float L = 0.5*(px*px + py*py + pz*pz);
            float phi = - (1.0-mu)/(sqrt((x+mu)*(x+mu) + y*y + z*z)) - mu/(sqrt((x-(1.0-mu))*(x-(1.0-mu)) + y*y + z*z));
            float R = n*(y*px - x*py);        
            return L + phi + R;
        }
        `
    }

}

export { OffscreenGridComputationFlowMap }