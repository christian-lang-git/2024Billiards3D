import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

import * as ARRAY_MATH_DECLARATIONS from "@/components/glsl/array_math_declarations";
import * as ARRAY_MATH from "@/components/glsl/array_math";
import * as BILLIARD_DECLARATIONS from "@/components/glsl/billiard_declarations";
import * as BILLIARD from "@/components/glsl/billiard";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import { OffscreenSurfaceComputation } from "@/components/threejs/offscreen_surface_computation"


const glsl = x => x[0];

class OffscreenSurfaceComputationFtle extends OffscreenSurfaceComputation {

    constructor(renderer, simulationParameters, marchingCubesMesh) {
        super(renderer, simulationParameters, marchingCubesMesh);
    }

    link(offscreen_surface_computation_flow_pos, offscreen_surface_computation_flow_dir){
        this.offscreen_surface_computation_flow_pos = offscreen_surface_computation_flow_pos;
        this.offscreen_surface_computation_flow_dir = offscreen_surface_computation_flow_dir;
    }

    addAdditionalUniforms(){
        this.uniforms["input_texture_flow_pos"] = { type: 'sampler2D', value: this.marchingCubesMesh.texture_vertices};//set to placeholder because real doesnt exist yet
        this.uniforms["input_texture_flow_dir"] = { type: 'sampler2D', value: this.marchingCubesMesh.texture_vertices};//set to placeholder because real doesnt exist yet
        this.uniforms["input_texture_neighbors"] = { type: 'sampler3D', value: this.marchingCubesMesh.texture_neighbors};
    }

    setAdditionalUniforms(){
        this.dummy_plane_mesh.material.uniforms.input_texture_flow_pos.value = this.offscreen_surface_computation_flow_pos.renderTarget.texture;    
        this.dummy_plane_mesh.material.uniforms.input_texture_flow_dir.value = this.offscreen_surface_computation_flow_dir.renderTarget.texture;     
        this.dummy_plane_mesh.material.uniforms.input_texture_neighbors.value = this.marchingCubesMesh.texture_neighbors;         
    }

    compute() {   
        //computation in shader
        this.setUniforms();
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.bufferScene, this.bufferCamera);

        this.writeToAttributeWrapper();
    }

    writeToAttribute(readBuffer){
        this.marchingCubesMesh.setAttributeFTLE(readBuffer);        
    }

    fragmentShaderMethodComputation(){
        return glsl`

        //build 2D index of this vertex for use in 2D textures
        ivec2 pointer = ivec2(x_pixel_mod, y_pixel_mod);

        //fetch vertex position
        vec4 vertex_pos_data = texelFetch(input_texture_positions, pointer, 0);
        vec3 vertex_pos = vertex_pos_data.xyz;
        bool no_value = vertex_pos_data.w < 0.5;

        //early termination if this pixel is padding (i.e., not associated with any vertex)
        if(no_value){
            outputColor = vec4(0,0,0,0);
            return;
        }

        //fetch flow result of this vertex
        vec3 vertex_flow_pos = texelFetch(input_texture_flow_pos, pointer, 0).xyz;
        vec3 vertex_flow_dir = texelFetch(input_texture_flow_dir, pointer, 0).xyz;

        //get number of neighbors
        int num_neighbors = CountNeighbors(x_pixel_mod, y_pixel_mod);
        float test_value = float(num_neighbors) / 16.0;

        //create empty matrices





        /*


        if(neighbor_index >= 0){
            num_neighbors++;

            //compute 2D index of neighbor for use in 2D textures
            int neighbor_x_index = neighbor_index % int(planeDimensionsPixel.x);
            int neighbor_y_index = neighbor_index / int(planeDimensionsPixel.x);
            ivec2 pointer_neighbor = ivec2(neighbor_x_index, neighbor_y_index);

            //fetch neighbor vertex position
            vec3 neighbor_pos = texelFetch(input_texture_positions, pointer_neighbor, 0).xyz;

            //fetch neighbor flow result
            vec3 neighbor_flow_pos = texelFetch(input_texture_flow_pos, pointer_neighbor, 0).xyz;
            vec3 neighbor_flow_dir = texelFetch(input_texture_flow_dir, pointer_neighbor, 0).xyz;

            //add values to A

            //add values to B
        }
        */

        //compute AT

        //compute ATA

        //compute ATAinv

        //compute ATAinvAT

        //compute ATAinvATB
        
        /*
        //test input_texture_neighbors
        ivec3 pointer_neighbors = ivec3(x_pixel_mod, y_pixel_mod, 0);
        pointer_neighbors = ivec3(1, 0, 0);//TEST
        vec4 neighbors4 = texelFetch(input_texture_neighbors, pointer_neighbors, 0);

        if(neighbors4[0] == 0.0 && neighbors4[1] == 2.0 && neighbors4[2] == 30.0 && neighbors4[3] == 29.0){
            outputColor = vec4(test_value,0,0,1);//TEST
            return;//TEST
        }
            */

        //output position
        //outputColor = vec4(position.x,position.y,position.z,1);

        outputColor = vec4(test_value,0,0,1);//TEST

        //TODO: copied method from flow, change to FTLE
        ` 
    }

    fragmentShaderAdditionalMethodDeclarations(){
        //override in child class
        return ARRAY_MATH_DECLARATIONS.SHADER_MODULE_ARRAY_MATH_DECLARATIONS + glsl`
        int CountNeighbors(int x_pixel_mod, int y_pixel_mod);
        `;
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return BILLIARD.SHADER_MODULE_BILLIARD + "\n" +
        ARRAY_MATH.SHADER_MODULE_ARRAY_MATH + glsl`
        
        int CountNeighbors(int x_pixel_mod, int y_pixel_mod){
            int num_neighbors = 0;
            //iterate over all 4 layers (neighbor texture)
            for(int layer_index=0; layer_index<4; layer_index++){
                ivec3 pointer_neighbors = ivec3(x_pixel_mod, y_pixel_mod, layer_index);
                vec4 neighbors4 = texelFetch(input_texture_neighbors, pointer_neighbors, 0);
                //iterate over all 4 values of the pixel (RGBA)
                for(int rgba_index=0; rgba_index<4; rgba_index++){
                    int neighbor_index = int(neighbors4[rgba_index]);
                    //check for early termination
                    if(neighbor_index < 0){
                        return num_neighbors;
                    }      
                    num_neighbors++;              
                }
            }
            return num_neighbors;
        }
        
        
        
        
        
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

export { OffscreenSurfaceComputationFtle }