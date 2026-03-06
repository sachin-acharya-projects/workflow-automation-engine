import asyncio
import json
import sys
import time
from collections import defaultdict, deque
from typing import Any, Dict, List, Set

from models import NodeExecutionResult, WorkflowModel, WorkflowRunResult


def validate_dag(workflow: WorkflowModel):
    """
    Validates that the workflow is a proper DAG (Directed Acyclic Graph)
    Raises ValueError if cycles are detected or invalid references.
    """
    # Build adjacency list
    adj_list: Dict[str, List[str]] = defaultdict(list)
    node_ids = {node.id for node in workflow.nodes}

    for edge in workflow.edges:
        if edge.source_node_id not in node_ids:
            raise ValueError(
                f"Edge references unknown source node: {edge.source_node_id}"
            )
        if edge.target_node_id not in node_ids:
            raise ValueError(
                f"Edge references unknown target node: {edge.target_node_id}"
            )

        adj_list[edge.source_node_id].append(edge.target_node_id)

    # Check for cycles using DFS
    visited: Set[str] = set()
    rec_stack: Set[str] = set()  # recursion stack

    def is_cyclic(node_id: str) -> bool:
        visited.add(node_id)
        rec_stack.add(node_id)

        for neighbor in adj_list[node_id]:
            if neighbor not in visited:
                if is_cyclic(neighbor):
                    return True
            elif neighbor in rec_stack:
                return True

        rec_stack.remove(node_id)
        return False

    for node in workflow.nodes:
        if node.id not in visited:
            if is_cyclic(node.id):
                raise ValueError("Workflow contains cycles. Only DAGs are supported.")


