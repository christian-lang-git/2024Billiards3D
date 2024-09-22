import * as Constants from "@/components/utility/constants";
import { getThetaFromCartesian, getPhiFromCartesian } from "@/components/utility/utility";
import { vec3 } from "gl-matrix/esm";
import {evaluate, derivative} from "mathjs";
import { SurfaceBase } from "@/components/logic/surface_base";

class SurfaceEllipsoid extends SurfaceBase{
    constructor(simulationParameters) {
        super(simulationParameters);
        console.warn("CONSTRUCTOR SurfaceEllipsoid");
    }

    setSurfaceValues(a, b, c, R, r, formula_implicit_surface){
        var noChange = a == this.var_a && b == this.var_b && c == this.var_c;

        this.var_a = a;
        this.var_b = b;
        this.var_c = c;
        this.one_div_aa = 1 / (a * a);
        this.one_div_bb = 1 / (b * b);
        this.one_div_cc = 1 / (c * c);
        
        return noChange;
    }

    computeDerivative(){
        //no computation required
    }

    evaluateSurface(pos){
        var x = pos[0];
        var y = pos[1];
        var z = pos[2];
        var value = x*x*this.one_div_aa + y*y*this.one_div_bb + z*z*this.one_div_cc - 1;
        return value;
    }

    evaluateGradient(pos, gradient){
        //https://www.wolframalpha.com/input?i=derivative&assumption=%7B%22C%22%2C+%22derivative%22%7D+-%3E+%7B%22Calculator%22%2C+%22dflt%22%7D&assumption=%7B%22F%22%2C+%22Derivative%22%2C+%22derivativefunction%22%7D+-%3E%22x*x%2F%28a*a%29+%2B+y*y%2F%28b*b%29+%2B+z*z%2F%28c*c%29+-+1%22&assumption=%7B%22F%22%2C+%22Derivative%22%2C+%22derivativevariable%22%7D+-%3E%22x%22
        var x = pos[0];
        var y = pos[1];
        var z = pos[2];
        var dx = 2*x*this.one_div_aa;
        var dy = 2*y*this.one_div_bb;
        var dz = 2*z*this.one_div_cc;
        vec3.set(gradient, dx, dy, dz);
    }

    computeTangentA(pos, normal, tangent_a){

        var a = this.var_a;
        var b = this.var_b;
        var c = this.var_c;
        var x = pos[0];
        var y = pos[1];
        var z = pos[2];

        //calculate the ellipse of slicing the ellipsoid via z coordinate
        var root = Math.sqrt(1-(z*z)/(c*c))
        var a_e = a * root;
        var b_e = b * root;

        //var pos_norm = vec3.create();
        //vec3.normalize(pos_norm, pos);
        var dir_x = y * a_e*a_e;
        var dir_y = -x * b_e*b_e;
        vec3.set(tangent_a, dir_x, dir_y, 0);
        vec3.normalize(tangent_a, tangent_a);
    }
}

export { SurfaceEllipsoid };