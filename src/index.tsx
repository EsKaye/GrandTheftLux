/**
 * 🎮 GTL IV - Main Application Entry Point
 * 
 * React application entry point with:
 * - Strict mode for development
 * - Error boundaries for crash handling
 * - Performance monitoring
 * - Accessibility features
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 GTL IV Development Mode');
  console.log('📊 Performance monitoring enabled');
  console.log('🐛 Debug mode active');
}

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('❌ Unhandled error:', event.error);
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    console.error('Error details:', {
      message: event.error?.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default browser behavior
});

// WebGL support check
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    
    if (!gl) {
      console.error('❌ WebGL not supported');
      return false;
    }
    
    console.log('✅ WebGL supported');
    console.log('🎮 WebGL version:', gl.getParameter(gl.VERSION));
    console.log('🎨 WebGL renderer:', gl.getParameter(gl.RENDERER));
    
    return true;
  } catch (error) {
    console.error('❌ WebGL check failed:', error);
    return false;
  }
}

// Performance API support check
function checkPerformanceSupport(): void {
  if ('performance' in window) {
    console.log('✅ Performance API supported');
    
    if ('memory' in performance) {
      console.log('🧠 Memory API available');
    }
    
    if ('getEntriesByType' in performance) {
      console.log('📊 Performance timing available');
    }
  } else {
    console.warn('⚠️ Performance API not supported');
  }
}

// Service Worker registration (for PWA features)
function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    });
  }
}

// Initialize application
function initializeApp(): void {
  console.log('🎮 Initializing GTL IV...');
  
  // Check system requirements
  const webglSupported = checkWebGLSupport();
  checkPerformanceSupport();
  
  if (!webglSupported) {
    // Show error message for unsupported browsers
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <h1>❌ WebGL Not Supported</h1>
          <p>GTL IV requires WebGL support to run.</p>
          <p>Please update your browser or enable WebGL in your graphics settings.</p>
          <p>Recommended browsers: Chrome, Firefox, Safari, Edge (latest versions)</p>
        </div>
      `;
    }
    return;
  }
  
  // Register service worker
  registerServiceWorker();
  
  // Create React root
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element not found');
    return;
  }
  
  const root = ReactDOM.createRoot(rootElement);
  
  // Render application
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ GTL IV initialized successfully');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for potential external use
export { App }; 