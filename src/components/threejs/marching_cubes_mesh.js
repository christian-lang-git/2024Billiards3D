import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import * as Constants from "@/components/utility/constants";
import { MarchingCubesData } from "./marching_cubes_data";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import {marchingOBJ} from "@/components/utility/utility";

const glsl = x => x[0];

class MarchingCubesMesh{

    //based on https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Marching-Cubes.html
    //ported to new threejs by CL

    constructor(scene, simulationParameters){
        this.points = [];
        this.values = [];
        this.scene = scene;
        this.simulationParameters = simulationParameters;
        this.generateUniforms();
        this.initMaterial();
    }

    initMaterial(){
        this.textured_material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            side: THREE.DoubleSide,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader(),
            glslVersion: THREE.GLSL3
        })
        this.textured_material.transparent = true;
        //this.textured_material.opacity = 0.5;
        this.textured_material.opacity = 1.0;

        
        var green = 0x34a853;
        this.single_color_material =  new THREE.MeshStandardMaterial( {color: green, side: THREE.DoubleSide, wireframe: false, transparent: true} );
        this.single_color_material.opacity = 1.0;
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
        this.build_new();
        //this.build_old();

        //example vertex counts
        //142704 floats, 47568 vertices without sharing
        //95136 floats, 31712 vertices when sharing in the same cell
        //23784 floats, 7928 vertices when sharing with neighboring cell via key shifting
        //~16.667% of original vertex count
    }

    build_new(){
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
        var geometry_data = new MarchingCubesData(this.simulationParameters);
        
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
            var value0 = this.values[ p    ],//value0 at position [x.y.z] = [0,0,0]
                value1 = this.values[ px   ],//value1 at position [x.y.z] = [1,0,0]
                value2 = this.values[ py   ],//value2 at position [x.y.z] = [0,1,0]
                value3 = this.values[ pxy  ],//value3 at position [x.y.z] = [1,1,0]
                value4 = this.values[ pz   ],//value4 at position [x.y.z] = [0,0,1]
                value5 = this.values[ pxz  ],//value5 at position [x.y.z] = [1,0,1]
                value6 = this.values[ pyz  ],//value6 at position [x.y.z] = [0,1,1]
                value7 = this.values[ pxyz ];//value7 at position [x.y.z] = [1,1,1]
            
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
                
                var tmp = vlist[index1].clone()     
                var v_index_0 = geometry_data.addVertex(x, y, z, index1, tmp.x, tmp.y, tmp.z);
                var tmp = vlist[index2].clone()
                var v_index_1 = geometry_data.addVertex(x, y, z, index2, tmp.x, tmp.y, tmp.z);                
                var tmp = vlist[index3].clone()
                var v_index_2 = geometry_data.addVertex(x, y, z, index3, tmp.x, tmp.y, tmp.z);
                geometry_data.addTriangle(v_index_0, v_index_1, v_index_2);

                //TODO: handle uv
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

        geometry_data.generateNeighbors();
        geometry_data.MoveVerticesToSurface();

        const indices = Array.from(geometry_data.indices);
        const vertices = new Float32Array(geometry_data.vertices);
        const uv = new Float32Array(geometry_data.uv);

        geometry.setIndex( indices );
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        geometry.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );
        
        var compute_normals_from_gradient = true;
        if(compute_normals_from_gradient){
            geometry_data.ComputeVertexNormalsFromGradient();
            const normals = new Float32Array(geometry_data.normals);
            geometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
        }else{
            geometry.computeVertexNormals();
        }

        //var colorMaterial =  new THREE.MeshLambertMaterial( {color: green, side: THREE.DoubleSide, wireframe: false} );

        //this.mesh = new THREE.Mesh( geometry, material );
        this.mesh = new THREE.Mesh( geometry, this.textured_material );
        this.scene.add(this.mesh);

        console.warn("vertices.length", vertices.length);
    }

    build_old(){
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

        console.warn("vertices.length", vertices.length);
    }

    setAttributeFTLE(readBuffer){ 
        //console.warn("### readBuffer", readBuffer);            
        this.mesh.geometry.setAttribute( 'ftle', new THREE.BufferAttribute(readBuffer, 4) );
        //console.warn("### this.mesh.geometry", this.mesh.geometry);  
    }

    //this shader is responsible for rendering the vertex data computed by OffscreenSurfaceComputation 
    vertexShader() {
        return glsl`
        attribute vec4 ftle;
        varying vec4 vftle; 
    
        void main() {
          vftle = ftle; 
    
          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition; 
        }
        `
    }

    //this shader is responsible for rendering the vertex data computed by OffscreenSurfaceComputation 
    fragmentShader() {
        return "" +
            this.getUniformsString() 
            + LINALG.SHADER_MODULE_LINALG + "\n" 
            + UTILITY.SHADER_MODULE_UTILITY + "\n" 
            + glsl`

        varying vec4 vftle;
        out vec4 outputColor;

        void coloringFTLE();
  
        void main() {
            switch (rendering_specialized_mode) {
                case 1://TEXTURE_MODE_SPECIALIZED_RETURN_FTLE
                    coloringFTLE();                    
                    break;            
                default:
                    break;
            }

        }    
        
        void coloringFTLE(){
            //ftle
            float scalar = vftle[ftle_index];//TODO: change when we use backward
            bool forward = true;//TODO: change to uniform when we use backward

            //map to either red or blue
            float t = (scalar - scalar_min) / (scalar_max - scalar_min);
            t = clamp(t, 0.0, 1.0);

            //color on white background
            vec3 col_forward = vec3(1.0, 1.0-t, 1.0-t);
            vec3 col_backwards = vec3(1.0-t, 1.0-t, 1.0);
            outputColor = forward ? vec4(col_forward, opacity) : vec4(col_backwards, opacity);
        }
        `
        ;
    }

        /**
     * Automatically generates the shader code for uniforms from the method generateUniforms()
     * The example: 
     * 
     *  this.uniforms = {
     *      planeCenter: { type: 'vec2', value: new THREE.Vector2(0,0) },
     *      planeCornerBL: { type: 'vec2', value: new THREE.Vector2(-1,-1) },
     *      planeDimensions: { type: 'vec2', value: new THREE.Vector2(2,2) },
     *      planeDimensionsPixel: { type: 'vec2', value: new THREE.Vector2(100,100) }
     *  };
     *  
     * results in:
     *       
     *      uniform vec2 planeCenter; 
     *      uniform vec2 planeCornerBL; 
     *      uniform vec2 planeDimensions; 
     *      uniform vec2 planeDimensionsPixel; 
     * 
     * @returns shader code for all uniforms
     */
    getUniformsString() {
        return Object.keys(this.uniforms).map(key => {
            const type = this.uniforms[key].type;
            return `uniform ${type} ${key};`;
        }).join('\n');
    }

    generateUniforms() {
        this.uniforms = {
            ftle_index: { type: 'int', value: 0 },
            opacity: { type: 'float', value: 1 },
            scalar_min: { type: 'float', value: 0 },
            scalar_max: { type: 'float', value: 10 },
            rendering_specialized_mode : { type: 'int', value: parseInt(Constants.TEXTURE_MODE_SPECIALIZED_SINGLE_COLOR) }
        }
    }

    updateMaterial(){
        console.warn("rendering_specialized_mode", this.simulationParameters.rendering_specialized_mode);
        switch (this.simulationParameters.rendering_specialized_mode) {
            case Constants.TEXTURE_MODE_SPECIALIZED_SINGLE_COLOR:
                console.warn("case 0");
                this.mesh.material = this.single_color_material;    
                break;
            case Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE:
                console.warn("case 1");
                this.mesh.material = this.textured_material;                
                break;
            default:
                console.error("Error: Unknown rendering_specialized_mode", this.simulationParameters.rendering_specialized_mode);
                break;
        }

        this.single_color_material.opacity = this.simulationParameters.opacity;
    }

    updateUniforms() {
        this.textured_material.uniforms.ftle_index.value = this.simulationParameters.rendering_ftle_type;      
        this.textured_material.uniforms.opacity.value = this.simulationParameters.opacity;      
        this.textured_material.uniforms.scalar_min.value = this.simulationParameters.scalar_min;
        this.textured_material.uniforms.scalar_max.value = this.simulationParameters.scalar_max;
        this.textured_material.uniforms.rendering_specialized_mode.value = this.simulationParameters.rendering_specialized_mode;   
    }
}

export { MarchingCubesMesh }