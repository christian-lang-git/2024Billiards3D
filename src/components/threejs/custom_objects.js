import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

import * as Constants from "@/components/utility/constants";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {evaluate} from "mathjs";
import { lerp } from "@/components/utility/utility";

const glsl = x => x[0];

class ObjectArrow {
    constructor(position, length, radius, cone_radius_factor, cone_fraction, color_hex){
        this.position = position,
        this.length = length;
        this.radius = radius;
        this.cone_radius_factor = cone_radius_factor;
        this.cone_fraction = cone_fraction;
        this.color_hex = color_hex;

        this.list_mesh = [];

        this.build();
    }

    build(){
        var radius = this.radius;
        var cone_radius_factor = this.cone_radius_factor;
        var cylinder_height = this.length * (1-this.cone_fraction);
        var cylinder_radial_segments = 20;
        var cylinder_height_segments = 1;

        var cone_radius = cone_radius_factor*radius;
        var cone_height = this.length * this.cone_fraction;
        var cone_radial_segments = 20;
        var cone_height_segments = 1;

        this.material = new THREE.MeshBasicMaterial( {color: this.color_hex} ); 

        this.cylinder_geometry = new THREE.CylinderGeometry(radius, radius, cylinder_height, cylinder_radial_segments, cylinder_height_segments ); 
        this.cylinder_geometry.translate(0, cylinder_height/2, 0);

        this.cylinder_mesh = new THREE.Mesh( this.cylinder_geometry, this.material );

        this.cone_geometry = new THREE.ConeGeometry( cone_radius, cone_height, cone_radial_segments, cone_height_segments ); 
        this.cone_geometry.translate(0, cylinder_height+cone_height/2, 0);
        this.cone_mesh = new THREE.Mesh( this.cone_geometry, this.material );

        this.combined_geometry = BufferGeometryUtils.mergeGeometries([this.cylinder_geometry, this.cone_geometry], false);
        this.mesh = new THREE.Mesh( this.combined_geometry, this.material );

        this.list_mesh.push(this.cylinder_mesh);
        this.list_mesh.push(this.cone_mesh);
    }
}

class ObjectAxes{

    constructor(position, length_x, length_y, length_z, radius, cone_radius_factor, cone_fraction, theta_down){
        this.position = position;
        this.length_x = length_x;
        this.length_y = length_y;
        this.length_z = length_z;
        this.radius = radius;
        this.cone_radius_factor = cone_radius_factor;
        this.cone_fraction = cone_fraction;
        this.theta_down = theta_down;

        this.list_arrows = [];

        var has_z = true;
        this.build(has_z);
    }

    setValues(position, length_x, length_y, length_z, radius, cone_radius_factor, cone_fraction){
        this.position = position;
        this.length_x = length_x;
        this.length_y = length_y;
        this.length_z = length_z;
        this.radius = radius;
        this.cone_radius_factor = cone_radius_factor;
        this.cone_fraction = cone_fraction;
        if(this.theta_down){
            this.position[1] += this.length_y;   
        }
    }

    build(has_z, color1, color2, color3){
        this.list_arrows = [];

        this.axes_arrow_x = new ObjectArrow(this.position, this.length_x, this.radius, this.cone_radius_factor, this.cone_fraction, color1);
        this.list_arrows.push(this.axes_arrow_x);

        this.axes_arrow_y = new ObjectArrow(this.position, this.length_y, this.radius, this.cone_radius_factor, this.cone_fraction, color2);
        this.list_arrows.push(this.axes_arrow_y);

        if(has_z){
            this.axes_arrow_z = new ObjectArrow(this.position, this.length_z, this.radius, this.cone_radius_factor, this.cone_fraction, color3);
            this.axes_arrow_z.mesh.rotateX(THREE.MathUtils.degToRad(90));
            this.list_arrows.push(this.axes_arrow_z);
        }

        if(this.theta_down){
            this.axes_arrow_x.mesh.rotateZ(THREE.MathUtils.degToRad(180));
            this.axes_arrow_y.mesh.rotateZ(THREE.MathUtils.degToRad(-90));
            
        }else{
            this.axes_arrow_x.mesh.rotateZ(THREE.MathUtils.degToRad(-90));
        }
    }

