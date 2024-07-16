import * as Constants from "@/components/utility/constants";
import { getThetaFromCartesian, getPhiFromCartesian } from "@/components/utility/utility";
import { SurfaceBase } from "@/components/logic/surface_base";
import { vec3 } from "gl-matrix/esm";
import {evaluate, derivative} from "mathjs";

class SurfaceCustom extends SurfaceBase{
    constructor() {
        super();
        console.warn("CONSTRUCTOR SurfaceCustom");
    }

    setSurfaceValues(a, b, c, R, r, formula_implicit_surface){
        var noChange = formula_implicit_surface == this.formula_implicit_surface;
        this.formula_implicit_surface = formula_implicit_surface;
        this.computeDerivative();
        return noChange;
    }

    computeDerivative(){
        this.formula_implicit_surface_dx = derivative(this.formula_implicit_surface, "x").toString();
        this.formula_implicit_surface_dy = derivative(this.formula_implicit_surface, "y").toString();
        this.formula_implicit_surface_dz = derivative(this.formula_implicit_surface, "z").toString();
    }

    evaluateSurface(pos){
        let scope = {
            x: pos[0],
            y: pos[1],
            z: pos[2],
        };
        var value = evaluate(this.formula_implicit_surface, scope);
        return value;
    }

    evaluateGradient(pos, gradient){
        let scope = {
            x: pos[0],
            y: pos[1],
            z: pos[2],
        };
        var dx = evaluate(this.formula_implicit_surface_dx, scope);
        var dy = evaluate(this.formula_implicit_surface_dy, scope);
        var dz = evaluate(this.formula_implicit_surface_dz, scope);
        vec3.set(gradient, dx, dy, dz);
    }

    computeTangentA(pos, normal, tangent_a){

        //TODO: redo this function

        //set to ellipsoid test values
        var a = 3.5;
        var b = 2.5;
        var c = 1.5;

        //set to 1 for torus
        //a = 1;
        //b = 1;
        //c = 1;

        var x = pos[0];
        var y = pos[1];
        var z = pos[2];

        //calculate the ellipse of slicing the ellipsoid via z coordinate
        var root = Math.sqrt(1-(z*z)/(c*c))
        var a_e = a / root;
        var b_e = b / root;

        var pos_norm = vec3.create();
        vec3.normalize(pos_norm, pos);
        var dir_x = y * a_e*a_e;
        var dir_y = -x * b_e*b_e;
        vec3.set(tangent_a, dir_x, dir_y, 0);
        vec3.normalize(tangent_a, tangent_a);
    }
}

export { SurfaceCustom };