import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

import * as BILLIARD_DECLARATIONS from "@/components/glsl/billiard_declarations";
import * as BILLIARD from "@/components/glsl/billiard";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";


const glsl = x => x[0];

class OffscreenSurfaceComputation {

    constructor(renderer, simulationParameters, marchingCubesMesh) {
        this.renderer = renderer;
        this.simulationParameters = simulationParameters;
        this.marchingCubesMesh = marchingCubesMesh;
        this.initialize();
    }

    initialize() {
        console.warn("INITIALIZE OffscreenSurfaceComputation");

        this.width = 100;
        this.height = 100;
        this.num_pixels = this.width * this.height;

        this.updateRenderTarget();
        this.bufferScene = new THREE.Scene();
        this.bufferCamera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 100);
        this.bufferCamera.position.z = 5;

        this.dummy_plane_geometry = new THREE.PlaneGeometry(100, 100);

        this.generateUniforms();
        this.dummy_plane_material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader(),
            glslVersion: THREE.GLSL3
        })

        console.log(this.fragmentShader())

        this.dummy_plane_mesh = new THREE.Mesh(this.dummy_plane_geometry, this.dummy_plane_material);
        this.bufferScene.add(this.dummy_plane_mesh);

        //this.compute();
    }

    setUniforms() {

        this.dummy_plane_mesh.material.uniforms.planeDimensionsPixel.value.x = this.width;
        this.dummy_plane_mesh.material.uniforms.planeDimensionsPixel.value.y = this.height;
        this.dummy_plane_mesh.material.uniforms.input_texture_positions.value = this.marchingCubesMesh.texture_vertices;

        //surface variables
        this.dummy_plane_mesh.material.uniforms.surface_type.value = this.simulationParameters.surface_type;
        this.dummy_plane_mesh.material.uniforms.var_a.value = this.simulationParameters.var_a;
        this.dummy_plane_mesh.material.uniforms.var_b.value = this.simulationParameters.var_b;
        this.dummy_plane_mesh.material.uniforms.var_c.value = this.simulationParameters.var_c;
        this.dummy_plane_mesh.material.uniforms.var_R.value = this.simulationParameters.var_R;
        this.dummy_plane_mesh.material.uniforms.var_r.value = this.simulationParameters.var_r;
        //bisection variables        
        this.dummy_plane_mesh.material.uniforms.number_of_intersections.value = this.simulationParameters.number_of_intersections;
        this.dummy_plane_mesh.material.uniforms.number_of_bisection_steps.value = this.simulationParameters.number_of_bisection_steps;
        this.dummy_plane_mesh.material.uniforms.step_size.value = this.simulationParameters.step_size;
        this.dummy_plane_mesh.material.uniforms.max_steps.value = this.simulationParameters.max_steps;
        //seed variables
        this.dummy_plane_mesh.material.uniforms.use_local_direction.value = this.simulationParameters.use_local_direction;
        this.dummy_plane_mesh.material.uniforms.seed_direction.value.x = this.simulationParameters.seed_direction_x;
        this.dummy_plane_mesh.material.uniforms.seed_direction.value.y = this.simulationParameters.seed_direction_y;
        this.dummy_plane_mesh.material.uniforms.seed_direction.value.z = this.simulationParameters.seed_direction_z;
                
        //compute some values like one_div_aa
        var a = this.simulationParameters.var_a;
        var b = this.simulationParameters.var_b;
        var c = this.simulationParameters.var_c;
        var one_div_aa = 1 / (a * a);
        var one_div_bb = 1 / (b * b);
        var one_div_cc = 1 / (c * c);
        this.dummy_plane_mesh.material.uniforms.one_div_aa.value = one_div_aa;
        this.dummy_plane_mesh.material.uniforms.one_div_bb.value = one_div_bb;
        this.dummy_plane_mesh.material.uniforms.one_div_cc.value = one_div_cc;   
        
        this.dummy_plane_mesh.material.uniforms.kernel_distance.value = this.simulationParameters.kernel_distance;
        
    }

    updateRenderTarget() {
        //console.warn("### UPDATE RENDER TARGET SIZE", this.width, this.height, this.num_pixels);
        var total_w = this.width;
        var total_h = this.height;

        this.renderTarget = new THREE.WebGLRenderTarget(total_w, total_h, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,//THREE.LinearFilter
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        const size = total_w * total_h * 4; // RGBA
        const data = new Float32Array(size);

        //the output texture
        const texture = new THREE.DataTexture(data, total_w, total_h);            
        texture.format = THREE.RGBAFormat;
        texture.type = THREE.FloatType;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.unpackAlignment = 1;
        this.renderTarget.texture = texture;
    }

    computeWrapper(){
        //helper values
        var attribute_position = this.marchingCubesMesh.mesh.geometry.attributes.position;
        var vertex_count = attribute_position.count;

        //compute required texture size
        var num_pixels_x = Math.ceil(Math.sqrt(vertex_count));
        var num_pixels_y = Math.ceil(vertex_count / num_pixels_x);
        var num_pixels = num_pixels_x * num_pixels_y;

        //check and update texture size
        if(num_pixels != this.num_pixels){
            this.num_pixels = num_pixels;   
            this.width = num_pixels_x;      
            this.height = num_pixels_y;         
            this.updateRenderTarget();
        }

        this.compute();
    }

    writeToAttributeWrapper(){
        //read results
        const readBuffer = new Float32Array(this.width * this.height * 4);
        this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.width, this.height, readBuffer);

        //send results to mesh
        this.writeToAttribute(readBuffer);

        //cleanup
        this.renderer.setRenderTarget(null);
    }

    generateUniforms() {
        this.uniforms = {      
            planeDimensionsPixel: { type: 'vec2', value: new THREE.Vector2(100, 100) },
            input_texture_positions: { type: 'sampler2D', value: this.marchingCubesMesh.texture_vertices},      
            surface_type: { type: 'int', value: 2 },
            var_a: { type: 'float', value: 3.5 },
            var_b: { type: 'float', value: 2.5 },
            var_c: { type: 'float', value: 1.5 },
            var_R: { type: 'float', value: 2.0 },
            var_r: { type: 'float', value: 1.0 },
            one_div_aa: { type: 'float', value: 1.0 },//computed later
            one_div_bb: { type: 'float', value: 1.0 },//computed later
            one_div_cc: { type: 'float', value: 1.0 },//computed later
            number_of_intersections: { type: 'int', value: 2 },
            number_of_bisection_steps: { type: 'int', value: 8 },
            step_size: { type: 'float', value: 1.0 },
            max_steps: { type: 'int', value: 100 },
            seed_direction: { type: 'vec3', value: new THREE.Vector3(1, 1, 1) },
            use_local_direction: { type: 'bool', value: true },
            kernel_distance: { type: 'float', value: 0.01 },            
        }
    }

    vertexShader() {
        return glsl`
        varying vec3 vUv; 
    
        void main() {
          vUv = position; 
    
          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition; 
        }
        `
    }

    fragmentShader() {
        return "" +
            this.getUniformsString() + "\n" + 
            BILLIARD_DECLARATIONS.SHADER_MODULE_BILLIARD_DECLARATIONS + "\n" +
            LINALG.SHADER_MODULE_LINALG + "\n" + UTILITY.SHADER_MODULE_UTILITY + "\n" +
            glsl`
        varying vec3 vUv;

        const float G = 1.0;//TODO
        const float PI = 3.1415926535897932384626433832795;
        out vec4 outputColor;
  
        void main() {
            //coordinates in pixel in total texture starting bottom left
            float x_pixel = floor(gl_FragCoord[0]);//x
            float y_pixel = floor(gl_FragCoord[1]);//y

            //coordinates in pixel in virtual texture
            int x_pixel_mod = int(x_pixel) % int(planeDimensionsPixel.x);
            int y_pixel_mod = int(y_pixel) % int(planeDimensionsPixel.y);

            //x and y indices of virtual texture e.g., (0,0) is the top left texture
            int virtual_texture_x = int(x_pixel) / int(planeDimensionsPixel.x);
            int virtual_texture_y = int(y_pixel) / int(planeDimensionsPixel.y);            
        `
            + this.fragmentShaderMethodComputation() +
            `
        }    
        `
        + this.fragmentShaderAdditionalMethodDefinitions();
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

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      REQUIRED METHODS
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    compute() {
        //override in child class
    }

    fragmentShaderMethodComputation(){
        //override in child class
        return "";
    }

}

export { OffscreenSurfaceComputation }