import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { PeerProvider } from './context/PeerContext.jsx';
import './index.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PeerProvider>
          <App />
        </PeerProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
