import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // We'll create this component next
import './index.css'; // Import the CSS

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Could not find root element to mount React app.");
}
