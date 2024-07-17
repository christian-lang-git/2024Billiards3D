import React, { Component } from "react";
import * as THREE from "three";
//import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

import Emitter from '../utility/emitter';
import * as Constants from "../utility/constants";
import { AppContext } from "@/components/uicustom/AppContext"
import { SceneWrapperVisualizationAux } from "./sceneWrapperVisualizationnAux";
import ThreeContainer from "./threeContainer";

class ThreeContainerAux extends ThreeContainer {

    constructor(props) {
        super(props);
        this.mainRef = props.mainRef;
        console.warn("CONSTRUCTOR ThreeContainerAux");
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      INITIALIZATION
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
    initializeAdditional() {
        Emitter.on(Constants.EVENT_DOWNLOAD, this.handleEventDownload);
        Emitter.on(Constants.EVENT_FULL_UPDATE, this.handleEventFullUpdate);
        Emitter.on(Constants.EVENT_DATA_UPDATE, this.handleEventDataUpdate);     
        Emitter.on(Constants.EVENT_RENDERING_UPDATE, this.handleEventRenderingUpdate);
        Emitter.on(Constants.EVENT_ALIGN_CAMERA, this.handleEventAlignCamera);  
        Emitter.on(Constants.EVENT_SELECT_CHANGED, this.handleEventSelectChanged);      

        Emitter.on(Constants.EVENT_SEED_POSITION_CHANGED, this.handleEventSeedPositionChanged);     
        
        
        this.initializeAdditionalSceneSphere();
        this.initializeAdditionalCameraSphere();
        this.initializeAdditionalControlsSphere();

        this.sceneWrapper = new SceneWrapperVisualizationAux(this.renderer, this.scene, this.camera, this.controls, this.raycaster, this.scene_sphere, this.camera_sphere, this.controls_sphere);
        this.sceneWrapper.initialize();
            
        this.switchToScene(Constants.AUX_CONTENT_DEFAULT);
        this.switchGridDirection(Constants.AUX_GRID_DIRECTION_THETA_DOWN_PHI_RIGHT);
    }

    switchToScene(index){
        this.sceneWrapper.simulationParameters.active_aux_scene_index = index;
        if(index == 0){
            this.active_scene = this.scene;
            this.active_camera = this.camera;
            this.active_controls = this.controls;

            this.controls.enabled = true;
            this.controls_sphere.enabled = false;
        }
        else{
            this.active_scene = this.scene_sphere;
            this.active_camera = this.camera_sphere;
            this.active_controls = this.controls_sphere;

            this.controls.enabled = false;
            this.controls_sphere.enabled = true;
        }
    }

    switchGridDirection(value){
        this.sceneWrapper.switchGridDirection(value);
        this.updateVisualElements();
    }

    initializeAdditionalSceneSphere() {
        this.scene_sphere = new THREE.Scene();
        this.scene_sphere.background = new THREE.Color(0xffffff);
    }

    initializeAdditionalCameraSphere() {
        this.camera_sphere = new THREE.PerspectiveCamera(75, 1.0, 0.01, 100);
        this.camera_sphere.position.z = 2;
        this.scene_sphere.add(this.camera_sphere);
        
        this.list_cameras.push(this.camera_sphere);
    }

    initializeAdditionalControlsSphere() {
        this.controls_sphere = new TrackballControls(this.camera_sphere, this.renderer.domElement);
        this.controls_sphere.update();

        this.list_controls.push(this.controls_sphere);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      EVENT HANDLERS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    handleEventDownload = () => {
        //console.warn("handleEventDownload");
        this.saveImage();
    }

    handleEventFullUpdate = () => {
        //console.warn("handleEventFullUpdate");
        this.updateParametersData();
        this.updateParametersRendering();
        this.computeStuff();
        this.updateVisualElements();
    }

    handleEventDataUpdate = () => {
        //console.warn("aux handleEventDataUpdate");
        this.updateParametersData();
        this.computeStuff();
        this.updateVisualElements();
    }

    handleEventRenderingUpdate = () => {
        //console.log("handleEventRenderingUpdate");
        this.updateParametersRendering();
        this.updateVisualElements();
    }

    handleEventAlignCamera = () => {
        //console.log("handleEventAlignCamera");
        this.alignCameraWithDomain();
    }

    handleEventSelectChanged = (event) => {
        //console.log("handleEventSelectChanged");
        switch(event.key){
            case "UI_STATE_AUX_CONTENT":
                this.switchToScene(event.value);
                break;
            case "UI_STATE_AUX_GRID_DIRECTION":
                this.switchGridDirection(event.value);
                break;
            default:
                //do nothing
                break;
        }
    }

    handleEventSeedPositionChanged = () => {
        //console.log("handleEventSeedPositionChanged");
        this.sceneWrapper.OnSeedPositionChanged();
        this.writeSeedDataToUI();
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //      UPDATE FUNCTIONS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    computeStuff(){
        this.sceneWrapper.computeStuff();
        //this.sceneWrapper.recalculateStreamlineWithLastParameters();
        //this.sceneWrapper.recalculateStreamlineKeepPosition();        
    }

    updateVisualElements(){
        this.sceneWrapper.updateVisualElements();
        /*
        this.sceneWrapper.updateBodies();
        this.sceneWrapper.updateClickedPosition();   
        this.sceneWrapper.updateStreamlineModel();  
        this.sceneWrapper.updateTexturedPlane();
        this.sceneWrapper.updateAxes();
        */
    }

    updateControls() {
        this.updateControlsInstance(this.controls);
        this.updateControlsInstance(this.controls_sphere);
    }

    saveImage(){
        this.renderer.render(this.active_scene, this.active_camera);
        var canvas = this.renderer.domElement;
        canvas.toBlob((blob) => {
            this.saveBlob(blob, "capture-aux.png");
        });
    }

}

export default ThreeContainerAux;