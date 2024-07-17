import * as THREE from "three";
import { glMatrix, mat2, mat2d, mat3, mat4, quat, quat2, vec2, vec3, vec4 } from "gl-matrix/esm";

class PointData {
    constructor() {
        this.position = vec3.create();
        this.direction = vec3.create();
        this.arc_length = 0;
        this.t = 0;
    }

    getPosTHREE() {
        return new THREE.Vector3(this.position[0], this.position[1], this.position[2]);
    }
}

class Streamline {
    constructor(streamline_generator, multi) {
        //console.log("Streamline: initialize");
        this.streamline_generator = streamline_generator;
        this.simulationParameters = streamline_generator.simulationParameters;
        this.scene = streamline_generator.scene;
        this.multi = multi;

        this.list_point_data = [];
        this.path = null;
        this.signum = 1;
        this.arc_length = 0;

        this.seed_position = vec3.fromValues(0.75, 0.4, 0);
        this.seed_direction = vec3.fromValues(0, 0, 0.1);
        this.seed_velocity = vec3.fromValues(0, 0, 0.1);
        this.seed_direction_normalized = vec3.create();
        vec3.normalize(this.seed_direction_normalized, this.seed_direction);

        this.existsInScene = false;
    }

    setSeed(position, direction) {
        vec3.copy(this.seed_position, position);
        vec3.copy(this.seed_direction, direction);
        vec3.normalize(this.seed_direction_normalized, this.seed_direction);
    }

    setSeedPosition(position) {
        vec3.copy(this.seed_position, position);
    }

    setSeedDirection(direction) {
        vec3.copy(this.seed_direction, direction);
        vec3.normalize(this.seed_direction_normalized, this.seed_direction);
    }
    /*
    recalculate(x, y, z, dir_x, dir_y, dir_z, energy) {
        if(this.existsInScene){
            this.scene.remove(this.mesh);
        }

        var seed_direction = vec3.fromValues(dir_x, dir_y, dir_z);
        vec3.normalize(seed_direction, seed_direction);
        vec3.scale(seed_direction, seed_direction, energy);

        this.setSeedPosition(vec3.fromValues(x, y, z));
        this.setSeedDirection(seed_direction);
        this.calculate();
        this.build();

        this.scene.add(this.mesh);
        this.existsInScene = true;
    }
    */

    recalculate(x, y, z, dir_x, dir_y, dir_z, energy) {
        this.setSeedPosition(vec3.fromValues(x, y, z));
        this.setSeedDirection(vec3.fromValues(dir_x, dir_y, dir_z));
        this.updateSeedVelocity();
        this.calculate();    
    }

    recalculateFromOther(other){
        //console.warn("OTHER:", other);
        var seed_position = vec3.create();
        var seed_direction = vec3.create();
        var end_point_data = other.list_point_data[other.list_point_data.length-1];
        vec3.copy(seed_position, end_point_data.position);
        vec3.copy(seed_direction, end_point_data.direction);
        vec3.copy(this.seed_velocity, end_point_data.direction);

        this.setSeedPosition(seed_position);
        this.setSeedDirection(seed_direction);
        this.calculate();
    }

    updateSeedVelocity(){
        //console.warn("SEED DIRECTION: ", this.seed_direction);

        if(this.simulationParameters.use_constant_velocity){
            //if set to true, use constant velocity
            var dir_normalized = vec3.create();
            vec3.normalize(dir_normalized, this.seed_direction);
            vec3.scale(this.seed_velocity, dir_normalized, this.simulationParameters.seed_energy);
        }
        else{
            //if set to false, use constant hamiltonian
            var dir_normalized = vec3.create();
            vec3.normalize(dir_normalized, this.seed_direction);
            var dir_x = dir_normalized[0];
            var dir_y = dir_normalized[1];
            var dir_z = dir_normalized[2];
            var x = this.seed_position[0];
            var y = this.seed_position[1];
            var z = this.seed_position[2];
    
            var mu = this.simulationParameters.mu;
            var n = this.simulationParameters.angular_velocity;
            var H = this.simulationParameters.seed_energy;
            var phi = - (1-mu)/(Math.sqrt((x+mu)*(x+mu) + y*y + z*z)) - mu/(Math.sqrt((x-(1-mu))*(x-(1-mu)) + y*y + z*z));
            var ydxminusxdy = y*dir_x - x*dir_y;
            var L = -n * ydxminusxdy;
            var R = Math.sqrt(n*n*ydxminusxdy*ydxminusxdy - 2*(phi-H));
    
            var a1 = L + R;
            var a2 = L - R;
            var a = Math.max(a1, a2);
            //console.warn("results for a", a1, a2);
    
            vec3.scale(this.seed_velocity, dir_normalized, a);
        }

        //console.warn("SEED VELOCITY: ", this.seed_velocity);
    }

