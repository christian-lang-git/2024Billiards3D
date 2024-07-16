import * as Constants from "@/components/utility/constants";
import { getThetaFromCartesian, getPhiFromCartesian } from "@/components/utility/utility";
import { vec3 } from "gl-matrix/esm";
import {evaluate, derivative} from "mathjs";
import { SurfaceBase } from "@/components/logic/surface_base";

class SurfaceTorus extends SurfaceBase{
    constructor() {
        super();
        console.warn("CONSTRUCTOR SurfaceTorus");
    }

    setSurfaceValues(a, b, c, R, r, formula_implicit_surface){
        var noChange = R == this.var_R && r == this.var_r;

        this.var_R = R;
        this.var_r = r;
        
        return noChange;
    }

    computeDerivative(){
        //no computation required
    }

    evaluateSurface(pos){
        var x = pos[0];
        var y = pos[1];
        var z = pos[2];

        var xx = x*x;
        var yy = y*y;
        var zz = z*z;
        var RR = this.var_R*this.var_R;
        var rr = this.var_r*this.var_r;        
        var sum = xx + yy + zz + RR - rr

        var value = sum*sum - 4*RR*(xx+yy);
        return value;
    }

    evaluateGradient(pos, gradient){
        //https://www.wolframalpha.com/input?i=derivative+%28x*x%2By*y%2Bz*z%2BR*R-r*r%29*%28x*x%2By*y%2Bz*z%2BR*R-r*r%29+-+4*R*R*%28x*x%2By*y%29
        var x = pos[0];
        var y = pos[1];
        var z = pos[2];

        var xx = x*x;
        var yy = y*y;
        var zz = z*z;
        var RR = this.var_R*this.var_R;
        var rr = this.var_r*this.var_r;
        var sum = - rr - RR + xx + yy + zz;
        var sum2 = - rr + RR + xx + yy + zz;

        var dx = 4*x*sum;
        var dy = 4*y*sum;
        var dz = 4*z*sum2;
        vec3.set(gradient, dx, dy, dz);
    }

    computeTangentA(pos, normal, tangent_a){
        var x = pos[0];
        var y = pos[1];
        var z = pos[2];

        var pos_norm = vec3.create();
        vec3.normalize(pos_norm, pos);
        var dir_x = y;
        var dir_y = -x;
        vec3.set(tangent_a, dir_x, dir_y, 0);
        vec3.normalize(tangent_a, tangent_a);
    }
}

export { SurfaceTorus };