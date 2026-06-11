import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import App from './App.jsx';

const SIDEBAR = '#2e2e2e';
const ACCENT  = '#3d4f63';
const BG      = '#eef0f5';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: ACCENT, light: '#5a6e83', dark: '#253040', contrastText: '#ffffff' },
    background: { default: BG, paper: '#ffffff' },
    text: { primary: '#1c2333', secondary: '#6e7891' },
    divider: 'rgba(0,0,0,0.07)',
    success: { main: '#2e7d52' },
    error:   { main: '#b03030' },
    warning: { main: '#9e6a1a' },
  },
  typography: {
    fontFamily: '"Barlow", "DM Sans", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '0.01em', fontSize: '1.35rem', color: '#1c2333' },
    h5: { fontWeight: 700, letterSpacing: '0.01em', fontSize: '1.1rem', color: '#1c2333' },
    h6: { fontWeight: 600, fontSize: '0.95rem', color: '#1c2333' },
    body1: { fontSize: '0.875rem', color: '#2d3748' },
    body2: { fontSize: '0.8rem', color: '#4a5568' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.04em', fontSize: '0.82rem' },
    caption: { fontSize: '0.71rem', letterSpacing: '0.06em', color: '#6e7891' },
  },
  shape: { borderRadius: 3 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3, padding: '7px 18px', transition: 'all 0.18s ease',
          boxShadow: 'none',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 3px 10px rgba(0,0,0,0.13)' },
          '&:active': { transform: 'translateY(0)', boxShadow: 'none' },
        },
        containedPrimary: {
          background: SIDEBAR,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          '&:hover': { background: '#3d3d3d', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.18s ease, transform 0.18s ease',
          '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.06)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.06)',
        },
        elevation1: { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)' },
        elevation2: { boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.05)' },
        elevation3: { boxShadow: '0 4px 14px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.06)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#1c2333', fontSize: '11px', borderRadius: 3, padding: '5px 10px', color: 'rgba(255,255,255,0.88)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
        arrow: { color: '#1c2333' },
      },
      defaultProps: { arrow: true, enterDelay: 200, enterNextDelay: 150 },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.12s ease',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
          '&:last-child td': { border: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(0,0,0,0.05)', padding: '11px 14px', fontSize: '0.825rem', color: '#2d3748' },
        head: { padding: '10px 14px', fontWeight: 700, fontSize: '11px', letterSpacing: '0.07em', color: '#ffffff', backgroundColor: SIDEBAR },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 3, fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em', height: 22 } },
    },
    MuiTextField: {
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: '#fafbfc', '& fieldset': { borderColor: 'rgba(0,0,0,0.12)' }, '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.28)' } } } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(0,0,0,0.06)' } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 3 } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: 'rgba(0,0,0,0.06)' } },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={4000}
      >
        <App />
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>
);