    reflect(direction, normal, reflection_direction){

        //debugging: reflect in normal direction
        //vec3.negate(normal, normal);
        //vec3.copy(reflection_direction, normal);

        this.reflect_regular(direction, normal, reflection_direction);
    }

    reflect_regular(direction, normal, reflection_direction){
        var d = vec3.dot(direction, normal);
        vec3.scaleAndAdd(reflection_direction, direction, normal, -2*d);//r=d-2(d dot n)n with direction d and normal n
        //console.warn("direction", direction);  
        //console.warn("normal", normal);  
        //console.warn("reflection_direction", reflection_direction);  
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

    calculate(){
        this.list_point_data = [];
        this.arc_length = 0;
        this.t = 0;
        this.success = true;
        var difference = vec3.create();
        var normal = vec3.create();
        //initial position
        var current_position_data = new PointData();
        vec3.copy(current_position_data.position, this.seed_position);
        vec3.copy(current_position_data.direction, this.seed_direction_normalized);
        this.list_point_data.push(current_position_data);

        //intersection
        var next_position_data = new PointData();
        this.list_point_data.push(next_position_data);
        this.findIntersection(current_position_data.position, current_position_data.direction, next_position_data.position, next_position_data.direction);

        //console.warn("build this.seed_position", this.seed_position);
        //console.warn("build next_position_data", next_position_data);
        //console.warn("build this.list_point_data", this.list_point_data);
        
        vec3.subtract(difference, next_position_data.position, current_position_data.position);
        var segment_length = vec3.length(difference);
        //console.warn("segment length", segment_length);
        next_position_data.arc_length = current_position_data.arc_length + segment_length;
        //next_position_data.t = current_position_data.t + step_size;
        this.arc_length = next_position_data.arc_length;

        //reflection
        //this.evaluateGradient(next_position_data.position, next_position_data.direction);
        //vec3.normalize(next_position_data.direction, next_position_data.direction);
        //vec3.negate(next_position_data.direction, next_position_data.direction);
        
        
        
        this.simulationParameters.evaluateGradient(next_position_data.position, normal);
        vec3.normalize(normal, normal);
        //vec3.negate(normal, normal);

        this.reflect(current_position_data.direction, normal, next_position_data.direction);  
         
    }


    //unused but kept in case we need rk4 later
    /*
    calculateRK4() {
        this.list_point_data = [];
        this.arc_length = 0;
        this.t = 0;
        this.success = false;

        //initial position
        var current_position_data = new PointData();
        vec3.copy(current_position_data.position, this.seed_position);
        vec3.copy(current_position_data.direction, this.seed_velocity);
        this.list_point_data.push(current_position_data);

        //debug: hamiltonian
        var H = this.calculateHamiltonian(this.seed_position[0], this.seed_position[1], this.seed_position[2],
            this.seed_velocity[0], this.seed_velocity[1], this.seed_velocity[2], this.simulationParameters.mu, this.simulationParameters.angular_velocity);
        console.warn("debug hamiltonian start:", H);
        this.hamiltonian_smallest = H;
        this.hamiltonian_largest = H;

        //debug: Ueff
        var Ueff = this.calculateUeff(this.seed_position[0], this.seed_position[1], this.seed_position[2], this.simulationParameters.mu);
        console.warn("debug Ueff start:", Ueff);

        var difference = vec3.create();//current - previous positions, calculated from k values
        var k1 = vec3.create();
        var k2 = vec3.create();
        var k3 = vec3.create();
        var k4 = vec3.create();
        var k1_2 = vec3.create();// k1_2 = k1/2
        var k2_2 = vec3.create();// k2_2 = k2/2
        var k1_6 = vec3.create();// k1_6 = k1/6
        var k2_3 = vec3.create();// k2_3 = k2/3
        var k3_3 = vec3.create();// k3_3 = k3/3
        var k4_6 = vec3.create();// k4_6 = k4/6
        var current_plus_k1_2 = vec3.create();
        var current_plus_k2_2 = vec3.create();
        var current_plus_k3 = vec3.create();

        var difference_l = vec3.create();//current - previous positions, calculated from k values
        var l1 = vec3.create();
        var l2 = vec3.create();
        var l3 = vec3.create();
        var l4 = vec3.create();
        var l1_2 = vec3.create();// k1_2 = k1/2
        var l2_2 = vec3.create();// k2_2 = k2/2
        var l1_6 = vec3.create();// k1_6 = k1/6
        var l2_3 = vec3.create();// k2_3 = k2/3
        var l3_3 = vec3.create();// k3_3 = k3/3
        var l4_6 = vec3.create();// k4_6 = k4/6
        var current_plus_l1_2 = vec3.create();
        var current_plus_l2_2 = vec3.create();
        var current_plus_l3 = vec3.create();

        var max_steps = this.streamline_generator.simulationParameters.max_steps;
        var step_size = this.streamline_generator.simulationParameters.step_size;
        var number_of_intersections = this.streamline_generator.simulationParameters.number_of_intersections;
        var isOnPositiveZ = this.seed_direction[2] >= 0;

        for (var i = 0; i < max_steps; i++) {
            //reference to the current position (result from last iteration)
            var current_position = current_position_data.position;
            var current_direction = current_position_data.direction;

            //the new point to be calculated
            var next_position_data = new PointData();
            this.list_point_data.push(next_position_data);



            //---------- START OF RK4 ----------
            //CALCULATE: vec3 k1 = step_size * f(current_position, signum);
            vec3.scale(k1, this.streamline_generator.f_position(current_position, current_direction, this.signum), step_size);
            vec3.scale(l1, this.streamline_generator.f_direction(current_position, current_direction, this.signum), step_size);

            //CALCULATE: vec3 k2 = step_size * f(current_position + k1/2, signum);
            vec3.scale(k1_2, k1, 1 / 2);// k1_2 = k1/2      
            vec3.scale(l1_2, l1, 1 / 2);// k1_2 = k1/2      
            vec3.add(current_plus_k1_2, current_position, k1_2);// current_position + k1/2         
            vec3.add(current_plus_l1_2, current_direction, l1_2);// current_position + k1/2       
            vec3.scale(k2, this.streamline_generator.f_position(current_plus_k1_2, current_plus_l1_2, this.signum), step_size);
            vec3.scale(l2, this.streamline_generator.f_direction(current_plus_k1_2, current_plus_l1_2, this.signum), step_size);

            //CALCULATE: vec3 k3 = step_size * f(current_position + k2/2, signum);
            vec3.scale(k2_2, k2, 1 / 2);// k2_2 = k2/2
            vec3.scale(l2_2, l2, 1 / 2);// k2_2 = k2/2
            vec3.add(current_plus_k2_2, current_position, k2_2);// current_position + k2/2   
            vec3.add(current_plus_l2_2, current_direction, k2_2);// current_position + k2/2        
            vec3.scale(k3, this.streamline_generator.f_position(current_plus_k2_2, current_plus_l2_2, this.signum), step_size);
            vec3.scale(l3, this.streamline_generator.f_direction(current_plus_k2_2, current_plus_l2_2, this.signum), step_size);

            //CALCULATE: vec3 k4 = step_size * f(current_position + k3, signum);
            vec3.add(current_plus_k3, current_position, k3);// current_position + k3     
            vec3.add(current_plus_l3, current_direction, l3);// current_position + k3       
            vec3.scale(k4, this.streamline_generator.f_position(current_plus_k3, current_plus_l3, this.signum), step_size);
            vec3.scale(l4, this.streamline_generator.f_direction(current_plus_k3, current_plus_l3, this.signum), step_size);

            //CALCULATE: vec3 next_position = current_position + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6;
            vec3.scale(k1_6, k1, 1 / 6);// k1_6 = k1/6
            vec3.scale(l1_6, l1, 1 / 6);// k1_6 = k1/6
            vec3.scale(k2_3, k2, 1 / 3);// k2_3 = k2/3
            vec3.scale(l2_3, l2, 1 / 3);// k2_3 = k2/3
            vec3.scale(k3_3, k3, 1 / 3);// k3_3 = k3/3
            vec3.scale(l3_3, l3, 1 / 3);// k3_3 = k3/3
            vec3.scale(k4_6, k4, 1 / 6);// k4_6 = k4/6
            vec3.scale(l4_6, l4, 1 / 6);// k4_6 = k4/6

            vec3.copy(difference, k1_6);
            vec3.copy(difference_l, l1_6);
            vec3.add(difference, difference, k2_3);// k1 / 6 + k2 / 3
            vec3.add(difference_l, difference_l, l2_3);// k1 / 6 + k2 / 3
            vec3.add(difference, difference, k3_3);// k1 / 6 + k2 / 3 + k3 / 3
            vec3.add(difference_l, difference_l, l3_3);// k1 / 6 + k2 / 3 + k3 / 3
            vec3.add(difference, difference, k4_6);// k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6
            vec3.add(difference_l, difference_l, l4_6);// k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6

            //vec3.add(difference, difference, k4_6);// next_position = current_position + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6;
            //vec3.add(difference_l, difference_l, l4_6);// next_position = current_position + k1 / 6 + k2 / 3 + k3 / 3 + k4 / 6;
            vec3.add(next_position_data.position, current_position, difference);
            vec3.add(next_position_data.direction, current_direction, difference_l);

            //console.log(next_position_data.position);
            var segment_length = vec3.length(difference);
            next_position_data.arc_length = current_position_data.arc_length + segment_length;
            next_position_data.t = current_position_data.t + step_size;

            this.arc_length = next_position_data.arc_length;


            //debug: hamiltonian
            var H = this.calculateHamiltonian(current_position_data.position[0], current_position_data.position[1], current_position_data.position[2],
                current_position_data.direction[0], current_position_data.direction[1], current_position_data.direction[2],
                this.simulationParameters.mu, this.simulationParameters.angular_velocity);
            this.hamiltonian_smallest = Math.min(H, this.hamiltonian_smallest);
            this.hamiltonian_largest = Math.max(H, this.hamiltonian_largest);

            //check if there is a plane intersection
            if (isOnPositiveZ) {
                //we are currently at z > 0
                if (next_position_data.position[2] < 0) {
                    isOnPositiveZ = false;
                    number_of_intersections -= 1;
                    console.warn("multi a", this.multi);
                    this.multi.list_point_data_returns.push(current_position_data);
                    this.success = true;
                    break;//stop early
                }
            } else {
                //we are currently at z < 0
                if (next_position_data.position[2] > 0) {
                    isOnPositiveZ = true;
                    number_of_intersections -= 1;
                    console.warn("multi b", this.multi);
                    this.multi.list_point_data_returns.push(current_position_data);
                    this.success = true;
                    break;//stop early
                }
            }

            //---------- END OF RK4 ----------
            //prepare next iteration

            current_position_data = next_position_data;
        }
        
        console.warn("debug hamiltonian smallest:", this.hamiltonian_smallest);
        console.warn("debug hamiltonian largest:", this.hamiltonian_largest);
    }
        */

    build() {
        this.path = new THREE.CurvePath();
        //console.log(this.list_point_data);
        for (var point_index = 1; point_index < this.list_point_data.length; point_index++) {
            var point_data_A = this.list_point_data[point_index - 1];
            var point_data_B = this.list_point_data[point_index];
            var curve = new THREE.LineCurve3(point_data_A.getPosTHREE(), point_data_B.getPosTHREE());
            this.path.add(curve);
        }

        var radius = this.streamline_generator.simulationParameters.tube_radius;
        var num_sides = this.streamline_generator.simulationParameters.tube_num_sides;

        var tube_segment_length = this.streamline_generator.simulationParameters.tube_segment_length;
        var num_segments = Math.ceil(this.arc_length / tube_segment_length);
        num_segments = Math.min(num_segments, this.streamline_generator.simulationParameters.tube_max_segments);

        num_segments = 1;

        //console.warn("build num_segments", num_segments);
        this.geometry = new THREE.TubeGeometry(this.path, num_segments, radius, num_sides, false);
        //this.material = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5 });
        //this.material = new THREE.MeshStandardMaterial({ color: 0x0090ff, roughness: 0.5 });
        //this.material = new THREE.MeshStandardMaterial({ color: 0x00b0ff, roughness: 0.75 });
        //this.material = new THREE.MeshStandardMaterial({ color: 0x00b0ff, roughness: 0.75, emissive: 0x00b0ff, emissiveIntensity: 0.4 });
        //this.material = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.75, emissive: 0x00ffff, emissiveIntensity: 0.4 });

        var tube_color = this.streamline_generator.simulationParameters.tube_color;
        var tube_roughness = this.streamline_generator.simulationParameters.tube_roughness;
        var tube_emissive_intensity = this.streamline_generator.simulationParameters.tube_emissive_intensity;
        this.material = new THREE.MeshStandardMaterial({ color: tube_color, roughness: tube_roughness, emissive: tube_color, emissiveIntensity: tube_emissive_intensity });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    calculateHamiltonian(x, y, z, px, py, pz, mu, n){
        var L = 0.5*(px*px + py*py + pz*pz);
        var phi = - (1-mu)/(Math.sqrt((x+mu)*(x+mu) + y*y + z*z)) - mu/(Math.sqrt((x-(1-mu))*(x-(1-mu)) + y*y + z*z));
        var R = n*(y*px - x*py);        
        return L + phi + R;
    }

    calculateUeff(x, y, z, mu){
        var phi = - (1-mu)/(Math.sqrt((x+mu)*(x+mu) + y*y + z*z)) - mu/(Math.sqrt((x-(1-mu))*(x-(1-mu)) + y*y + z*z));
        var R = 1/2*(x*x + y*y);
        return phi - R;
    }
}

class MultipleReturnsStreamline {

    constructor(streamline_generator) {
        console.log("MultipleReturnsStreamline: initialize");
        this.streamline_generator = streamline_generator;
        this.simulationParameters = streamline_generator.simulationParameters;
        this.scene = streamline_generator.scene;
        this.has_data = false;
        this.initialize();
    }

    initialize() {
        this.list_streamlines = [];
        this.list_point_data_returns = [];
        var streamline = new Streamline(this.streamline_generator, this);
        this.list_streamlines.push(streamline);
    }

    recalculateWithLastParameters() {
        if(!this.has_data){
            console.warn("recalculateWithLastParameters NO DATA YET");
            return;
        }

        this.list_point_data_returns = [];
        var number_of_intersections = this.simulationParameters.number_of_intersections;
        var index = 0;

        //calculate initial streamline with last parameters
        var streamline = this.list_streamlines[index];
        streamline.updateSeedVelocity();
        streamline.calculate();
        number_of_intersections -= 1;
        this.number_success = streamline.success ? 1 : 0;
        this.number_computed = 1;

        //calculate additional streamlines starting from previous end point
        while (number_of_intersections > 0) {
            index += 1;
            var previous = this.list_streamlines[index - 1];
            if (!previous.success) {
                break;
            }

            if(index == this.list_streamlines.length){
                var new_streamline = new Streamline(this.streamline_generator, this);
                this.list_streamlines.push(new_streamline);
            }
            var streamline = this.list_streamlines[index];
            streamline.recalculateFromOther(previous);
            number_of_returns -= 1;
            this.number_computed += 1;
            this.number_success += streamline.success ? 1 : 0;
        }
    }

    recalculateKeepPosition(){
        if(!this.has_data){
            console.warn("recalculateKeepPosition NO DATA YET");
            return;
        }

        var streamline = this.list_streamlines[0];
        var position = streamline.seed_position;
        var dir_x = this.simulationParameters.seed_direction_x;
        var dir_y = this.simulationParameters.seed_direction_y;
        var dir_z = this.simulationParameters.seed_direction_z;
        var energy = this.simulationParameters.seed_energy;
        this.recalculate(position[0], position[1], position[2], dir_x, dir_y, dir_z, energy);
    }

    recalculate(x, y, z, dir_x, dir_y, dir_z, energy) {
        this.list_point_data_returns = [];
        var number_of_intersections = this.simulationParameters.number_of_intersections;
        var index = 0;

        //calculate initial streamline with new parameters
        var streamline = this.list_streamlines[index];
        //console.warn("------");
        //console.warn("index", 0)
        streamline.recalculate(x, y, z, dir_x, dir_y, dir_z, energy);
        number_of_intersections -= 1;
        this.number_success = streamline.success ? 1 : 0;
        this.number_computed = 1;

        //calculate additional streamlines starting from previous end point
        while (number_of_intersections > 0) {
            index += 1;
            //console.warn("------");
            //console.warn("index", index)
            var previous = this.list_streamlines[index - 1];
            if (!previous.success) {
                break;
            }

            if(index == this.list_streamlines.length){
                var new_streamline = new Streamline(this.streamline_generator, this);
                this.list_streamlines.push(new_streamline);
            }
            var streamline = this.list_streamlines[index];
            streamline.recalculateFromOther(previous);
            number_of_intersections -= 1;
            this.number_computed += 1;
            this.number_success = streamline.success ? this.number_success+1 : this.number_success;
        }

        this.has_data = true;
    }

    updateStreamlineModels() {
        console.warn("this.number_success", this.number_success)
        for (var i = 0; i < this.list_streamlines.length; i++) {
            var streamline = this.list_streamlines[i];
            if (streamline.existsInScene) {
                this.scene.remove(streamline.mesh);
            }
            var conditio_success = i < this.number_success;
            var condition_computed = i < this.number_computed;
            var condition = this.simulationParameters.tube_only_show_successful_returns ? conditio_success : condition_computed;
            if (condition){
                streamline.build();
                this.scene.add(streamline.mesh);
                streamline.existsInScene = true;
            }
        }
    }
}

class StreamlineGenerator {

    constructor(simulationParameters, scene) {
        console.log("StreamlineGenerator: initialize");
        this.simulationParameters = simulationParameters;
        this.scene = scene;
        this.initialize();
    }

    initialize() {
        this.list_multi = [];
        var multi = new MultipleReturnsStreamline(this);
        this.list_multi.push(multi);
    }

    recalculateMulti(index, x, y, z, dir_x, dir_y, dir_z, energy) {
        //console.warn("### recalculateMulti");
        this.list_multi[index].recalculate(x, y, z, dir_x, dir_y, dir_z, energy);
    }

    recalculateMultiKeepPosition(index) {
        //console.warn("### recalculateMultiAtLastPosition");
        this.list_multi[index].recalculateKeepPosition();
    }

    recalculateMultiWithLastParameters(index) {
        //console.warn("### recalculateMultiWithLastParameters");
        this.list_multi[index].recalculateWithLastParameters();
    }

    updateMultiModel(index) {
        //console.warn("### updateMultiModel");
        this.list_multi[index].updateStreamlineModels();
    }

    f_position(position, direction, signum) {
        var n = this.simulationParameters.angular_velocity;

        var x = position[0];
        var y = position[1];
        //var z = position[2];

        var px = direction[0];
        var py = direction[1];
        var pz = direction[2];

        //equations of motion
        var u = px + n * y;
        var v = py - n * x;
        var w = pz;

        var result = vec3.create();
        result[0] = u * signum;
        result[1] = v * signum;
        result[2] = w * signum;
        return result;
    }

    f_direction(position, direction, signum) {
        var n = this.simulationParameters.angular_velocity;
        var mu = this.simulationParameters.mu;

        var x = position[0];
        var y = position[1];
        var z = position[2];

        var px = direction[0];
        var py = direction[1];
        //var pz = direction[2];

        //helper variables
        var muplusx = mu + x;
        var muminusone = mu - 1;
        var muplusxminusone = muplusx - 1;
        var left_denominator = Math.pow((muplusxminusone * muplusxminusone + y * y + z * z), (3 / 2));
        var right_denominator = Math.pow((muplusx * muplusx + y * y + z * z), (3 / 2));

        var dphi_dx = (mu * muplusxminusone) / left_denominator - (muminusone * muplusx) / right_denominator;
        var dphi_dy = (mu * y) / left_denominator - (muminusone * y) / right_denominator;
        var dphi_dz = (mu * z) / left_denominator - (muminusone * z) / right_denominator;

        //equations of motion
        var u = n * py - dphi_dx;
        var v = -n * px - dphi_dy;
        var w = - dphi_dz;

        var result = vec3.create();
        result[0] = u * signum;
        result[1] = v * signum;
        result[2] = w * signum;
        return result;
    }

}

export { StreamlineGenerator };