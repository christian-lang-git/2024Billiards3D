import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import { OffscreenRenderer } from "@/components/threejs/offscreen_renderer"



const glsl = x => x[0];
/**
 * TODO
 * One render call computes ftle for a single return map. Uses return map as input and changes only part of the input (x component of 4th vec4, see below)
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
 * 4. vec4: 1 float for ftle value
 *  	    3 placeholder
 */
class OffscreenGridComputationFTLE extends OffscreenGridComputation {


    constructor(renderer, simulationParameters, useAnglePlane) {
        super(renderer, simulationParameters, useAnglePlane)
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
        
        console.warn("FTLE uniforms", this.uniforms);
    }

    setAdditionalUniforms() {
        this.dummy_plane_mesh.material.uniforms.texture_seeds_and_returns.value = this.offscreenRendererSeedsAndReturns.renderTarget.texture;     
        this.dummy_plane_mesh.material.uniforms.max_steps.value = this.simulationParameters.max_steps;       
        this.dummy_plane_mesh.material.uniforms.step_size.value = this.simulationParameters.step_size;       
 
    }

    fragmentShaderMethodComputation() {
        return glsl`
            ivec3 pointer_original = ivec3(int(x_pixel), int(y_pixel), target_layer_index);

            if(virtual_texture_y == 0){
                if(virtual_texture_x == 0){
                    outputColor = texelFetch(texture_seeds_and_returns, pointer_original, 0);
                }
                else{
                    outputColor = texelFetch(texture_seeds_and_returns, pointer_original, 0);
                }
            }
            else{
                if(virtual_texture_x == 0){
                    outputColor = texelFetch(texture_seeds_and_returns, pointer_original, 0);
                }
                else{
                    //float ftle = computeFTLE(x_pixel_mod, y_pixel_mod);
                    float psftle = computePSFTLE(x_pixel_mod, y_pixel_mod, 0);//0 = psftle
                    float psftle_pos = computePSFTLE(x_pixel_mod, y_pixel_mod, 1);//1 = psftle_pos
                    float psftle_vel = computePSFTLE(x_pixel_mod, y_pixel_mod, 2);//2 = psftle_vel
                    
                    outputColor = vec4(psftle,psftle_pos,psftle_vel, 1.0); 
                }
            }
        `
    }

