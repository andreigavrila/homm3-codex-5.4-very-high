import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ERROR] [ErrorBoundary] render failure', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section className="error-boundary">
          <h2 className="panel-title">{this.props.title ?? 'UI Region Failed'}</h2>
          <p>This section could not be rendered. Reload or start a new game.</p>
        </section>
      );
    }

    return this.props.children;
  }
}
