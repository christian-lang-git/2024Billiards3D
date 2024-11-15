import React, { Component } from "react";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppContext } from "@/components/uicustom/AppContext"

class LabeledField extends Component {

    static contextType = AppContext;
    handleChange = (e) => {
        const { setUiState } = this.context;
        setUiState({ [e.target.name]: e.target.value });
    };

    render() {

        const { name, labelText } = this.props;
        const { uiState } = this.context;
        const value = uiState[name];


        return (
            <div className="w-full p-2">
                <Label className="w-50">{labelText}
                    <Input
                        name={name}
                        value={value}
                        onChange={this.handleChange} />
                </Label>
            </div>
        )
    }

}

export default LabeledField
