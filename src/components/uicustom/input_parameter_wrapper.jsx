import React, { Component } from "react";
import { AppContext } from "@/components/uicustom/AppContext"
import Emitter from '../utility/emitter';
import * as Constants from "../utility/constants";
import * as THREE from "three";
class InputWrapper {

    constructor(input_parameter_wrapper, ui_state_name, url_parameter_name, type) {
        this.input_parameter_wrapper = input_parameter_wrapper;
        this.ui_state_name = ui_state_name;
        this.url_parameter_name = url_parameter_name;
        this.type = type;

        this.addToDicts();
    }

    addToDicts() {
        console.log("add InputWrapper: ", this.ui_state_name, this.url_parameter_name)
        var exists = this.url_parameter_name in this.input_parameter_wrapper.dict_url_parameter_name_to_input_wrapper
        if (exists) {
            var wrapper = this.input_parameter_wrapper.dict_url_parameter_name_to_input_wrapper[this.url_parameter_name]
            throw new Error("Error while trying to add '" + this.ui_state_name + "' with url_parameter_name '"
                + this.url_parameter_name + "'. The url_parameter_name "
                + "already exists for wrapper: '" + wrapper.ui_state_name + "'");
        }
        var exists = this.ui_state_name in this.input_parameter_wrapper.dict_ui_state_name_to_input_wrapper
        if (exists) {
            var wrapper = this.input_parameter_wrapper.dict_ui_state_name_to_input_wrapper[this.ui_state_name]
            throw new Error("Error while trying to add '" + this.ui_state_name + "' with url_parameter_name '"
                + this.url_parameter_name + "'. The ui_state_name "
                + "already exists with url_parameter_name: '" + wrapper.url_parameter_name + "'");
        }
        this.input_parameter_wrapper.dict_url_parameter_name_to_input_wrapper[this.url_parameter_name] = this;
        this.input_parameter_wrapper.dict_ui_state_name_to_input_wrapper[this.ui_state_name] = this;
    }
}

class InputParameterWrapper extends Component{

    static contextType = AppContext;

