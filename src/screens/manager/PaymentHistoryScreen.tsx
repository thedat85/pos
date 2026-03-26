import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  Card,
  CardContent,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import { Payment } from '../../types';
import { DEFAULT_PAGE_SIZE, PAYMENT_METHOD } from '../../lib/constants';

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/* M3 shared styles */
const m3Card = {
  borderRadius: '16px',
  border: '1px solid #E7E0EC',
  boxShadow: 'none',
  '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
};

const m3TableHead: Record<string, any> = {
  backgroundColor: '#F7F2FA',
  '& .MuiTableCell-head': {
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    color: '#49454F',
    borderBottom: '1px solid #E7E0EC',
  },
};

const m3TableRow = {
  '& .MuiTableCell-root': { borderBottom: '1px solid #E7E0EC' },
  '&:hover': { backgroundColor: '#F7F2FA' },
};

const m3TextField = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px' },
};

const PaymentHistoryScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [method, setMethod] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit: DEFAULT_PAGE_SIZE,
      };
      if (fromDate) params.from = `${fromDate}T00:00:00`;
      if (toDate) params.to = `${toDate}T23:59:59`;
      if (method) params.method = method;

      const result = await paymentService.getHistory(params);
      setPayments(result.data);
      setTotalCount(result.count);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment history');
      toast.error('Lỗi tải lịch sử thanh toán');
    } finally {
      setLoading(false);
    }
  }, [page, fromDate, toDate, method]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const shortenId = (id: string): string => {
    return id.substring(0, 8) + '...';
  };

  return (
    <Box p={3}>
      {/* M3 Page Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 400 }}>
            Lịch sử thanh toán
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
            Xem lịch sử các giao dịch thanh toán
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ ...m3Card, mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Từ ngày"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={m3TextField}
            />
            <TextField
              label="Đến ngày"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={m3TextField}
            />
            <FormControl sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} size="small">
              <InputLabel>Phương thức</InputLabel>
              <Select
                value={method}
                label="Phương thức"
                onChange={(e) => {
                  setMethod(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value={PAYMENT_METHOD.CASH}>Cash</MenuItem>
                <MenuItem value={PAYMENT_METHOD.QR}>QR</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={m3Card}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={m3TableHead}>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Bàn</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell>Phương thức</TableCell>
                  <TableCell>Thu ngân</TableCell>
                  <TableCell>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} sx={m3TableRow}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          backgroundColor: '#F7F2FA',
                          display: 'inline-block',
                          px: 1,
                          py: 0.25,
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                        }}
                      >
                        {shortenId(payment.order_id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(payment as any).orders?.table_no ||
                        (payment.order as any)?.table?.table_no ||
                        '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      {formatVND(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.method === 'cash' ? 'Cash' : 'QR'}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 500,
                          backgroundColor:
                            payment.method === 'cash' ? '#F7F2FA' : '#E3F2FD',
                          color:
                            payment.method === 'cash' ? '#49454F' : '#0D47A1',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {(payment.cashier as any)?.full_name ||
                        (payment as any).cashier?.full_name ||
                        '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#49454F', fontSize: '0.85rem' }}>
                      {new Date(payment.created_at).toLocaleString('vi-VN')}
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <ReceiptIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          Không có dữ liệu
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#79747E' }}>
                          Không tìm thấy giao dịch nào trong khoảng thời gian này
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalCount}
              page={page - 1}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              rowsPerPage={DEFAULT_PAGE_SIZE}
              rowsPerPageOptions={[DEFAULT_PAGE_SIZE]}
              sx={{
                borderTop: '1px solid #E7E0EC',
                '& .MuiTablePagination-actions button': { borderRadius: '100px' },
              }}
            />
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default PaymentHistoryScreen;
