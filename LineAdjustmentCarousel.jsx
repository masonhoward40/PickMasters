import { Component } from "react";
import { AlertTriangle, X } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      stack: error.stack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 md:p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-black dark:text-white font-sora">
                Something Went Wrong
              </h3>
              <button
                type="button"
                onClick={this.handleReset}
                className="text-[#6F6F6F] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="text-center mb-6">
              <AlertTriangle
                className="mx-auto mb-4 text-[#F59E0B] dark:text-[#F59E0B]"
                size={48}
              />
              <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-2">
                We encountered an error displaying this content.
              </p>
              {this.props.showDetails && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] cursor-pointer font-inter">
                    Error Details
                  </summary>
                  <pre className="mt-2 p-2 bg-[#F5F5F5] dark:bg-[#0F0F0F] rounded text-xs overflow-auto max-h-40 text-[#6F6F6F] dark:text-[#AAAAAA] font-mono">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] active:scale-95 font-inter"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
