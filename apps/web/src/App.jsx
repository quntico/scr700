import React from 'react';
import { Route, Routes, Navigate, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Scr700App from './scr700/Scr700App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05080d] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="p-8 rounded-2xl bg-[#0b1322] border border-cyan-500/30 max-w-md shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-xl">
              ⚡
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Restableciendo Entorno 3D</h2>
            <p className="text-xs text-slate-400 mb-6 font-mono bg-[#03060a] p-3 rounded-lg border border-slate-800 text-left overflow-auto max-h-24">
              {this.state.error?.toString() || 'Actualización en caliente completada.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] uppercase text-xs tracking-wider cursor-pointer"
            >
              🔄 Recargar Vista
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Scr700App />} />
                    <Route path="/scr700" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
