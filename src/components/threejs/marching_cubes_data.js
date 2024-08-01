import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import * as Constants from "@/components/utility/constants";

class MarchingCubesData{
    
    constructor(simulationParameters){
        this.simulationParameters = simulationParameters;
        this.dict_unique_edge_to_vertex_index = {};
        this.vertices = [];
        this.normals = [];
        this.indices = [];
        this.uv = [];
        this.next_vertex_index = 0;
    }

    getKey(x, y, z, edgeIndex){        
        if(x > 0){
            switch (edgeIndex) {
                case 3:
                    edgeIndex = 1;
                    x -= 1;                    
                    break;
                case 7:
                    edgeIndex = 5;
                    x -= 1;                    
                    break;
                case 8:
                    edgeIndex = 9;
                    x -= 1;                    
                    break;
                case 11:
                    edgeIndex = 10;
                    x -= 1;                    
                    break;
                default:
                    //do nothing
                    break;
            }
        }
        if(y > 0){
            switch (edgeIndex) {
                case 0:
                    edgeIndex = 2;
                    y -= 1;                    
                    break;
                case 4:
                    edgeIndex = 6;
                    y -= 1;                    
                    break;
                case 8:
                    edgeIndex = 11;
                    y -= 1;                    
                    break;
                case 9:
                    edgeIndex = 10;
                    y -= 1;                    
                    break;
                default:
                    //do nothing
                    break;
            }
        }
        if(z > 0){
            switch (edgeIndex) {
                case 0:
                    edgeIndex = 4;
                    z -= 1;                    
                    break;
                case 1:
                    edgeIndex = 5;
                    z -= 1;                    
                    break;
                case 2:
                    edgeIndex = 6;
                    z -= 1;                    
                    break;
                case 3:
                    edgeIndex = 7;
                    z -= 1;                    
                    break;
                default:
                    //do nothing
                    break;
            }
        }
        var key = x + "," + y + "," + z + "," + edgeIndex;
        return key;
    }

    addVertex(x, y, z, edgeIndex, pos_x, pos_y, pos_z){
        var vertexIndex = 0;
        var key = this.getKey(x, y, z, edgeIndex);
        if(key in this.dict_unique_edge_to_vertex_index){
            //console.warn("MCDATA: vertex already exists")
            vertexIndex = this.dict_unique_edge_to_vertex_index[key];
        }else{
            //console.warn("MCDATA: new")
            this.vertices.push( pos_x );   
            this.vertices.push( pos_y );   
            this.vertices.push( pos_z );  
            vertexIndex = this.next_vertex_index;
            this.dict_unique_edge_to_vertex_index[key] = vertexIndex;

            this.next_vertex_index += 1;
        }

        this.indices.push(vertexIndex);
    }

    MoveVerticesToSurface(){
        for (var i = 0; i < this.next_vertex_index; i++) {
            var index = 3*i;

            //original point
            var x = this.vertices[index];
            var y = this.vertices[index+1];
            var z = this.vertices[index+2];            
            var point = vec3.fromValues(x,y,z);

            //move point
            this.simulationParameters.moveToSurface(point);
            
            //update point in list
            this.vertices[index] = point[0];
            this.vertices[index+1] = point[1];
            this.vertices[index+2] = point[2];
        }
    }

    ComputeVertexNormalsFromGradient(){
        for (var i = 0; i < this.next_vertex_index; i++) {
            var index = 3*i;
            var normal = vec3.create();

            //original point
            var x = this.vertices[index];
            var y = this.vertices[index+1];
            var z = this.vertices[index+2];            
            var point = vec3.fromValues(x,y,z);

            //compute normal
            this.simulationParameters.evaluateGradient(point, normal);
            vec3.normalize(normal, normal);
            vec3.negate(normal, normal);
            
            //add normal
            this.normals.push(normal[0]);
            this.normals.push(normal[1]);
            this.normals.push(normal[2]);
        }
    }
}

export { MarchingCubesData }