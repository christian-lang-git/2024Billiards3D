import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import { OffscreenGridComputation } from "@/components/threejs/offscreen_grid_computation";

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
    }

    setAdditionalUniforms() {
        this.dummy_plane_mesh.material.uniforms.seed_position.value.x = this.simulationParameters.seed_position_x;
        this.dummy_plane_mesh.material.uniforms.seed_position.value.y = this.simulationParameters.seed_position_y; 
        this.dummy_plane_mesh.material.uniforms.seed_position.value.z = this.simulationParameters.seed_position_z;       
    }

    fragmentShaderMethodComputation() {
        return glsl`
            float dir_x = sin(theta_radians) * cos(phi_radians);
            float dir_y = sin(theta_radians) * sin(phi_radians);
            float dir_z = cos(theta_radians);

            if(virtual_texture_x == 0){
                //POSITION OUTPUT
                outputColor = vec4(seed_position.x, seed_position.y, seed_position.z, 1);
            }        
            if(virtual_texture_x == 1){
                //DIRECTION OUTPUT
                outputColor = vec4(dir_x, dir_y, dir_z, 1);                                      
            }
        `
    }

    fragmentShaderAdditionalMethodDeclarations(){
        return glsl`

        `;
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return glsl`

        `
    }


}

export { OffscreenGridComputationSeeds }