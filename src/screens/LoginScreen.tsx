// ============================================
// SCR-01: Login Screen — Stitch "Tactile Atelier"
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME, ROLE_ROUTES } from '../lib/constants';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.username, data.password);
      const raw = localStorage.getItem('pos_user_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        const route = ROLE_ROUTES[profile.role] || '/';
        navigate(route, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8f9fa',
        p: { xs: 2, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        // Decorative circles
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -160,
          right: -160,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'rgba(133,83,0,0.05)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -120,
          left: -120,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'rgba(0,101,139,0.05)',
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 448,
          borderRadius: '1.5rem',
          border: 'none',
          overflow: 'visible',
          boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
          position: 'relative',
          zIndex: 1,
          bgcolor: '#ffffff',
        }}
      >
        <CardContent sx={{ p: { xs: 4, md: 5 } }}>
          {/* Logo & App Name */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '1.5rem',
                background: 'linear-gradient(135deg, #855300, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
                boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <RestaurantIcon sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 800,
                fontSize: '1.5rem',
                color: '#191c1d',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              AMBER HEARTH
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontFamily: '"Inter", sans-serif',
                fontWeight: 400,
                fontSize: '1rem',
                color: '#534434',
              }}
            >
              Chào mừng trở lại
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '0.75rem',
                bgcolor: 'rgba(186,26,26,0.08)',
                color: '#ba1a1a',
                '& .MuiAlert-icon': { color: '#ba1a1a' },
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('username')}
              placeholder="Tên đăng nhập"
              fullWidth
              autoFocus
              autoComplete="username"
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  height: 56,
                  borderRadius: '0.75rem',
                  bgcolor: '#f3f4f5',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  '& fieldset': { border: 'none' },
                  '&:hover': { bgcolor: '#eef0f1' },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 0 0 2px rgba(245,158,11,0.2)',
                  },
                  '&.Mui-error': {
                    boxShadow: '0 0 0 2px rgba(186,26,26,0.2)',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  pl: 1.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 0.5 }}>
                    <PersonIcon sx={{ color: '#534434', fontSize: 22, transition: 'color 0.2s' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('password')}
              placeholder="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  height: 56,
                  borderRadius: '0.75rem',
                  bgcolor: '#f3f4f5',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  '& fieldset': { border: 'none' },
                  '&:hover': { bgcolor: '#eef0f1' },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 0 0 2px rgba(245,158,11,0.2)',
                  },
                  '&.Mui-error': {
                    boxShadow: '0 0 0 2px rgba(186,26,26,0.2)',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  pl: 1.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 0.5 }}>
                    <LockIcon sx={{ color: '#534434', fontSize: 22, transition: 'color 0.2s' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: '#534434', mr: 0.5 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              disableElevation
              sx={{
                height: 56,
                fontSize: '1rem',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #855300, #f59e0b)',
                color: '#ffffff',
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(245,158,11,0.25)',
                transition: 'all 0.15s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6b4400, #e8920a)',
                  boxShadow: '0 12px 28px rgba(245,158,11,0.35)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                '&.Mui-disabled': {
                  background: '#f3f4f5',
                  color: '#534434',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mt: 4,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#4ade80',
                boxShadow: '0 0 6px rgba(74,222,128,0.4)',
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.8125rem',
                fontWeight: 400,
                color: '#534434',
                opacity: 0.6,
              }}
            >
              Hệ thống đang hoạt động
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
