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
        vec3.copy(intersection_position, pos_inside);
        //vec3.copy(intersection_position, pos);
    }

    findIntersection(position, direction, intersection_position, intersection_direction){        
        var value = this.simulationParameters.evaluateSurface(position);
        if(value < 0){            
            this.findIntersectionFromInside(position, direction, intersection_position, intersection_direction);
        }
        if(value > 0){            
            this.findIntersectionFromOutside(position, direction, intersection_position, intersection_direction);
        }
    }

    findIntersectionFromInside(position, direction, intersection_position, intersection_direction){
        //console.warn("findIntersectionFromInside");
        var pos = vec3.create();
        var pos_inside = vec3.create();
        var pos_outside = vec3.create();
        var found_outside = false;
        vec3.copy(intersection_position, position);
        vec3.copy(pos_inside, position);
        vec3.copy(pos_outside, position);
        var step_size = this.simulationParameters.step_size;
        var max_steps = this.simulationParameters.max_steps;
        
        for(var i=1; i<max_steps; i++)
        {            
            var scale = i * step_size;        
            vec3.scaleAndAdd(pos, position, direction, scale);
            var value = this.simulationParameters.evaluateSurface(pos);
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
            console.warn("did not find outside");
        }        
    }

    findIntersectionFromOutside(position, direction, intersection_position, intersection_direction){
        //console.warn("findIntersectionFromOutside");
        var pos = vec3.create();
        var pos_inside = vec3.create();
        var pos_outside = vec3.create();
        var found_inside = false;
        vec3.copy(intersection_position, position);
        vec3.copy(pos_inside, position);
        vec3.copy(pos_outside, position);
        var step_size = this.simulationParameters.step_size;
        var max_steps = this.simulationParameters.max_steps;
        
        for(var i=1; i<max_steps; i++)
        {            
            var scale = i * step_size;        
            vec3.scaleAndAdd(pos, position, direction, scale);
            var value = this.simulationParameters.evaluateSurface(pos);
            if(value > 0){   
                //outside object            
                vec3.copy(pos_outside, pos);
            }
            else{
                //inside object   
                vec3.copy(pos_inside, pos);  
                found_inside = true;
                break;
            }
        }

        if(found_inside){
            this.bisectSurface(pos_inside, pos_outside, intersection_position);
        }else{
            console.warn("did not find inside");
        }        
    }


    moveToSurface(position){
        //console.warn("---------- moveToSurface ----------");
        //var intersection_position = vec3.create();
        var gradient = vec3.create();
        var direction = vec3.create();
        this.evaluateGradient(position, gradient);
        vec3.normalize(direction, gradient);


        var value = this.simulationParameters.evaluateSurface(position);
        //console.warn("value", value);
        if(value > 0){
            //console.warn("findIntersectionFromOutside");
            vec3.negate(direction, direction);
            this.findIntersectionFromOutside(position, direction, position);
            //var value = this.simulationParameters.evaluateSurface(position);
            //console.warn("new value", value);
        }
        else if(value < 0){
            //console.warn("findIntersectionFromInside");
            this.findIntersectionFromInside(position, direction, position);
            //var value = this.simulationParameters.evaluateSurface(position);
            //console.warn("new value", value);
        }
    }
}

export { SurfaceBase };