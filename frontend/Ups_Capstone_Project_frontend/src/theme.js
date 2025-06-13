import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#351C15', // UPS Brown
      light: '#4A2B21',
      dark: '#1E0F0C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFB500', // UPS Yellow
      light: '#FFC640',
      dark: '#CC9100',
      contrastText: '#351C15',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
    success: {
      main: '#00B894',
      light: '#55EFC4',
      dark: '#00A885',
    },
    error: {
      main: '#FF7675',
      light: '#FFB2B2',
      dark: '#D63031',
    },
  },
  graphy: {
    fontFamily: 'sans-serif, "Inter", "Roboto", "Helvetica", "Arial"',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,

    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #351C15 30%, #4A2B21 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #4A2B21 30%, #351C15 90%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #FFB500 30%, #FFC640 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #FFC640 30%, #FFB500 90%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'all 0.2s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#351C15',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #351C15 30%, #4A2B21 90%)',
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.05)',
    '0 4px 8px rgba(0,0,0,0.05)',
    '0 8px 16px rgba(0,0,0,0.05)',
    '0 12px 24px rgba(0,0,0,0.05)',
    '0 16px 32px rgba(0,0,0,0.05)',
    ...Array(19).fill('none'),
  ],
});

export default theme; 