import "./App.css"
import * as Constants from "./components/utility/constants";
import ThreeContainerMain from "./components/threejs/threeContainerMain";
import ThreeContainerAux from "./components/threejs/threeContainerAux";
import Emitter from "./components/utility/emitter";
import LeftPanel from "./components/uicustom/leftpanel";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { useState } from 'react'
import { AppProvider } from '@/components/uicustom/AppContext'
import BehaviorBar from "./components/uicustom/behaviorbar";
import ActionBar from "./components/uicustom/actionbar";

function App() {

    function handleResizePanel() {
        console.log("handleResizePanel")
        Emitter.emit(Constants.EVENT_RESIZE_PANEL, {});
    }

    return (
        <AppProvider>
            <div className="absolute inset-2 flex flex-col">
                <ResizablePanelGroup direction="horizontal" className="max-w-md inset-0 min-w-full rounded-lg border">
                    <ResizablePanel defaultSize={25}>
                        <LeftPanel />
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel onResize={handleResizePanel} defaultSize={50}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel onResize={handleResizePanel} defaultSize={85}>
                                <ThreeContainerMain />
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={15}>
                                <div className="flex items-center justify-center p-2">
                                    <BehaviorBar />
                                </div>
                                <div className="flex items-center justify-center p-2">
                                    <ActionBar />
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={25}>
                    <ResizablePanelGroup direction="vertical">
                            <ResizablePanel onResize={handleResizePanel} defaultSize={50}>
                                <ThreeContainerAux />
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={50}>
                                
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </AppProvider>
    )
}

export default App
