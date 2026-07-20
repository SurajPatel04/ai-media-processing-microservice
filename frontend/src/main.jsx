import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster 
        position="bottom-right" 
        reverseOrder={false} 
        toastOptions={{
          style: {
            background: '#000000',
            color: '#ffffff',
            border: '1px solid #ffffff',
            borderRadius: '0px',
            padding: '12px 16px',
            boxShadow: '8px 8px 0px 0px rgba(255,255,255,0.1)',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            fontSize: '14px',
            letterSpacing: '-0.025em',
          },
          success: {
            iconTheme: {
              primary: '#ffffff',
              secondary: '#000000',
            },
          },
          error: {
            iconTheme: {
              primary: '#ffffff',
              secondary: '#000000',
            },
          },
        }}
      />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
