import {
    Background,
    BackgroundVariant,
    Controls,
    MarkerType,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCallback, useRef } from "react"

import type { NodeType } from "@/types/workflow"
import { useStore, type FlowEdge, type FlowNode } from "../store/useStore"
import { CodeNode, TriggerNode } from "./nodes/CustomNodes"

const nodeTypes = {
    triggerNode: TriggerNode,
    codeNode: CodeNode,
}

function FlowCanvasInternal() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const { screenToFlowPosition } = useReactFlow()

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        setSelectedNode,
    } = useStore()

    const onSelectionChange = useCallback(
        (params: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
            if (params.nodes.length > 0) {
                setSelectedNode(params.nodes[0].id)
            } else {
                setSelectedNode(null)
            }
        },
        [setSelectedNode],
    )

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
    }, [])

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault()

            const type = event.dataTransfer.getData("application/reactflow")
            if (typeof type === "undefined" || !type) {
                return
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            })

            addNode(type as NodeType, position)
        },
        [screenToFlowPosition, addNode],
    )

    return (
        <div className="w-full h-full relative" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                onPaneClick={() => setSelectedNode(null)}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                panActivationKeyCode={null}
                defaultEdgeOptions={{
                    style: { stroke: "hsl(var(--foreground))", strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: "hsl(var(--foreground))",
                    },
                }}
                fitView
            >
                <Controls />
                <MiniMap zoomable pannable />
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={12}
                    size={1}
                />
            </ReactFlow>

            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-background p-2 rounded-md shadow border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Add Nodes
                </h3>
                <div
                    className="p-2 border rounded cursor-grab bg-accent/20 text-accent-foreground text-sm flex items-center gap-2"
                    onDragStart={(e) => {
                        e.dataTransfer.setData(
                            "application/reactflow",
                            "trigger",
                        )
                        e.dataTransfer.effectAllowed = "move"
                    }}
                    draggable
                >
                    ⚡ Trigger
                </div>
                <div
                    className="p-2 border rounded cursor-grab bg-card text-foreground text-sm flex items-center gap-2"
                    onDragStart={(e) => {
                        e.dataTransfer.setData("application/reactflow", "code")
                        e.dataTransfer.effectAllowed = "move"
                    }}
                    draggable
                >
                    {`</>`} Code/Router
                </div>
            </div>
        </div>
    )
}

export function FlowCanvas() {
    return (
        <ReactFlowProvider>
            <FlowCanvasInternal />
        </ReactFlowProvider>
    )
}
