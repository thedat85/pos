import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Switch,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { configService } from '../../services/configService';
import { SystemConfig } from '../../types';

interface ConfigValues {
  tax_percent: string;
  service_fee_percent: string;
  min_reservation_minutes: string;
  allow_incomplete_payment: string;
}

const defaultValues: ConfigValues = {
  tax_percent: '10',
  service_fee_percent: '5',
  min_reservation_minutes: '30',
  allow_incomplete_payment: 'false',
};

/* M3 shared styles */
const m3Card = {
  borderRadius: '16px',
  border: '1px solid #E7E0EC',
  boxShadow: 'none',
  '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
};

const m3TextField = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px' },
  mb: 3,
};

const m3Btn = { borderRadius: '100px', textTransform: 'none' as const };

const m3Switch = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#6750A4' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6750A4' },
};

const SystemConfigScreen: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [values, setValues] = useState<ConfigValues>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configService.getSystemConfig();
      setConfigs(data);

      const newValues = { ...defaultValues };
      data.forEach((config) => {
        if (config.key in newValues) {
          (newValues as any)[config.key] = config.value;
        }
      });
      setValues(newValues);
    } catch (err: any) {
      setError(err.message || 'Failed to load system config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(values).map(([key, value]) =>
        configService.updateSystemConfig(key, value)
      );
      await Promise.all(updates);
      toast.success('Lưu cấu hình hệ thống thành công');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* M3 Page Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 400 }}>
            Cấu hình hệ thống
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
            Thiết lập các thông số hệ thống
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ ...m3Btn, px: 3 }}
        >
          {saving ? <CircularProgress size={20} /> : 'Lưu cấu hình'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        {/* Tax & Fee Card */}
        <Card sx={m3Card}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <SettingsIcon sx={{ color: '#6750A4' }} />
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                Thuế và phí
              </Typography>
            </Stack>

            <TextField
              label="Thuế VAT"
              type="number"
              value={values.tax_percent}
              onChange={(e) =>
                setValues({ ...values, tax_percent: e.target.value })
              }
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" sx={{ color: '#79747E', fontWeight: 500 }}>%</Typography>
                  </InputAdornment>
                ),
              }}
              sx={m3TextField}
            />

            <TextField
              label="Phí dịch vụ"
              type="number"
              value={values.service_fee_percent}
              onChange={(e) =>
                setValues({ ...values, service_fee_percent: e.target.value })
              }
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" sx={{ color: '#79747E', fontWeight: 500 }}>%</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{ ...m3TextField, mb: 0 }}
            />
          </CardContent>
        </Card>

        {/* Reservation Card */}
        <Card sx={m3Card}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <SettingsIcon sx={{ color: '#6750A4' }} />
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                Đặt bàn
              </Typography>
            </Stack>

            <TextField
              label="Thời gian đặt bàn tối thiểu"
              type="number"
              value={values.min_reservation_minutes}
              onChange={(e) =>
                setValues({ ...values, min_reservation_minutes: e.target.value })
              }
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" sx={{ color: '#79747E', fontWeight: 500 }}>phút</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{ ...m3TextField, mb: 0 }}
            />
          </CardContent>
        </Card>

        {/* Payment Settings Card */}
        <Card sx={m3Card}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <SettingsIcon sx={{ color: '#6750A4' }} />
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                Thanh toán
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: '12px',
                backgroundColor: '#F7F2FA',
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Cho phép thanh toán không đủ
                </Typography>
                <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
                  Cho phép xác nhận đơn khi số tiền chưa đủ
                </Typography>
              </Box>
              <Switch
                checked={values.allow_incomplete_payment === 'true'}
                onChange={(e) =>
                  setValues({
                    ...values,
                    allow_incomplete_payment: e.target.checked ? 'true' : 'false',
                  })
                }
                sx={m3Switch}
              />
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default SystemConfigScreen;
