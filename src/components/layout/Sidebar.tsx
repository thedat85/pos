import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, Avatar, IconButton, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import {
  TableRestaurant, Restaurant, Kitchen, Payment,
  Dashboard, People, Inventory, Settings, Receipt,
  EventNote, Logout, MenuBook, AccountBalance, Menu as MenuIcon, Close,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../lib/constants';

const DRAWER_WIDTH = 256;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const waiterNav: NavItem[] = [
  { label: 'Sơ đồ bàn', path: '/waiter/tables', icon: <TableRestaurant /> },
  { label: 'Đặt bàn', path: '/waiter/reservations', icon: <EventNote /> },
];

const kitchenNav: NavItem[] = [
  { label: 'Màn hình bếp', path: '/kitchen', icon: <Kitchen /> },
];

const cashierNav: NavItem[] = [
  { label: 'Sơ đồ bàn', path: '/waiter/tables', icon: <TableRestaurant /> },
  { label: 'Đặt bàn', path: '/waiter/reservations', icon: <EventNote /> },
  { label: 'Thanh toán', path: '/cashier', icon: <Payment /> },
];

const managerNav: NavItem[] = [
  { label: 'Dashboard', path: '/manager/dashboard', icon: <Dashboard /> },
  { label: 'Quản lý bàn', path: '/manager/tables', icon: <TableRestaurant /> },
  { label: 'Thực đơn', path: '/manager/menu', icon: <MenuBook /> },
  { label: 'Kho nguyên liệu', path: '/manager/inventory', icon: <Inventory /> },
  { label: 'Lịch sử thanh toán', path: '/manager/payments', icon: <Receipt /> },
  { label: 'Cấu hình thanh toán', path: '/manager/payment-config', icon: <AccountBalance /> },
  { label: 'Nhân viên', path: '/manager/users', icon: <People /> },
  { label: 'Cấu hình', path: '/manager/config', icon: <Settings /> },
];

const navByRole: Record<string, NavItem[]> = {
  waiter: waiterNav,
  kitchen: kitchenNav,
  cashier: cashierNav,
  manager: managerNav,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:767px)');

  if (!user) return null;

  const navItems = navByRole[user.role] || [];

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f3f4f5',
      }}
    >
      {/* Brand header */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            bgcolor: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
          }}
        >
          <Restaurant sx={{ color: '#fff', fontSize: 26 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 700,
              color: '#191c1d',
              lineHeight: 1.2,
            }}
          >
            {APP_NAME}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"Inter", sans-serif',
              color: '#534434',
              textTransform: 'capitalize',
            }}
          >
            {user.role}
          </Typography>
        </Box>
        {/* Close button on mobile */}
        {isMobile && (
          <IconButton
            onClick={onMobileClose}
            size="small"
            sx={{ color: '#534434' }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, pt: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: '12px',
                mb: 0.5,
                minHeight: 48,
                px: 2,
                border: 'none',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: '#ffffff',
                  color: '#191c1d',
                  boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
                  '&:hover': {
                    bgcolor: '#ffffff',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#855300',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(133,83,0,0.04)',
                },
              }}
            >
              {/* Amber left accent for active item */}
              {isActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    borderRadius: '0 4px 4px 0',
                    bgcolor: '#f59e0b',
                  }}
                />
              )}
              <ListItemIcon
                sx={{
                  color: isActive ? '#855300' : '#534434',
                  minWidth: 40,
                  '& .MuiSvgIcon-root': { fontSize: 22 },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: 0.1,
                  color: isActive ? '#191c1d' : '#534434',
                }}
              />
              {isActive && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: '#f59e0b',
                    ml: 1,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* User section */}
      <Box
        sx={{
          p: 2,
          mx: 1.5,
          mb: 1.5,
          borderRadius: '1.5rem',
          outline: '1px solid rgba(133,83,0,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#855300',
              fontSize: 16,
              fontWeight: 600,
              fontFamily: '"Manrope", sans-serif',
              boxShadow: '0 4px 12px rgba(133,83,0,0.20)',
            }}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                color: '#191c1d',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.full_name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Inter", sans-serif',
                color: '#534434',
              }}
            >
              @{user.username}
            </Typography>
          </Box>
          <Tooltip title="Đăng xuất" placement="top">
            <IconButton
              onClick={logout}
              size="small"
              sx={{
                color: '#534434',
                '&:hover': {
                  bgcolor: 'rgba(133,83,0,0.04)',
                  color: '#855300',
                },
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  // Mobile: temporary drawer with slide
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#f3f4f5',
            borderRight: 'none',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(25,28,29,0.3)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Desktop: permanent drawer
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#f3f4f5',
          borderRight: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
