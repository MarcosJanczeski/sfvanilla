import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: any }> {
  state = { error: null as any };
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(err: any, info: any) { console.error("UI crash:", err, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:16 }}>
          <h2>Ops, algo quebrou no app</h2>
          <pre style={{ whiteSpace:"pre-wrap" }}>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
