import { createTheme } from '@mui/material/styles';

// ============================================
// "The Tactile Atelier" — Stitch Design System
// Amber Hearth POS Theme
// ============================================

const theme = createTheme({
  palette: {
    primary: {
      main: '#855300',       // Primary (Action)
      light: '#f59e0b',      // Primary Container (CTA) — "Hero" amber
      dark: '#6b4200',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7d5725',       // Secondary (Warning/Reserved)
      light: '#ffcb8f',      // Secondary Container
      dark: '#5c3f18',
      contrastText: '#ffffff',
    },
    info: {
      main: '#00658b',       // Tertiary (Available/Success)
      light: '#1abdff',      // Tertiary Container
      dark: '#004c6a',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ba1a1a',
      light: '#ffdad6',
      dark: '#93000a',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4ade80',
      light: '#bbf7d0',
      dark: '#166534',
    },
    warning: {
      main: '#f59e0b',
      light: '#ffddb8',     // Primary Fixed
      dark: '#855300',
    },
    background: {
      default: '#f8f9fa',   // Surface (Main Canvas)
      paper: '#ffffff',      // Surface Container Lowest
    },
    text: {
      primary: '#191c1d',   // On-Surface — never use pure #000
      secondary: '#534434', // On-Surface-Variant
    },
    divider: 'rgba(83,68,52,0.08)', // Ghost borders — "felt, not seen"
  } as Record<string, unknown>,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontFamily: '"Manrope", "Inter", sans-serif',
      fontSize: '3rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: '"Manrope", "Inter", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h5: {
      fontFamily: '"Manrope", "Inter", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.35,
    },
    h6: {
      fontFamily: '"Manrope", "Inter", sans-serif',
      fontSize: '1.125rem',
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: 0,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: 0,
    },
    body1: {
      fontSize: '0.9375rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0.02,
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.6875rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 800,
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
    },
  },
  shape: {
    borderRadius: 12, // Default — md (0.75rem)
  },
  shadows: (() => {
    // Ambient shadows tinted with 2% primary warmth
    const s = Array(25).fill('none') as [string, ...string[]];
    s[0] = 'none';
    s[1] = '0 1px 3px rgba(133,83,0,0.04)';
    s[2] = '0 2px 8px rgba(133,83,0,0.04)';
    s[3] = '0 4px 16px rgba(133,83,0,0.04)';
    s[4] = '0 8px 24px rgba(133,83,0,0.06)';
    s[5] = '0 12px 32px rgba(25,28,29,0.04)';  // Stitch standard
    s[6] = '0 16px 40px rgba(245,158,11,0.15)'; // FAB / CTA glow
    return s;
  })() as never,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@import': [
          "url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap')",
        ],
        body: {
          backgroundColor: '#f8f9fa',
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          fontSize: '0.875rem',
          fontFamily: '"Inter", sans-serif',
          minHeight: 48,
          borderRadius: 16, // lg (1rem)
          padding: '12px 24px',
          transition: 'all 0.2s ease',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(133,83,0,0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #855300 0%, #f59e0b 150%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6b4200 0%, #d48b09 150%)',
          },
        },
        outlined: {
          borderWidth: 1,
          borderColor: 'rgba(83,68,52,0.15)',
          '&:hover': {
            borderWidth: 1,
            backgroundColor: 'rgba(133,83,0,0.04)',
          },
        },
        sizeSmall: {
          minHeight: 40,
          padding: '8px 16px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          minHeight: 56,
          padding: '14px 32px',
          fontSize: '1rem',
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 16px 40px rgba(245,158,11,0.3)',
          textTransform: 'none' as const,
          background: 'linear-gradient(135deg, #f59e0b, #855300)',
          color: '#fff',
          '&:hover': {
            boxShadow: '0 20px 48px rgba(245,158,11,0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          // "No-Line Rule" — use tonal layering instead of borders
          borderRadius: 24, // xl (1.5rem)
          boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
          border: 'none',
          backgroundColor: '#ffffff', // surface-container-lowest
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          '&:hover': {
            boxShadow: '0 16px 40px rgba(25,28,29,0.08)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12, // md (0.75rem)
          fontWeight: 700,
          fontSize: '0.6875rem',
          height: 28,
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#f3f4f5', // surface-container-low
            minHeight: 56,
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(133,83,0,0.15)',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#f59e0b',
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 12px 32px rgba(25,28,29,0.08)',
          padding: 8,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Manrope", sans-serif',
          fontSize: '1.25rem',
          fontWeight: 700,
          padding: '24px 24px 12px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '8px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
          gap: 12,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 800,
            fontSize: '0.625rem',
            color: '#534434',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            backgroundColor: 'transparent',
            borderBottom: 'none',
            paddingBottom: 12,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          fontSize: '0.875rem',
          borderBottom: '1px solid rgba(83,68,52,0.05)', // Ghost border
          color: '#191c1d',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: '#f3f4f5', // surface-container-low
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: '#f3f4f5', // surface-container-low
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 48,
          margin: '2px 8px',
          padding: '10px 16px',
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(133,83,0,0.06)',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#ffffff',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(133,83,0,0.04)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
          borderRadius: 12,
          '&.Mui-selected': {
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(133,83,0,0.06)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: '#edeeef', // surface-container-high
          borderRadius: 12,
          padding: 6,
          minHeight: 48,
        },
        indicator: {
          display: 'none', // Tabs use background selection instead
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: 'none',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52,
          height: 32,
          padding: 0,
        },
        switchBase: {
          padding: 4,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            '& + .MuiSwitch-track': {
              backgroundColor: '#f59e0b',
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
          backgroundColor: '#fff',
        },
        track: {
          borderRadius: 16,
          opacity: 0.3,
          backgroundColor: '#191c1d',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 12px',
          backgroundColor: '#2e3132',
        },
      },
    },
  },
});

export default theme;
