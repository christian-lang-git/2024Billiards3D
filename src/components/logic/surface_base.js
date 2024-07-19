import * as Constants from "@/components/utility/constants";
import { getThetaFromCartesian, getPhiFromCartesian } from "@/components/utility/utility";
import { vec3 } from "gl-matrix/esm";
import {evaluate, derivative} from "mathjs";

class SurfaceBase {
    constructor(simulationParameters) {
       this.simulationParameters = simulationParameters;
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

    bisectSurface(pos_inside, pos_outside, intersection_position){  
        //console.warn("bisectSurface pos_inside, pos_outside", pos_inside, pos_outside);  
        var number_of_bisection_steps = this.simulationParameters.number_of_bisection_steps;
        var value_outside = this.simulationParameters.evaluateSurface(pos_outside);    
        
        for(var i=0; i<number_of_bisection_steps; i++){
            //get and evaluate center point
            var pos = vec3.create();
            vec3.add(pos, pos_inside, pos_outside);
            vec3.scale(pos, pos, 0.5);
            //console.warn("bisectSurface pos", pos); 
            var value = this.simulationParameters.evaluateSurface(pos);

            //compare
            if((value>0) == (value_outside>0)){
                //center and outside have same sign
                vec3.copy(pos_outside, pos);
            }else{
                //center and inside have same sign
                vec3.copy(pos_inside, pos);
            }
        }

        //var value = this.simulationParameters.evaluateSurface(pos);
        //console.warn("bisect value", value);
        //console.warn("bisect pos", pos);
        vec3.copy(intersection_position, pos);
    }

    findIntersection(position, direction, intersection_position, intersection_direction){
        var pos = vec3.create();
        var pos_inside = vec3.create();
        var pos_outside = vec3.create();
        var found_outside = false;
        vec3.copy(intersection_position, position);
        vec3.copy(pos_inside, position);
        vec3.copy(pos_outside, position);
        var step_size = this.simulationParameters.step_size;
        var max_steps = this.simulationParameters.max_steps;
        
        //var value = this.simulationParameters.evaluateSurface(position);
        //console.warn("initial value", value);

        for(var i=1; i<max_steps; i++)
        {            
            var scale = i * step_size;        
            vec3.scaleAndAdd(pos, position, direction, scale);
            var value = this.simulationParameters.evaluateSurface(pos);
            //console.warn("value", value);
            if(value < 0){   
                //inside object             
                vec3.copy(pos_inside, pos);
            }
            else{
                //outside object   
                vec3.copy(pos_outside, pos);  
                found_outside = true;
                break;
            }
        }

        if(found_outside){
            this.bisectSurface(pos_inside, pos_outside, intersection_position);
        }else{
            //console.warn("did not find outside");
        }
        
        //console.warn("build intersection_position", intersection_position);
    }

    moveToSurface(position){
        //console.warn("moveToSurface", position);
        //var value = this.simulationParameters.evaluateSurface(position);    
        //console.warn("value start", value);
        //var value = this.simulationParameters.evaluateSurface(vec3.fromValues(0,0,0));    
        //console.warn("value 0", value);
        
        var gradient = vec3.create();
        this.evaluateGradient(position, gradient);
        var value = this.simulationParameters.evaluateSurface(position);

        console.warn("---------- moveToSurface ----------");
        console.warn("value", value);
    }
}

export { SurfaceBase };