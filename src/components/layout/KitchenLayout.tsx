import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

// Kitchen uses fullscreen layout without sidebar (BD SCR-07)
export default function KitchenLayout() {
  return (
    <Box sx={{ minHeight: '100vh', height: '100vh', bgcolor: '#191c1d', color: '#fff' }}>
      <Outlet />
    </Box>
  );
}
