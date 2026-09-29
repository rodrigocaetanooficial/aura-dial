import React from 'react';
import { createRoot } from 'react-dom/client';
import { NewTabPage } from './pages/NewTabPage';
import './styles/newtab.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <NewTabPage />
  </React.StrictMode>
);
