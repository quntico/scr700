import React from 'react';
import { Route, Routes, Navigate, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Scr700App from './scr700/Scr700App';

function App() {
    return (
        <Router>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Scr700App />} />
                <Route path="/scr700" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
