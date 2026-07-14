import React from 'react';
import { Button } from './ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here (e.g., Sentry, Crashlytics)
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-(--color-background) p-8 text-center">
          <div className="border-4 border-black p-8 bg-(--color-brutal-bg) shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-red-600">Something went critically wrong.</h1>
            <p className="text-lg font-bold mb-8 text-(--color-text-muted)">
              The application encountered an unexpected error. Please refresh the page or contact support if the issue persists.
            </p>
            
            {this.state.error && (
              <div className="bg-gray-100 p-4 border-2 border-black text-left overflow-auto max-h-64 mb-8 text-sm font-mono text-red-800">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            )}

            <Button 
              variant="primary" 
              size="lg"
              onClick={() => window.location.reload()}
            >
              RELOAD APPLICATION
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
