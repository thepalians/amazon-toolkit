import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import { registerServiceWorker } from './registerSW';

const root = ReactDOM.createRoot(document.getElementById('root'));
registerServiceWorker();
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
