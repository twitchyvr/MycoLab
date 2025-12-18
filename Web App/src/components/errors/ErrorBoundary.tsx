// ============================================================================
// ERROR BOUNDARY
// Catches React component errors and provides graceful fallback UI
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError, getErrorLog, clearErrorLog } from './GlobalErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  feedbackSubmitted: boolean;
  feedbackText: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    feedbackSubmitted: false,
    feedbackText: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log the error
    logError({
      type: 'unknown',
      message: `Component Error: ${error.message}`,
      technical: errorInfo.componentStack || undefined,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleToggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ feedbackText: e.target.value });
  };

  private handleSubmitFeedback = async () => {
    const { error, errorInfo, feedbackText } = this.state;
    const errorLog = getErrorLog();

    // Create error report
    const report = {
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
      },
      userFeedback: feedbackText,
      recentErrors: errorLog.slice(-10),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // For now, just log to console - in production, this would POST to an API
    console.log('Error report:', report);

    // Store for potential manual retrieval
    try {
      localStorage.setItem('mycolab-last-error-report', JSON.stringify(report));
    } catch (e) {
      // Ignore storage errors
    }

    this.setState({ feedbackSubmitted: true });

    // Clear error log after submission
    clearErrorLog();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      feedbackSubmitted: false,
      feedbackText: '',
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails, feedbackSubmitted, feedbackText } = this.state;

      return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-zinc-800 rounded-xl border border-zinc-700 p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Something Went Wrong</h1>
              <p className="text-zinc-400 text-sm">
                We encountered an unexpected error. Your data is safe, and you can continue using the app.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Feedback Section */}
            {!feedbackSubmitted ? (
              <div className="space-y-3 pt-4 border-t border-zinc-700">
                <p className="text-sm text-zinc-400">
                  Help us fix this issue by describing what you were doing:
                </p>
                <textarea
                  value={feedbackText}
                  onChange={this.handleFeedbackChange}
                  placeholder="What were you trying to do when this happened?"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm resize-none focus:outline-none focus:border-emerald-500"
                  rows={3}
                />
                <button
                  onClick={this.handleSubmitFeedback}
                  className="w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-zinc-700 text-center">
                <div className="inline-flex items-center gap-2 text-emerald-400 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Thank you for your feedback!
                </div>
              </div>
            )}

            {/* Technical Details Toggle */}
            <div className="pt-4 border-t border-zinc-700">
              <button
                onClick={this.handleToggleDetails}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {showDetails ? 'Hide' : 'Show'} technical details
              </button>

              {showDetails && (
                <div className="mt-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700 overflow-auto max-h-48">
                  <p className="text-xs text-red-400 font-mono break-all">
                    {error?.message || 'Unknown error'}
                  </p>
                  {errorInfo?.componentStack && (
                    <pre className="mt-2 text-xs text-zinc-500 font-mono whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
