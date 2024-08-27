import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Provider } from 'react-redux';
import { ModalProvider } from './context/Modal';
import configureStore from './store/store';
import { restoreCSRF, csrfFetch } from './store/csrf';
import * as sessionActions from './store/session';

const store = configureStore();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModalProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </ModalProvider>
  </React.StrictMode>
);

if (process.env.NODE_ENV !== 'production') {
  window.store = store;
}

if (import.meta.env.MODE !== 'production') {
  restoreCSRF();

  window.csrfFetch = csrfFetch;
  window.store = store;
  window.sessionActions = sessionActions;
}