    addToScene(scene){
        for (var i = 0; i < this.list_arrows.length; i++) {
            var arrow = this.list_arrows[i];
            scene.add(arrow.mesh);
            arrow.mesh.position.set(this.position[0],this.position[1],this.position[2]);
        }
    }

    removefromScene(scene){
        for (var i = 0; i < this.list_arrows.length; i++) {
            var arrow = this.list_arrows[i];
            scene.remove(arrow.mesh);
        }
    }

    rebuild(has_z, z_factor, scene, simulationParameters, min_x, max_x, min_y, max_y, min_z, max_z, radius, color1, color2, color3){       

        this.removefromScene(scene);

        var position = vec3.fromValues(min_x, min_y, min_z);
        var length_x = max_x - min_x;
        var length_y = max_y - min_y;
        var length_z = max_z - min_z;
        var cone_radius_factor = 5.0;
        var cone_fraction = 0.05;

        this.setValues(position, length_x, length_y, length_z, radius, cone_radius_factor, cone_fraction);
        this.build(has_z, color1, color2, color3);
        this.addToScene(scene);
    }
}

class SpherelikeGrid{

    constructor(scene, material){
        console.warn("CONSTRUCTOR SpherelikeGrid");
        this.scene = scene;
        this.pixels_x = 0;
        this.pixels_y = 0;
        this.angle_min_x = 0;
        this.angle_min_y = 0;
        this.angle_max_x = 1;
        this.angle_max_y = 1;
        this.subdivide = false;    
        this.material = material; 
    }

    updateGrid(subdivide, pixels_x, pixels_y, angle_min_x, angle_min_y, angle_max_x, angle_max_y){
        var no_change = subdivide == this.subdivide && pixels_x == this.pixels_x && pixels_y == this.pixels_y
        && angle_min_x == this.angle_min_x && angle_min_y == this.angle_min_y && angle_max_x == this.angle_max_x && angle_max_y == this.angle_max_y ;
        if(no_change){
            //console.warn("SpherelikeGrid updateGrid no change");
            return;
        }

        
        console.warn("#SphereGrid -----------------");
        console.warn("#SphereGrid pixels_x", pixels_x);
        console.warn("#SphereGrid pixels_y", pixels_y);
        console.warn("#SphereGrid angle_min_x", angle_min_x);
        console.warn("#SphereGrid angle_max_x", angle_max_x);
        console.warn("#SphereGrid angle_min_y", angle_min_y);
        console.warn("#SphereGrid angle_max_y", angle_max_y);

        //console.warn("SpherelikeGrid updateGrid", pixels_x, pixels_y);

        this.subdivide = subdivide;//if true, one additional vertex per cell is added
        this.pixels_x = pixels_x;
        this.pixels_y = pixels_y;
        this.angle_min_x = angle_min_x;
        this.angle_min_y = angle_min_y;
        this.angle_max_x = angle_max_x;
        this.angle_max_y = angle_max_y;
        this.num_cells_x = pixels_x - 1;
        this.num_cells_y = pixels_y - 1;
        this.num_cells = this.num_cells_x * this.num_cells_y;
        this.num_vertices = pixels_x * pixels_y;
        this.num_triangles = this.num_cells * 2;
        if(subdivide){
            this.num_vertices += this.num_cells;
            this.num_triangles *= 2;
        }
        this.build();
    }

