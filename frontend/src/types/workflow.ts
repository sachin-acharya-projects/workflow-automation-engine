export type NodeType = "trigger" | "code"

export type NodeConfig = {
    payload?: unknown
    timeout?: number
}

export type NodeModel = {
    id: string
    type: NodeType
    name: string
    inputs: string[]
    outputs: string[]
    code?: string
    config?: NodeConfig
    [key: string]: unknown
}

export type EdgeModel = {
    source_node_id: string
    source_output: string
    target_node_id: string
    target_input: string
}

export type WorkflowModel = {
    id: string
    name: string
    nodes: NodeModel[]
    edges: EdgeModel[]
}

export type NodeStatus = "success" | "error" | "skipped" | "idle" | "running"

export type NodeExecutionResult = {
    node_id: string
    status: NodeStatus
    outputs: Record<string, unknown>
    error?: string
    duration: number
}

export type WorkflowRunResult = {
    run_id: string
    workflow_id: string
    node_results: NodeExecutionResult[]
}
