from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class NodeModel(BaseModel):
    id: str
    type: str  # "trigger", "code"
    name: str = "Node"
    inputs: List[str] = Field(default_factory=list)
    outputs: List[str] = Field(default_factory=list)
    code: Optional[str] = None
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)


class EdgeModel(BaseModel):
    source_node_id: str
    source_output: str
    target_node_id: str
    target_input: str


class WorkflowModel(BaseModel):
    id: str
    name: str = "Untitled Workflow"
    nodes: List[NodeModel] = Field(default_factory=list)
    edges: List[EdgeModel] = Field(default_factory=list)


class NodeExecutionResult(BaseModel):
    node_id: str
    status: str  # "success", "error", "skipped"
    outputs: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    duration: float = 0.0


class WorkflowRunResult(BaseModel):
    run_id: str
    workflow_id: str
    node_results: List[NodeExecutionResult] = Field(default_factory=list)