    build(){
        this.scene.remove(this.mesh);

        //console.warn("this.mesh", this.mesh);

        const geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array(this.num_vertices * 3);
        const uv = new Float32Array(this.num_vertices * 2);
        const indices = Array(this.num_triangles);
        
        //iterate over all nodes of the grid to calculate vertex positions
        var index = 0;
        var index_uv = 0;
        for(var y_index = 0; y_index<this.pixels_y; y_index++){
            for(var x_index = 0; x_index<this.pixels_x; x_index++){
                //angles in virtual texture (when position is constant and direction is variable)
                //ISO convention (i.e. for physics: radius r, inclination theta, azimuth phi) --> https://en.wikipedia.org/wiki/Spherical_coordinate_system#Cartesian_coordinates
                
                var t_x = x_index / (this.pixels_x - 1.0);
                var t_y = y_index / (this.pixels_y - 1.0);
                var x_frac = lerp(this.angle_min_x, this.angle_max_x, t_x);
                var y_frac = lerp(this.angle_min_y, this.angle_max_y, t_y);
                var theta_radians = Math.PI * x_frac;
                var phi_radians = 2.0 * Math.PI * y_frac;

                var dir_x = Math.sin(theta_radians) * Math.cos(phi_radians);
                var dir_y = Math.sin(theta_radians) * Math.sin(phi_radians);
                var dir_z = Math.cos(theta_radians);

                vertices[index] = dir_x;
                vertices[index+1] = dir_y;
                vertices[index+2] = dir_z;                
                index+=3;
                
                uv[index_uv] = t_x;
                uv[index_uv+1] = t_y;
                index_uv+=2;

            }
        }

        //iterate over all cells of the grid to generate triangles
        var index = 0;
        for(var y_index = 0; y_index<this.num_cells_y; y_index++){
            for(var x_index = 0; x_index<this.num_cells_x; x_index++){
                
                var vertex_index_top_left = x_index + y_index * this.pixels_x;
                var vertex_index_bottom_left = vertex_index_top_left + this.pixels_x;
                var vertex_index_bottom_right = vertex_index_bottom_left + 1;
                var vertex_index_top_right = vertex_index_top_left + 1;

                //this order results in triangles visible from inside the sphere
                //indices[index] = vertex_index_top_left;
                //indices[index+1] = vertex_index_bottom_left;
                //indices[index+2] = vertex_index_top_right;

                //this order results in triangles visible from outside the sphere
                indices[index] = vertex_index_top_left;
                indices[index+1] = vertex_index_top_right;
                indices[index+2] = vertex_index_bottom_left;
                //second triangle of cell
                indices[index+3] = vertex_index_top_right;
                indices[index+4] = vertex_index_bottom_right;
                indices[index+5] = vertex_index_bottom_left;

                index+=6;
            }
        }

        geometry.setIndex( indices );
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        geometry.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );

        this.mesh = new THREE.Mesh( geometry, this.material );

        this.scene.add(this.mesh);
    }
}

class TubeVector{

    constructor(scene, simulationParameters, color){
        this.scene = scene;
        this.simulationParameters = simulationParameters;
        this.color = color;
        this.position = vec3.fromValues(0,0,0);
        this.direction = vec3.fromValues(1,0,0);
        this.end_point = vec3.fromValues(0.25,0,0);
        this.length = 0.25;
        this.three_position = new THREE.Vector3(this.position[0], this.position[1], this.position[2]);        
        this.three_end_point = new THREE.Vector3(this.end_point[0], this.end_point[1], this.end_point[2])
    }

    setPosition(x, y, z){
        vec3.set(this.position, x, y, z);
        vec3.scaleAndAdd(this.end_point, this.position, this.direction, this.length);
        this.updateTHREE();
    }

    setDirection(x, y, z){
        vec3.set(this.direction, x, y, z);
        vec3.scaleAndAdd(this.end_point, this.position, this.direction, this.length);
        this.updateTHREE();
    }

    setPosDir(pos_x, pos_y, pos_z, dir_x, dir_y, dir_z){
        vec3.set(this.position, pos_x, pos_y, pos_z);
        vec3.set(this.direction, dir_x, dir_y, dir_z);
        vec3.scaleAndAdd(this.end_point, this.position, this.direction, this.length);
        this.updateTHREE();
    }

