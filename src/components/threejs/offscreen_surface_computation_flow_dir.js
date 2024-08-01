import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

import * as BILLIARD_DECLARATIONS from "@/components/glsl/billiard_declarations";
import * as BILLIARD from "@/components/glsl/billiard";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import { OffscreenSurfaceComputationFlow } from "@/components/threejs/offscreen_surface_computation_flow"


const glsl = x => x[0];

class OffscreenSurfaceComputationFlowDir extends OffscreenSurfaceComputationFlow {

    constructor(renderer, simulationParameters, marchingCubesMesh) {
        super(renderer, simulationParameters, marchingCubesMesh);
    }

    fragmentShaderMethodComputationOutput(){
        return glsl`
        //output direction
        vec3 result_direction = result_state.direction;
        outputColor = vec4(result_direction.x,result_direction.y,result_direction.z,1);
        `
    }

    writeToAttribute(readBuffer){
        this.marchingCubesMesh.setAttributeResultDirection(readBuffer);
    }

}

export { OffscreenSurfaceComputationFlowDir }