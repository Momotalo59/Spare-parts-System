
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'; // Import AuthProvider
import './index.css';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#A076F9',
    },
    secondary: {
      main: '#f7931e',
    },
    background: {
      default: '#1f1f1f',
      paper: '#2b2b2b',
    },
  },
  typography: {
    fontFamily: 'Kanit, sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider> {/* Wrap the app with AuthProvider */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