    updateTHREE(){
        this.three_position.set(this.position[0], this.position[1], this.position[2]);
        this.three_end_point.set(this.end_point[0], this.end_point[1], this.end_point[2]);
    }

    build() {
        this.scene.remove(this.mesh);

        this.path = new THREE.CurvePath();
        var curve = new THREE.LineCurve3(this.three_position, this.three_end_point);
        this.path.add(curve);

        var radius = this.simulationParameters.tube_radius;
        var num_sides = this.simulationParameters.tube_num_sides;
        var num_segments = 1;

        this.geometry = new THREE.TubeGeometry(this.path, num_segments, radius, num_sides, false);

        var tube_roughness = this.simulationParameters.tube_roughness;
        var tube_emissive_intensity = this.simulationParameters.tube_emissive_intensity;
        this.material = new THREE.MeshStandardMaterial({ color: this.color, roughness: tube_roughness, emissive: this.color, emissiveIntensity: tube_emissive_intensity });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.scene.add(this.mesh);
    }
}

class LocalCoordinates{
    constructor(scene, simulationParameters){
        this.scene = scene;
        this.simulationParameters = simulationParameters;
        this.position = vec3.fromValues(0,0,0);
        this.normal = vec3.fromValues(0,0,0);
        this.normal_negated = vec3.fromValues(0,0,0);
        this.tangent_a = vec3.fromValues(0,0,0);
        this.tangent_b = vec3.fromValues(0,0,0);
        this.point_tangent_a_forward = vec3.fromValues(0,0,0);
        this.point_tangent_a_backward = vec3.fromValues(0,0,0);
        this.point_tangent_b_forward = vec3.fromValues(0,0,0);
        this.point_tangent_b_backward = vec3.fromValues(0,0,0);
        if(this.scene){
            this.axis0 = new TubeVector(scene, simulationParameters, 0xffff00);
            this.axis1 = new TubeVector(scene, simulationParameters, 0xff0000);
            this.axis2 = new TubeVector(scene, simulationParameters, 0x00ff00);
            this.axis3 = new TubeVector(scene, simulationParameters, 0x0000ff);
            this.build_spheres();
        }
    }

    build_spheres(){
        var radius = 0.01;
        var cyan = 0x00ffff;
        var magenta = 0xff00ff;
        var yellow = 0xfbbc05;
        this.sphere_geometry = new THREE.SphereGeometry(radius);
        this.sphere_material = new THREE.MeshStandardMaterial({ color: magenta });
        
        this.sphere_tangent_a_forward_mesh = new THREE.Mesh(this.sphere_geometry, this.sphere_material);
        this.sphere_tangent_a_forward_mesh.position.set(0, 0, 10000);
        this.scene.add(this.sphere_tangent_a_forward_mesh);

        this.sphere_tangent_a_backward_mesh = new THREE.Mesh(this.sphere_geometry, this.sphere_material);
        this.sphere_tangent_a_backward_mesh.position.set(0, 0, 10000);
        this.scene.add(this.sphere_tangent_a_backward_mesh);

        this.sphere_tangent_b_forward_mesh = new THREE.Mesh(this.sphere_geometry, this.sphere_material);
        this.sphere_tangent_b_forward_mesh.position.set(0, 0, 10000);
        this.scene.add(this.sphere_tangent_b_forward_mesh);

        this.sphere_tangent_b_backward_mesh = new THREE.Mesh(this.sphere_geometry, this.sphere_material);
        this.sphere_tangent_b_backward_mesh.position.set(0, 0, 10000);
        this.scene.add(this.sphere_tangent_b_backward_mesh);
    }

    update(pos_x, pos_y, pos_z){
        this.updateData(pos_x, pos_y, pos_z);
        this.updateAxes(pos_x, pos_y, pos_z);
        this.updateSpheres(pos_x, pos_y, pos_z);
    }

