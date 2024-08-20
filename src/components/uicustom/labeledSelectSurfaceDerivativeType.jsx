import React from 'react';
import LabeledSelect from './labeledSelect';
import * as Constants from "@/components/utility/constants";

const options = [
    { value: Constants.SURFACE_DERIVATIVE_MAT3X3, label: '3x3 inverse (faster)' },
    { value: Constants.SURFACE_DERIVATIVE_MAT4X4, label: '4x4 inverse (slower)' },
];

const labeledSelectSurfaceDerivativeType = () => (
    <LabeledSelect 
        name="selectSurfaceDerivative"
        labelText="surface derivative type"
        setUiStateKey="UI_STATE_DATA_SURFACE_DERIVATIVE_METHOD"
        emit="false"
        options={options}
    />
);

export default labeledSelectSurfaceDerivativeType;