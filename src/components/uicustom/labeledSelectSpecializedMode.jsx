import React from 'react';
import LabeledSelect from './labeledSelect';
import * as Constants from "@/components/utility/constants";

const options = [ 
    { value: Constants.TEXTURE_MODE_SPECIALIZED_SINGLE_COLOR, label: 'single color' },    
    { value: Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE, label: 'FTLE' },
];

const LabeledSelectSpecializedMode = () => (
    <LabeledSelect 
        name="selectSpecializedMode"
        labelText="specialized mode"
        setUiStateKey="UI_STATE_RENDERING_SPECIALIZED_MODE"
        emit="false"
        options={options}
    />
);

export default LabeledSelectSpecializedMode;