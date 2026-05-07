import React from 'react';
import ReactDOM from 'react-dom/client';
import HRDashboard from './modules/hr/pages/HRDashboard';
import { HRProvider } from './modules/hr/context/HRContext';
import './index.css'; // TailwindCSS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HRProvider>
      <HRDashboard />
    </HRProvider>
  </React.StrictMode>
);