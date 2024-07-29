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


    constructor(renderer, simulationParameters, useAnglePlane, forward) {
        super(renderer, simulationParameters, useAnglePlane)
        this.signum = forward ? 1.0 : -1.0;
    }

    link(offscreenGridComputationSeeds){
        this.offscreenGridComputationSeeds = offscreenGridComputationSeeds;
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
        this.uniforms["texture_seeds"] = { type: 'sampler3D', value: this.offscreenGridComputationSeeds.renderTarget.texture};  
        this.uniforms["surface_type"] = { type: 'int', value: 2 };
        this.uniforms["var_a"] = { type: 'float', value: 3.5 };
        this.uniforms["var_b"] = { type: 'float', value: 2.5 };
        this.uniforms["var_c"] = { type: 'float', value: 1.5 };
        this.uniforms["var_R"] = { type: 'float', value: 2.0 };
        this.uniforms["var_r"] = { type: 'float', value: 1.0 };
        this.uniforms["one_div_aa"] = { type: 'float', value: 1.0 };//computed later
        this.uniforms["one_div_bb"] = { type: 'float', value: 1.0 };//computed later
        this.uniforms["one_div_cc"] = { type: 'float', value: 1.0 };//computed later
        this.uniforms["number_of_intersections"] = { type: 'int', value: 2 };
        this.uniforms["number_of_bisection_steps"] = { type: 'int', value: 8 };
        this.uniforms["step_size"] = { type: 'float', value: 1.0 };
        this.uniforms["max_steps"] = { type: 'int', value: 100 };     
        console.warn("FLOW MAP uniforms", this.uniforms);
    }

    setAdditionalUniforms() {
        this.dummy_plane_mesh.material.uniforms.texture_seeds.value = this.offscreenGridComputationSeeds.renderTarget.texture;       

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
            /*
            vec3 seed_position = texelFetch(texture_seeds, pointer, 0).xyz;
            float x = seed_position.x;
            float y = seed_position.y;
            float z = seed_position.z;
            vec3 seed_direction = texelFetch(texture_seeds, pointer+ivec3(int(planeDimensionsPixel.x),0,0), 0).xyz;
            vec4 data3 = texelFetch(texture_seeds, pointer+ivec3(0,int(planeDimensionsPixel.y),0),0);
            float old_success_float = data3.x;
            float advection_time = data3.y;
            float arc_length = data3.z;
            float hamiltonian_smallest = texelFetch(texture_seeds, pointer, 0).w;
            float hamiltonian_largest = texelFetch(texture_seeds, pointer+ivec3(int(planeDimensionsPixel.x),0,0), 0).w;
            */
            
            ivec3 pointer = ivec3(x_pixel_mod, y_pixel_mod, 0);
            PhaseState seed_state;
            seed_state.position = texelFetch(texture_seeds, pointer, 0).xyz;
            seed_state.direction = texelFetch(texture_seeds, pointer+ivec3(int(planeDimensionsPixel.x),0,0), 0).xyz;
            PhaseState result_state = computeFlow(seed_state);
            
            if(virtual_texture_x == 0){
                //POSITION OUTPUT
                outputColor = vec4(result_state.position.x, result_state.position.y, result_state.position.z, 1);
            }        
            if(virtual_texture_x == 1){
                //DIRECTION OUTPUT
                outputColor = vec4(result_state.direction.x, result_state.direction.y, result_state.direction.z, 1);                                   
            }
        `
    }

    fragmentShaderAdditionalMethodDeclarations(){
        return BILLIARD_DECLARATIONS.SHADER_MODULE_BILLIARD_DECLARATIONS + "\n" + glsl`


        `;
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return BILLIARD.SHADER_MODULE_BILLIARD + glsl`
        


        `
    }

}

export { OffscreenGridComputationFlowMap }