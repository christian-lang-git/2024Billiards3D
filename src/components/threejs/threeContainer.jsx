import React, { Component } from "react";
import * as THREE from "three";
//import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

import Emitter from '../utility/emitter';
import * as Constants from "../utility/constants";
import { AppContext } from "@/components/uicustom/AppContext"

class ThreeContainer extends Component {

    static contextType = AppContext;

    constructor(props) {
        super(props);
        console.warn("CONSTRUCTOR ThreeContainer");
    }

    componentDidMount() {
        console.warn("ThreeScene::componentDidMount");
        this.frame_counter = 0;
        this.list_cameras = [];
        this.list_controls = [];

        this.initializeScene();
        this.initializeRenderer();
        this.initializeCamera();
        this.initializeControls();
        this.initializeRayCaster();
        this.initializeEventHandlers();

        this.initializeAdditional();

        this.updateCanvasSize();
        this.updateControls();
        this.updateParameters();
        this.computeStuff();
        this.updateVisualElements();
        this.alignCameraWithDomain();
        this.renderLoop();
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      INITIALIZATION
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    initializeScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        //this.scene.background = new THREE.Color( 0x000000 );//background color for debugging layout

        this.active_scene = this.scene;
    }

    initializeRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(10, 10);
        this.mount.appendChild(this.renderer.domElement);
    }

    initializeCamera() {
        this.camera = new THREE.PerspectiveCamera(75, 1.0, 0.01, 100);
        this.camera.useQuaternion = true;
        this.camera.position.z = 11;
        this.scene.add(this.camera);

        this.active_camera = this.camera;

        this.list_cameras.push(this.camera);
    }

    initializeControls() {
        this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        this.controls.update();

        this.active_controls = this.controls;
        
        this.list_controls.push(this.controls);
    }

    initializeRayCaster() {
        this.raycaster = new THREE.Raycaster();
    }

    initializeEventHandlers() {
        window.addEventListener("resize", this.handleResize);
        Emitter.on(Constants.EVENT_RESIZE_PANEL, this.handleResize);    
        Emitter.on(Constants.EVENT_CAMERA_UPDATE, this.handleEventCameraUpdate); 
    }

    initializeAdditional() {
        //define in child class  
        console.error("initializeAdditional not defined");
    }

    /**
     * generates and initializes a SceneWrapper "this.sceneWrapper"
     */
    loadScene() {
        //define in child class
        console.error("loadScene not defined");
    }

    initializationCompleted(){
        Emitter.emit(Constants.EVENT_INITIALIZATION_COMPLETED, {});
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      EVENT HANDLERS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    handleResize = () => {
        console.log("handleResize");
        this.updateCanvasSize();
    }

    handleEventCameraUpdate = () => {
        console.log("handleEventCameraUpdate");
        this.updateControls();
        this.updateCamera();
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      UPDATE FUNCTIONS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    updateCanvasSize() {
        var canvas = this.renderer.domElement;
        var canvas_parent = this.renderer.domElement.parentElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        var width = canvas_parent.clientWidth;
        var height = canvas_parent.clientHeight;

        for(var i=0; i<this.list_cameras.length; i++){
            var camera = this.list_cameras[i];
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }

        for(var i=0; i<this.list_controls.length; i++){
            var controls = this.list_controls[i];
            controls.handleResize();
            controls.update();
        }



        this.renderer.setSize(width, height, false);
        this.renderer.render(this.active_scene, this.active_camera);
        console.warn("RESIZE")
    }

    updateControls() {
        this.updateControlsInstance(this.controls);
    }

    updateCamera(){
        this.updateCameraInstance(this.camera);
    }

    updateControlsInstance(controls) {
        const { uiState } = this.context;
        controls.rotateSpeed = uiState.UI_STATE_CAMERA_CONTROLS_ROTATESPEED * 5.0;//default: 1.0
        controls.panSpeed = uiState.UI_STATE_CAMERA_CONTROLS_PANSPEED * 0.3;//default: 0.3
        controls.zoomSpeed = uiState.UI_STATE_CAMERA_CONTROLS_ZOOMSPEED * 1.2;//default: 1.2
        controls.update();
    }

    updateCameraInstance(camera) {
        const { uiState } = this.context;
        camera.near = parseFloat(uiState.UI_STATE_CAMERA_NEAR);
        camera.far = parseFloat(uiState.UI_STATE_CAMERA_FAR);
        camera.updateProjectionMatrix();
    }

    updateParameters() {
        this.updateParametersData();
        this.updateParametersRendering();
        this.updateParametersActiveBehavior();
    }

    computeStuff(){
        //define in child class
        console.error("computeStuff not defined");
    }

    updateVisualElements(){
        //define in child class
        console.error("updateVisualElements not defined");
    }

    writeSeedDataToUI() {
        //console.warn("writeSeedDataToUI", this.sceneWrapper.simulationParameters.seed_position_x, this.sceneWrapper.simulationParameters.seed_position_y);
        const { uiState, setUiState } = this.context;
        //setUiState({ ["UI_STATE_DATA_PHYSICS_SEED_DIRECTION_X"]: this.sceneWrapper.simulationParameters.seed_direction_x });
        //setUiState({ ["UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Y"]: this.sceneWrapper.simulationParameters.seed_direction_y });
        //setUiState({ ["UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Z"]: this.sceneWrapper.simulationParameters.seed_direction_z });
        //setUiState({ ["UI_STATE_DATA_PHYSICS_SEED_POSITION_X"]: this.sceneWrapper.simulationParameters.seed_position_x });
        //setUiState({ ["UI_STATE_DATA_PHYSICS_SEED_POSITION_Y"]: this.sceneWrapper.simulationParameters.seed_position_y });
        
        setUiState({ 
            ["UI_STATE_DATA_PHYSICS_SEED_DIRECTION_X"]: this.sceneWrapper.simulationParameters.seed_direction_x,
            ["UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Y"]: this.sceneWrapper.simulationParameters.seed_direction_y,
            ["UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Z"]: this.sceneWrapper.simulationParameters.seed_direction_z,
            ["UI_STATE_DATA_PHYSICS_SEED_POSITION_X"]: this.sceneWrapper.simulationParameters.seed_position_x,
            ["UI_STATE_DATA_PHYSICS_SEED_POSITION_Y"]: this.sceneWrapper.simulationParameters.seed_position_y,
            ["UI_STATE_DATA_PHYSICS_SEED_POSITION_Z"]: this.sceneWrapper.simulationParameters.seed_position_z
         });
    }

    updateParametersData() {
        const { uiState } = this.context;
        var formula_implicit_surface = uiState.UI_STATE_DATA_FORMULA_SURFACE_IMPLICIT;
        var mu = uiState.UI_STATE_DATA_PHYSICS_MU;
        var angular_velocity = uiState.UI_STATE_DATA_PHYSICS_ANGULAR_VELOCITY;
        var use_constant_velocity = uiState.UI_STATE_DATA_PHYSICS_USE_CONSTANT_VELOCITY;
        var seed_energy = uiState.UI_STATE_DATA_PHYSICS_SEED_ENERGY;
        var seed_direction_x = uiState.UI_STATE_DATA_PHYSICS_SEED_DIRECTION_X;
        var seed_direction_y = uiState.UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Y;
        var seed_direction_z = uiState.UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Z;
        var seed_position_x = uiState.UI_STATE_DATA_PHYSICS_SEED_POSITION_X;
        var seed_position_y = uiState.UI_STATE_DATA_PHYSICS_SEED_POSITION_Y;
        var seed_position_z = uiState.UI_STATE_DATA_PHYSICS_SEED_POSITION_Z;        

        var step_size = uiState.UI_STATE_DATA_INTEGRATION_STEP_SIZE;
        var max_steps = uiState.UI_STATE_DATA_INTEGRATION_MAX_STEPS;
        var number_of_intersections = uiState.UI_STATE_DATA_NUMBER_OF_INTERSECTIONS;
        var number_of_bisection_steps = uiState.UI_STATE_DATA_INTEGRATION_BISECTION_STEPS;
        
        var domain_min_x = uiState.UI_STATE_DATA_DOMAIN_MIN_X;
        var domain_max_x = uiState.UI_STATE_DATA_DOMAIN_MAX_X;
        var domain_pixels_x = uiState.UI_STATE_DATA_DOMAIN_PIXELS_X;
        var domain_min_y = uiState.UI_STATE_DATA_DOMAIN_MIN_Y;
        var domain_max_y = uiState.UI_STATE_DATA_DOMAIN_MAX_Y;
        var domain_pixels_y = uiState.UI_STATE_DATA_DOMAIN_PIXELS_Y;
        var domain_min_z = uiState.UI_STATE_DATA_DOMAIN_MIN_Z;
        var domain_max_z = uiState.UI_STATE_DATA_DOMAIN_MAX_Z;
        var domain_pixels_z = uiState.UI_STATE_DATA_DOMAIN_PIXELS_Z;

        var angle_pixels_x = uiState.UI_STATE_DATA_ANGLE_PIXELS_X;
        var angle_pixels_y = uiState.UI_STATE_DATA_ANGLE_PIXELS_Y;

        var surface_type = uiState.UI_STATE_DATA_SURFACE_TYPE;
        var var_a = uiState.UI_STATE_DATA_VAR_A;
        var var_b = uiState.UI_STATE_DATA_VAR_B;
        var var_c = uiState.UI_STATE_DATA_VAR_C;
        var var_R = uiState.UI_STATE_DATA_VAR_BIG_R;
        var var_r = uiState.UI_STATE_DATA_VAR_SMALL_R;

        this.sceneWrapper.updateParametersData(surface_type, var_a, var_b, var_c, var_R, var_r, formula_implicit_surface, mu, angular_velocity, use_constant_velocity, seed_energy, seed_direction_x, seed_direction_y, seed_direction_z, seed_position_x, seed_position_y, seed_position_z, step_size, max_steps, number_of_intersections, number_of_bisection_steps, domain_min_x, domain_max_x, domain_pixels_x, domain_min_y, domain_max_y, domain_pixels_y, domain_min_z, domain_max_z, domain_pixels_z, angle_pixels_x, angle_pixels_y);
    }

    updateParametersRendering(){
        const { uiState } = this.context;
        var max_radius_bodies = uiState.UI_STATE_RENDERING_BODIES_MAX_RADIUS_BODIES;
        var radius_center_of_mass = uiState.UI_STATE_RENDERING_RADIUS_ORIGIN;
        var radius_clicked_position = uiState.UI_STATE_RENDERING_CLICKED_POSITION_RADIUS;
        var radius_clicked_position_aux = uiState.UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX;
        var radius_clicked_position_aux_sphere = uiState.UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX_SPHERE;
        var rendering_ftle_type = uiState.UI_STATE_RENDERING_FTLE_TYPE;
        var rendering_texture_mode = uiState.UI_STATE_RENDERING_TEXTURE_MODE;
        var rendering_specialized_mode = uiState.UI_STATE_RENDERING_SPECIALIZED_MODE;
        var return_number = uiState.UI_STATE_RENDERING_RETURN_NUMBER;
        var rendering_forward = uiState.UI_STATE_RENDERING_DIRECTION;
        var rendering_raw_mode = uiState.UI_STATE_RENDERING_RAW_MODE;
        var rendering_raw_mode_layer = uiState.UI_STATE_RENDERING_RAW_MODE_LAYER;
        var rendering_raw_mode_x_texture_index = uiState.UI_STATE_RENDERING_RAW_MODE_X_TEXTURE_INDEX;
        var rendering_raw_mode_y_texture_index = uiState.UI_STATE_RENDERING_RAW_MODE_Y_TEXTURE_INDEX;
        var scalar_min = uiState.UI_STATE_RENDERING_SCALAR_MIN;
        var scalar_max = uiState.UI_STATE_RENDERING_SCALAR_MAX;
        var opacity = uiState.UI_STATE_RENDERING_OPACITY;
        var tube_segment_length = uiState.UI_STATE_RENDERING_TUBE_SEGMENT_LENGTH;
        var tube_max_segments = uiState.UI_STATE_RENDERING_TUBE_MAX_SEGMENTS;
        var tube_num_sides = uiState.UI_STATE_RENDERING_TUBE_NUM_SIDES;
        var tube_radius = uiState.UI_STATE_RENDERING_TUBE_RADIUS;

        var tube_only_show_successful_returns = uiState.UI_STATE_RENDERING_TUBE_ONLY_SHOW_SUCCESSFUL_RETURNS;
        var tube_color = uiState.UI_STATE_RENDERING_TUBE_COLOR;
        var tube_roughness = uiState.UI_STATE_RENDERING_TUBE_ROUGHNESS;
        var tube_emissive_intensity = uiState.UI_STATE_RENDERING_TUBE_EMISSIVE_INTENSITY;
        var scale_vertices = uiState.UI_STATE_RENDERING_SCALE_VERTICES;

        this.sceneWrapper.updateParametersRendering(max_radius_bodies, radius_center_of_mass, radius_clicked_position, radius_clicked_position_aux, radius_clicked_position_aux_sphere,
            rendering_ftle_type, rendering_texture_mode, rendering_specialized_mode, return_number, rendering_forward, rendering_raw_mode, 
            rendering_raw_mode_layer, rendering_raw_mode_x_texture_index, rendering_raw_mode_y_texture_index,
            scalar_min, scalar_max, opacity, tube_segment_length, tube_max_segments, tube_num_sides, tube_radius, tube_only_show_successful_returns, tube_color, tube_roughness, tube_emissive_intensity, scale_vertices);       
    }

    updateParametersActiveBehavior() {
        const { uiState } = this.context;
        var activeBehavior = uiState.UI_STATE_ACTIVE_BEHAVIOR;
        var linkedViewsActive = uiState.UI_STATE_LINKED_VIEWS_ACTIVE;
        this.sceneWrapper.updateParametersActiveBehavior(activeBehavior, linkedViewsActive);
        this.sceneWrapper.updateBehavior();
    }

    alignCameraWithDomain(){
        this.sceneWrapper.alignCameraWithDomain(this.camera, this.controls);
        console.log(this.camera.position)
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      RENDERING
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    renderLoop = () => {
        if(this.frame_counter == 1){            
            this.initializationCompleted();
        }
        if(this.frame_counter >= 0){            
            this.frame_counter += 1;
        }
        this.updateParametersActiveBehavior();
        this.sceneWrapper.updateBehavior();
        this.sceneWrapper.preRender();
        this.active_controls.update();
        this.renderer.render(this.active_scene, this.active_camera);
        requestAnimationFrame(this.renderLoop);
    }

    render() {
        return (
            <div className="parent h-full w-full p-2">
                <div className="child flex flex-1 h-full w-full" ref={mount => { this.mount = mount; }} />
            </div>
        )
    }

    saveBlob = (function() {
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        return function saveData(blob, fileName) {
           const url = window.URL.createObjectURL(blob);
           a.href = url;
           a.download = fileName;
           a.click();
        };
    }());
}

export default ThreeContainer;