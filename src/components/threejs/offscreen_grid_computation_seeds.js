import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import { OffscreenGridComputation } from "@/components/threejs/offscreen_grid_computation";
import * as BILLIARD_DECLARATIONS from "@/components/glsl/billiard_declarations";
import * as BILLIARD from "@/components/glsl/billiard";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";

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
class OffscreenGridComputationSeeds extends OffscreenGridComputation {

    constructor(renderer, simulationParameters, useAnglePlane, mode_constant_direction) {
        super(renderer, simulationParameters, useAnglePlane);
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
        this.uniforms["seed_position"] = { type: 'vec3', value: new THREE.Vector3(0, 0, 0) };
        this.uniforms["use_local_direction"] = { type: 'bool', value: true };

        //BELOW UNIFORMS ARE REQUIRED FOR SHADER COMPILATION (SHADER_MODULE_BILLIARD)
        this.uniforms["surface_type"] = { type: 'int', value: 2 };
        this.uniforms["var_a"] = { type: 'float', value: 0 };
        this.uniforms["var_b"] = { type: 'float', value: 0 };
        this.uniforms["var_c"] = { type: 'float', value: 0 };
        this.uniforms["var_R"] = { type: 'float', value: 0 };
        this.uniforms["var_r"] = { type: 'float', value: 0 };
        this.uniforms["one_div_aa"] = { type: 'float', value: 1 };
        this.uniforms["one_div_bb"] = { type: 'float', value: 1 };
        this.uniforms["one_div_cc"] = { type: 'float', value: 1 };
        this.uniforms["number_of_intersections"] = { type: 'int', value: 2 };
        this.uniforms["number_of_bisection_steps"] = { type: 'int', value: 8 };
        this.uniforms["step_size"] = { type: 'float', value: 1.0 };
        this.uniforms["max_steps"] = { type: 'int', value: 100 };     
    }

    setAdditionalUniforms() {        
        //seed variables
        this.dummy_plane_mesh.material.uniforms.use_local_direction.value = this.simulationParameters.use_local_direction;
        this.dummy_plane_mesh.material.uniforms.seed_position.value.x = this.simulationParameters.seed_position_x;
        this.dummy_plane_mesh.material.uniforms.seed_position.value.y = this.simulationParameters.seed_position_y; 
        this.dummy_plane_mesh.material.uniforms.seed_position.value.z = this.simulationParameters.seed_position_z;   
        
        //surface variables
        this.dummy_plane_mesh.material.uniforms.surface_type.value = this.simulationParameters.surface_type;
        this.dummy_plane_mesh.material.uniforms.var_a.value = this.simulationParameters.var_a;
        this.dummy_plane_mesh.material.uniforms.var_b.value = this.simulationParameters.var_b;
        this.dummy_plane_mesh.material.uniforms.var_c.value = this.simulationParameters.var_c;
        this.dummy_plane_mesh.material.uniforms.var_R.value = this.simulationParameters.var_R;
        this.dummy_plane_mesh.material.uniforms.var_r.value = this.simulationParameters.var_r;
        //bisection variables        
        this.dummy_plane_mesh.material.uniforms.number_of_intersections.value = this.simulationParameters.number_of_intersections;
        this.dummy_plane_mesh.material.uniforms.number_of_bisection_steps.value = this.simulationParameters.number_of_bisection_steps;
        this.dummy_plane_mesh.material.uniforms.step_size.value = this.simulationParameters.step_size;
        this.dummy_plane_mesh.material.uniforms.max_steps.value = this.simulationParameters.max_steps;
                
        //compute some values like one_div_aa
        var a = this.simulationParameters.var_a;
        var b = this.simulationParameters.var_b;
        var c = this.simulationParameters.var_c;
        var one_div_aa = 1 / (a * a);
        var one_div_bb = 1 / (b * b);
        var one_div_cc = 1 / (c * c);
        this.dummy_plane_mesh.material.uniforms.one_div_aa.value = one_div_aa;
        this.dummy_plane_mesh.material.uniforms.one_div_bb.value = one_div_bb;
        this.dummy_plane_mesh.material.uniforms.one_div_cc.value = one_div_cc;     
    }

    fragmentShaderMethodComputation() {
        return glsl`
            vec3 direction = getSeedDirection(theta_radians, phi_radians);

            if(virtual_texture_x == 0){
                //POSITION OUTPUT
                outputColor = vec4(seed_position.x, seed_position.y, seed_position.z, 1);
            }        
            if(virtual_texture_x == 1){
                //DIRECTION OUTPUT
                outputColor = vec4(direction.x, direction.y, direction.z, 1);                                      
            }
        `
    }

    fragmentShaderAdditionalMethodDeclarations(){
        return BILLIARD_DECLARATIONS.SHADER_MODULE_BILLIARD_DECLARATIONS + "\n" + glsl`
        vec3 getSeedDirection(float theta_radians, float phi_radians);
        `;
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return BILLIARD.SHADER_MODULE_BILLIARD + glsl`       
        
        vec3 getSeedDirection(float theta_radians, float phi_radians){
            float dir_x = sin(theta_radians) * cos(phi_radians);
            float dir_y = sin(theta_radians) * sin(phi_radians);
            float dir_z = cos(theta_radians);

            
            if(use_local_direction){
                float scale_x = dir_x;
                float scale_y = dir_y;
                float scale_z = dir_z;
                vec3 position = seed_position;

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


}

export { OffscreenGridComputationSeeds }