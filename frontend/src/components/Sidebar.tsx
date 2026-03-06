import Editor from "@monaco-editor/react"
import { useState } from "react"
import { useStore } from "../store/useStore"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { ScrollArea } from "./ui/scroll-area"

export function Sidebar() {
    const { selectedNodeId, nodes, updateNodeData, runResults, deleteNode } =
        useStore()

    const selectedNode = nodes.find((n) => n.id === selectedNodeId)
    const nodeResult = selectedNodeId ? runResults[selectedNodeId] : null

    const [inputName, setInputName] = useState("")
    const [outputName, setOutputName] = useState("")
    const [isEditorExpanded, setIsEditorExpanded] = useState(false)

    if (!selectedNode) {
        return (
            <div className="w-80 border-l bg-card flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                Select a node on the canvas to configure it.
            </div>
        )
    }

    const { data } = selectedNode
    const isTrigger = data.type === "trigger"

    const handleAddInput = () => {
        if (inputName && !data.inputs.includes(inputName)) {
            updateNodeData(data.id, { inputs: [...data.inputs, inputName] })
            setInputName("")
        }
    }

    const handleAddOutput = () => {
        if (outputName && !data.outputs.includes(outputName)) {
            updateNodeData(data.id, { outputs: [...data.outputs, outputName] })
            setOutputName("")
        }
    }

    const handleRemoveInput = (name: string) => {
        updateNodeData(data.id, {
            inputs: data.inputs.filter((i) => i !== name),
        })
    }

    const handleRemoveOutput = (name: string) => {
        updateNodeData(data.id, {
            outputs: data.outputs.filter((i) => i !== name),
        })
    }

    return (
        <div className="w-96 border-l bg-card flex flex-col h-full shadow-lg z-20">
            <div className="p-4 border-b flex items-center justify-between bg-muted/40">
                <h2 className="font-semibold text-foreground">
                    Node Configuration
                </h2>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNode(data.id)}
                >
                    Delete Node
                </Button>
            </div>

            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-6">
                    {/* Node Name */}
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            value={data.name}
                            onChange={(e) =>
                                updateNodeData(data.id, {
                                    name: e.target.value,
                                })
                            }
                        />
                    </div>

                    {/* Trigger Payload config */}
                    {isTrigger && (
                        <div className="space-y-2">
                            <Label>Trigger Payload (JSON)</Label>
                            <div className="h-48 border rounded-md overflow-hidden">
                                <Editor
                                    height="100%"
                                    defaultLanguage="json"
                                    value={JSON.stringify(
                                        data.config?.payload || {},
                                        null,
                                        2,
                                    )}
                                    onChange={(val) => {
                                        try {
                                            const payload = JSON.parse(
                                                val || "{}",
                                            )
                                            updateNodeData(data.id, {
                                                config: {
                                                    ...data.config,
                                                    payload,
                                                },
                                            })
                                        } catch {
                                            // ignore parse errors while typing
                                        }
                                    }}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Node Code config */}
                    {!isTrigger && (
                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label>Python Code</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => setIsEditorExpanded(true)}
                                >
                                    Expand ⤢
                                </Button>
                            </div>
                            <div className="h-64 border rounded-md overflow-hidden relative">
                                <Editor
                                    height="100%"
                                    defaultLanguage="python"
                                    value={data.code || ""}
                                    onChange={(val) =>
                                        updateNodeData(data.id, { code: val })
                                    }
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Inputs & Outputs Management */}
                    <div className="space-y-4">
                        {!isTrigger && (
                            <div className="space-y-2">
                                <Label>Inputs</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Input name (e.g. data)"
                                        value={inputName}
                                        onChange={(e) =>
                                            setInputName(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            handleAddInput()
                                        }
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={handleAddInput}
                                    >
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {data.inputs.map((inp) => (
                                        <span
                                            key={inp}
                                            className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center gap-1"
                                        >
                                            {inp}
                                            <button
                                                className="text-muted-foreground hover:text-foreground"
                                                onClick={() =>
                                                    handleRemoveInput(inp)
                                                }
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Outputs</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Output name (e.g. result)"
                                    value={outputName}
                                    onChange={(e) =>
                                        setOutputName(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleAddOutput()
                                    }
                                />
                                <Button
                                    variant="secondary"
                                    onClick={handleAddOutput}
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {data.outputs.map((out) => (
                                    <span
                                        key={out}
                                        className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full flex items-center gap-1"
                                    >
                                        {out}
                                        <button
                                            className="text-primary-foreground/70 hover:text-primary-foreground"
                                            onClick={() =>
                                                handleRemoveOutput(out)
                                            }
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Execution Result */}
                    {nodeResult && (
                        <div className="space-y-2 mt-8 pt-6 border-t">
                            <Label className="flex items-center gap-2">
                                Execution Result
                                <span
                                    className={`px-2 py-0.5 rounded text-xs text-white ${
                                        nodeResult.status === "success"
                                            ? "bg-green-500"
                                            : nodeResult.status === "error"
                                              ? "bg-red-500"
                                              : "bg-gray-500"
                                    }`}
                                >
                                    {nodeResult.status.toUpperCase()}
                                </span>
                            </Label>
                            <div className="text-xs text-muted-foreground mb-2">
                                Duration: {nodeResult.duration.toFixed(3)}s
                            </div>

                            {nodeResult.error && (
                                <div className="bg-red-500/10 text-red-500 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                                    {nodeResult.error}
                                </div>
                            )}

                            {Object.keys(nodeResult.outputs || {}).length >
                                0 && (
                                <div className="bg-muted p-2 rounded text-xs font-mono overflow-auto max-h-48">
                                    <pre>
                                        {JSON.stringify(
                                            nodeResult.outputs,
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {isEditorExpanded && !isTrigger && (
                <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm p-6 sm:p-12">
                    <div className="bg-card w-full h-full rounded-xl border shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b bg-muted/40">
                            <div>
                                <h2 className="font-semibold text-lg">
                                    {data.name} - Python Code
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Editing code in expanded view.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditorExpanded(false)}
                            >
                                Close / Collapse ⤡
                            </Button>
                        </div>
                        <div className="flex-1 w-full">
                            <Editor
                                height="100%"
                                defaultLanguage="python"
                                value={data.code || ""}
                                onChange={(val) =>
                                    updateNodeData(data.id, { code: val })
                                }
                                options={{
                                    minimap: { enabled: true },
                                    fontSize: 14,
                                    padding: {top: 20}
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
