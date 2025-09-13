import React from "react";

export default class RouteErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("RouteErrorBoundary", error, info); }

  render(){
    const { error } = this.state;
    if (error) {
      return (
        <div className="container">
          <div className="card">
            <h1 className="page-title" style={{marginBottom:8}}>Something went wrong</h1>
            <div className="subtitle" style={{marginBottom:12}}>The page failed to render. See console for details.</div>
            <pre style={{
              background:"#f6f7f9", border:"1px solid #e2e8f0",
              padding:"12px", borderRadius:"8px", fontSize:"12px", overflow:"auto"
            }}>{String(error?.message || error)}</pre>
            <div className="actions" style={{marginTop:12}}>
              <button className="btn" onClick={() => this.setState({ error: null })}>Try again</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
