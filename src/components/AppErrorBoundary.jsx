import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep console output for production debugging (e.g. Android WebView).
    console.error("Unhandled app error:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Qualcosa e andato storto</h1>
            <p className="text-muted-foreground mb-5">
              Ricarica la pagina per continuare.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-full bg-primary px-5 py-2 text-primary-foreground"
            >
              Ricarica pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