    constructor(props) {   
        super(props);
        this.mainRef = props.mainRef;
        this.auxRef = props.auxRef;
        console.warn("CONSTRUCTOR: InputParameterWrapper");     
        this.dict_url_parameter_name_to_input_wrapper = {};
        this.dict_ui_state_name_to_input_wrapper = {};
        
        Emitter.on(Constants.EVENT_INITIALIZATION_COMPLETED, this.handleEventInitializationCompleted);
        Emitter.on(Constants.EVENT_WRITE_FROM_UI_TO_URL, this.handleEventWriteFromUItoURL);
        this.waiting_for_completion = Constants.NUM_ELEMENTS_THAT_REQUIRE_INITIALIZATION;
        
        new InputWrapper(this, "UI_STATE_DATA_FORMULA_SURFACE_IMPLICIT", "imp", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_MU", "mu", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_ANGULAR_VELOCITY", "n", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_SEED_ENERGY", "e", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_SEED_DIRECTION_X", "dx", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Y", "dy", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Z", "dz", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_SEED_POSITION_X", "qx", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_SEED_POSITION_Y", "qy", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_SEED_POSITION_Z", "qz", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_INTEGRATION_STEP_SIZE", "ss", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_INTEGRATION_MAX_STEPS", "sn", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_NUMBER_OF_INTERSECTIONS", "num", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_MIN_X", "xmin", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_MAX_X", "xmax", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_PIXELS_X", "nx", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_MIN_Y", "ymin", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_MAX_Y", "ymax", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_PIXELS_Y", "ny", Constants.TYPE_STRING);        
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_MIN_Z", "zmin", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_MAX_Z", "zmax", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_DOMAIN_PIXELS_Z", "nz", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_ANGLE_PIXELS_X", "ax", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_ANGLE_PIXELS_Y", "ay", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_CAMERA_CONTROLS_ROTATESPEED", "rot", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_CAMERA_CONTROLS_PANSPEED", "pan", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_CAMERA_CONTROLS_ZOOMSPEED", "zoom", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_CAMERA_NEAR", "near", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_CAMERA_FAR", "far", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_FTLE_TYPE", "ftype", Constants.TYPE_INT);
        new InputWrapper(this, "UI_STATE_RENDERING_BODIES_MAX_RADIUS_BODIES", "radb", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_BODIES_RADIUS_CENTER_OF_MASS", "radcm", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_SCALAR_MIN", "smin", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_SCALAR_MAX", "smax", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_OPACITY", "opa", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_CLICKED_POSITION_RADIUS", "radc", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX", "rada", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX_SPHERE", "radas", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TEXTURE_MODE", "tm", Constants.TYPE_INT);
        new InputWrapper(this, "UI_STATE_RENDERING_SPECIALIZED_MODE", "sm", Constants.TYPE_INT);
        new InputWrapper(this, "UI_STATE_RENDERING_RETURN_NUMBER", "rn", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_DIRECTION", "dir", Constants.TYPE_BOOL);
        new InputWrapper(this, "UI_STATE_RENDERING_RAW_MODE", "raw", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_RAW_MODE_LAYER", "rawl", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_RAW_MODE_X_TEXTURE_INDEX", "rawx", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_RAW_MODE_Y_TEXTURE_INDEX", "rawy", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_SEGMENT_LENGTH", "tsl", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_MAX_SEGMENTS", "tsn", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_RADIUS", "tr", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_NUM_SIDES", "tns", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_ONLY_SHOW_SUCCESSFUL_RETURNS", "succ", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_COLOR", "col", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_ROUGHNESS", "rough", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_RENDERING_TUBE_EMISSIVE_INTENSITY", "int", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_ACTIVE_BEHAVIOR", "ab", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_LINKED_VIEWS_ACTIVE", "link", Constants.TYPE_STRING);
        new InputWrapper(this, "UI_STATE_DATA_PHYSICS_USE_CONSTANT_VELOCITY", "cvel", Constants.TYPE_BOOL);
        new InputWrapper(this, "UI_STATE_AUX_CONTENT", "auxc", Constants.TYPE_INT_EMIT_SELECT_CHANGED);
        new InputWrapper(this, "UI_STATE_AUX_GRID_DIRECTION", "auxgd", Constants.TYPE_INT_EMIT_SELECT_CHANGED);
        new InputWrapper(this, "UI_STATE_RENDERING_SCALE_VERTICES", "scalev", Constants.TYPE_STRING);
    }

    componentDidMount() {
        this.fromURL();
    }

    handleEventInitializationCompleted = () => {
        console.warn("handleEventInitializationCompleted");
        this.waiting_for_completion -= 1;
        if(this.waiting_for_completion == 0){
            console.warn("all elements initialized");
            Emitter.emit(Constants.EVENT_FULL_UPDATE, {});
        }
    }

    handleEventWriteFromUItoURL = () => {
        console.warn("handleEventWriteFromUItoURL");
        this.updateURL();
    }

    fromURL() {
        console.warn("fromURL:", window.location.search);
        const urlParams = new URLSearchParams(window.location.search);

        const no_search = window.location.search.length < 1;
        const complete = urlParams.has("c") || no_search;
        if(!complete){
            window.alert("Error: Incomplete URL.\nIf you clicked on a link in a PDF, try using a different PDF viewer.");
        }

        var dict = {};
        for (var key in this.dict_url_parameter_name_to_input_wrapper) {
            var input_wrapper = this.dict_url_parameter_name_to_input_wrapper[key];
            const value = urlParams.get(input_wrapper.url_parameter_name);
            console.warn("url_parameter_name:", input_wrapper.url_parameter_name, "value:", value);
            if (value === null)
                continue;

            switch (input_wrapper.type) {
                case Constants.TYPE_BOOL:
                    dict[input_wrapper.ui_state_name] = value === "true" ? true : false;                    
                    break;
                case Constants.TYPE_INT:
                    dict[input_wrapper.ui_state_name] = parseInt(value);                    
                    break;
                case Constants.TYPE_INT_EMIT_SELECT_CHANGED:
                    dict[input_wrapper.ui_state_name] = parseInt(value);   
                    Emitter.emit(Constants.EVENT_SELECT_CHANGED, 
                        {
                            key:input_wrapper.ui_state_name,
                            value:value
                        });
                    break;
                default:
                    dict[input_wrapper.ui_state_name] = value;
                    break;
            }
        }

        //special string representations
        const string_camera_and_controls1 = urlParams.get("cc1");
        this.fromStringCameraAndControls(this.mainRef.current.sceneWrapper.camera, this.mainRef.current.sceneWrapper.controls, string_camera_and_controls1);
        const string_camera_and_controls2 = urlParams.get("cc2");
        this.fromStringCameraAndControls(this.auxRef.current.sceneWrapper.camera, this.auxRef.current.sceneWrapper.controls, string_camera_and_controls2);
        const string_camera_and_controls3 = urlParams.get("cc3");
        this.fromStringCameraAndControls(this.auxRef.current.sceneWrapper.camera_sphere, this.auxRef.current.sceneWrapper.controls_sphere, string_camera_and_controls3);

        this.setValues(dict);
    }

    updateURL(){        
        var query_string = this.toQueryString();
        window.history.pushState(null, null, 'index.html' + query_string);
    }

    /*
    toURL(){
        var query_string = this.toQueryString();
        var url_without_query = window.location.toString().replace(window.location.search, "");
        return url_without_query + query_string;
    }
    */

    toQueryString() {
        console.warn("toURL");
        var params = {};

        for (var key in this.dict_url_parameter_name_to_input_wrapper) {
            var input_wrapper = this.dict_url_parameter_name_to_input_wrapper[key];
            console.log("key:", key);
            const value = this.getValue(input_wrapper.ui_state_name);
            console.log("url_parameter_name:", input_wrapper.url_parameter_name, "value:", value);
            if (value === null)
                continue;
            params[input_wrapper.url_parameter_name] = value;
        }

        //special string representations
        params["cc1"] = this.toStringCameraAndControls(this.mainRef.current.sceneWrapper.camera, this.mainRef.current.sceneWrapper.controls);
        params["cc2"] = this.toStringCameraAndControls(this.auxRef.current.sceneWrapper.camera, this.auxRef.current.sceneWrapper.controls);
        params["cc3"] = this.toStringCameraAndControls(this.auxRef.current.sceneWrapper.camera_sphere, this.auxRef.current.sceneWrapper.controls_sphere);
        
        var query_string = "?" + Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&')

        console.log("query_string:", query_string);
        return query_string + "&c=1";
    }   
    
    setValue(ui_state_name, value) {
        console.warn("set value of '", ui_state_name, "' to '", value, "'")
        const { setUiState } = this.context;
        setUiState({ [ui_state_name]: value });
    }

    setValues(dict) {
        console.warn("set values", dict)
        const { setUiState } = this.context;
        setUiState(dict);
    }

    getValue(ui_state_name) {
        console.warn("get value of '", ui_state_name, "'")
        const { uiState } = this.context;
        return uiState[ui_state_name];
    }

    render() {
        const { children } = this.props

        return (
            <div>
                {children}
            </div>
        )
    }

    toStringCameraAndControls(camera, controls){
        console.warn(camera)
        return camera.position.x + "~" +
            camera.position.y + "~" +
            camera.position.z + "~" +
            camera.up.x + "~" +
            camera.up.y + "~" +
            camera.up.z + "~" +
            camera.quaternion.x + "~" +
            camera.quaternion.y + "~" +
            camera.quaternion.z + "~" +
            camera.quaternion.w + "~" +
            controls.target.x + "~" +
            controls.target.y + "~" +
            controls.target.z; 
    }

    fromStringCameraAndControls(camera, controls, string){
        if (string === null)
            return;
        
        var split = string.split("~");

        camera.position.x = parseFloat(split[0]);
        camera.position.y = parseFloat(split[1]);
        camera.position.z = parseFloat(split[2]);

        controls.target.x = parseFloat(split[10]);
        controls.target.y = parseFloat(split[11]);
        controls.target.z = parseFloat(split[12]);

        camera.up.x = parseFloat(split[3]);
        camera.up.y = parseFloat(split[4]);
        camera.up.z = parseFloat(split[5]);

        //var q = new THREE.Quaternion()
        //q.set(parseFloat(parseFloat(split[6])), parseFloat(split[7]), parseFloat(split[8]), parseFloat(split[9]))
        //camera.quaternion.copy(q);        
        camera.quaternion.set(parseFloat(split[6]), parseFloat(split[7]), parseFloat(split[8]), parseFloat(split[9]));
    }
}

export { InputParameterWrapper };