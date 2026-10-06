import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import './global.css';
import { LanguageProvider } from './lib/LanguageContext';

// Prevent the browser from restoring a stale scroll position (often the footer)
// before React Router's initial route has rendered.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </Router>
    </LanguageProvider>
  </React.StrictMode>
);
