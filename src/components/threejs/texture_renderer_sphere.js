import * as THREE from "three";
import { vec3 } from "gl-matrix/esm";
import * as Constants from "../utility/constants";
import * as LINALG from "@/components/glsl/linalg";
import * as UTILITY from "@/components/glsl/utility";
import * as TEXTURE_ACCESS from "@/components/glsl/texture_access";
import * as TEXTURE_ACCESS_DECLARATIONS from "@/components/glsl/texture_access_declarations";
import { TextureRenderer } from "./texture_renderer";
import { SpherelikeGrid } from "./custom_objects";


const glsl = x => x[0];
/**
 * TODO
 * This class renders the textures generated by offscreen renderers.
 * It can render the data:
 * - specialized: TODO specific use cases tailored for the input data
 * - raw: from the uv data access the nearest texel from the input texture and render as is
 * - processed: TODO more control over the data
 */
class TextureRendererSphere extends TextureRenderer {

    constructor(renderer_id, renderer, simulationParameters, colorMaps, scene, useAnglePlane) {
        super(renderer_id, renderer, simulationParameters, colorMaps, scene, useAnglePlane);
        console.warn("CONSTRUCTOR: TextureRendererSphere");
    }
    
    initializeTexturedGeometry(){
        this.spherelikeGrid = new SpherelikeGrid(this.scene, this.textured_material);

        var subdivide = false;
        var pixels_x = 100;
        var pixels_y = 100;
        this.spherelikeGrid.updateGrid(subdivide, pixels_x, pixels_y);

        this.textured_mesh = this.spherelikeGrid.mesh;
    }

    vertexShader() {
        return "" +
        this.getUniformsString() 
        + UTILITY.SHADER_MODULE_UTILITY + "\n" 
        + TEXTURE_ACCESS_DECLARATIONS.SHADER_MODULE_TEXTURE_ACCESS_DECLARATIONS + "\n" 
        + glsl`
        varying vec2 vUv; 
    
        void main() {
            vUv = uv; 
            float a = 1.0;
            vec3 pos = position;

            //modify vertex position by scaling
            if(scale_vertices_by_velocity_magnitude){
                //coordinates as fractions of texture starting bottom left
                float x_frac = vUv.x;
                float y_frac = vUv.y;

                //coordinates in pixel in virtual texture starting bottom left
                int x_pixel = int(round(x_frac * (planeDimensionsPixel.x-1.0)));
                int y_pixel = int(round(y_frac * (planeDimensionsPixel.y-1.0)));
                int x_pixel_total = int(round(x_frac * (2.0*planeDimensionsPixel.x-1.0)));//TODO: const 2.0
                int y_pixel_total = int(round(y_frac * (2.0*planeDimensionsPixel.y-1.0)));//TODO: const 2.0

                int x_virtual = 1;
                int y_virtual = 0;
                int z_layer = 0;
                int component = 3;
                bool forward = rendering_forward;
                a = InterpolateScalarWrapper(forward, x_frac, y_frac, x_virtual, y_virtual, z_layer, component);

                //pos = vec3(x_frac, y_frac, 0);
                pos *= a;
            }

            vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
        }
        ` + "\n" 
        + TEXTURE_ACCESS.SHADER_MODULE_TEXTURE_ACCESS
        ;
    }

    shouldScaleVerticesByVelocityMagnitude(){
        return this.simulationParameters.rendering_texture_mode == Constants.TEXTURE_MODE_SPECIALIZED
        && this.simulationParameters.rendering_specialized_mode == Constants.TEXTURE_MODE_SPECIALIZED_SEED_VELOCITY_MAGNITUDE;
    }

    addAdditionalUniforms(){
        super.addAdditionalUniforms();
        this.uniforms["is_plane"] = { type: 'bool', value: false };
    }
}

export { TextureRendererSphere }