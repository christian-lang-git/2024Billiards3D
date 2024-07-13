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
import LabeledSelect from "@/components/uicustom/labeledSelect";
import LabeledSelectUseConstantVelocity from "@/components/uicustom/labeledSelectUseConstantVelocity";
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Label } from '@radix-ui/react-label';

class TabData extends Component {

    static contextType = AppContext;

    handleClickDataUpdate() {
        console.warn("handleClickDataUpdate")
        Emitter.emit(Constants.EVENT_DATA_UPDATE, {});
        Emitter.emit(Constants.EVENT_WRITE_FROM_UI_TO_URL, {});        
    }

    handleClickDataUpdateStreamline() {
        console.warn("handleClickDataUpdateStreamline")
        Emitter.emit(Constants.EVENT_DATA_UPDATE_STREAMLINE, {});
        Emitter.emit(Constants.EVENT_WRITE_FROM_UI_TO_URL, {});    
    }

    shouldRenderSeedMagnitude = () => {
        const { uiState } = this.context;
        return uiState.UI_STATE_DATA_PHYSICS_USE_CONSTANT_VELOCITY === true;
    };

    shouldRenderSeedHamiltonian = () => {
        const { uiState } = this.context;
        return uiState.UI_STATE_DATA_PHYSICS_USE_CONSTANT_VELOCITY === false;
    };

    render() {
        return (
            <div className="flex flex-col h-full">
                <div className="p-2 bg-secondary grid grid-cols-2">
                    <Button className="w-full" onClick={this.handleClickDataUpdate}>update all</Button>
                    <Button className="w-full" onClick={this.handleClickDataUpdateStreamline}>update streamline</Button>
                </div>
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="pl-2 pr-4 pb-2">
                        <Accordion type="multiple" className="w-full" collapsible="true"
                            defaultValue={["physics", "integration", "domain", "streamline", "ftle", "geometry"]}
                        >
                            <AccordionItem value="physics">
                                <AccordionTrigger>Physics</AccordionTrigger>
                                <AccordionContent>
                                    <LabeledField
                                        name="UI_STATE_DATA_FORMULA_SURFACE_IMPLICIT"
                                        labelText={"implicit surface"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_MU"
                                        labelText={"mass of secondary: mu"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_ANGULAR_VELOCITY"
                                        labelText={"angular velocity: n"}
                                    />                                    
                                    <div className="grid grid-cols-2">
                                    <LabeledSelectUseConstantVelocity/>
                                    {this.shouldRenderSeedMagnitude() && (
                                        <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_ENERGY"
                                        labelText={"magnitude"}
                                        />
                                    )}
                                    {this.shouldRenderSeedHamiltonian() && (
                                        <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_ENERGY"
                                        labelText={"hamiltonian"}
                                        />
                                    )}
                                    </div>    
                                    <Label className="font-medium">constant seed direction (left view)</Label>
                                    <div className="grid grid-cols-3">
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_DIRECTION_X"
                                        labelText={"x"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Y"
                                        labelText={"y"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_DIRECTION_Z"
                                        labelText={"z"}
                                    />
                                    </div>       
                                    <Label className="font-medium">constant seed position (right view)</Label>
                                    <div className="grid grid-cols-3">
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_POSITION_X"
                                        labelText={"x"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_POSITION_Y"
                                        labelText={"y"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_PHYSICS_SEED_POSITION_Z"
                                        labelText={"z"}
                                    />
                                    </div>                                 
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="integration">
                                <AccordionTrigger>Integration</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2">
                                    <LabeledField
                                        name="UI_STATE_DATA_INTEGRATION_STEP_SIZE"
                                        labelText={"step size"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_INTEGRATION_MAX_STEPS"
                                        labelText={"max steps"}
                                    />
                                    </div>    
                                    <LabeledField
                                        name="UI_STATE_DATA_NUMBER_OF_INTERSECTIONS"
                                        labelText={"number of intersections"}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="domain">
                                <AccordionTrigger>Domain</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-3">
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_MIN_X"
                                        labelText={"min x"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_MAX_X"
                                        labelText={"max x"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_PIXELS_X"
                                        labelText={"grid nodes x"}
                                    />
                                    </div>
                                    <div className="grid grid-cols-3">
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_MIN_Y"
                                        labelText={"min y"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_MAX_Y"
                                        labelText={"max y"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_PIXELS_Y"
                                        labelText={"grid nodes y"}
                                    />
                                    </div>
                                    <div className="grid grid-cols-3">
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_MIN_Z"
                                        labelText={"min z"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_MAX_Z"
                                        labelText={"max z"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_DOMAIN_PIXELS_Z"
                                        labelText={"grid nodes z"}
                                    />
                                    </div>
                                    <div className="grid grid-cols-2">
                                    <LabeledField
                                        name="UI_STATE_DATA_ANGLE_PIXELS_X"
                                        labelText={"grid nodes theta"}
                                    />
                                    <LabeledField
                                        name="UI_STATE_DATA_ANGLE_PIXELS_Y"
                                        labelText={"grid nodes phi"}
                                    />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>                            
                        </Accordion>
                    </div>
                </ScrollArea>
            </div>
        )
    }

}

export default TabData
