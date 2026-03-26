import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, IconButton, Typography, Avatar, useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../lib/constants';

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:767px)');
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile top AppBar */}
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: '#f8f9fa',
              color: '#191c1d',
              boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56 }}>
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{
                  color: '#534434',
                  '&:hover': { bgcolor: 'rgba(133,83,0,0.04)' },
                }}
              >
                <MenuIcon />
              </IconButton>

              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  color: '#191c1d',
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                {APP_NAME}
              </Typography>

              {user && (
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: '#855300',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: '"Manrope", sans-serif',
                    boxShadow: '0 4px 12px rgba(133,83,0,0.20)',
                  }}
                >
                  {user.full_name.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Toolbar>
          </AppBar>
        )}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: '#f8f9fa',
            overflow: 'auto',
            maxHeight: isMobile ? 'calc(100vh - 56px)' : '100vh',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
