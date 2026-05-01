import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import App from './App';
import { initializeMercadoPago } from './config/mercadopago';
import './index.css';

// Initialize Mercado Pago SDK
initializeMercadoPago();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
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
    </Provider>
  </React.StrictMode>
);
