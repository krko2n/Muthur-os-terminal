import { Component, ErrorInfo, ReactNode } from 'react';

interface PanelBoundaryProps {
  name: string;
  children: ReactNode;
}

interface PanelBoundaryState {
  error: Error | null;
}

// Contains a crash to one panel. Without it, a single bad value in any
// module unmounts the whole interface and leaves a black screen.
export default class PanelBoundary extends Component<PanelBoundaryProps, PanelBoundaryState> {
  state: PanelBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PanelBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}] panel crashed:`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="h-full flex flex-col items-center justify-center gap-[1vh] p-[2vh] text-center font-mono">
        <div className="text-[1.2vh] tracking-widest text-muthur-accent">{this.props.name} MODULE FAULT</div>
        <div className="text-[1vh] text-muthur-secondary opacity-60 max-w-[40ch] break-words">{this.state.error.message}</div>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-[0.5vh] px-3 py-1 text-[1vh] tracking-widest border border-muthur-border text-muthur-primary hover:bg-[rgba(var(--color-r),var(--color-g),var(--color-b),0.1)]"
        >
          RESTART MODULE
        </button>
      </div>
    );
  }
}
