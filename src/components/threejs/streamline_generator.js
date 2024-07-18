import * as THREE from "three";
import { glMatrix, mat2, mat2d, mat3, mat4, quat, quat2, vec2, vec3, vec4 } from "gl-matrix/esm";
import { computeOrthogonalVector } from "@/components/utility/utility";

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

        this.number_of_allocated_points = 0;
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

    recalculate(number_of_intersections, x, y, z, dir_x, dir_y, dir_z, energy) {
        this.setSeedPosition(vec3.fromValues(x, y, z));
        this.setSeedDirection(vec3.fromValues(dir_x, dir_y, dir_z));
        this.updateSeedVelocity();
        this.calculate(number_of_intersections);    
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

    calculate(number_of_intersections){
        var new_number_of_allocated_points = number_of_intersections + 1;
        if(this.number_of_allocated_points != new_number_of_allocated_points){
            this.number_of_allocated_points = new_number_of_allocated_points;
            console.warn("NEW NUMBER OF POINTS", new_number_of_allocated_points);
        }
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

        for(var i=1; i<this.number_of_allocated_points; i++){
            var current_position_data = this.list_point_data[i-1];
            
            //intersection --> next position
            var next_position_data = new PointData();
            this.list_point_data.push(next_position_data);
            this.findIntersection(current_position_data.position, current_position_data.direction, next_position_data.position, next_position_data.direction);        
            
            //reflect --> next direction
            this.simulationParameters.evaluateGradient(next_position_data.position, normal);
            vec3.normalize(normal, normal);
            this.reflect(current_position_data.direction, normal, next_position_data.direction);  

            //arc length
            vec3.subtract(difference, next_position_data.position, current_position_data.position);
            var segment_length = vec3.length(difference);
            next_position_data.arc_length = current_position_data.arc_length + segment_length;
            this.arc_length = next_position_data.arc_length; 
        }    
    }

    initialize_circle(num_sides, radius){    
        var noChange = num_sides == this.last_num_sides && radius == this.last_radius;  
        if(noChange){
            //console.warn("initialize_circle skipped");
            return;
        }
        console.warn("initialize_circle");
        
        this.circle_x = new Float32Array(num_sides);
        this.circle_y = new Float32Array(num_sides);
        for(var i=0; i<num_sides; i++){
            const angle = 2 * Math.PI * (i / num_sides);
            this.circle_x[i] = Math.cos(angle) * radius;
            this.circle_y[i] = Math.sin(angle) * radius;
        }
    }

    writeCircle(array, circle_index, num_sides, point, axis_1, axis_2){
        //console.warn("axis_1, axis_2",axis_1, axis_2)
        for(var i=0; i<num_sides; i++){
            var index = num_sides*circle_index*3 + 3*i;
            array[index+0] = point[0] + axis_1[0] * this.circle_x[i] + axis_2[0] * this.circle_y[i];
            array[index+1] = point[1] + axis_1[1] * this.circle_x[i] + axis_2[1] * this.circle_y[i];
            array[index+2] = point[2] + axis_1[2] * this.circle_x[i] + axis_2[2] * this.circle_y[i];            
        }
    }

    initialize_mesh(number_of_intersections, num_sides){
        var noChange = num_sides == this.last_num_sides && number_of_intersections == this.last_number_of_intersections;
        if(noChange){
            //console.warn("initialize_mesh skipped");
            return;
        }
        console.warn("initialize_mesh");

        var num_vertices = 2 * num_sides * (this.number_of_allocated_points-1);
        var num_triangles = num_vertices;

        this.geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(num_vertices * 3);
        const indices = Array(num_triangles * 3);

        for(var i=0; i<this.number_of_allocated_points-1; i++){
            var index = i * 2 * num_sides * 3;
            var face_offset = 0;

            //face 0
            //triangle 1
            indices[index+0] = 0 + i * 2 * num_sides;
            indices[index+1] = 1 + i * 2 * num_sides;
            indices[index+2] = num_sides + i * 2 * num_sides;

            //triangle 2
            indices[index+3] = 1 + i * 2 * num_sides;
            indices[index+4] = num_sides + 1 + i * 2 * num_sides;
            indices[index+5] = num_sides + i * 2 * num_sides;
            
            //other faces
            for( var j=1; j<num_sides-1; j++){
                face_offset += 6
                indices[index+face_offset+0] = indices[index+face_offset+0-6]+1;
                indices[index+face_offset+1] = indices[index+face_offset+1-6]+1;
                indices[index+face_offset+2] = indices[index+face_offset+2-6]+1;

                indices[index+face_offset+3] = indices[index+face_offset+3-6]+1;
                indices[index+face_offset+4] = indices[index+face_offset+4-6]+1;
                indices[index+face_offset+5] = indices[index+face_offset+5-6]+1;
            }

            
            //last face
            face_offset += 6
            indices[index+face_offset+0] = num_sides-1 + i * 2 * num_sides;
            indices[index+face_offset+1] = 0 + i * 2 * num_sides;
            indices[index+face_offset+2] = 2*num_sides-1 + i * 2 * num_sides;

            indices[index+face_offset+3] = 0 + i * 2 * num_sides;
            indices[index+face_offset+4] = num_sides + i * 2 * num_sides;
            indices[index+face_offset+5] = 2*num_sides-1 + i * 2 * num_sides;
                
        }

        this.geometry.setIndex( indices );
        this.geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

        var tube_color = this.streamline_generator.simulationParameters.tube_color;
        var tube_roughness = this.streamline_generator.simulationParameters.tube_roughness;
        var tube_emissive_intensity = this.streamline_generator.simulationParameters.tube_emissive_intensity;
        this.material = new THREE.MeshStandardMaterial({ color: tube_color, roughness: tube_roughness, emissive: tube_color, emissiveIntensity: tube_emissive_intensity });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
    }

    build() {     
        var number_of_intersections = this.simulationParameters.number_of_intersections;
        var num_sides = this.simulationParameters.tube_num_sides;
        var radius = this.simulationParameters.tube_radius;
        this.initialize_circle(num_sides, radius);
        this.initialize_mesh(number_of_intersections, num_sides);
        //set values to allow skipping above initialization next time
        this.last_number_of_intersections = number_of_intersections;
        this.last_num_sides = num_sides;
        this.last_radius = radius;

        var array = this.mesh.geometry.attributes.position.array;
        for (var point_index = 0; point_index < this.list_point_data.length-1; point_index++) {
            var point_data_A = this.list_point_data[point_index];
            var point_data_B = this.list_point_data[point_index+1];
            var axis_1 = vec3.create();
            var axis_2 = vec3.create();
            var dir = vec3.create();   
            vec3.subtract(dir, point_data_B.position, point_data_A.position);
            computeOrthogonalVector(axis_1, dir );
            vec3.cross(axis_2, dir, axis_1 );
            vec3.normalize(axis_2, axis_2);

            var circle_index = 2*point_index;
            var point = point_data_A.position;
            this.writeCircle(array, circle_index, num_sides, point, axis_1, axis_2)
            
            circle_index += 1;
            var point = point_data_B.position;
            this.writeCircle(array, circle_index, num_sides, point, axis_1, axis_2)
        }  
        
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();

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
        streamline.recalculate(number_of_intersections, x, y, z, dir_x, dir_y, dir_z, energy);
        //number_of_intersections -= 1;
        this.number_success = streamline.success ? 1 : 0;
        this.number_computed = 1;
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