import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";

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

    getPlaneDimensionX(){
        return this.simulationParameters.domain_pixels_x;
    }

    getPlaneDimensionY(){
        return this.simulationParameters.domain_pixels_y;
    }

    initialize() {
        console.warn("INITIALIZE OffscreenRenderer");

        this.width = 100;
        this.height = 100;
        this.num_pixels = this.width * this.height;

        this.updateRenderTarget();
        this.bufferScene = new THREE.Scene();
        this.bufferCamera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 100);
        this.bufferCamera.position.z = 5;

        this.dummy_plane_geometry = new THREE.PlaneGeometry(100, 100);
        //this.dummy_plane_material = new THREE.MeshBasicMaterial({ color: 0x500000, side: THREE.DoubleSide });

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
        this.setAdditionalUniforms();        
        this.dummy_plane_mesh.material.uniforms.mu.value = this.simulationParameters.mu;
        this.dummy_plane_mesh.material.uniforms.angular_velocity.value = this.simulationParameters.angular_velocity;
        this.dummy_plane_mesh.material.uniforms.primary_x.value = this.simulationParameters.getPrimaryX();
        this.dummy_plane_mesh.material.uniforms.secondary_x.value = this.simulationParameters.getSecondaryX();
        this.dummy_plane_mesh.material.uniforms.primary_mass.value = this.simulationParameters.getPrimaryMass();
        this.dummy_plane_mesh.material.uniforms.secondary_mass.value = this.simulationParameters.getSecondaryMass();
        this.dummy_plane_mesh.material.uniforms.planeCornerBL.value.x = this.simulationParameters.domain_min_x;
        this.dummy_plane_mesh.material.uniforms.planeCornerBL.value.y = this.simulationParameters.domain_min_y;
        this.dummy_plane_mesh.material.uniforms.planeDimensions.value.x = this.simulationParameters.domain_dimension_x;
        this.dummy_plane_mesh.material.uniforms.planeDimensions.value.y = this.simulationParameters.domain_dimension_y;
        this.dummy_plane_mesh.material.uniforms.planeDimensionsPixel.value.x = this.width;
        this.dummy_plane_mesh.material.uniforms.planeDimensionsPixel.value.y = this.height;
        this.dummy_plane_mesh.material.uniforms.input_texture_positions.value = this.texture_vertices;
        
        
    }

    updateRenderTarget() {
        console.warn("### UPDATE RENDER TARGET SIZE", this.width, this.height, this.num_pixels);
        var total_w = this.width * this.getNumPixelsPerNodeX();
        var total_h = this.height * this.getNumPixelsPerNodeY();

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

        //the input texture (vertex positions)
        this.texture_vertices_data = new Float32Array(size);
        this.texture_vertices = new THREE.DataTexture(this.texture_vertices_data, total_w, total_h);            
        this.texture_vertices.format = THREE.RGBAFormat;
        this.texture_vertices.type = THREE.FloatType;
        this.texture_vertices.minFilter = THREE.LinearFilter;
        this.texture_vertices.magFilter = THREE.NearestFilter;
        this.texture_vertices.unpackAlignment = 1;
    }

    compute() {
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

        //write a test value
        this.texture_vertices_data[0] = 1337;
        this.texture_vertices.needsUpdate = true;
        console.warn("### this.texture_vertices_data", this.texture_vertices_data);
        
        //computation in shader
        this.setUniforms();
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.bufferScene, this.bufferCamera);

        //read results
        const readBuffer = new Float32Array(this.width * this.height * 4);
        this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.width, this.height, readBuffer);
        console.warn("### readBuffer", readBuffer);

        //cleanup
        this.renderer.setRenderTarget(null);
    }

    computeLayer(targetLayerIndex){
        this.dummy_plane_mesh.material.uniforms.target_layer_index.value = targetLayerIndex;
        this.renderer.setRenderTarget(this.renderTarget, targetLayerIndex);
        this.renderer.render(this.bufferScene, this.bufferCamera);
        this.renderer.setRenderTarget(null);
    }

    /**
     * Computes a 2D texture at layer 0 of this texture but for layer targetLayerIndex
     * @param {*} targetLayerIndex the target layer in the 3D texture
     */
    computeTargetLayerAt0(targetLayerIndex){
        this.dummy_plane_mesh.material.uniforms.target_layer_index.value = targetLayerIndex;
        this.renderer.setRenderTarget(this.renderTarget, 0);
        this.renderer.render(this.bufferScene, this.bufferCamera);
        this.renderer.setRenderTarget(null);
    }
    
    copyTextureToLayer(texture_input, targetLayerIndex){
        //console.warn("texture_input", texture_input);
        this.dummy_plane_mesh.material.uniforms.texture_input.value = texture_input;      
        this.dummy_plane_mesh.material.uniforms.target_layer_index.value = targetLayerIndex;
        this.renderer.setRenderTarget(this.renderTarget, targetLayerIndex);
        this.renderer.render(this.bufferScene, this.bufferCamera);
        this.renderer.setRenderTarget(null);
    }

    generateUniforms() {
        this.uniforms = {
            target_layer_index: { type: 'int', value: 0 },
            mu: { type: 'float', value: 0.1 },
            angular_velocity: { type: 'float', value: 1.0 },
            primary_x: { type: 'float', value: 0.0 },
            secondary_x: { type: 'float', value: 0.0 },
            primary_mass: { type: 'float', value: 0.0 },
            secondary_mass: { type: 'float', value: 0.0 },
            planeCenter: { type: 'vec2', value: new THREE.Vector2(0, 0) },
            planeCornerBL: { type: 'vec2', value: new THREE.Vector2(-1, -1) },
            planeDimensions: { type: 'vec2', value: new THREE.Vector2(2, 2) },
            planeDimensionsPixel: { type: 'vec2', value: new THREE.Vector2(100, 100) },
            input_texture_positions: { type: 'sampler2D', value: this.texture_vertices}
        }
        this.addAdditionalUniforms();
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
            this.fragmentShaderAdditionalMethodDeclarations() + LINALG.SHADER_MODULE_LINALG + "\n" + UTILITY.SHADER_MODULE_UTILITY + "\n" +
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

            //world coordinates in virtual texture (when position is variable and direction is constant)
            float world_x = planeCornerBL.x + (float(x_pixel_mod) / (planeDimensionsPixel.x - 1.0)) * planeDimensions.x;
            float world_y = planeCornerBL.y + (float(y_pixel_mod) / (planeDimensionsPixel.y - 1.0)) * planeDimensions.y;

            //angles in virtual texture (when position is constant and direction is variable)
            //ISO convention (i.e. for physics: radius r, inclination theta, azimuth phi) --> https://en.wikipedia.org/wiki/Spherical_coordinate_system#Cartesian_coordinates
            float theta_radians = PI * (float(x_pixel_mod) / (planeDimensionsPixel.x - 1.0));//TODO REPLACE planeDimensionsPixel with dimension of other grid
            float phi_radians = 2.0 * PI * (float(y_pixel_mod) / (planeDimensionsPixel.y - 1.0));//TODO REPLACE planeDimensionsPixel with dimension of other grid

            //TESTING: add texture value
            ivec2 pointer = ivec2(x_pixel_mod, y_pixel_mod);
            vec4 value = texelFetch(input_texture_positions, pointer, 0);
            if(int(x_pixel) == 0 && int(y_pixel) == 0){
                outputColor = vec4(87,42,23,11) + value;
            }
            else{
                outputColor = vec4(x_pixel,y_pixel,0,0) + value;
            }


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

    /**
     * A texture can output a single vec4 for each pixel.
     * If more data per grid node is required, multiple pixels per grid node can be used.
     * 
     * @returns the number of "virtual textures" on the x axis, setting this value to 2 doubles the available data per node
     */
    getNumPixelsPerNodeX() {
        return 1;
    }

    /**
     * A texture can output a single vec4 for each pixel.
     * If more data per grid node is required, multiple pixels per grid node can be used.
     * 
     * @returns the number of "virtual textures" on the y axis, setting this value to 2 doubles the available data per node
     */
    getNumPixelsPerNodeY() {
        return 1;
    }

    /**
     * How many layers of 2D textures make up the 3D texture
     * 
     * @returns the number of layers
     */
    getNumLayers(){
        return 1;
    }

    /**
     * The actual computation of the shader is done in this method.
     * 
     * @returns partial shader code that is copied inside the main function of the shader
     */
    fragmentShaderMethodComputation() {
        return "";
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      OPTIONAL METHODS
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * The following uniforms are created for all offscreen renderers during generateUniforms():
     * - planeCenter
     * - planeCornerBL
     * - planeDimensions
     * - planeDimensionsPixel
     * 
     * Additional uniforms can be created in this method
     */
    addAdditionalUniforms() {

    }

    setAdditionalUniforms() {

    }

    fragmentShaderAdditionalMethodDeclarations(){
        return "";
    }

    fragmentShaderAdditionalMethodDefinitions(){
        return "";
    }

}

export { OffscreenSurfaceComputation }