async def execute_python_code(
    code: str, inputs: Dict[str, Any], timeout: int = 5
) -> Dict[str, Any]:
    """
    Executes Python code in a sandboxed subprocess.
    """
    # Create a temporary wrapper script to execute the function
    wrapper_code = f"""
import sys
import json
import traceback

def execute(inputs: dict) -> dict:
    pass # Replaced by user code

{code}

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read())
        output_data = execute(input_data)
        if not isinstance(output_data, dict):
            print(json.dumps({{"error": "Function must return a dictionary"}}), file=sys.stderr)
            sys.exit(1)
            
        print(json.dumps(output_data))
        sys.exit(0)
    except Exception as e:
        error_info = traceback.format_exc()
        print(json.dumps({{"error": str(e), "traceback": error_info}}), file=sys.stderr)
        sys.exit(1)
"""

    # We use asyncio.create_subprocess_exec to run python without creating temp files
    process = await asyncio.create_subprocess_exec(
        sys.executable,
        "-c",
        wrapper_code,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        input_json = json.dumps(inputs).encode("utf-8")
        stdout, stderr = await asyncio.wait_for(
            process.communicate(input_json), timeout=timeout
        )

        if process.returncode != 0:
            error_msg = stderr.decode("utf-8").strip()
            try:
                # Try to parse stderr as JSON error object if from our wrapper
                error_obj = json.loads(error_msg)
                return {
                    "_error": error_obj.get("error", "Unknown error"),
                    "_traceback": error_obj.get("traceback"),
                }
            except Exception:
                return {
                    "_error": error_msg
                    or f"Subprocess exited with code {process.returncode}"
                }

        try:
            return json.loads(stdout.decode("utf-8"))
        except json.JSONDecodeError:
            return {"_error": "Node did not return valid JSON output"}

    except asyncio.TimeoutError:
        try:
            process.kill()
        except Exception:
            pass
        return {"_error": f"Execution timed out after {timeout} seconds"}
    except Exception as e:
        return {"_error": f"Internal execution engine error: {str(e)}"}


async def execute_workflow(workflow: WorkflowModel, run_id: str) -> WorkflowRunResult:
    """
    Executes a workflow DAG.
    """
    try:
        validate_dag(workflow)
    except ValueError as e:
        return WorkflowRunResult(
            run_id=run_id,
            workflow_id=workflow.id,
            node_results=[
                NodeExecutionResult(node_id="", status="error", error=str(e))
            ],
        )

    # 1. Build Adjacency and Indegrees
    # node_id -> List[(target_node_id, source_output_name, target_input_name)]
    adj_list: Dict[str, List[tuple]] = defaultdict(list)
    # node_id -> count of incoming edges
    in_degree: Dict[str, int] = defaultdict(int)
    # Target node inputs tracking: target_node_id -> { input_name: set(source_node_ids) }
    # To track when ALL inputs are ready
    required_inputs: Dict[str, Set[str]] = defaultdict(set)

    nodes_by_id = {node.id: node for node in workflow.nodes}

    for edge in workflow.edges:
        adj_list[edge.source_node_id].append(
            (edge.target_node_id, edge.source_output, edge.target_input)
        )
        in_degree[edge.target_node_id] += 1
        required_inputs[edge.target_node_id].add(edge.target_input)

    # State tracking
    node_outputs: Dict[str, Dict[str, Any]] = defaultdict(
        dict
    )  # node_id -> { output_name: value }
    results: List[NodeExecutionResult] = []

    # 2. Find starting nodes (indegree == 0)
    queue = deque([node.id for node in workflow.nodes if in_degree[node.id] == 0])

    # Keep track of nodes that have been completely skipped due to missing branches
    skipped_nodes: Set[str] = set()

    # 3. Process topologically
    while queue:
        current_node_id = queue.popleft()
        current_node = nodes_by_id[current_node_id]

        node_start = time.time()

        # Check if this node was skipped (e.g. earlier branch didn't emit)
        if current_node_id in skipped_nodes:
            results.append(
                NodeExecutionResult(
                    node_id=current_node_id, status="skipped", duration=0
                )
            )

            # Propagate skip to children
            for target_id, _, _ in adj_list[current_node_id]:
                in_degree[target_id] -= 1
                skipped_nodes.add(target_id)
                if in_degree[target_id] == 0:
                    queue.append(target_id)
            continue

        # Gather inputs from upstream
        # node_inputs = { input_name: value }
        node_inputs_data = {}
        for edge in workflow.edges:
            if edge.target_node_id == current_node_id:
                source_out = node_outputs.get(edge.source_node_id, {})

                # If the upstream node returned None for this output (or missing entirely),
                # this means the conditional branch is NOT taken. We must skip this node.
                if (
                    edge.source_output not in source_out
                    or source_out[edge.source_output] is None
                ):
                    skipped_nodes.add(current_node_id)
                    break

                node_inputs_data[edge.target_input] = source_out[edge.source_output]

        if current_node_id in skipped_nodes:
            results.append(
                NodeExecutionResult(
                    node_id=current_node_id, status="skipped", duration=0
                )
            )

            # Propagate skip
            for target_id, _, _ in adj_list[current_node_id]:
                in_degree[target_id] -= 1
                skipped_nodes.add(target_id)
                if in_degree[target_id] == 0:
                    queue.append(target_id)
            continue

        # Execute Node logic
        node_status = "error"
        error_msg = None
        outputs = {}

        if current_node.type == "trigger":
            # Triggers just emit their configured payload to their 'data' output or similar
            node_status = "success"
            payload = (
                current_node.config.get("payload", {}) if current_node.config else {}
            )
            # Map the payload to the first declared output, if any
            if current_node.outputs:
                outputs = {current_node.outputs[0]: payload}
            else:
                outputs = {"data": payload}
            node_outputs[current_node_id] = outputs

        elif current_node.type == "code":
            if not current_node.code:
                error_msg = "Node has no code defined"
            else:
                timeout = (
                    current_node.config.get("timeout", 5) if current_node.config else 5
                )
                exec_result = await execute_python_code(
                    current_node.code, node_inputs_data, timeout
                )

                if "_error" in exec_result:
                    error_msg = exec_result["_error"]
                    if "_traceback" in exec_result:
                        error_msg += f"\n\nTraceback: {exec_result['_traceback']}"
                else:
                    node_status = "success"
                    # Only keep outputs that the node declared
                    outputs = {
                        k: v
                        for k, v in exec_result.items()
                        if k in current_node.outputs
                    }
                    node_outputs[current_node_id] = outputs
        else:
            error_msg = f"Unknown node type: {current_node.type}"

        node_duration = time.time() - node_start

        results.append(
            NodeExecutionResult(
                node_id=current_node_id,
                status=node_status,
                outputs=outputs,
                error=error_msg,
                duration=node_duration,
            )
        )

        # If error, maybe we stop execution? or just skip downstream?
        # Let's skip downstream on error for now.
        if node_status == "error":
            for target_id, _, _ in adj_list[current_node_id]:
                skipped_nodes.add(target_id)
                in_degree[target_id] -= 1
                if in_degree[target_id] == 0:
                    queue.append(target_id)
        else:
            # Enqueue ready children
            for target_id, _, _ in adj_list[current_node_id]:
                in_degree[target_id] -= 1
                if in_degree[target_id] == 0:
                    queue.append(target_id)

    # Handle any remaining nodes that weren't reached (detached or unreachable)
    visited_nodes = {r.node_id for r in results}
    for node in workflow.nodes:
        if node.id not in visited_nodes:
            results.append(
                NodeExecutionResult(
                    node_id=node.id,
                    status="skipped",
                    duration=0,
                    error="Unreachable Node",
                )
            )

    return WorkflowRunResult(
        run_id=run_id, workflow_id=workflow.id, node_results=results
    )
