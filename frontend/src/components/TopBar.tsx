import { http } from "@/lib/api"
import { PlayIcon, SaveIcon, UndoIcon } from "lucide-react"
import { useState } from "react"
import { useStore } from "../store/useStore"
import { Button } from "./ui/button"

export function TopBar() {
    const {
        getExportData,
        setRunResults,
        isRunning,
        setIsRunning,
        workflowName,
    } = useStore()
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const data = getExportData()
            await http.post("/workflows", data)
        } catch (error) {
            console.error("Failed to save workflow", error)
            alert("Failed to save workflow. DAG might contain cycles.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleRun = async () => {
        setIsRunning(true)
        setRunResults([]) // Clear previous results
        try {
            const data = getExportData()
            await http.post("/workflows", data)

            const response = await http.post(`/workflows/${data.id}/run`)
            setRunResults(response.data.node_results)
        } catch (error) {
            console.error("Failed to run workflow", error)
            alert("Execution failed. Check console.")
        } finally {
            setIsRunning(false)
        }
    }

    const handleClearResults = () => {
        setRunResults([])
    }

    return (
        <div className="h-14 border-b bg-card flex items-center justify-between px-6 shadow-sm z-20">
            <div className="flex items-center gap-4">
                <h1 className="font-bold text-lg text-primary tracking-tight flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground p-1 rounded-sm w-7 h-7 flex items-center justify-center">
                        A
                    </span>
                    Automation
                </h1>
                <div className="text-sm font-medium text-muted-foreground border-l pl-4 hidden md:block">
                    {workflowName}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearResults}
                    title="Clear execution highlights"
                >
                    <UndoIcon className="w-4 h-4 mr-2" />
                    Clear Results
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || isRunning}
                >
                    <SaveIcon className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                    size="sm"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    {isRunning ? "Running..." : "Run Workflow"}
                </Button>
            </div>
        </div>
    )
}
