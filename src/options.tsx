import React from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsPage } from './pages/OptionsPage';
import './styles/options.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);
