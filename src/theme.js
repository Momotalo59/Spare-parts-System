
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8A2BE2', // Vibrant Purple
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#A076F9', // Lighter Purple
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#1f1f1f', // Dark background
      paper: '#2b2b2b',   // Lighter surface for cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#bbb',
    },
    error: {
      main: '#EF5350', 
    },
    success: {
        main: '#66BB6A',
    }
  },
  typography: {
    fontFamily: 'Kanit, sans-serif',
    button: {
      fontWeight: 'bold',
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          padding: '10px 20px',
        },
      },
    },
    MuiTab: {
        styleOverrides: {
            root: {
                fontFamily: 'Kanit',
                fontWeight: 'bold',
                fontSize: '1rem',
            }
        }
    }
  },
});

export default theme;
