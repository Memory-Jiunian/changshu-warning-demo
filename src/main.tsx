import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { DemoProvider } from './state/DemoProvider';
import './styles.css';
import './components/layout/page-frame.css';

createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <DemoProvider>
      <App />
    </DemoProvider>
  </React.StrictMode>,
);