    fragmentShaderAdditionalMethodDeclarations(){
        return glsl`
        //float computeFTLE(int x_pixel_mod, int y_pixel_mod);
        float computePSFTLE(int x_pixel_mod, int y_pixel_mod, int type);
        `;
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return glsl`


        /*
        float computeFTLE(int x_pixel_mod, int y_pixel_mod){
            float dx = 1.0 / (planeDimensionsPixel.x-1.0);
            float dy = 1.0 / (planeDimensionsPixel.y-1.0);
            ivec3 pointer = ivec3(x_pixel_mod, y_pixel_mod, target_layer_index);

            //finite differences
            //finite differences in x direction
            vec3 df_dx;
            if(x_pixel_mod == 0){
                df_dx = computeForwardDifference(texture_seeds_and_returns, pointer, ivec3(1,0,0), dx );
            }
            else if(x_pixel_mod == int(planeDimensionsPixel.x-1.0)){
                df_dx = computeBackwardDifference(texture_seeds_and_returns, pointer, ivec3(-1,0,0), dx );
            }
            else{
                df_dx = computeCentralDifference(texture_seeds_and_returns, pointer, ivec3(-1,0,0), ivec3(1,0,0), dx );
            }
            //finite differences in y direction
            vec3 df_dy;
            if(y_pixel_mod == 0){
                df_dy = computeForwardDifference(texture_seeds_and_returns, pointer, ivec3(0,1,0), dx );
            }
            else if(y_pixel_mod == int(planeDimensionsPixel.y-1.0)){
                df_dy = computeBackwardDifference(texture_seeds_and_returns, pointer, ivec3(0,-1,0), dx );
            }
            else{
                df_dy = computeCentralDifference(texture_seeds_and_returns, pointer, ivec3(0,-1,0), ivec3(0,1,0), dy );
            }
            //finite differences in z direction = (0,0,0)
            vec3 df_dz = vec3(0,0,0);

            //jacobian
            mat3 J = BuildJacoby(df_dx, df_dy, df_dz);
            //transpose jacobian
            mat3 JT = transpose(J);
            //C = cauchy-green tensor = J^T * J
            mat3 C = JT * J;

            //biggest eigenvalue lambda_max
            vec3 lambdas = vec3(0,0,0);
            mat3eigenvalues(C, lambdas);
            float lambda_max = max(lambdas.x, max(lambdas.y, lambdas.z));

            //FTLE
            float advection_time = 1.0;//TODO SCALING?
            float ftle = 1.0 / advection_time * log(sqrt(lambda_max));

            return ftle;
        }*/

        float computePSFTLE(int x_pixel_mod, int y_pixel_mod, int type){
            float dx = 1.0 / (planeDimensionsPixel.x-1.0);
            float dy = 1.0 / (planeDimensionsPixel.y-1.0);
            ivec3 pointer = ivec3(x_pixel_mod, y_pixel_mod, target_layer_index);

            ivec3 x_offset_vel = ivec3(int(planeDimensionsPixel.x),0,0);

            //finite differences
            //finite differences in x direction
            vec3 dpos_dx;
            vec3 dvel_dx;
            if(x_pixel_mod == 0){
                dpos_dx = computeForwardDifference(texture_seeds_and_returns, pointer, ivec3(1,0,0), dx );
                dvel_dx = computeForwardDifference(texture_seeds_and_returns, pointer+x_offset_vel, ivec3(1,0,0), dx );
            }
            else if(x_pixel_mod == int(planeDimensionsPixel.x-1.0)){
                dpos_dx = computeBackwardDifference(texture_seeds_and_returns, pointer, ivec3(-1,0,0), dx );
                dvel_dx = computeBackwardDifference(texture_seeds_and_returns, pointer+x_offset_vel, ivec3(-1,0,0), dx );
            }
            else{
                dpos_dx = computeCentralDifference(texture_seeds_and_returns, pointer, ivec3(-1,0,0), ivec3(1,0,0), dx );
                dvel_dx = computeCentralDifference(texture_seeds_and_returns, pointer+x_offset_vel, ivec3(-1,0,0), ivec3(1,0,0), dx );
            }
            //finite differences in y direction
            vec3 dpos_dy;
            vec3 dvel_dy;
            if(y_pixel_mod == 0){
                dpos_dy = computeForwardDifference(texture_seeds_and_returns, pointer, ivec3(0,1,0), dx );
                dvel_dy = computeForwardDifference(texture_seeds_and_returns, pointer+x_offset_vel, ivec3(0,1,0), dx );
            }
            else if(y_pixel_mod == int(planeDimensionsPixel.y-1.0)){
                dpos_dy = computeBackwardDifference(texture_seeds_and_returns, pointer, ivec3(0,-1,0), dx );
                dvel_dy = computeBackwardDifference(texture_seeds_and_returns, pointer+x_offset_vel, ivec3(0,-1,0), dx );
            }
            else{
                dpos_dy = computeCentralDifference(texture_seeds_and_returns, pointer, ivec3(0,-1,0), ivec3(0,1,0), dy );
                dvel_dy = computeCentralDifference(texture_seeds_and_returns, pointer+x_offset_vel, ivec3(0,-1,0), ivec3(0,1,0), dy );
            }

            mat2 C;
            if(type == 0){//0 = psftle
                C = BuildCauchyGreen(dpos_dx, dvel_dx, dpos_dy, dvel_dy);
            }
            else if(type == 1){//1 = psftle_pos
                C = BuildCauchyGreenPos(dpos_dx, dpos_dy);
            }
            else if(type == 2){//2 = psftle_vel
                C = BuildCauchyGreenVel(dvel_dx, dvel_dy);
            }

            //biggest eigenvalue lambda_max
            vec2 lambdas = vec2(0,0);
            mat2eigenvalues(C, lambdas);
            float lambda_max = max(lambdas.x, lambdas.y);

            //FTLE
            float advection_time = 1.0;//TODO SCALING?
            float ftle = 1.0 / advection_time * log(sqrt(lambda_max));

            return ftle;
        }
        `
    }

}

export { OffscreenGridComputationFTLE }