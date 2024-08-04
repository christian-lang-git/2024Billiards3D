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
        ArrayMatrix mat_tmp0;//A    ATAinv      Bpos            Bdir
        ArrayMatrix mat_tmp1;//AT   AT          pos_derivative  dir_derivative
        ArrayMatrix mat_tmp2;//ATA  ATAinvAT    ATAinvAT        ATAinvAT

        //write matrix A into mat_tmp0
        FillMatrixA(vertex_pos, x_pixel_mod, y_pixel_mod, num_neighbors, mat_tmp0);
        //write matrix AT into mat_tmp1
        AM_Transpose(mat_tmp0, mat_tmp1);
        //write matrix ATA into mat_tmp2
        AM_Multiply(mat_tmp1, mat_tmp0, mat_tmp2);
        //write matrix ATAinv into mat_tmp0
        AM_Mat3Inv(mat_tmp2, mat_tmp0);
        //write matrix ATAinvAT into mat_tmp2
        AM_Multiply(mat_tmp0, mat_tmp1, mat_tmp2);


        //write matrix Bpos into mat_tmp0
        FillMatrixBpos(vertex_flow_pos, x_pixel_mod, y_pixel_mod, num_neighbors, mat_tmp0);
        //write matrix pos_derivative into mat_tmp1
        AM_Multiply(mat_tmp2, mat_tmp0, mat_tmp1);
        //extract results
        vec3 dpos_dx;
        vec3 dpos_dy;
        vec3 dpos_dz;
        AM_ExtractColumns3x3(mat_tmp1, dpos_dx, dpos_dy, dpos_dz);    


        //write matrix Bdir into mat_tmp0
        FillMatrixBdir(vertex_flow_dir, x_pixel_mod, y_pixel_mod, num_neighbors, mat_tmp0);
        //write matrix pos_derivative into mat_tmp1
        AM_Multiply(mat_tmp2, mat_tmp0, mat_tmp1);
        //extract results
        vec3 dvel_dx;
        vec3 dvel_dy;
        vec3 dvel_dz;
        AM_ExtractColumns3x3(mat_tmp1, dvel_dx, dvel_dy, dvel_dz);    
    
        //psftle computation
        float psftle = computePSFTLE(dpos_dx, dvel_dx, dpos_dy, dvel_dy, 0);
        float psftle_pos = computePSFTLE(dpos_dx, dvel_dx, dpos_dy, dvel_dy, 1);
        float psftle_vel = computePSFTLE(dpos_dx, dvel_dx, dpos_dy, dvel_dy, 2);
        outputColor = vec4(psftle,psftle_pos,psftle_vel,1);
        ` 
    }

    fragmentShaderAdditionalMethodDeclarations(){
        //override in child class
        return ARRAY_MATH_DECLARATIONS.SHADER_MODULE_ARRAY_MATH_DECLARATIONS + glsl`
        int CountNeighbors(int x_pixel_mod, int y_pixel_mod);
        void FillMatrixA(vec3 vertex_pos, int x_pixel_mod, int y_pixel_mod, int num_neighbors, inout ArrayMatrix mat);
        void FillMatrixBpos(vec3 vertex_flow_pos, int x_pixel_mod, int y_pixel_mod, int num_neighbors, inout ArrayMatrix mat);
        void FillMatrixBdir(vec3 vertex_flow_dir, int x_pixel_mod, int y_pixel_mod, int num_neighbors, inout ArrayMatrix mat);
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

        void FillMatrixA(vec3 vertex_pos, int x_pixel_mod, int y_pixel_mod, int num_neighbors, inout ArrayMatrix mat){
            mat.rows = num_neighbors;
            mat.cols = 3;
            int row_index = 0;
            //iterate over all 4 layers (neighbor texture)
            for(int layer_index=0; layer_index<4; layer_index++){
                ivec3 pointer_neighbors = ivec3(x_pixel_mod, y_pixel_mod, layer_index);
                vec4 neighbors4 = texelFetch(input_texture_neighbors, pointer_neighbors, 0);
                //iterate over all 4 values of the pixel (RGBA)
                for(int rgba_index=0; rgba_index<4; rgba_index++){
                    int neighbor_index = int(neighbors4[rgba_index]);
                    //check for early termination
                    if(neighbor_index < 0){
                        return;
                    }       
                    
                    //compute 2D index of neighbor for use in 2D textures
                    int neighbor_x_index = neighbor_index % int(planeDimensionsPixel.x);
                    int neighbor_y_index = neighbor_index / int(planeDimensionsPixel.x);
                    ivec2 pointer_neighbor = ivec2(neighbor_x_index, neighbor_y_index);

                    //fetch neighbor vertex position
                    vec3 neighbor_pos = texelFetch(input_texture_positions, pointer_neighbor, 0).xyz;

                    //write row to matrix
                    //access element in i-th row and j-th col: index = i + j * mat_rows;
                    mat.values[row_index + 0 * mat.rows] = neighbor_pos.x - vertex_pos.x;
                    mat.values[row_index + 1 * mat.rows] = neighbor_pos.y - vertex_pos.y;
                    mat.values[row_index + 2 * mat.rows] = neighbor_pos.z - vertex_pos.z;

                    row_index++;
                }
            }
        }

        void FillMatrixBpos(vec3 vertex_flow_pos, int x_pixel_mod, int y_pixel_mod, int num_neighbors, inout ArrayMatrix mat){
            mat.rows = num_neighbors;
            mat.cols = 3;
            int row_index = 0;
            //iterate over all 4 layers (neighbor texture)
            for(int layer_index=0; layer_index<4; layer_index++){
                ivec3 pointer_neighbors = ivec3(x_pixel_mod, y_pixel_mod, layer_index);
                vec4 neighbors4 = texelFetch(input_texture_neighbors, pointer_neighbors, 0);
                //iterate over all 4 values of the pixel (RGBA)
                for(int rgba_index=0; rgba_index<4; rgba_index++){
                    int neighbor_index = int(neighbors4[rgba_index]);
                    //check for early termination
                    if(neighbor_index < 0){
                        return;
                    }       
                    
                    //compute 2D index of neighbor for use in 2D textures
                    int neighbor_x_index = neighbor_index % int(planeDimensionsPixel.x);
                    int neighbor_y_index = neighbor_index / int(planeDimensionsPixel.x);
                    ivec2 pointer_neighbor = ivec2(neighbor_x_index, neighbor_y_index);

                    //fetch neighbor flow result
                    vec3 neighbor_flow_pos = texelFetch(input_texture_flow_pos, pointer_neighbor, 0).xyz;

                    //write row to matrix
                    //access element in i-th row and j-th col: index = i + j * mat_rows;
                    mat.values[row_index + 0 * mat.rows] = neighbor_flow_pos.x - vertex_flow_pos.x;
                    mat.values[row_index + 1 * mat.rows] = neighbor_flow_pos.y - vertex_flow_pos.y;
                    mat.values[row_index + 2 * mat.rows] = neighbor_flow_pos.z - vertex_flow_pos.z;

                    row_index++;
                }
            }
        }

        void FillMatrixBdir(vec3 vertex_flow_dir, int x_pixel_mod, int y_pixel_mod, int num_neighbors, inout ArrayMatrix mat){
            mat.rows = num_neighbors;
            mat.cols = 3;
            int row_index = 0;
            //iterate over all 4 layers (neighbor texture)
            for(int layer_index=0; layer_index<4; layer_index++){
                ivec3 pointer_neighbors = ivec3(x_pixel_mod, y_pixel_mod, layer_index);
                vec4 neighbors4 = texelFetch(input_texture_neighbors, pointer_neighbors, 0);
                //iterate over all 4 values of the pixel (RGBA)
                for(int rgba_index=0; rgba_index<4; rgba_index++){
                    int neighbor_index = int(neighbors4[rgba_index]);
                    //check for early termination
                    if(neighbor_index < 0){
                        return;
                    }       
                    
                    //compute 2D index of neighbor for use in 2D textures
                    int neighbor_x_index = neighbor_index % int(planeDimensionsPixel.x);
                    int neighbor_y_index = neighbor_index / int(planeDimensionsPixel.x);
                    ivec2 pointer_neighbor = ivec2(neighbor_x_index, neighbor_y_index);

                    //fetch neighbor flow result
                    vec3 neighbor_flow_dir = texelFetch(input_texture_flow_dir, pointer_neighbor, 0).xyz;

                    //write row to matrix
                    //access element in i-th row and j-th col: index = i + j * mat_rows;
                    mat.values[row_index + 0 * mat.rows] = neighbor_flow_dir.x - vertex_flow_dir.x;
                    mat.values[row_index + 1 * mat.rows] = neighbor_flow_dir.y - vertex_flow_dir.y;
                    mat.values[row_index + 2 * mat.rows] = neighbor_flow_dir.z - vertex_flow_dir.z;

                    row_index++;
                }
            }
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