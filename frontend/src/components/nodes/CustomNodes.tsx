import { Handle, Position } from "@xyflow/react";
import { useStore } from "../../store/useStore";
import type { NodeModel } from "../../types/workflow";

export function CodeNode({ id, data }: { id: string; data: NodeModel }) {
    const { selectedNodeId, runResults } = useStore()
    const isSelected = selectedNodeId === id
    const result = runResults[id]

    let borderColor = "border-border"
    if (result) {
        if (result.status === "success")
            borderColor = "border-green-500 bg-green-500/10"
        if (result.status === "error")
            borderColor = "border-red-500 bg-red-500/10"
        if (result.status === "skipped")
            borderColor =
                "border-gray-500 bg-gray-500/10 text-gray-500 opacity-60"
    }

    return (
        <div
            className={`
      relative bg-card rounded-md border-2 min-w-[150px] shadow-sm
      ${isSelected ? "ring-2 ring-primary border-primary" : borderColor}
    `}
        >
            <div className="bg-muted px-2 py-1 border-b border-border/50 text-xs font-semibold rounded-t-[4px] text-muted-foreground uppercase flex items-center justify-between">
                <span className="truncate max-w-[100px]">{data.name}</span>
                {result && (
                    <span
                        className={`ml-2 w-2 h-2 rounded-full ${
                            result.status === "success"
                                ? "bg-green-500"
                                : result.status === "error"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                        }`}
                    />
                )}
            </div>

            <div className="p-2 text-sm flex flex-col gap-1">
                {data.inputs?.map((input) => (
                    <div
                        key={`in-${input}`}
                        className="relative h-4 flex items-center mb-1"
                    >
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`in-${input}`}
                            className="w-3 h-3 border-2 border-background/10 !bg-secondary left-[-20px]"
                        />
                        <span className="text-xs text-foreground/80">
                            {input}
                        </span>
                    </div>
                ))}

                <div className="w-full border-t border-border/50 my-1" />

                {data.outputs?.map((output) => (
                    <div
                        key={`out-${output}`}
                        className="relative h-4 flex items-center justify-end mt-1"
                    >
                        <span className="text-xs text-foreground/80">
                            {output}
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`out-${output}`}
                            className="w-3 h-3 border-2 border-background/50 !bg-primary right-[-20px]"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function TriggerNode({ id, data }: { id: string; data: NodeModel }) {
    const { selectedNodeId, runResults } = useStore()
    const isSelected = selectedNodeId === id
    const result = runResults[id]

    let borderColor = "border-accent"
    if (result) {
        if (result.status === "success")
            borderColor = "border-green-500 bg-green-500/10"
        if (result.status === "error")
            borderColor = "border-red-500 bg-red-500/10"
    }

    return (
        <div
            className={`
      relative bg-card rounded-md border-2 min-w-[130px] shadow-sm
      ${isSelected ? "ring-2 ring-primary border-primary" : borderColor}
    `}
        >
            <div className="bg-accent/20 px-2 py-1 border-b border-border/50 text-xs font-semibold rounded-t-[4px] text-accent-foreground uppercase flex items-center gap-1">
                ⚡ {data.name}
            </div>
            <div className="p-3">
                {data.outputs?.map((output) => (
                    <div
                        key={`out-${output}`}
                        className="relative h-4 flex items-center justify-end mt-1"
                    >
                        <span className="text-xs text-foreground/80">
                            {output}
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`out-${output}`}
                            className="w-3 h-3 border-2 border-background/50 !bg-primary right-[-20px]"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
