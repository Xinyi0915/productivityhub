import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

// Check if we need to reset the session storage for testing
// This allows for easy debugging by adding ?reset=true to the URL
if (window.location.search.includes('reset=true')) {
  // Clear persisted state to start fresh
  persistor.purge();
}

// Get the root DOM element where our React app will be mounted
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the application with React 18's createRoot API
root.render(
  // StrictMode enables additional development checks and warnings
  <React.StrictMode>
    {/* Redux is set up at the top level to provide state management */}
    <Provider store={store}>
      {/* PersistGate delays rendering until persisted state is loaded */}
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
); 