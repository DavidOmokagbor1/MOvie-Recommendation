import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './theme.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'semantic-ui-css/semantic.min.css';

// Error boundary so a crash in the tree shows a message instead of a blank page
class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    if (process.env.NODE_ENV === 'development') {
      console.error('AppErrorBoundary caught:', error, info);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0e1a',
          color: '#e0e0e0',
          padding: 40,
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h1 style={{ marginBottom: 16 }}>Something went wrong</h1>
          <p style={{ marginBottom: 24, maxWidth: 480 }}>
            The app hit an error. Try refreshing the page. If it keeps happening, open the browser console (F12) for details.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, overflow: 'auto', maxWidth: '90%', fontSize: 12 }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: '12px 24px', cursor: 'pointer', fontSize: 16 }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Temporarily disable StrictMode to avoid findDOMNode warnings from semantic-ui-react
// This is a known issue with older versions of semantic-ui-react
ReactDOM.render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
