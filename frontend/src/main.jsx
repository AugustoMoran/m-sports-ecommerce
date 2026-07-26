import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import store from './app/store';
import App from './App';
import { initializeMercadoPago } from './config/mercadopago';
import './index.css';

// Initialize Mercado Pago SDK
initializeMercadoPago().catch(err => console.error('Failed to initialize MP:', err));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
            }}
          />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
);
