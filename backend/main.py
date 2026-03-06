import uuid
from typing import Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from engine import execute_workflow, validate_dag
from models import WorkflowModel, WorkflowRunResult

app = FastAPI(title="FlowForge — A Mini Workflow Automation Engine")

# Setup CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for workflows and runs (as a simple prototype)
workflows_db: Dict[str, WorkflowModel] = {}
runs_db: Dict[str, WorkflowRunResult] = {}


@app.post("/api/workflows", response_model=WorkflowModel, tags=["Workflows"])
async def create_workflow(workflow: WorkflowModel):
    try:
        validate_dag(workflow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    workflows_db[workflow.id] = workflow
    return workflow


@app.get(
    "/api/workflows/{workflow_id}", response_model=WorkflowModel, tags=["Workflows"]
)
async def get_workflow(workflow_id: str):
    workflow = workflows_db.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@app.post(
    "/api/workflows/{workflow_id}/run",
    response_model=WorkflowRunResult,
    tags=["Workflows"],
)
async def run_workflow(workflow_id: str):
    workflow = workflows_db.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    run_id = str(uuid.uuid4())
    run_result = await execute_workflow(workflow, run_id)
    runs_db[run_id] = run_result

    return run_result


@app.get(
    "/api/workflows/{workflow_id}/runs/{run_id}",
    response_model=WorkflowRunResult,
    tags=["Workflows"],
)
async def get_run_result(workflow_id: str, run_id: str):
    run_result = runs_db.get(run_id)
    if not run_result or run_result.workflow_id != workflow_id:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
