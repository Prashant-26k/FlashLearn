import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        style={{
          alignItems: 'center',
          background: 'var(--bg-base, #f8fafc)',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '480px' }}>
          <h1>Something went wrong</h1>
          <p>
            FlashLearn encountered an unexpected problem. Please reload the
            page and try again.
          </p>
          <button type="button" onClick={this.handleReload}>
            Reload FlashLearn
          </button>
        </div>
      </main>
    );
  }
}
