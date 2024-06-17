import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import { OffscreenRenderer } from "@/components/threejs/offscreen_renderer"

const glsl = x => x[0];

/**
 * TODO
 * The resulting texture stores positions and velocities of the seeds and is padded with additional values to have the same layout as flow map:
 * 
 * size 2*domain_pixel_x, 2*domain_pixel_y
 * 
 * --> 4 vec4 per grid node
 * 
 * 1. vec4: 3 floats for position
 * 2. vec4: 3 floats for velocity
 * 3. vec4: [value=0] to have same layout as flowmap
 *          [value=0] to have same layout as flowmap
 *          [value=0] to have same layout as flowmap
 *          [value=0] to have same layout as flowmap
 * 4. vec4: [value=0] to have same layout as flowmap
 *  	    3 placeholder
 */
class OffscreenRendererSeeds extends OffscreenRenderer {

    constructor(renderer, simulationParameters, mode_constant_direction) {
        super(renderer, simulationParameters);
        this.mode_constant_direction = mode_constant_direction;
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
        this.uniforms["seed_direction"] = { type: 'vec3', value: new THREE.Vector3(0, 0, 0) };
        this.uniforms["seed_position"] = { type: 'vec3', value: new THREE.Vector3(0, 0, 0) };
        this.uniforms["seed_energy"] = { type: 'float', value: 1.0 };
        this.uniforms["use_constant_velocity"] = { type: 'bool', value: false };
        this.uniforms["mode_constant_direction"] = { type: 'bool', value: true };
    }

    setAdditionalUniforms() {
        this.dummy_plane_mesh.material.uniforms.seed_direction.value.x = this.simulationParameters.seed_direction_x;
        this.dummy_plane_mesh.material.uniforms.seed_direction.value.y = this.simulationParameters.seed_direction_y;
        this.dummy_plane_mesh.material.uniforms.seed_direction.value.z = this.simulationParameters.seed_direction_z;
        this.dummy_plane_mesh.material.uniforms.seed_position.value.x = this.simulationParameters.seed_position_x;
        this.dummy_plane_mesh.material.uniforms.seed_position.value.y = this.simulationParameters.seed_position_y;        
        this.dummy_plane_mesh.material.uniforms.seed_energy.value = this.simulationParameters.seed_energy;
        this.dummy_plane_mesh.material.uniforms.use_constant_velocity.value = this.simulationParameters.use_constant_velocity;  
        
        //this value is set during constructor to differentiate between left and right view
        this.dummy_plane_mesh.material.uniforms.mode_constant_direction.value = this.mode_constant_direction;
    }

    fragmentShaderMethodComputation() {
        return glsl`
            if(mode_constant_direction){
                computeSeedConstantDirection(virtual_texture_x, virtual_texture_y, world_x, world_y);
            }
            else{
                computeSeedConstantPosition(virtual_texture_x, virtual_texture_y, theta_radians, phi_radians);
            }    
        `
    }

    fragmentShaderAdditionalMethodDeclarations(){
        return glsl`
        void computeSeedConstantDirection(int virtual_texture_x, int virtual_texture_y, float world_x, float world_y);
        void computeSeedConstantPosition(int virtual_texture_x, int virtual_texture_y, float theta_radians, float phi_radians);
        `;
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return glsl`

        void computeSeedConstantDirection(int virtual_texture_x, int virtual_texture_y, float world_x, float world_y){
            float x = world_x;
            float y = world_y;
            float z = 0.0;
            if(virtual_texture_y == 0){                
                if(virtual_texture_x == 0){
                    //POSITION CALCULATION
                    outputColor = vec4(x, y, 0.0, 1.0);
                }        
                if(virtual_texture_x == 1){
                    //VELOCITY CALCULATION
                    if(use_constant_velocity){
                        //if set to true, use constant velocity
                        vec3 seed_velocity = normalize(seed_direction) * seed_energy;//TODO placeholder
                        outputColor = vec4(seed_velocity.x, seed_velocity.y, seed_velocity.z, 1.0);
                    }
                    else{
                        //if set to false, use constant hamiltonian
                        vec3 dir_normalized = normalize(seed_direction);

                        float dir_x = dir_normalized.x;
                        float dir_y = dir_normalized.y;
                        float dir_z = dir_normalized.z;
    
                        float n = angular_velocity;
                        float H = seed_energy;
                        float phi = - (1.0-mu)/(sqrt((x+mu)*(x+mu) + y*y + z*z)) - mu/(sqrt((x-(1.0-mu))*(x-(1.0-mu)) + y*y + z*z));
                        float ydxminusxdy = y*dir_x - x*dir_y;
                        float L = -n * ydxminusxdy;
                        float R = sqrt(n*n*ydxminusxdy*ydxminusxdy - 2.0*(phi-H));
    
                        float a1 = L + R;
                        float a2 = L - R;
                        float a = max(a1, a2);
    
                        outputColor = vec4(a*dir_x, a*dir_y, a*dir_z, a);
                    }                    
                }
            }
            else{
                outputColor = vec4(0.0, 0.0, 0.0, 0.0);         
            }
        }

        void computeSeedConstantPosition(int virtual_texture_x, int virtual_texture_y, float theta_radians, float phi_radians){
            float x = seed_position.x;
            float y = seed_position.y;
            float z = 0.0;
            if(virtual_texture_y == 0){                
                if(virtual_texture_x == 0){
                    //POSITION CALCULATION
                    //outputColor = vec4(theta_radians, phi_radians, 0.0, 1.0);
                    outputColor = vec4(x, y, 0.0, 1.0);
                }        
                if(virtual_texture_x == 1){
                    //VELOCITY CALCULATION
                    //vec3 direction = vec3(1.0,0.0,0.0);
                    float dir_x = sin(theta_radians) * cos(phi_radians);
                    float dir_y = sin(theta_radians) * sin(phi_radians);
                    float dir_z = cos(theta_radians);
                    vec3 direction = vec3(dir_x, dir_y, dir_z);

                    if(use_constant_velocity){
                        //if set to true, use constant velocity
                        vec3 seed_velocity = normalize(direction) * seed_energy;
                        outputColor = vec4(seed_velocity.x, seed_velocity.y, seed_velocity.z, 1.0);
                    }
                    else{
                        //if set to false, use constant hamiltonian
                        vec3 dir_normalized = normalize(direction);

                        float dir_x = dir_normalized.x;
                        float dir_y = dir_normalized.y;
                        float dir_z = dir_normalized.z;
    
                        float n = angular_velocity;
                        float H = seed_energy;
                        float phi = - (1.0-mu)/(sqrt((x+mu)*(x+mu) + y*y + z*z)) - mu/(sqrt((x-(1.0-mu))*(x-(1.0-mu)) + y*y + z*z));
                        float ydxminusxdy = y*dir_x - x*dir_y;
                        float L = -n * ydxminusxdy;
                        float R = sqrt(n*n*ydxminusxdy*ydxminusxdy - 2.0*(phi-H));
    
                        float a1 = L + R;
                        float a2 = L - R;
                        float a = max(a1, a2);
    
                        outputColor = vec4(a*dir_x, a*dir_y, a*dir_z, a);
                    }                    
                }
            }
            else{
                outputColor = vec4(0.0, 0.0, 0.0, 0.0);         
            }
        }
        `
    }


}

export { OffscreenRendererSeeds }