/**
 * ErrorBoundary — catches unexpected React render errors and shows a recovery UI
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(255,107,0,0.12) 0%, transparent 55%), #0D0D0D',
        }}
      >
        <div className="text-6xl mb-6">💥</div>
        <h1 className="font-display font-bold text-2xl text-white mb-2">Something went wrong</h1>
        <p className="text-sm mb-8" style={{ color: '#A0A0A0' }}>
          An unexpected error occurred. Refreshing should fix it.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl bg-pp-orange text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Reload page
        </button>
        {process.env.NODE_ENV !== 'production' && this.state.error && (
          <pre className="mt-8 text-left text-xs text-red-400 bg-black/40 rounded-xl p-4 max-w-xl overflow-x-auto">
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    );
  }
}
