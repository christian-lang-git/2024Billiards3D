import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

import * as BILLIARD_DECLARATIONS from "@/components/glsl/billiard_declarations";
import * as BILLIARD from "@/components/glsl/billiard";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import { OffscreenSurfaceComputationFlow } from "@/components/threejs/offscreen_surface_computation_flow"


const glsl = x => x[0];

class OffscreenSurfaceComputationFlowPos extends OffscreenSurfaceComputationFlow {

    constructor(renderer, simulationParameters, marchingCubesMesh) {
        super(renderer, simulationParameters, marchingCubesMesh);
    }

    fragmentShaderMethodComputationOutput(){
        return glsl`
        //output position
        vec3 result_position = result_state.position;
        outputColor = vec4(result_position.x,result_position.y,result_position.z,1);
        `
    }

    writeToAttribute(readBuffer){
        this.marchingCubesMesh.setAttributeResultPosition(readBuffer);
    }

}

export { OffscreenSurfaceComputationFlowPos }