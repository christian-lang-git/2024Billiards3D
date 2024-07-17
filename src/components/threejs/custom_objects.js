import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import {marchingOBJ} from "@/components/utility/utility";
import {evaluate} from "mathjs";

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
        this.subdivide = false;    
        this.material = material; 
    }

    updateGrid(subdivide, pixels_x, pixels_y){
        var no_change = subdivide == this.subdivide && pixels_x == this.pixels_x && pixels_y == this.pixels_y;
        if(no_change){
            //console.warn("SpherelikeGrid updateGrid no change");
            return;
        }

        //console.warn("SpherelikeGrid updateGrid", pixels_x, pixels_y);

        this.subdivide = subdivide;//if true, one additional vertex per cell is added
        this.pixels_x = pixels_x;
        this.pixels_y = pixels_y;
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
                var theta_radians = Math.PI * (x_index / (this.pixels_x - 1.0));
                var phi_radians = 2.0 * Math.PI * (y_index / (this.pixels_y - 1.0));

                var dir_x = Math.sin(theta_radians) * Math.cos(phi_radians);
                var dir_y = Math.sin(theta_radians) * Math.sin(phi_radians);
                var dir_z = Math.cos(theta_radians);

                vertices[index] = dir_x;
                vertices[index+1] = dir_y;
                vertices[index+2] = dir_z;                
                index+=3;
                
                uv[index_uv] = (x_index / (this.pixels_x - 1.0));
                uv[index_uv+1] = (y_index / (this.pixels_y - 1.0));
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

class MarchingCubesMesh{

    //based on https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Marching-Cubes.html
    //ported to new threejs by CL

    constructor(scene, simulationParameters){
        this.points = [];
        this.values = [];
        this.scene = scene;
        this.simulationParameters = simulationParameters;
    }

    UpdateParametersCheckBuildRequired(){
        var size_x = this.simulationParameters.domain_pixels_x;
        var size_y = this.simulationParameters.domain_pixels_y;
        var size_z = this.simulationParameters.domain_pixels_z;

        var min_x = this.simulationParameters.domain_min_x;
        var min_y = this.simulationParameters.domain_min_y;
        var min_z = this.simulationParameters.domain_min_z;

        var max_x = this.simulationParameters.domain_max_x;
        var max_y = this.simulationParameters.domain_max_y;
        var max_z = this.simulationParameters.domain_max_z;

        this.noParameterChange = size_x == this.size_x && size_y == this.size_y && size_z == this.size_z
            && min_x == this.min_x && min_y == this.min_y && min_z == this.min_z
            && max_x == this.max_x && max_y == this.max_y && max_z == this.max_z
            && this.simulationParameters.noSurfaceParameterChange;

        this.size_x = this.simulationParameters.domain_pixels_x;
        this.size_y = this.simulationParameters.domain_pixels_y;
        this.size_z = this.simulationParameters.domain_pixels_z;

        this.min_x = this.simulationParameters.domain_min_x;
        this.min_y = this.simulationParameters.domain_min_y;
        this.min_z = this.simulationParameters.domain_min_z;

        this.max_x = this.simulationParameters.domain_max_x;
        this.max_y = this.simulationParameters.domain_max_y;
        this.max_z = this.simulationParameters.domain_max_z;
    }

    build(){
        this.UpdateParametersCheckBuildRequired();
        if(this.noParameterChange){
            //console.warn("implicit surface build skipped");
            return;
        }else{
            //console.warn("implicit surface build");
            this.simulationParameters.noSurfaceParameterChange = true;
        }

        this.points = [];
        this.values = [];
        this.scene.remove(this.mesh);
        // number of cubes along a side
        //var size = 50;
        var size_x = this.simulationParameters.domain_pixels_x;
        var size_y = this.simulationParameters.domain_pixels_y;
        var size_z = this.simulationParameters.domain_pixels_z;

        var min_x = this.simulationParameters.domain_min_x;
        var min_y = this.simulationParameters.domain_min_y;
        var min_z = this.simulationParameters.domain_min_z;

        var max_x = this.simulationParameters.domain_max_x;
        var max_y = this.simulationParameters.domain_max_y;
        var max_z = this.simulationParameters.domain_max_z;

        var axisRange_x = max_x - min_x;
        var axisRange_y = max_y - min_y;
        var axisRange_z = max_z - min_z;
        
        // Generate a list of 3D points and values at those points
        for (var k = 0; k < size_z; k++)
        for (var j = 0; j < size_y; j++)
        for (var i = 0; i < size_x; i++)
        {
            // actual values
            var x = min_x + axisRange_x * i / (size_x - 1);
            var y = min_y + axisRange_y * j / (size_y - 1);
            var z = min_z + axisRange_z * k / (size_z - 1);
            this.points.push( new THREE.Vector3(x,y,z) );

            var pos = vec3.fromValues(x,y,z);
            var value = this.simulationParameters.evaluateSurface(pos);
            this.values.push( value );
        }
        
        // Marching Cubes Algorithm
        var geometry_data = {
            vertices : [],
            indices : [],
            uv : []
        }
        
        var size2 = size_x * size_y;

        // Vertices may occur along edges of cube, when the values at the edge's endpoints
        //   straddle the isolevel value.
        // Actual position along edge weighted according to function values.
        var vlist = new Array(12);
        
        var geometry = new THREE.BufferGeometry();
        var vertexIndex = 0;
        
        for (var z = 0; z < size_z - 1; z++)
        for (var y = 0; y < size_y - 1; y++)
        for (var x = 0; x < size_x - 1; x++)
        {
            // index of base point, and also adjacent points on cube
            var p    = x + size_x * y + size2 * z,
                px   = p   + 1,
                py   = p   + size_x,
                pxy  = py  + 1,
                pz   = p   + size2,
                pxz  = px  + size2,
                pyz  = py  + size2,
                pxyz = pxy + size2;
            
            // store scalar values corresponding to vertices
            var value0 = this.values[ p    ],
                value1 = this.values[ px   ],
                value2 = this.values[ py   ],
                value3 = this.values[ pxy  ],
                value4 = this.values[ pz   ],
                value5 = this.values[ pxz  ],
                value6 = this.values[ pyz  ],
                value7 = this.values[ pxyz ];
            
            // place a "1" in bit positions corresponding to vertices whose
            //   isovalue is less than given constant.
            
            var isolevel = 0;
            
            var cubeindex = 0;
            if ( value0 < isolevel ) cubeindex |= 1;
            if ( value1 < isolevel ) cubeindex |= 2;
            if ( value2 < isolevel ) cubeindex |= 8;
            if ( value3 < isolevel ) cubeindex |= 4;
            if ( value4 < isolevel ) cubeindex |= 16;
            if ( value5 < isolevel ) cubeindex |= 32;
            if ( value6 < isolevel ) cubeindex |= 128;
            if ( value7 < isolevel ) cubeindex |= 64;
            
            // bits = 12 bit number, indicates which edges are crossed by the isosurface
            var bits = marchingOBJ.edgeTable[ cubeindex ];
            
            // if none are crossed, proceed to next iteration
            if ( bits === 0 ) continue;
            
            // check which edges are crossed, and estimate the point location
            //    using a weighted average of scalar values at edge endpoints.
            // store the vertex in an array for use later.
            var mu = 0.5; 
            
            // bottom of the cube
            if ( bits & 1 )
            {		
                mu = ( isolevel - value0 ) / ( value1 - value0 );
                vlist[0] = this.points[p].clone().lerp( this.points[px], mu );
            }
            if ( bits & 2 )
            {
                mu = ( isolevel - value1 ) / ( value3 - value1 );
                vlist[1] = this.points[px].clone().lerp( this.points[pxy], mu );
            }
            if ( bits & 4 )
            {
                mu = ( isolevel - value2 ) / ( value3 - value2 );
                vlist[2] = this.points[py].clone().lerp( this.points[pxy], mu );
            }
            if ( bits & 8 )
            {
                mu = ( isolevel - value0 ) / ( value2 - value0 );
                vlist[3] = this.points[p].clone().lerp( this.points[py], mu );
            }
            // top of the cube
            if ( bits & 16 )
            {
                mu = ( isolevel - value4 ) / ( value5 - value4 );
                vlist[4] = this.points[pz].clone().lerp( this.points[pxz], mu );
            }
            if ( bits & 32 )
            {
                mu = ( isolevel - value5 ) / ( value7 - value5 );
                vlist[5] = this.points[pxz].clone().lerp( this.points[pxyz], mu );
            }
            if ( bits & 64 )
            {
                mu = ( isolevel - value6 ) / ( value7 - value6 );
                vlist[6] = this.points[pyz].clone().lerp( this.points[pxyz], mu );
            }
            if ( bits & 128 )
            {
                mu = ( isolevel - value4 ) / ( value6 - value4 );
                vlist[7] = this.points[pz].clone().lerp( this.points[pyz], mu );
            }
            // vertical lines of the cube
            if ( bits & 256 )
            {
                mu = ( isolevel - value0 ) / ( value4 - value0 );
                vlist[8] = this.points[p].clone().lerp( this.points[pz], mu );
            }
            if ( bits & 512 )
            {
                mu = ( isolevel - value1 ) / ( value5 - value1 );
                vlist[9] = this.points[px].clone().lerp( this.points[pxz], mu );
            }
            if ( bits & 1024 )
            {
                mu = ( isolevel - value3 ) / ( value7 - value3 );
                vlist[10] = this.points[pxy].clone().lerp( this.points[pxyz], mu );
            }
            if ( bits & 2048 )
            {
                mu = ( isolevel - value2 ) / ( value6 - value2 );
                vlist[11] = this.points[py].clone().lerp( this.points[pyz], mu );
            }
            
            // construct triangles -- get correct vertices from triTable.
            var i = 0;
            cubeindex <<= 4;  // multiply by 16... 
            // "Re-purpose cubeindex into an offset into triTable." 
            //  since each row really isn't a row.
            
            // the while loop should run at most 5 times,
            //   since the 16th entry in each row is a -1.
            while ( marchingOBJ.triTable[ cubeindex + i ] != -1 ) 
            {
                var index1 = marchingOBJ.triTable[cubeindex + i];
                var index2 = marchingOBJ.triTable[cubeindex + i + 1];
                var index3 = marchingOBJ.triTable[cubeindex + i + 2];
                
                //geometry_data.vertices.push( vlist[index1].clone() );  
                var tmp = vlist[index1].clone()     
                geometry_data.vertices.push( tmp.x );       
                geometry_data.vertices.push( tmp.y );   
                geometry_data.vertices.push( tmp.z );    
                //geometry_data.vertices.push( vlist[index2].clone() );   
                var tmp = vlist[index2].clone()
                geometry_data.vertices.push( tmp.x );       
                geometry_data.vertices.push( tmp.y );   
                geometry_data.vertices.push( tmp.z );  
                //geometry_data.vertices.push( vlist[index3].clone() );   
                var tmp = vlist[index3].clone()
                geometry_data.vertices.push( tmp.x );       
                geometry_data.vertices.push( tmp.y );   
                geometry_data.vertices.push( tmp.z );   

                //var face = new THREE.Face3(vertexIndex, vertexIndex+1, vertexIndex+2);                
                //geometry_data.faces.push( face );
                geometry_data.indices.push( vertexIndex );
                geometry_data.indices.push( vertexIndex+1 );
                geometry_data.indices.push( vertexIndex+2 );

                //geometry_data.faceVertexUvs[ 0 ].push( [ new THREE.Vector2(0,0), new THREE.Vector2(0,1), new THREE.Vector2(1,1) ] );
                geometry_data.uv.push(0);
                geometry_data.uv.push(0);
                geometry_data.uv.push(0);
                geometry_data.uv.push(1);
                geometry_data.uv.push(1);
                geometry_data.uv.push(1);
                vertexIndex += 3;
                i += 3;
            }
        }

        const indices = Array.from(geometry_data.indices);
        const vertices = new Float32Array(geometry_data.vertices);
        const uv = new Float32Array(geometry_data.uv);

        geometry.setIndex( indices );
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        geometry.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );
        
        //geometry.computeCentroids();
        //geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        
        var green = 0x34a853;
        //var colorMaterial =  new THREE.MeshLambertMaterial( {color: green, side: THREE.DoubleSide, wireframe: false} );
        var material =  new THREE.MeshStandardMaterial( {color: green, side: THREE.DoubleSide, wireframe: false, transparent: true} );
        this.mesh = new THREE.Mesh( geometry, material );
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
        this.tangent_a = vec3.fromValues(0,0,0);
        this.axis1 = new TubeVector(scene, simulationParameters, 0xff0000);
        this.axis2 = new TubeVector(scene, simulationParameters, 0x00ff00);
        this.axis3 = new TubeVector(scene, simulationParameters, 0x0000ff);

        this.axis1.build();
    }

    update(pos_x, pos_y, pos_z){
        vec3.set(this.position, pos_x, pos_y, pos_z);
        this.simulationParameters.evaluateGradient(this.position, this.normal);
        vec3.normalize(this.normal, this.normal);
        var dir_x = this.normal[0];
        var dir_y = this.normal[1];
        var dir_z = this.normal[2];
        this.axis1.setPosDir(pos_x, pos_y, pos_z, dir_x, dir_y, dir_z);
        this.axis1.build();

        this.simulationParameters.computeTangentA(this.position, this.normal, this.tangent_a);
        var dir_x = this.tangent_a[0];
        var dir_y = this.tangent_a[1];
        var dir_z = this.tangent_a[2];
        this.axis2.setPosDir(pos_x, pos_y, pos_z, dir_x, dir_y, dir_z);
        this.axis2.build();
    }
}

export { ObjectArrow, ObjectAxes, SpherelikeGrid, MarchingCubesMesh, TubeVector, LocalCoordinates }