import * as Constants from "@/components/utility/constants";
import { getThetaFromCartesian, getPhiFromCartesian } from "@/components/utility/utility";
import { vec3 } from "gl-matrix/esm";
import {evaluate, derivative} from "mathjs";

class SurfaceBase {
    constructor() {
       
    }

    setSurfaceValues(a, b, c, R, r, formula_implicit_surface){
        //required in child class
    }

    evaluateSurface(pos){
        //required in child class
    }

    evaluateGradient(pos, gradient){
        //required in child class
    }

    computeTangentA(pos, normal, tangent_a){
        //required in child class
    }
}

export { SurfaceBase };