import React from 'react';

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error('ErrorBoundary:', error);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something wilted.</h2>
          <p>{this.state.error?.message}</p>
          <button className="primary" onClick={this.reset}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
