import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import * as Constants from "../utility/constants";

/**
 * TODO
 * This class renders the textures generated by offscreen renderers.
 * It can render the data:
 * - specialized: TODO specific use cases tailored for the input data
 * - raw: from the uv data access the nearest texel from the input texture and render as is
 * - processed: TODO more control over the data
 */
class TextureRenderer {

    constructor(renderer, simulationParameters, colorMaps, scene) {
        this.renderer = renderer;
        this.simulationParameters = simulationParameters;
        this.colorMaps = colorMaps;
        this.scene = scene;
    }

    initialize() {
        console.warn("INITIALIZE TextureRenderer");

        this.width = 100;
        this.height = 100;

        this.generateUniforms();
        this.textured_plane_geometry = new THREE.PlaneGeometry(1, 1);
        this.textured_plane_material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader(),
            glslVersion: THREE.GLSL3
        })
        this.textured_plane_material.transparent = true;
        this.textured_plane_material.opacity = 0.5;
        this.textured_plane_mesh = new THREE.Mesh(this.textured_plane_geometry, this.textured_plane_material);
        this.scene.add(this.textured_plane_mesh);
        //console.warn(this.fragmentShader())
    }

    updateTransform(pos_x, pos_y, scale_x, scale_y){
        this.textured_plane_mesh.scale.set(scale_x, scale_y, 1);
        this.textured_plane_mesh.position.set(pos_x, pos_y, 0);
    }

    changeDisplayedTexture(texture){
        this.displayedTexture = texture;
    }

    updateTexturedPlane() {
        this.setAdditionalUniforms();        
        this.textured_plane_mesh.material.uniforms.mu.value = this.simulationParameters.mu;
        this.textured_plane_mesh.material.uniforms.angular_velocity.value = this.simulationParameters.angular_velocity;        
        this.textured_plane_mesh.material.uniforms.primary_x.value = this.simulationParameters.getPrimaryX();
        this.textured_plane_mesh.material.uniforms.secondary_x.value = this.simulationParameters.getSecondaryX();
        this.textured_plane_mesh.material.uniforms.primary_mass.value = this.simulationParameters.getPrimaryMass();
        this.textured_plane_mesh.material.uniforms.secondary_mass.value = this.simulationParameters.getSecondaryMass();
        this.textured_plane_mesh.material.uniforms.planeCornerBL.value.x = this.simulationParameters.domain_min_x;
        this.textured_plane_mesh.material.uniforms.planeCornerBL.value.y = this.simulationParameters.domain_min_y;
        this.textured_plane_mesh.material.uniforms.planeDimensions.value.x = this.simulationParameters.domain_dimension_x;
        this.textured_plane_mesh.material.uniforms.planeDimensions.value.y = this.simulationParameters.domain_dimension_y;
        this.textured_plane_mesh.material.uniforms.planeDimensionsPixel.value.x = this.simulationParameters.domain_pixels_x;
        this.textured_plane_mesh.material.uniforms.planeDimensionsPixel.value.y = this.simulationParameters.domain_pixels_y;
        return;
    }

    generateUniforms() {
        this.uniforms = {
            mu: { type: 'float', value: 0.1 },
            angular_velocity: { type: 'float', value: 1.0 },
            primary_x: { type: 'float', value: 0.0 },
            secondary_x: { type: 'float', value: 0.0 },
            primary_mass: { type: 'float', value: 0.0 },
            secondary_mass: { type: 'float', value: 0.0 },
            planeCenter: { type: 'vec2', value: new THREE.Vector2(0, 0) },
            planeCornerBL: { type: 'vec2', value: new THREE.Vector2(-1, -1) },
            planeDimensions: { type: 'vec2', value: new THREE.Vector2(2, 2) },
            planeDimensionsPixel: { type: 'vec2', value: new THREE.Vector2(100, 100) }
        }
        this.addAdditionalUniforms();
    }

    vertexShader() {
        return `
        varying vec2 vUv; 
    
        void main() {
          vUv = uv; 
    
          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition; 
        }
        `
    }

    fragmentShader() {
        return "" +
            this.getUniformsString() +
            `
        varying vec2 vUv;
        out vec4 outputColor;

        const float G = 1.0;//TODO
  
        void RenderSpecializedMode(float x_frac, float y_frac);
        float InterpolateScalar(float x_frac, float y_frac, int x_virtual, int y_virtual, int component);
        vec4 InterpolateVec4(float x_frac, float y_frac, int x_virtual, int y_virtual);
        vec3 mapScalarToColor(float scalar);
        vec3 normalMappingVec2(vec2 vector);

        void main() {

            //coordinates as fractions of texture starting bottom left
            float x_frac = vUv.x;
            float y_frac = vUv.y;

            //coordinates in pixel in virtual texture starting bottom left
            int x_pixel = int(round(x_frac * (planeDimensionsPixel.x-1.0)));
            int y_pixel = int(round(y_frac * (planeDimensionsPixel.y-1.0)));
            int x_pixel_total = int(round(x_frac * (2.0*planeDimensionsPixel.x-1.0)));//TODO: const 2.0
            int y_pixel_total = int(round(y_frac * (2.0*planeDimensionsPixel.y-1.0)));//TODO: const 2.0


            ivec2 pointer;
            vec4 data;
            outputColor = vec4(0.0, 0.0, 0.0, 1.0);
            switch (rendering_texture_mode) {
                case 0://specialized
                    RenderSpecializedMode(x_frac, y_frac);
                    break;
                case 1://raw texture output of virtual texture
                    pointer = ivec2(x_pixel, y_pixel);
                    data = texelFetch(displayedTexture, pointer, 0);
                    outputColor = vec4(data.x, data.y, data.z, data.a);
                    break;
                case 2://raw texture output of all virtual textures
                    pointer = ivec2(x_pixel_total, y_pixel_total);
                    data = texelFetch(displayedTexture, pointer, 0);
                    outputColor = vec4(data.x, data.y, data.z, data.a);
                    break;
            }
        `
            + this.fragmentShaderMethodComputation() +
            `
        }   
        
        void RenderSpecializedMode(float x_frac, float y_frac){
            int x_virtual = 0;
            int y_virtual = 0;
            int component = 0;
            outputColor = vec4(1.0, 0.0, 1.0, 1.0);
            switch (rendering_specialized_mode) {
                case 0://gravitational force (normal)
                    x_virtual = 0;
                    y_virtual = 0;
                    vec4 data = InterpolateVec4(x_frac, y_frac, x_virtual, y_virtual);
                    outputColor = vec4(normalMappingVec2(vec2(data.x, data.y)), opacity);
                    break;
                case 1://gravitational force (magnitude)
                    x_virtual = 0;
                    y_virtual = 0;
                    component = 3;
                    float value = InterpolateScalar(x_frac, y_frac, x_virtual, y_virtual, component);
                    outputColor = vec4(mapScalarToColor(value), opacity);
                    break;
            }
        }

        // x_virtual, y_virtual: which virtual texture is used?
        // component: the index to access the element of the vec4
        float InterpolateScalar(float x_frac, float y_frac, int x_virtual, int y_virtual, int component){
            
            int x_offset = int(planeDimensionsPixel.x) * x_virtual;
            int y_offset = int(planeDimensionsPixel.y) * y_virtual;

            float dx = 1.0 / (planeDimensionsPixel.x-1.0);
            float dy = 1.0 / (planeDimensionsPixel.y-1.0);

            float x = x_frac;
            float y = y_frac;

            int i = int(floor(x / dx));
            int j = int(floor(y / dy));

            float t_x = (x - (float(i) * dx)) / dx;
            float t_y = (y - (float(j) * dy)) / dy;

            float v_00 = texelFetch(displayedTexture, ivec2(i+0+x_offset, j+0+y_offset), 0)[component];
            float v_01 = texelFetch(displayedTexture, ivec2(i+0+x_offset, j+1+y_offset), 0)[component];
            float v_10 = texelFetch(displayedTexture, ivec2(i+1+x_offset, j+0+y_offset), 0)[component];
            float v_11 = texelFetch(displayedTexture, ivec2(i+1+x_offset, j+1+y_offset), 0)[component];

            //interpolate 2 points along y axis using t_y
            float v_0 = mix(v_00, v_01, t_y);
            float v_1 = mix(v_10, v_11, t_y);

            //interpolate 1 points along x axis using t_x
            float v = mix(v_0, v_1, t_x);
            
            return v;
        }

        // x_virtual, y_virtual: which virtual texture is used?
        // component: the index to access the element of the vec4
        vec4 InterpolateVec4(float x_frac, float y_frac, int x_virtual, int y_virtual){
            
            int x_offset = int(planeDimensionsPixel.x) * x_virtual;
            int y_offset = int(planeDimensionsPixel.y) * y_virtual;

            float dx = 1.0 / (planeDimensionsPixel.x-1.0);
            float dy = 1.0 / (planeDimensionsPixel.y-1.0);

            float x = x_frac;
            float y = y_frac;

            int i = int(floor(x / dx));
            int j = int(floor(y / dy));

            float t_x = (x - (float(i) * dx)) / dx;
            float t_y = (y - (float(j) * dy)) / dy;

            vec4 v_00 = texelFetch(displayedTexture, ivec2(i+0+x_offset, j+0+y_offset), 0);
            vec4 v_01 = texelFetch(displayedTexture, ivec2(i+0+x_offset, j+1+y_offset), 0);
            vec4 v_10 = texelFetch(displayedTexture, ivec2(i+1+x_offset, j+0+y_offset), 0);
            vec4 v_11 = texelFetch(displayedTexture, ivec2(i+1+x_offset, j+1+y_offset), 0);

            //interpolate 2 points along y axis using t_y
            vec4 v_0 = mix(v_00, v_01, t_y);
            vec4 v_1 = mix(v_10, v_11, t_y);

            //interpolate 1 points along x axis using t_x
            vec4 v = mix(v_0, v_1, t_x);
            
            return v;
        }

        vec3 mapScalarToColor(float scalar){
            int bin_count = 256;

            float t = (scalar - scalar_min) / (scalar_max - scalar_min);
            int bin_index = int(t * float(bin_count-1));
            bin_index = clamp(bin_index, 0, bin_count-1);
            vec3 color = texelFetch(colorMapsTexture, ivec2(bin_index, 0), 0).rgb;

            return vec3(color);
        }

        vec3 normalMappingVec2(vec2 vector){

            vec2 normal = normalize(vector);
            vec2 mapped = 0.5 * normal + 0.5;

            return vec3(mapped.x, mapped.y, 0.0);
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
     * The actual computation of the shader is done in this method.
     * 
     * @returns partial shader code that is copied inside the main function of the shader
     */
    fragmentShaderMethodComputation() {        
        return `
        /*
        if(vUv.x > 0.0)
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        if(vUv.y > 0.0)
            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
*/

        `
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
        this.uniforms["displayedTexture"] = { type: 'sampler2D', value: null};
        this.uniforms["colorMapsTexture"] = { type: 'sampler2D', value: null};
        this.uniforms["rendering_texture_mode"] = { type: 'int', value: parseInt(Constants.TEXTURE_MODE_SPECIALIZED)};      
        this.uniforms["rendering_specialized_mode"] = { type: 'int', value: parseInt(Constants.TEXTURE_MODE_SPECIALIZED_GRAVITATIONAL_FORCE)};      
        
        this.uniforms["scalar_min"] = { type: 'float', value: 0.0};
        this.uniforms["scalar_max"] = { type: 'float', value: 1.0};
        this.uniforms["opacity"] = { type: 'float', value: 1.0};
        
        
    }

    setAdditionalUniforms() {
        this.textured_plane_mesh.material.uniforms.displayedTexture.value = this.displayedTexture;
        this.textured_plane_mesh.material.uniforms.colorMapsTexture.value = this.colorMaps.texture;
        this.textured_plane_mesh.material.uniforms.rendering_texture_mode.value = this.simulationParameters.rendering_texture_mode;
        this.textured_plane_mesh.material.uniforms.rendering_specialized_mode.value = this.simulationParameters.rendering_specialized_mode;
        this.textured_plane_mesh.material.uniforms.scalar_min.value = this.simulationParameters.scalar_min;
        this.textured_plane_mesh.material.uniforms.scalar_max.value = this.simulationParameters.scalar_max;
        this.textured_plane_mesh.material.uniforms.opacity.value = this.simulationParameters.opacity;        
        
        console.warn("this.uniforms", this.uniforms);
    }

}

export { TextureRenderer }