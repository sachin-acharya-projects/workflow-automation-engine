import { FlowCanvas } from './components/FlowCanvas';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <div className="flex flex-col h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
                <TopBar />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 relative">
                        <FlowCanvas />
                    </div>
                    <Sidebar />
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default App;
