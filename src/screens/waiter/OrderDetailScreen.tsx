// ============================================
// SCR-06: Order Detail Screen (Realtime) (M3)
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';
import { useRealtimeTable } from '../../hooks/useRealtime';
import {
  ORDER_STATUS_LABELS,
  ORDER_ITEM_STATUS_LABELS,
} from '../../lib/constants';
import type { Order, OrderItem } from '../../types';

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    amount,
  );

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const STATUS_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  new: { bg: '#F7F2FA', color: '#49454F' },
  sent_to_kitchen: { bg: '#E3F2FD', color: '#0D47A1' },
  preparing: { bg: '#FFF3E0', color: '#E65100' },
  completed: { bg: '#E8F5E9', color: '#1B5E20' },
  done: { bg: '#E8F5E9', color: '#1B5E20' },
  closed: { bg: '#FFEBEE', color: '#B71C1C' },
};

const getChipStyle = (status: string) =>
  STATUS_CHIP_STYLES[status] || { bg: '#F7F2FA', color: '#49454F' };

export default function OrderDetailScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canPayDirectly = user?.role === 'cashier' || user?.role === 'manager';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const prevItemStatusRef = useRef<Map<string, string>>(new Map());

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await orderService.getById(orderId);
      setOrder(data);

      // Check for newly completed items and notify
      if (data.items) {
        const prevMap = prevItemStatusRef.current;
        data.items.forEach((item: OrderItem) => {
          const prevStatus = prevMap.get(item.id);
          if (prevStatus && prevStatus !== 'completed' && item.status === 'completed') {
            toast.success(`Món "${item.item_name}" đã xong!`, { icon: '✅' });
          }
          prevMap.set(item.id, item.status);
        });
      }
    } catch (err) {
      toast.error('Không thể tải thông tin đơn hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Realtime updates when kitchen changes order_items
  useRealtimeTable(
    'order_items',
    '*',
    useCallback(() => {
      loadOrder();
    }, [loadOrder]),
    orderId ? `order_id=eq.${orderId}` : undefined,
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress sx={{ color: '#C62828' }} />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: '#B71C1C', fontSize: '0.875rem' }}>
          Không tìm thấy đơn hàng
        </Typography>
      </Box>
    );
  }

  const items: OrderItem[] = order.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.item_price * item.quantity,
    0,
  );

  const orderStatusStyle = getChipStyle(order.status);

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto', bgcolor: '#FFFBFE', minHeight: '100vh' }}>
      {/* Header Card */}
      <Box
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '16px',
          bgcolor: '#F7F2FA',
          border: '1px solid #E7E0EC',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 400,
              color: '#1C1B1F',
            }}
          >
            Ban {order.table?.table_no || '---'}
          </Typography>
          <Chip
            label={ORDER_STATUS_LABELS[order.status] || order.status}
            sx={{
              fontWeight: 600,
              fontSize: '0.8125rem',
              bgcolor: orderStatusStyle.bg,
              color: orderStatusStyle.color,
              borderRadius: '8px',
            }}
          />
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon sx={{ fontSize: 18, color: '#79747E' }} />
            <Typography sx={{ fontSize: '0.875rem', color: '#79747E' }}>
              {formatTime(order.created_at)}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.8125rem', color: '#79747E' }}>
          Mã đơn: {order.id}
        </Typography>
      </Box>

      {/* Items Table */}
      <TableContainer
        sx={{
          mb: 3,
          borderRadius: '16px',
          border: '1px solid #E7E0EC',
          bgcolor: '#fff',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F7F2FA' }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textTransform: 'uppercase',
                  color: '#49454F',
                  borderBottom: '1px solid #E7E0EC',
                }}
              >
                Món
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textTransform: 'uppercase',
                  color: '#49454F',
                  borderBottom: '1px solid #E7E0EC',
                }}
              >
                SL
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textTransform: 'uppercase',
                  color: '#49454F',
                  borderBottom: '1px solid #E7E0EC',
                }}
              >
                Đơn giá
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textTransform: 'uppercase',
                  color: '#49454F',
                  borderBottom: '1px solid #E7E0EC',
                }}
              >
                Thành tiền
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textTransform: 'uppercase',
                  color: '#49454F',
                  borderBottom: '1px solid #E7E0EC',
                }}
              >
                Trạng thái
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const chipStyle = getChipStyle(item.status);
              return (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': { bgcolor: '#F7F2FA' },
                    '& td': { borderBottom: '1px solid #E7E0EC' },
                  }}
                >
                  <TableCell sx={{ fontSize: '0.875rem', color: '#1C1B1F' }}>
                    {item.item_name}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.875rem', color: '#1C1B1F' }}>
                    {item.quantity}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#49454F' }}>
                    {formatVND(item.item_price)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1C1B1F' }}>
                    {formatVND(item.item_price * item.quantity)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        ORDER_ITEM_STATUS_LABELS[item.status] || item.status
                      }
                      size="small"
                      sx={{
                        fontWeight: 600,
                        minWidth: 70,
                        fontSize: '0.75rem',
                        bgcolor: chipStyle.bg,
                        color: chipStyle.color,
                        borderRadius: '8px',
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography sx={{ color: '#79747E', fontSize: '0.875rem' }}>
                    Chưa có món nào
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Card */}
      <Box
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '16px',
          bgcolor: '#FFDAD4',
          border: '1px solid #E7E0EC',
        }}
      >
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#49454F', fontSize: '0.875rem' }}>Tạm tính</Typography>
            <Typography sx={{ color: '#1C1B1F', fontSize: '0.875rem' }}>{formatVND(subtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#49454F', fontSize: '0.875rem' }}>Thuế (VAT)</Typography>
            <Typography sx={{ color: '#1C1B1F', fontSize: '0.875rem' }}>{formatVND(order.tax_amount || 0)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#49454F', fontSize: '0.875rem' }}>Phí dịch vụ</Typography>
            <Typography sx={{ color: '#1C1B1F', fontSize: '0.875rem' }}>{formatVND(order.service_fee || 0)}</Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(198,40,40,0.2)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 500,
                color: '#1C1B1F',
              }}
            >
              Tổng cộng
            </Typography>
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#C62828',
              }}
            >
              {formatVND(order.total || subtotal)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/waiter/orders/${order.table_id}`)}
          sx={{
            flex: 1,
            minHeight: 48,
            borderRadius: '100px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderColor: '#C62828',
            color: '#C62828',
            '&:hover': {
              borderColor: '#B71C1C',
              bgcolor: 'rgba(198,40,40,0.04)',
            },
          }}
          size="large"
        >
          Thêm món
        </Button>
        <Button
          variant="contained"
          startIcon={<PaymentIcon />}
          onClick={() => {
            if (canPayDirectly) {
              // Cashier/Manager → navigate thẳng tới màn hình thanh toán
              navigate(`/cashier/payment/${order.id}`);
            } else {
              // Waiter → chỉ thông báo cho thu ngân
              toast.success('Đã gửi yêu cầu thanh toán cho thu ngân');
              navigate('/waiter/tables');
            }
          }}
          sx={{
            flex: 1,
            minHeight: 48,
            borderRadius: '100px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            bgcolor: canPayDirectly ? '#2E7D32' : '#C62828',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: canPayDirectly ? '#1B5E20' : '#B71C1C',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            },
          }}
          size="large"
        >
          {canPayDirectly ? 'Thanh toán ngay' : 'Yêu cầu thanh toán'}
        </Button>
      </Box>
    </Box>
  );
}
