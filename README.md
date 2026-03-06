# Workflow Execution Engine

A small prototype workflow engine that allows users to define workflows composed of nodes, execute them, and inspect per-node results.

The system supports:

- Directed Acyclic Graph (DAG) workflows
- Node dependency resolution
- Conditional branching
- Python code execution inside nodes

The project consists of:

- **React frontend** for workflow creation and visualization
- **FastAPI backend** for workflow execution and orchestration

# Project Structure

```
project-root
│
├── backend/        # FastAPI application
│   ├── test.py
│   ├── engine.py
│   ├── models.py
│   └── main.py
│
├── frontend/       # React application
│   ├── src/
│   └── package.json
│
├── docs/           # Design and architecture decision documents
│
└── README.md
```

The `docs/` directory contains design documents written before implementation, describing architectural decisions and tradeoffs.

# Setup & Run Instructions

## Clone the Repository

```bash
git clone https://github.com/sachin-acharya-projects/workflow-automation-engine.git
cd workflow-engine
```

---

# Option 1 — Using Make (Recommended)

A Makefile is provided to simplify common tasks.

### Install dependencies

```bash
make install
```

### Run backend

```bash
make backend
```

### Run frontend

```bash
make frontend
```

### Run both services

```bash
make dev
```

---

# Option 2 — Manual Setup

## Backend Setup (FastAPI)

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend server:

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```
http://localhost:8000
```

---

## Frontend Setup (React)

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

# Architecture Overview

The system follows a **client–server architecture**.

### Frontend (React)

Responsible for:

- Workflow creation
- Node configuration
- Displaying execution results
- Managing application state

State management is handled using **Zustand**.

### Backend (FastAPI)

Responsible for:

- Workflow validation
- DAG execution
- Node dependency resolution
- Python code execution

Workflows are represented internally as a **Directed Acyclic Graph (DAG)** and executed using **topological ordering**.

### Execution Flow

```
User creates workflow (React UI)
          │
          ▼
Workflow sent to FastAPI
          │
          ▼
Backend validates DAG
          │
          ▼
Topological execution engine
          │
          ▼
Each node executed in subprocess
          │
          ▼
Results returned to frontend
```

**Flow:**

```
[Workflow Definition] --> [Validation] --> [Execution Engine]
        |                                  |
        v                                  v
     Frontend                            Node Outputs
```

# Key Design Decisions

More detailed explanations are available in the **`docs/` folder**.

## 1. Python Code Execution (Sandboxing)

Nodes containing Python code are executed using **subprocesses**.

Approach:

- A child Python process is spawned
- Node code is executed inside the isolated process
- Inputs are passed as serialized data
- Outputs are returned to the parent process

### Why subprocess?

Advantages:

- Basic isolation from the main API process
- Easy to implement
- Prevents crashes from breaking the server
- Allows execution timeout control

Tradeoffs:

- Not a fully secure sandbox
- Process startup overhead
- Docker-based sandboxing would be safer for production

## 2. State Management (Frontend)

The frontend uses **Zustand**.

Reasons:

- Minimal boilerplate
- Simple global state management
- Lightweight compared to Redux
- Easier mental model than React Context for shared state

Tradeoffs:

- Less structured than Redux for very large apps

## 3. Persistence Layer

For this prototype, workflows and execution results are stored **in-memory using Python dictionaries**.

Example:

```python
workflows_db: Dict[str, WorkflowModel] = {}
runs_db: Dict[str, WorkflowRunResult] = {}
```

Reasons:

- Simplifies the prototype
- No database setup required
- Faster development iteration

Tradeoffs:

- Data is lost when the server restarts
- Not suitable for production systems

In a production system this would be replaced by **SQLite + SQLAlchemy or PostgreSQL**.

# Features Implemented

The application supports the required capabilities:

### Workflow Creation

Users can create workflows containing **3 or more nodes**.

### DAG Execution

Nodes are executed in **dependency order** using topological sorting.

### Node Execution

Nodes can execute custom **Python code**.

### Conditional Branching

Workflows support **branching based on node outputs**.

### Execution Results

Users can inspect:

- Node status
- Node outputs
- Execution order

# Example Workflow

Example workflow:

1. Trigger node
2. Python code node (process input)
3. Conditional node
4. Final node

Execution results are returned per node.

**Example JSON Workflow**

```json
{
    "id": "workflow1",
    "name": "Sample Workflow",
    "nodes": [
        {
            "id": "trigger1",
            "type": "trigger",
            "name": "Start",
            "outputs": ["data"],
            "config": { "payload": 5 }
        },
        {
            "id": "code1",
            "type": "code",
            "name": "Multiply by 2",
            "inputs": ["data"],
            "outputs": ["result"],
            "code": "def execute(inputs): return {'result': inputs['data'] * 2}"
        },
        {
            "id": "code2",
            "type": "code",
            "name": "Add 10",
            "inputs": ["result"],
            "outputs": ["final"],
            "code": "def execute(inputs): return {'final': inputs['result'] + 10}"
        }
    ],
    "edges": [
        {
            "source_node_id": "trigger1",
            "source_output": "data",
            "target_node_id": "code1",
            "target_input": "data"
        },
        {
            "source_node_id": "code1",
            "source_output": "result",
            "target_node_id": "code2",
            "target_input": "result"
        }
    ]
}
```

**Execution result**

```json
[
    { "node_id": "trigger1", "status": "success", "outputs": { "data": 5 } },
    { "node_id": "code1", "status": "success", "outputs": { "result": 10 } },
    { "node_id": "code2", "status": "success", "outputs": { "final": 20 } }
]
```

# What I'd Do With More Time

Several improvements could make the system production-ready:

### Security

- Execute nodes inside **Docker containers**
- Use **resource limits and network isolation**
- Add **authentication + multi-user support**
- Add **retry and logging mechanism per node**

### Persistence

- Replace in-memory store with **SQLite/PostgreSQL**
- Add workflow versioning

### Observability

- Add structured logging
- Execution tracing
- Node retry policies

### Scalability

- Queue-based execution system
- Worker processes (Celery / Redis)

# Documentation

Additional design documentation can be found in:

```
docs/
```

These documents include:

- Architecture decisions
- Execution model exploration
- Tradeoff analysis performed before implementation
