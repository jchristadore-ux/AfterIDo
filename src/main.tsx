import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

/**
 * Two hosting shapes, one source.
 *
 * Normally we use clean URLs (BrowserRouter). On GitHub Pages the app lives at
 * /<repo>/, so the router needs that prefix — Vite hands it to us as BASE_URL.
 * Pages can't rewrite unknown paths, so the deploy also ships a 404.html copy
 * of index.html; the SPA boots from it and reads the real URL.
 *
 * Where even that isn't possible (a single self-contained HTML file), set
 * VITE_ROUTER=hash at build time and routes live in the fragment instead.
 */
const useHashRouter = import.meta.env.VITE_ROUTER === 'hash';
const Router = useHashRouter ? HashRouter : BrowserRouter;

// BASE_URL is '/' or '/NameDay/'. React Router wants it without the trailing
// slash, and wants nothing at all when the app is at the domain root.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <Router basename={useHashRouter ? undefined : basename}>
      <App />
    </Router>
  </StrictMode>,
);
