
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import html2canvas from 'html2canvas';

// Import global styles
import './styles.css';

// Reset default body margins and padding
document.body.style.margin = '0';
document.body.style.padding = '0';

// --- Screenshot and error handling logic for iframe ---

// Helper to post messages to the parent window
const postToParent = (message: any) => {
  // In a production environment, you should specify the target origin for security.
  // For this example, we use '*' to allow any origin.
  window.parent.postMessage(message, '*');
};

// Listen for screenshot requests from the parent
window.addEventListener('message', async (event: MessageEvent) => {
  if (event.data && event.data.type === 'captureRequest') {
    try {
      const canvas = await html2canvas(document.documentElement, { useCORS: true });
      const imageData = canvas.toDataURL('image/png');
      postToParent({ type: 'captureResponse', imageData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Screenshot capture failed:', errorMessage);
      postToParent({ type: 'captureError', error: errorMessage });
    }
  }
});

// Forward uncaught errors to the parent
window.addEventListener('error', (event: ErrorEvent) => {
  const errorMessage = `Uncaught error: ${event.message}`;
  const locationInfo = event.filename ? ` at ${event.filename}:${event.lineno}:${event.colno}` : '';
  postToParent({
    type: 'consoleError',
    message: errorMessage + locationInfo
  });
});

// Forward unhandled promise rejections to the parent
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const errorMessage = `Unhandled promise rejection: ${event.reason}`;
  postToParent({
    type: 'consoleError',
    message: errorMessage
  });
});

// Forward console.error calls to the parent
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  originalConsoleError.apply(console, args);
  const message = args.map(arg => {
    if (arg instanceof Error) return arg.stack || arg.message;
    try { return JSON.stringify(arg); } catch (e) { return String(arg); }
  }).join(' ');
  postToParent({ type: 'consoleError', message: `console.error: ${message}` });
};

// Forward console.warn calls to the parent (as they often indicate issues)
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  originalConsoleWarn.apply(console, args);
  const message = args.map(arg => {
    if (arg instanceof Error) return arg.stack || arg.message;
    try { return JSON.stringify(arg); } catch (e) { return String(arg); }
  }).join(' ');
  postToParent({ type: 'consoleError', message: `console.warn: ${message}` });
};

// --- End of iframe logic ---

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
