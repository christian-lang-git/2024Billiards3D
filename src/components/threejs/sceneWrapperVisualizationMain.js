import * as THREE from "three";
import { ObjectArrow, ObjectAxes, MarchingCubesMesh, LocalCoordinates } from "./custom_objects";
import { vec3 } from "gl-matrix/esm";
import { SimulationParameters } from "@/components/logic/simulation_parameters";
import { getMousePositionInCanvasNDC } from "@/components/utility/mouseHelper";
import * as Constants from "@/components/utility/constants";
import { OffscreenRendererSeedsAndReturns} from "./offscreen_renderer_seeds_and_returns";
import { OffscreenRendererSeeds} from "./offscreen_renderer_seeds";
import { OffscreenRendererFlowMap } from "./offscreen_renderer_flow_map";
import { OffscreenRendererFTLE } from "./offscreen_renderer_ftle";
import { OffscreenRendererGravitationalForce} from "./offscreen_renderer_gravitational_force";
import { TextureRenderer } from "@/components/threejs/texture_renderer";
import { SceneWrapperVisualization } from "@/components/threejs/sceneWrapperVisualization";

import { ColorMaps } from "@/components/colormaps/colormaps"
import Emitter from '@/components/utility/emitter';
import { OffscreenSurfaceComputation } from "./offscreen_surface_computation";

/**
 * This class is responsible for the scene that shows the main visualization
 * 
 * Other SceneWrappers could for example visualize:
 * - a sphere where the user can select a direction
 * - a deformed sphere that visualizes equivalent energy
 */
class SceneWrapperVisualizationMain extends SceneWrapperVisualization{
    constructor(renderer, scene, camera, controls, raycaster) {
        super(Constants.RENDERER_ID_MAIN, renderer, scene, camera, controls, raycaster, true, false);
        console.warn("CONSTRUCTOR SceneWrapperVisualizationMain");
        this.marchingCubesMesh = new MarchingCubesMesh(scene, this.simulationParameters);
        this.local_coordinates = new LocalCoordinates(scene, this.simulationParameters)
        this.offscreen_surface_computation = new OffscreenSurfaceComputation(renderer, this.simulationParameters, this.marchingCubesMesh);
    }

    initializeAdditionalObjects(){
        this.initializeOrigin();
    }

    /**
    * Generates the 3 spheres with radius 1
    */
    initializeOrigin() {
        var radius = 1.0;

        this.center_geometry = new THREE.SphereGeometry(radius);
        this.center_material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        this.center_mesh = new THREE.Mesh(this.center_geometry, this.center_material);
        this.center_mesh.position.set(0, 0, 0);
        this.scene.add(this.center_mesh);
    }

    getTexturedPlaneMinX(){
        return this.simulationParameters.domain_min_x;
    }

    getTexturedPlaneMaxX(){
        return this.simulationParameters.domain_max_x;
    }

    getTexturedPlaneMinY(){
        return this.simulationParameters.domain_min_y;
    }

    getTexturedPlaneMaxY(){
        return this.simulationParameters.domain_max_y;
    }

    getDefaultCameraDistance(){
        return 11;
    }

    updateVisualElements(){
        this.updateOrigin();
        this.updateClickedPosition();   
        this.updateStreamlineModel();  
        this.updateTexturedPlane();
        this.updateAxes();
        this.updateMarchingCubesMesh();
    }

    updateOrigin() {
        //scale
        var radius = this.simulationParameters.getCenterOfMassRadius();
        this.center_mesh.scale.set(radius, radius, radius);
    }

    updateAxes(){
        var has_z = true;
        var z_factor = 0.5;
        var min_x = this.simulationParameters.domain_min_x;
        var max_x = this.simulationParameters.domain_max_x;
        var min_y = this.simulationParameters.domain_min_y;
        var max_y = this.simulationParameters.domain_max_y; 
        var min_z = this.simulationParameters.domain_min_z;
        var max_z = this.simulationParameters.domain_max_z;       
        
        var diff_x = max_x - min_x;
        var diff_y = max_y - min_y;
        var diff = Math.min(diff_x, diff_y);

        var radius = 0.02 * diff / 16;
        var color1 = 0xff0000;
        var color2 = 0x00ff00;
        var color3 = 0x0000ff;
        this.objectAxes.rebuild(has_z, z_factor, this.scene, this.simulationParameters, min_x, max_x, min_y, max_y, min_z, max_z, radius, color1, color2, color3);
    }

    rayCastAndMovePosition(mousePositionNDC){        
        //console.log("CLICK NDC:", mousePositionNDC.x, mousePositionNDC.y);
        var mouse = new THREE.Vector2();
        mouse.x = mousePositionNDC.x;
        mouse.y = mousePositionNDC.y;
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.marchingCubesMesh.mesh);
        if (intersects.length > 0) {
            this.simulationParameters.setSeedPositionFromIntersection(intersects[0]);
            Emitter.emit(Constants.EVENT_SEED_POSITION_CHANGED,{});
        }

    }

    repositionSeedSpheres(){        
        this.clicked_mesh.position.set(this.simulationParameters.seed_position_x, this.simulationParameters.seed_position_y, this.simulationParameters.seed_position_z);
    }

    OnSeedDirectionChanged(){
        console.warn("OnSeedDirectionChanged");
        this.seed_changed = true;
    }

    updateMarchingCubesMesh(){
        //this.marchingCubesMesh.mesh.material.opacity = this.simulationParameters.opacity;
        this.marchingCubesMesh.updateUniforms();
    }

    computeAdditionalStuff(){        
        this.marchingCubesMesh.build();
        this.offscreen_surface_computation.compute();
    }
}

export { SceneWrapperVisualizationMain };