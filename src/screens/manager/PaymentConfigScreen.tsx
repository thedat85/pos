import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  AccountBalance as BankIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { configService } from '../../services/configService';
import { PaymentConfig } from '../../types';

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

const PaymentConfigScreen: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configService.getPaymentConfig();
      setConfig(data);
      if (data) {
        setForm({
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment config');
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
      await configService.updatePaymentConfig({
        bank_name: form.bank_name.trim(),
        account_number: form.account_number.trim(),
        account_name: form.account_name.trim(),
      });
      toast.success('Lưu cấu hình thanh toán thành công');
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
            Cấu hình thanh toán
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
            Thiết lập thông tin tài khoản ngân hàng và QR thanh toán
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
        {/* Bank Account Card */}
        <Card sx={m3Card}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <BankIcon sx={{ color: '#6750A4' }} />
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                Tài khoản nhận tiền
              </Typography>
            </Stack>
            <TextField
              label="Tên ngân hàng"
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              fullWidth
              sx={m3TextField}
            />
            <TextField
              label="Số tài khoản"
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              fullWidth
              sx={m3TextField}
            />
            <TextField
              label="Tên chủ tài khoản"
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              fullWidth
              sx={{ ...m3TextField, mb: 0 }}
            />
          </CardContent>
        </Card>

        {/* QR Preview Card */}
        <Card sx={m3Card}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <QrCodeIcon sx={{ color: '#6750A4' }} />
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                QR Code Preview
              </Typography>
            </Stack>
            <Box
              sx={{
                border: '1px dashed #CAC4D0',
                borderRadius: '16px',
                p: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
                backgroundColor: '#F7F2FA',
              }}
            >
              {form.bank_name && form.account_number ? (
                <Box textAlign="center">
                  <img
                    src={`https://img.vietqr.io/image/${form.bank_name}-${form.account_number}-compact2.png?amount=0&addInfo=Preview`}
                    alt="QR Preview"
                    style={{ maxWidth: 200, maxHeight: 200, borderRadius: 12 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#79747E', mt: 1.5 }}>
                    {form.account_name}
                  </Typography>
                </Box>
              ) : (
                <Box textAlign="center">
                  <QrCodeIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#79747E' }}>
                    Nhập thông tin ngân hàng để xem QR preview
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default PaymentConfigScreen;
