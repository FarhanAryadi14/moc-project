import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard';
import '../css/app.css';

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>
  );
}