    updateData(pos_x, pos_y, pos_z){
        vec3.set(this.position, pos_x, pos_y, pos_z);
        this.simulationParameters.evaluateGradient(this.position, this.normal);
        vec3.normalize(this.normal, this.normal);
        vec3.negate(this.normal_negated, this.normal);
        this.simulationParameters.computeTangentA(this.position, this.normal, this.tangent_a);        
        vec3.cross(this.tangent_b, this.normal_negated, this.tangent_a);

        //initial positioning of spheres in 4 directions
        //var kernel_distance = 0.025;
        var kernel_distance = 0.25;
        vec3.scaleAndAdd(this.point_tangent_a_forward, this.position, this.tangent_a, kernel_distance);
        vec3.scaleAndAdd(this.point_tangent_a_backward, this.position, this.tangent_a, -kernel_distance);
        vec3.scaleAndAdd(this.point_tangent_b_forward, this.position, this.tangent_b, kernel_distance);
        vec3.scaleAndAdd(this.point_tangent_b_backward, this.position, this.tangent_b, -kernel_distance);

        //move spheres to surface via gradient
        this.simulationParameters.moveToSurface(this.point_tangent_a_forward);
        this.simulationParameters.moveToSurface(this.point_tangent_a_backward);
        this.simulationParameters.moveToSurface(this.point_tangent_b_forward);
        this.simulationParameters.moveToSurface(this.point_tangent_b_backward);

    }

    updateAxes(pos_x, pos_y, pos_z){
        //axis0 (yellow): normal
        var dir_x = this.normal[0];
        var dir_y = this.normal[1];
        var dir_z = this.normal[2];
        this.axis0.setPosDir(pos_x, pos_y, pos_z, dir_x, dir_y, dir_z);
        this.axis0.build();

        //axis1 (red): tangent a
        var dir_x = this.tangent_a[0];
        var dir_y = this.tangent_a[1];
        var dir_z = this.tangent_a[2];
        this.axis1.setPosDir(pos_x, pos_y, pos_z, dir_x, dir_y, dir_z);
        this.axis1.build();

        //axis2 (green): tangent b
        var dir_x = this.tangent_b[0];
        var dir_y = this.tangent_b[1];
        var dir_z = this.tangent_b[2];
        this.axis2.setPosDir(pos_x, pos_y, pos_z, dir_x, dir_y, dir_z);
        this.axis2.build();

        //axis3 (blue): normal negated
        var dir_x = this.normal_negated[0];
        var dir_y = this.normal_negated[1];
        var dir_z = this.normal_negated[2];
        this.axis3.setPosDir(pos_x, pos_y, pos_z, dir_x, dir_y, dir_z);
        this.axis3.build();
    }

    updateSpheres(pos_x, pos_y, pos_z){
        var x = this.point_tangent_a_forward[0];
        var y = this.point_tangent_a_forward[1];
        var z = this.point_tangent_a_forward[2];
        this.sphere_tangent_a_forward_mesh.position.set(x, y, z);

        var x = this.point_tangent_a_backward[0];
        var y = this.point_tangent_a_backward[1];
        var z = this.point_tangent_a_backward[2];
        this.sphere_tangent_a_backward_mesh.position.set(x, y, z);

        var x = this.point_tangent_b_forward[0];
        var y = this.point_tangent_b_forward[1];
        var z = this.point_tangent_b_forward[2];
        this.sphere_tangent_b_forward_mesh.position.set(x, y, z);

        var x = this.point_tangent_b_backward[0];
        var y = this.point_tangent_b_backward[1];
        var z = this.point_tangent_b_backward[2];
        this.sphere_tangent_b_backward_mesh.position.set(x, y, z);
    }
}

export { ObjectArrow, ObjectAxes, SpherelikeGrid, TubeVector, LocalCoordinates }