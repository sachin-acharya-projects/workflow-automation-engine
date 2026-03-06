import type {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    OnConnect,
    OnEdgesChange,
    OnNodesChange,
} from "@xyflow/react"
import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    MarkerType,
} from "@xyflow/react"
import { v4 as uuidv4 } from "uuid"
import { create } from "zustand"
import type {
    EdgeModel,
    NodeExecutionResult,
    NodeModel,
    WorkflowModel,
} from "../types/workflow"

export type FlowNode = Node<NodeModel>
export type FlowEdge = Edge<{ source_output: string; target_input: string }>

interface WorkflowState {
    nodes: FlowNode[]
    edges: FlowEdge[]
    selectedNodeId: string | null
    workflowId: string
    workflowName: string
    runResults: Record<string, NodeExecutionResult>
    isRunning: boolean

    // Actions
    onNodesChange: OnNodesChange<FlowNode>
    onEdgesChange: OnEdgesChange<FlowEdge>
    onConnect: OnConnect
    addNode: (
        type: NodeModel["type"],
        position: { x: number; y: number },
    ) => void
    updateNodeData: (nodeId: string, data: Partial<NodeModel>) => void
    setSelectedNode: (nodeId: string | null) => void
    deleteNode: (nodeId: string) => void
    setRunResults: (results: NodeExecutionResult[]) => void
    setIsRunning: (isRunning: boolean) => void
    getExportData: () => WorkflowModel
}

const initialNodes: FlowNode[] = [
    {
        id: "trigger-1",
        type: "triggerNode",
        position: { x: 250, y: 100 },
        data: {
            id: "trigger-1",
            type: "trigger",
            name: "Webhook Trigger",
            inputs: [],
            outputs: ["data"],
            config: { payload: { score: 75 } },
        },
    },
]

export const useStore = create<WorkflowState>((set, get) => ({
    nodes: initialNodes,
    edges: [],
    selectedNodeId: null,
    workflowId: uuidv4(),
    workflowName: "FlowForge — A Mini Workflow Automation Engine",
    runResults: {},
    isRunning: false,

    onNodesChange: (changes: NodeChange<FlowNode>[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        })
    },

    onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        })
    },

    onConnect: (connection: Connection) => {
        // Determine input/output names from the handle IDs
        const sourceOutput = connection.sourceHandle?.replace("out-", "") || ""
        const targetInput = connection.targetHandle?.replace("in-", "") || ""

        const newEdge: FlowEdge = {
            ...connection,
            id: `e-${connection.source}-${connection.target}-${sourceOutput}-${targetInput}`,
            type: "default",
            animated: get().isRunning,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "hsl(var(--foreground))",
            },
            style: {
                stroke: "hsl(var(--foreground))",
                strokeWidth: 2,
            },
            data: {
                source_output: sourceOutput,
                target_input: targetInput,
            },
        } as FlowEdge

        set({
            edges: addEdge(newEdge, get().edges),
        })
    },

    addNode: (type, position) => {
        const id = uuidv4()
        const isTrigger = type === "trigger"

        const newNode: FlowNode = {
            id,
            type: isTrigger ? "triggerNode" : "codeNode",
            position,
            data: {
                id,
                type,
                name: isTrigger ? "New Trigger" : "Code Node",
                inputs: isTrigger ? [] : ["input_1"],
                outputs: isTrigger ? ["data"] : ["output_1"],
                code: isTrigger
                    ? undefined
                    : 'def execute(inputs):\n    return {"output_1": inputs.get("input_1")}',
                config: isTrigger ? { payload: {} } : {},
            },
        }

        set({ nodes: [...get().nodes, newNode] })
    },

    updateNodeData: (nodeId, newData) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: { ...node.data, ...newData },
                    }
                }
                return node
            }),
        })
    },

    setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId })
    },

    deleteNode: (nodeId) => {
        set({
            nodes: get().nodes.filter((node) => node.id !== nodeId),
            edges: get().edges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId,
            ),
            selectedNodeId:
                get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        })
    },

    setRunResults: (results) => {
        const resultsMap: Record<string, NodeExecutionResult> = {}
        results.forEach((res) => {
            resultsMap[res.node_id] = res
        })
        set({ runResults: resultsMap })
    },

    setIsRunning: (isRunning) => {
        set({
            isRunning,
            // Update edge animations
            edges: get().edges.map((edge) => ({
                ...edge,
                animated: isRunning,
            })),
        })
    },

    getExportData: () => {
        const { workflowId, workflowName, nodes, edges } = get()

        const exportNodes: NodeModel[] = nodes.map((node) => node.data)

        const exportEdges: EdgeModel[] = edges.map((edge) => ({
            source_node_id: edge.source,
            source_output: edge.data?.source_output || "",
            target_node_id: edge.target,
            target_input: edge.data?.target_input || "",
        }))

        return {
            id: workflowId,
            name: workflowName,
            nodes: exportNodes,
            edges: exportEdges,
        }
    },
}))
