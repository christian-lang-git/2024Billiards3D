import React, { createContext, useState } from 'react';
import * as Constants from "@/components/utility/constants";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [uiState, setUiState] = useState({
        UI_STATE_DATA_SURFACE_TYPE: Constants.SURFACE_TYPE_TORUS,
        UI_STATE_DATA_LOCAL_DIRECTION: true,
        UI_STATE_DATA_VAR_A: "3.5",
        UI_STATE_DATA_VAR_B: "2.5",
        UI_STATE_DATA_VAR_C: "1.5",
        UI_STATE_DATA_VAR_BIG_R: "2",
        UI_STATE_DATA_VAR_SMALL_R: "1",
        UI_STATE_DATA_PHYSICS_MU: "0.1",
        UI_STATE_DATA_PHYSICS_ANGULAR_VELOCITY: "1.0",
        UI_STATE_DATA_PHYSICS_SEED_ENERGY: "0.5",
        UI_STATE_DATA_PHYSICS_SEED_DIRECTION_X: "1.0",
        UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Y: "1.0",
        UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Z: "0.25",
        UI_STATE_DATA_PHYSICS_SEED_POSITION_X: "0.0",
        UI_STATE_DATA_PHYSICS_SEED_POSITION_Y: "0.0",
        UI_STATE_DATA_PHYSICS_SEED_POSITION_Z: "0.0",
        UI_STATE_DATA_INTEGRATION_STEP_SIZE: "0.1",
        UI_STATE_DATA_INTEGRATION_MAX_STEPS: "100",
        UI_STATE_DATA_NUMBER_OF_INTERSECTIONS: "1000",
        UI_STATE_DATA_INTEGRATION_BISECTION_STEPS: "8",
        UI_STATE_DATA_DOMAIN_MIN_X: "-4",
        UI_STATE_DATA_DOMAIN_MAX_X: "4",
        UI_STATE_DATA_DOMAIN_PIXELS_X: "50",
        UI_STATE_DATA_DOMAIN_MIN_Y: "-3",
        UI_STATE_DATA_DOMAIN_MAX_Y: "3",
        UI_STATE_DATA_DOMAIN_PIXELS_Y: "50",
        UI_STATE_DATA_DOMAIN_MIN_Z: "-2",
        UI_STATE_DATA_DOMAIN_MAX_Z: "2",
        UI_STATE_DATA_DOMAIN_PIXELS_Z: "50",
        UI_STATE_DATA_FORMULA_SURFACE_IMPLICIT: "x*x/(3.5*3.5) + y*y/(2.5*2.5) + z*z/(1.5*1.5) - 1",
        UI_STATE_DATA_ANGLE_PIXELS_X: "100",
        UI_STATE_DATA_ANGLE_PIXELS_Y: "100",
        UI_STATE_CAMERA_CONTROLS_ROTATESPEED: "1.0",
        UI_STATE_CAMERA_CONTROLS_PANSPEED: "1.0",
        UI_STATE_CAMERA_CONTROLS_ZOOMSPEED: "1.0",
        UI_STATE_CAMERA_NEAR: "0.01",
        UI_STATE_CAMERA_FAR: "100",
        UI_STATE_RENDERING_FTLE_TYPE: Constants.FTLE_TYPE_PSFTLE,
        UI_STATE_RENDERING_BODIES_MAX_RADIUS_BODIES: "0.05",
        UI_STATE_RENDERING_RADIUS_ORIGIN: "0.01",
        UI_STATE_RENDERING_SCALAR_MIN: "0",
        UI_STATE_RENDERING_SCALAR_MAX: "10",
        UI_STATE_RENDERING_OPACITY: "0.5",
        UI_STATE_RENDERING_CLICKED_POSITION_RADIUS: "0.02",
        UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX: "0.005",
        UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX_SPHERE: "0.01",
        UI_STATE_RENDERING_TEXTURE_MODE: Constants.TEXTURE_MODE_SPECIALIZED,        
        UI_STATE_RENDERING_SPECIALIZED_MODE: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE,
        UI_STATE_RENDERING_RETURN_NUMBER: Constants.LAYER_INDEX_FIRST_RETURN,
        UI_STATE_RENDERING_DIRECTION: Constants.RENDERER_DIRECTION_FORWARD,
        UI_STATE_RENDERING_RAW_MODE: Constants.OFFSCREEN_RENDERER_GRAVITATIONAL_FORCE,
        UI_STATE_RENDERING_RAW_MODE_LAYER: "0",
        UI_STATE_RENDERING_RAW_MODE_X_TEXTURE_INDEX: "0",
        UI_STATE_RENDERING_RAW_MODE_Y_TEXTURE_INDEX: "0",
        UI_STATE_RENDERING_TUBE_SEGMENT_LENGTH: "0.01",
        UI_STATE_RENDERING_TUBE_MAX_SEGMENTS: "1000",
        UI_STATE_RENDERING_TUBE_RADIUS: "0.0025",
        UI_STATE_RENDERING_TUBE_NUM_SIDES: "20",
        UI_STATE_RENDERING_TUBE_ONLY_SHOW_SUCCESSFUL_RETURNS: "true",
        UI_STATE_RENDERING_TUBE_COLOR: "0x00ffff",
        UI_STATE_RENDERING_TUBE_ROUGHNESS: "0.75",
        UI_STATE_RENDERING_TUBE_EMISSIVE_INTENSITY: "0.4",
        UI_STATE_ACTIVE_BEHAVIOR: Constants.BEHAVIOR_CONTROL_CAMERA,
        UI_STATE_LINKED_VIEWS_ACTIVE: true,
        UI_STATE_DATA_PHYSICS_USE_CONSTANT_VELOCITY: false,
        UI_STATE_AUX_CONTENT: Constants.AUX_CONTENT_DEFAULT,
        UI_STATE_AUX_GRID_DIRECTION: Constants.AUX_GRID_DIRECTION_THETA_DOWN_PHI_RIGHT,
        UI_STATE_RENDERING_SCALE_VERTICES: false,
    });

    const value = {
        uiState,
        setUiState: (newState) => {
            //console.warn("update state:", newState);
            setUiState({ ...uiState, ...newState })
        }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};