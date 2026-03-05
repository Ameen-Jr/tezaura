import React from 'react';

class SafeChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Graph Component Crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ 
            height: "100%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: "#94a3b8",
            flexDirection: "column",
            gap: "10px"
        }}>
           <span style={{ fontSize: "24px" }}>📊</span>
           <span style={{ fontSize: "14px" }}>Graph Unavailable</span>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeChart;