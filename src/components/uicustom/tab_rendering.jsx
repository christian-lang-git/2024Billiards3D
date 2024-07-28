import React, { Component } from 'react';
import { AppContext } from "@/components/uicustom/AppContext"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Emitter from "@/components/utility/emitter";
import * as Constants from "@/components/utility/constants";
import LabeledField from "@/components/uicustom/labeledfield";
import LabeledCheckbox from "@/components/uicustom/labeledcheckbox";
import { Input } from "@/components/ui/input"
import LabeledSelectTextureMode from './labeledSelectTextureMode';
import LabeledSelectSpecializedMode from './labeledSelectSpecializedMode';
import LabeledSelectRawMode from './labeledSelectRawMode';
import LabeledSelectRenderingDirection from './labeledSelectRenderingDirection';
import LabeledSelectFtleType from './labeledSelectFtleType';
import { Label } from '@radix-ui/react-label';


class TabRendering extends Component {

    static contextType = AppContext;

    handleClickRenderingUpdate() {
        console.log("handleClickRenderingUpdate")
        Emitter.emit(Constants.EVENT_RENDERING_UPDATE, {});
        Emitter.emit(Constants.EVENT_WRITE_FROM_UI_TO_URL, {});    
    }

    shouldRenderSpecializedMode = () => {
        const { uiState } = this.context;
        return uiState.UI_STATE_RENDERING_TEXTURE_MODE === Constants.TEXTURE_MODE_SPECIALIZED;
    };

    shouldRenderFtleType = () => {
        const { uiState } = this.context;
        return uiState.UI_STATE_RENDERING_TEXTURE_MODE === Constants.TEXTURE_MODE_SPECIALIZED
        &&
        (
            uiState.UI_STATE_RENDERING_SPECIALIZED_MODE === Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE     
            || uiState.UI_STATE_RENDERING_SPECIALIZED_MODE === Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE_BOTH               
        );
    };

    shouldRenderDirection = () => {
        const { uiState } = this.context;
        return ! //NEGATED
        (
            uiState.UI_STATE_RENDERING_TEXTURE_MODE === Constants.TEXTURE_MODE_SPECIALIZED 
            && uiState.UI_STATE_RENDERING_SPECIALIZED_MODE === Constants.TEXTURE_MODE_SPECIALIZED_RETURN_FTLE_BOTH
        );
    };


    shouldRenderRawMode = () => {
        const { uiState } = this.context;
        return uiState.UI_STATE_RENDERING_TEXTURE_MODE === Constants.TEXTURE_MODE_RAW_TEXTURE
            || uiState.UI_STATE_RENDERING_TEXTURE_MODE === Constants.TEXTURE_MODE_RAW_VIRTUAL;
    };

    shouldRenderRawModeVirtual = () => {
        const { uiState } = this.context;
        return uiState.UI_STATE_RENDERING_TEXTURE_MODE === Constants.TEXTURE_MODE_RAW_VIRTUAL;
    };

    render() {
        return (
            <div className="flex flex-col h-full">
                <div className="p-2 bg-secondary">
                    <Button className="w-full" onClick={this.handleClickRenderingUpdate}>update</Button>
                </div>
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="pl-2 pr-4 pb-2">
                        <Accordion type="multiple" className="w-full" collapsible="true"
                            defaultValue={["plane", "spheres"]}
                        >
                            <AccordionItem value="plane">
                                <AccordionTrigger>Plane</AccordionTrigger>
                                <AccordionContent>
                                    <LabeledSelectTextureMode />
                                    {this.shouldRenderSpecializedMode() && (
                                        <LabeledSelectSpecializedMode />
                                    )}
                                    {this.shouldRenderRawMode() && (
                                        <div className="grid grid-cols-2">
                                            <LabeledSelectRawMode />
                                            <LabeledField
                                                name="UI_STATE_RENDERING_RAW_MODE_LAYER"
                                                labelText={"layer"}
                                            />
                                        </div>
                                    )}
                                    {this.shouldRenderFtleType() && (
                                        <LabeledSelectFtleType />
                                    )}
                                    {this.shouldRenderDirection() && (
                                        <LabeledSelectRenderingDirection />
                                    )}
                                    {this.shouldRenderRawModeVirtual() && (
                                        <div className="grid grid-cols-2">
                                            <LabeledField
                                                name="UI_STATE_RENDERING_RAW_MODE_X_TEXTURE_INDEX"
                                                labelText={"x texture index"}
                                            />
                                            <LabeledField
                                                name="UI_STATE_RENDERING_RAW_MODE_Y_TEXTURE_INDEX"
                                                labelText={"y texture index"}
                                            />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2">
                                        <LabeledField
                                            name="UI_STATE_RENDERING_SCALAR_MIN"
                                            labelText={"min scalar"}
                                        />
                                        <LabeledField
                                            name="UI_STATE_RENDERING_SCALAR_MAX"
                                            labelText={"max scalar"}
                                        />
                                    </div>
                                    <LabeledField
                                        name="UI_STATE_RENDERING_OPACITY"
                                        labelText={"opacity"}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="spheres">
                                <AccordionTrigger>Spheres</AccordionTrigger>
                                <AccordionContent>
                                    <LabeledField
                                        name="UI_STATE_RENDERING_RADIUS_ORIGIN"
                                        labelText={"radius origin"}
                                    />
                                    <Label className="font-medium">radius clicked position</Label>
                                    <div className="grid grid-cols-3">
                                    <LabeledField
                                        name="UI_STATE_RENDERING_CLICKED_POSITION_RADIUS"
                                        labelText={"main"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX"
                                        labelText={"aux (plane)"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_RENDERING_CLICKED_POSITION_RADIUS_AUX_SPHERE"
                                        labelText={"aux (sphere)"}
                                    />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="spheres">
                                <AccordionTrigger>Tubes</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2">
                                        <LabeledField
                                            name="UI_STATE_RENDERING_TUBE_SEGMENT_LENGTH"
                                            labelText={"segment length"}
                                        />
                                        <LabeledField
                                            name="UI_STATE_RENDERING_TUBE_MAX_SEGMENTS"
                                            labelText={"max segments"}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2">
                                        <LabeledField
                                            name="UI_STATE_RENDERING_TUBE_RADIUS"
                                            labelText={"tube radius"}
                                        />
                                        <LabeledField
                                            name="UI_STATE_RENDERING_TUBE_NUM_SIDES"
                                            labelText={"number of sides"}
                                        />
                                    </div>
                                    <LabeledField
                                            name="UI_STATE_RENDERING_TUBE_COLOR"
                                            labelText={"color"}
                                    />
                                    <div className="grid grid-cols-2">
                                        <LabeledField
                                                name="UI_STATE_RENDERING_TUBE_ROUGHNESS"
                                                labelText={"roughness"}
                                        />
                                        <LabeledField
                                                name="UI_STATE_RENDERING_TUBE_EMISSIVE_INTENSITY"
                                                labelText={"emissive intensity"}
                                        />
                                    </div>
                                    <LabeledCheckbox
                                        name="UI_STATE_RENDERING_TUBE_ONLY_SHOW_SUCCESSFUL_RETURNS"
                                        labelText={"only show successful returns"}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>
            </div>
        )
    }

}

export default TabRendering
