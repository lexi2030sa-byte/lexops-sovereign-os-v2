import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './sovereign-visual-unifier.css';

if (typeof window !== "undefined") {
  const path = window.location.pathname;
  if (path.startsWith("/sovereign") || path.includes("/sovereign")) {
    (window as any).__VITE_DISABLE_HMR__ = true;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
