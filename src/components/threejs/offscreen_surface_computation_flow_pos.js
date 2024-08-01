import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

import * as BILLIARD_DECLARATIONS from "@/components/glsl/billiard_declarations";
import * as BILLIARD from "@/components/glsl/billiard";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import { OffscreenSurfaceComputation } from "@/components/threejs/offscreen_surface_computation"


const glsl = x => x[0];

class OffscreenSurfaceComputationFlowPos extends OffscreenSurfaceComputation {

    constructor(renderer, simulationParameters, marchingCubesMesh) {
        super(renderer, simulationParameters, marchingCubesMesh);
    }

    compute() {   
        //computation in shader
        this.setUniforms();
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.bufferScene, this.bufferCamera);

        this.writeToAttributeWrapper();
    }

    writeToAttribute(readBuffer){
        this.marchingCubesMesh.setAttributeResultPosition(readBuffer);
    }

    generateUniforms() {
        this.uniforms = {      
            planeDimensionsPixel: { type: 'vec2', value: new THREE.Vector2(100, 100) },
            input_texture_positions: { type: 'sampler2D', value: this.marchingCubesMesh.texture_vertices},      
            surface_type: { type: 'int', value: 2 },
            var_a: { type: 'float', value: 3.5 },
            var_b: { type: 'float', value: 2.5 },
            var_c: { type: 'float', value: 1.5 },
            var_R: { type: 'float', value: 2.0 },
            var_r: { type: 'float', value: 1.0 },
            one_div_aa: { type: 'float', value: 1.0 },//computed later
            one_div_bb: { type: 'float', value: 1.0 },//computed later
            one_div_cc: { type: 'float', value: 1.0 },//computed later
            number_of_intersections: { type: 'int', value: 2 },
            number_of_bisection_steps: { type: 'int', value: 8 },
            step_size: { type: 'float', value: 1.0 },
            max_steps: { type: 'int', value: 100 },
            seed_direction: { type: 'vec3', value: new THREE.Vector3(1, 1, 1) },
            use_local_direction: { type: 'bool', value: true },
            kernel_distance: { type: 'float', value: 0.01 },            
        }
    }

    fragmentShaderMethodComputation(){
        return glsl`
        //reading seed position
        ivec2 pointer = ivec2(x_pixel_mod, y_pixel_mod);
        vec4 value = texelFetch(input_texture_positions, pointer, 0);
        vec3 position = value.xyz;
        bool no_value = value.w < 0.5;

        //early termination if this pixel is padding (i.e., not associated with any vertex)
        if(no_value){
            outputColor = vec4(0,0,0,0);
            return;
        }

        //compute flow
        PhaseState seed_state;
        seed_state.position = position;
        seed_state.direction = getSeedDirectionAtPosition(position);
        PhaseState result_state = computeFlow(seed_state);
        
        //output position
        vec3 result_position = result_state.position;
        outputColor = vec4(result_position.x,result_position.y,result_position.z,1);

        `
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return BILLIARD.SHADER_MODULE_BILLIARD + glsl`
        LocalGrid computeLocalGrid(vec3 position){

            //compute local axes
            vec3 gradient = evaluateGradient(position);
            vec3 normal = normalize(gradient);
            vec3 normal_negated = -normal;
            vec3 tangent_a = computeTangentA(position);    
            vec3 tangent_b = cross(normal_negated, tangent_a);
        
            //initial positioning of nodes in 4 directions
            vec3 point_tangent_a_forward = position + tangent_a * kernel_distance;
            vec3 point_tangent_a_backward = position - tangent_a * kernel_distance;
            vec3 point_tangent_b_forward = position + tangent_b * kernel_distance;
            vec3 point_tangent_b_backward = position - tangent_b * kernel_distance;
        
            //local grid
            LocalGrid local_grid;
            local_grid.center.position = position;
        
            //move nodes to surface via gradient
            local_grid.xp.position = moveToSurface(point_tangent_a_forward);
            local_grid.xn.position = moveToSurface(point_tangent_a_backward);
            local_grid.yp.position = moveToSurface(point_tangent_b_forward);
            local_grid.yn.position = moveToSurface(point_tangent_b_backward);
            
            //set seed directions
            local_grid.center.direction = getSeedDirectionAtPosition(local_grid.center.position);
            local_grid.xp.direction = getSeedDirectionAtPosition(local_grid.xp.position);
            local_grid.xn.direction = getSeedDirectionAtPosition(local_grid.xn.position);
            local_grid.yp.direction = getSeedDirectionAtPosition(local_grid.yp.position);
            local_grid.yn.direction = getSeedDirectionAtPosition(local_grid.yn.position);
        
            //compute grid distances for finite differences
            local_grid.dist_x = distance(local_grid.xp.position, local_grid.xn.position);
            local_grid.dist_y = distance(local_grid.yp.position, local_grid.yn.position);
        
            return local_grid;
        }
        
        vec3 getSeedDirectionAtPosition(vec3 position){
            vec3 seed_direction_normalized = normalize(seed_direction);
            float dir_x = seed_direction_normalized.x;
            float dir_y = seed_direction_normalized.y;
            float dir_z = seed_direction_normalized.z;
            
            if(use_local_direction){
                float scale_x = dir_x;
                float scale_y = dir_y;
                float scale_z = dir_z;

                //compute local axes
                vec3 gradient = evaluateGradient(position);
                vec3 normal = normalize(gradient);
                vec3 normal_negated = -normal;
                vec3 tangent_a = computeTangentA(position);    
                vec3 tangent_b = cross(normal_negated, tangent_a);
                            
                dir_x = tangent_a[0] * scale_x + tangent_b[0] * scale_y + normal_negated[0] * scale_z;
                dir_y = tangent_a[1] * scale_x + tangent_b[1] * scale_y + normal_negated[1] * scale_z;
                dir_z = tangent_a[2] * scale_x + tangent_b[2] * scale_y + normal_negated[2] * scale_z;                
            }                

            vec3 direction = vec3(dir_x, dir_y, dir_z);
            return normalize(direction);
        }
        `
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      REQUIRED METHODS
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////


}

export { OffscreenSurfaceComputationFlowPos }