const glsl = x => x[0];
const SHADER_MODULE_BILLIARD = glsl`

FlowResults computeFlowResults(LocalGrid local_grid){            
    FlowResults flow_results;
    flow_results.xp = computeFlow(local_grid.xp);
    flow_results.xn = computeFlow(local_grid.xn);
    flow_results.yp = computeFlow(local_grid.yp);
    flow_results.yn = computeFlow(local_grid.yn);
    return flow_results;
}

PhaseState computeFlow(PhaseState seed_state){
    PhaseState current_state;
    PhaseState next_state;
    next_state.position = vec3(seed_state.position);
    next_state.direction = vec3(seed_state.direction);

    for(int i=0; i<number_of_intersections; i++){
        //get current state
        current_state.position = vec3(next_state.position);
        current_state.direction = vec3(next_state.direction);
        
        //intersection --> next state
        next_state = findIntersectionFromInside(current_state);        
        
        //reflect --> next direction
        vec3 gradient = evaluateGradient(next_state.position);
        vec3 normal = normalize(gradient);
        next_state.direction = reflecion(current_state.direction, normal);  

        //arc length
        //vec3 difference = next_state.position - current_state.position;
        //float segment_length = length(difference);
        //next_position_data.arc_length = current_position_data.arc_length + segment_length;
        //this.arc_length = next_position_data.arc_length; 
    }  

    return next_state;
}

vec3 reflecion(vec3 direction, vec3 normal){    
    return reflecion_regular(direction, normal);
}

vec3 reflecion_regular(vec3 direction, vec3 normal){
    float d = dot(direction, normal);
    return direction - 2.0*d*normal;//reflection_direction: r=d-2(d dot n)n with direction d and normal n
}    

float computePSFTLE(vec3 dpos_dx, vec3 dvel_dx, vec3 dpos_dy, vec3 dvel_dy, int type){
    //build Cauchy-Green
    mat2 C;
    if(type == 0){//0 = psftle
        C = BuildCauchyGreen(dpos_dx, dvel_dx, dpos_dy, dvel_dy);
    }
    else if(type == 1){//1 = psftle_pos
        C = BuildCauchyGreenPos(dpos_dx, dpos_dy);
    }
    else if(type == 2){//2 = psftle_vel
        C = BuildCauchyGreenVel(dvel_dx, dvel_dy);
    }

    //biggest eigenvalue lambda_max
    vec2 lambdas = vec2(0,0);
    mat2eigenvalues(C, lambdas);
    float lambda_max = max(lambdas.x, lambdas.y);

    //FTLE
    float advection_time = 1.0;//TODO SCALING?
    float ftle = 1.0 / advection_time * log(sqrt(lambda_max));

    return ftle;
}

float evaluateSurface(vec3 position){
    switch (surface_type) {
        case 0://custom
            return 0.0;//TODO   
        case 1://ELLIPSOID
            return evaluateSurfaceEllipsoid(position);   
        case 2://TORUS
            return evaluateSurfaceTorus(position);   
        default:
            return 0.0;
    }
}

float evaluateSurfaceEllipsoid(vec3 position){
    float x = position.x;
    float y = position.y;
    float z = position.z;

    float value = x*x*one_div_aa + y*y*one_div_bb + z*z*one_div_cc - 1.0;
    return value;
}

float evaluateSurfaceTorus(vec3 position){
    float x = position.x;
    float y = position.y;
    float z = position.z;

    float xx = x*x;
    float yy = y*y;
    float zz = z*z;
    float RR = var_R*var_R;
    float rr = var_r*var_r;        
    float sum = xx + yy + zz + RR - rr;

    float value = sum*sum - 4.0*RR*(xx+yy);
    return value;
}

vec3 evaluateGradient(vec3 position){
    switch (surface_type) {
        case 0://custom
            return vec3(0,0,0);//TODO
        case 1://ELLIPSOID
            return evaluateGradientEllipsoid(position);   
        case 2://TORUS
            return evaluateGradientTorus(position);   
        default:
            return vec3(0,0,0);
    }
}

vec3 evaluateGradientEllipsoid(vec3 position){
    float x = position.x;
    float y = position.y;
    float z = position.z;
    float dx = 2.0*x*one_div_aa;
    float dy = 2.0*y*one_div_bb;
    float dz = 2.0*z*one_div_cc;
    return vec3(dx, dy, dz);
}

vec3 evaluateGradientTorus(vec3 position){
    float x = position.x;
    float y = position.y;
    float z = position.z;
    
    float xx = x*x;
    float yy = y*y;
    float zz = z*z;
    float RR = var_R*var_R;
    float rr = var_r*var_r;
    float sum = - rr - RR + xx + yy + zz;
    float sum2 = - rr + RR + xx + yy + zz;

    float dx = 4.0*x*sum;
    float dy = 4.0*y*sum;
    float dz = 4.0*z*sum2;
    return vec3(dx, dy, dz);
}

vec3 computeTangentA(vec3 position){
    switch (surface_type) {
        case 0://custom
            return vec3(0,0,0);//TODO
        case 1://ELLIPSOID
            return computeTangentAEllipsoid(position);   
        case 2://TORUS
            return computeTangentATorus(position);   
        default:
            return vec3(0,0,0);
    }
}

vec3 computeTangentAEllipsoid(vec3 position){
    float x = position.x;
    float y = position.y;
    float z = position.z;
    float a = var_a;
    float b = var_b;
    float c = var_c;

    //calculate the ellipse of slicing the ellipsoid via z coordinate
    float root = sqrt(1.0-(z*z)/(c*c));
    float a_e = a / root;
    float b_e = b / root;

    float dir_x = y * a_e*a_e;
    float dir_y = -x * b_e*b_e;
    return normalize(vec3(dir_x, dir_y, 0));
}

vec3 computeTangentATorus(vec3 position){
    float x = position.x;
    float y = position.y;
    float z = position.z;

    float dir_x = y;
    float dir_y = -x;
    return normalize(vec3(dir_x, dir_y, 0));
}

vec3 bisectSurface(vec3 pos_inside, vec3 pos_outside){  
    float value_outside = evaluateSurface(pos_outside);    
    
    for(int i=0; i<number_of_bisection_steps; i++){
        //get and evaluate center point
        vec3 pos = (pos_inside + pos_outside) * 0.5;
        float value = evaluateSurface(pos);

        //compare
        if((value>0.0) == (value_outside>0.0)){
            //center and outside have same sign
            pos_outside = vec3(pos);
        }else{
            //center and inside have same sign
            pos_inside = vec3(pos);
        }
    }    

    return pos_inside;//approximate intersection_position but always on the inside
}

PhaseState findIntersection(PhaseState phase_state){        
    float value = evaluateSurface(phase_state.position);
    if(value < 0.0){            
        return findIntersectionFromInside(phase_state);
    }
    if(value > 0.0){            
        return findIntersectionFromOutside(phase_state);
    }
    return phase_state;
}

PhaseState findIntersectionFromInside(PhaseState phase_state){            
    vec3 position = phase_state.position;
    vec3 direction = phase_state.direction;

    vec3 pos_inside = vec3(position);
    vec3 pos_outside = vec3(position);
    bool found_outside = false;
    
    for(int i=1; i<max_steps; i++)
    {            
        float scale = float(i) * step_size;   
        vec3 pos = position + scale * direction;
        float value = evaluateSurface(pos);
        if(value < 0.0){   
            //inside object             
            pos_inside = vec3(pos);
        }
        else{
            //outside object    
            pos_outside = vec3(pos);
            found_outside = true;
            break;
        }
    }

    if(found_outside){
        vec3 new_position = bisectSurface(pos_inside, pos_outside);
        phase_state.position = new_position;
    }    

    return phase_state;
}

PhaseState findIntersectionFromOutside(PhaseState phase_state){
    vec3 position = phase_state.position;
    vec3 direction = phase_state.direction;

    vec3 pos_inside = vec3(position);
    vec3 pos_outside = vec3(position);
    bool found_inside = false;
    
    for(int i=1; i<max_steps; i++)
    {            
        float scale = float(i) * step_size;   
        vec3 pos = position + scale * direction;
        float value = evaluateSurface(pos);
        if(value > 0.0){   
            //outside object            
            pos_outside = vec3(pos);
        }
        else{
            //inside object      
            pos_inside = vec3(pos);
            found_inside = true;
            break;
        }
    }

    if(found_inside){
        vec3 new_position = bisectSurface(pos_inside, pos_outside);
        phase_state.position = new_position;
    }
     
    return phase_state;
}

vec3 moveToSurface(vec3 position){
    vec3 gradient = evaluateGradient(position);
    vec3 direction = normalize(gradient);    

    float value = evaluateSurface(position);
    PhaseState phase_state;
    phase_state.position = position;
    if(value > 0.0){
        phase_state.direction = -direction;//NEGATED DIRECTION
        return findIntersectionFromOutside(phase_state).position;
    }
    else if(value < 0.0){
        phase_state.direction = direction;
        return findIntersectionFromInside(phase_state).position;
    }
}

`;

export { SHADER_MODULE_BILLIARD }