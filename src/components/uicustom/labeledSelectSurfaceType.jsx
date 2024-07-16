import React from 'react';
import LabeledSelect from './labeledSelect';
import * as Constants from "@/components/utility/constants";

const options = [
    { value: Constants.SURFACE_TYPE_CUSTOM, label: 'custom' },
    { value: Constants.SURFACE_TYPE_ELLIPSOID, label: 'ellipsoid' },
    { value: Constants.SURFACE_TYPE_TORUS, label: 'torus' },
];

const LabeledSelectSurfaceType = () => (
    <LabeledSelect 
        name="selectSurfaceType"
        labelText="surface type"
        setUiStateKey="UI_STATE_DATA_SURFACE_TYPE"
        emit="false"
        options={options}
    />
);

export default LabeledSelectSurfaceType;