import React from 'react';
import LabeledSelect from './labeledSelect';
import * as Constants from "@/components/utility/constants";

const options = [
    { value: true, label: 'local direction' },
    { value: false, label: 'global direction' }
];

const LabeledSelectLocalDirection = () => (
    <LabeledSelect 
        name="selectLocalDirection"
        labelText="seed direction"
        setUiStateKey="UI_STATE_DATA_LOCAL_DIRECTION"
        emit="false"
        options={options}
    />
);

export default LabeledSelectLocalDirection;