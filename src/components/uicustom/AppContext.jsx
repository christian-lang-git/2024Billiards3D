import React, { createContext, useState } from 'react';
import * as Constants from "@/components/utility/constants";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [uiState, setUiState] = useState({
        UI_STATE_DATA_PHYSICS_MU: "0.1",
        UI_STATE_DATA_PHYSICS_ANGULAR_VELOCITY: "1.0",
        UI_STATE_DATA_PHYSICS_SEED_ENERGY: "0.5",
        UI_STATE_DATA_PHYSICS_SEED_DIRECTION_X: "1.0",
        UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Y: "1.0",
        UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Z: "0.25",
        UI_STATE_DATA_PHYSICS_SEED_POSITION_X: "0.0",
        UI_STATE_DATA_PHYSICS_SEED_POSITION_Y: "0.0",
        UI_STATE_DATA_INTEGRATION_STEP_SIZE: "0.001",
        UI_STATE_DATA_INTEGRATION_MAX_STEPS: "25000",
        UI_STATE_DATA_INTEGRATION_TERMINATION_METHOD: Constants.TERMINATION_METHOD_FIRST_RETURN,
        UI_STATE_DATA_INTEGRATION_STEP_SIZE: "0.001",
        UI_STATE_DATA_DOMAIN_MIN_X: "-8",
        UI_STATE_DATA_DOMAIN_MAX_X: "8",
        UI_STATE_DATA_DOMAIN_PIXELS_X: "400",
        UI_STATE_DATA_DOMAIN_MIN_Y: "-8",
        UI_STATE_DATA_DOMAIN_MAX_Y: "8",
        UI_STATE_DATA_DOMAIN_PIXELS_Y: "400",
        UI_STATE_DATA_ANGLE_PIXELS_X: "100",
        UI_STATE_DATA_ANGLE_PIXELS_Y: "100",
        UI_STATE_CAMERA_CONTROLS_ROTATESPEED: "1.0",
        UI_STATE_CAMERA_CONTROLS_PANSPEED: "1.0",
        UI_STATE_CAMERA_CONTROLS_ZOOMSPEED: "1.0",
        UI_STATE_RENDERING_FTLE_TYPE: Constants.FTLE_TYPE_PSFTLE,
        UI_STATE_RENDERING_BODIES_MAX_RADIUS_BODIES: "0.05",
        UI_STATE_RENDERING_BODIES_RADIUS_CENTER_OF_MASS: "0.01",
        UI_STATE_RENDERING_SCALAR_MIN: "0",
        UI_STATE_RENDERING_SCALAR_MAX: "10",
        UI_STATE_RENDERING_OPACITY: "1",
        UI_STATE_RENDERING_CLICKED_POSITION_RADIUS: "0.02",
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
        UI_STATE_ACTIVE_BEHAVIOR: Constants.BEHAVIOR_CONTROL_CAMERA,
        UI_STATE_LINKED_VIEWS_ACTIVE: true,
        UI_STATE_DATA_PHYSICS_USE_CONSTANT_VELOCITY: false,
        UI_STATE_AUX_CONTENT: Constants.AUX_CONTENT_DEFAULT,
        UI_STATE_AUX_GRID_DIRECTION: Constants.AUX_GRID_DIRECTION_THETA_DOWN_PHI_RIGHT,
    });

    const value = {
        uiState,
        setUiState: (newState) => setUiState({ ...uiState, ...newState })
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};