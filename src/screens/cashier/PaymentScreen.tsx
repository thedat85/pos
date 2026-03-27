// ============================================
// SCR-08: Payment / Checkout Screen — Stitch Tactile Atelier
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,


  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  QrCode as QrCodeIcon,
  AttachMoney as CashIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import { ORDER_STATUS, formatOrderCode } from '../../lib/constants';
import type { Order } from '../../types';

/* ── Stitch Tactile Atelier tokens ── */
const S = {
  surface: '#f8f9fa',
  surfaceLow: '#f3f4f5',
  surfaceLowest: '#ffffff',
  onSurface: '#191c1d',
  onSurfaceVariant: '#534434',
  primary: '#855300',
  primaryContainer: '#f59e0b',
  tertiary: '#00658b',
  tertiaryContainer: '#1abdff',
  error: '#ba1a1a',
  success: '#4ade80',
  secondaryContainer: '#ffddb8',
  outline: '#e0ddd9',
  shadow: '0 12px 32px rgba(25,28,29,0.04)',
  tabBg: '#edeeef',
};

interface OrderTotals {
  subtotal: number;
  tax: number;
  service_fee: number;
  total: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [totals, setTotals] = useState<OrderTotals | null>(null);
  const [doneOrders, setDoneOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orderId ?? null
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Payment form state
  const [paymentTab, setPaymentTab] = useState(0); // 0 = cash, 1 = qr
  const [amountReceived, setAmountReceived] = useState('');

  // Load list of done orders if no orderId in URL
  useEffect(() => {
    if (!orderId) {
      const loadDoneOrders = async () => {
        try {
          const result = await orderService.getAll({
            status: ORDER_STATUS.DONE as string,
          });
          setDoneOrders(result.data);
        } catch (err) {
          console.error('Failed to load orders:', err);
          toast.error('Không thể tải danh sách đơn hàng');
        } finally {
          setLoading(false);
        }
      };
      loadDoneOrders();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  // Load selected order details
  useEffect(() => {
    if (!selectedOrderId) return;

    const loadOrder = async () => {
      try {
        const [invoiceData, totalData] = await Promise.all([
          paymentService.getInvoice(selectedOrderId),
          paymentService.calculateTotal(selectedOrderId),
        ]);
        setOrder(invoiceData);
        setTotals(totalData);
      } catch (err) {
        console.error('Failed to load order:', err);
        toast.error('Không thể tải thông tin đơn hàng');
      }
    };
    loadOrder();
  }, [selectedOrderId]);

  const changeAmount = useMemo(() => {
    if (!totals) return 0;
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - totals.total);
  }, [amountReceived, totals]);

  const qrUrl = useMemo(() => {
    if (!selectedOrderId || !totals) return '';
    return paymentService.generateQR(selectedOrderId, totals.total);
  }, [selectedOrderId, totals]);

  const canPay = useMemo(() => {
    if (!totals) return false;
    if (paymentTab === 0) {
      const received = parseFloat(amountReceived) || 0;
      return received >= totals.total;
    }
    // QR — always enabled
    return true;
  }, [paymentTab, amountReceived, totals]);

  const handlePayment = async () => {
    if (!selectedOrderId || !totals || !user) return;

    const method = paymentTab === 0 ? 'cash' : 'qr';
    const received = paymentTab === 0 ? parseFloat(amountReceived) || 0 : totals.total;

    if (method === 'cash' && received < totals.total) {
      toast.error('Số tiền khách đưa không đủ');
      return;
    }

    const change = method === 'cash' ? Math.max(0, received - totals.total) : 0;

    setProcessing(true);
    try {
      await paymentService.processPayment({
        order_id: selectedOrderId,
        method,
        amount: totals.total,
        amount_received: received,
        change_amount: change,
        cashier_id: user.id,
      });
      toast.success('Thanh toán thành công!');
      setTimeout(() => {
        navigate('/waiter/tables');
      }, 300);
    } catch (err) {
      console.error('Payment failed:', err);
      toast.error('Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  /* ── Order selection list ── */
  if (!selectedOrderId) {
    return (
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          bgcolor: S.surface,
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 700,
            color: S.onSurface,
            mb: 4,
            fontFamily: 'Manrope, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <PaymentIcon sx={{ color: S.tertiary }} />
          Chọn đơn hàng để thanh toán
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress sx={{ color: S.tertiary }} />
          </Box>
        ) : doneOrders.length === 0 ? (
          <Card
            sx={{
              borderRadius: '1.5rem',
              boxShadow: S.shadow,
              border: 'none',
              p: 5,
              textAlign: 'center',
              bgcolor: S.surfaceLowest,
            }}
          >
            <Typography sx={{ color: S.onSurfaceVariant, fontSize: 18 }}>
              Không có đơn hàng nào cần thanh toán
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {doneOrders.map((o) => (
              <Card
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                sx={{
                  borderRadius: '1.5rem',
                  boxShadow: S.shadow,
                  border: 'none',
                  bgcolor: S.surfaceLowest,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: S.surfaceLow,
                    boxShadow: '0 16px 40px rgba(25,28,29,0.08)',
                  },
                }}
              >
                <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 20,
                        color: S.onSurface,
                        fontFamily: 'Manrope, sans-serif',
                      }}
                    >
                      Bàn {o.table?.table_no ?? '??'}
                    </Typography>
                    <Chip
                      label={formatCurrency(o.total)}
                      size="small"
                      sx={{
                        bgcolor: S.secondaryContainer,
                        color: S.primary,
                        fontWeight: 700,
                        borderRadius: '0.75rem',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: S.onSurfaceVariant,
                      mt: 0.5,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Đơn hàng #{formatOrderCode(o)} -{' '}
                    {new Date(o.created_at).toLocaleString('vi-VN')}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  /* ── Main payment screen — split layout ── */
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: S.surface,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {!order || !totals ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress sx={{ color: S.tertiary }} />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: 0,
            overflow: { xs: 'auto', md: 'hidden' },
          }}
        >
          {/* ── LEFT: Order Summary ── */}
          <Box
            sx={{
              flex: { xs: 'none', md: '1.2' },
              p: { xs: 2, md: 4 },
              overflow: 'auto',
            }}
          >
            <Card
              sx={{
                borderRadius: '1.5rem',
                boxShadow: S.shadow,
                border: 'none',
                bgcolor: S.surfaceLowest,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                {/* Order header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: S.onSurface,
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    Bàn {order.table?.table_no ?? '??'} - Đơn #{formatOrderCode(order)}
                  </Typography>
                  <Chip
                    label="Chưa thanh toán"
                    sx={{
                      bgcolor: S.secondaryContainer,
                      color: S.primary,
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: '0.75rem',
                      height: 32,
                    }}
                  />
                </Box>

                {/* Item rows — breathing list, NO dividers */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(order.items ?? []).map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: S.onSurface,
                          }}
                        >
                          {item.item_name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 14,
                            color: S.onSurfaceVariant,
                          }}
                        >
                          {item.quantity} x {formatCurrency(item.item_price)}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: S.onSurface,
                        }}
                      >
                        {formatCurrency(item.item_price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Subtotals */}
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: S.onSurfaceVariant, fontSize: 15 }}>
                      Tạm tính
                    </Typography>
                    <Typography sx={{ color: S.onSurface, fontSize: 15 }}>
                      {formatCurrency(totals.subtotal)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: S.onSurfaceVariant, fontSize: 15 }}>
                      Thuế
                    </Typography>
                    <Typography sx={{ color: S.onSurface, fontSize: 15 }}>
                      {formatCurrency(totals.tax)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: S.onSurfaceVariant, fontSize: 15 }}>
                      Phí dịch vụ
                    </Typography>
                    <Typography sx={{ color: S.onSurface, fontSize: 15 }}>
                      {formatCurrency(totals.service_fee)}
                    </Typography>
                  </Box>
                </Box>

                {/* Grand total */}
                <Box
                  sx={{
                    mt: 3,
                    pt: 3,
                    borderTop: `2px solid ${S.surfaceLow}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: S.onSurface,
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    TỔNG CỘNG
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: S.onSurface,
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    {formatCurrency(totals.total)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* ── RIGHT: Payment Method ── */}
          <Box
            sx={{
              flex: { xs: 'none', md: 1 },
              p: { xs: 2, md: 4 },
              overflow: 'auto',
              bgcolor: S.surfaceLow,
            }}
          >
            {/* Tab switcher — pill style */}
            <Box
              sx={{
                bgcolor: S.tabBg,
                borderRadius: '1.5rem',
                p: '6px',
                display: 'flex',
                gap: 0.5,
                mb: 4,
              }}
            >
              {[
                { icon: <CashIcon sx={{ fontSize: 20 }} />, label: 'Tiền mặt', idx: 0 },
                { icon: <QrCodeIcon sx={{ fontSize: 20 }} />, label: 'QR Code', idx: 1 },
              ].map((tab) => (
                <Button
                  key={tab.idx}
                  onClick={() => {
                    setPaymentTab(tab.idx);
                    setAmountReceived('');
                  }}
                  startIcon={tab.icon}
                  sx={{
                    flex: 1,
                    borderRadius: '1.25rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 15,
                    py: 1.5,
                    bgcolor: paymentTab === tab.idx ? S.surfaceLowest : 'transparent',
                    color: paymentTab === tab.idx ? S.onSurface : S.onSurfaceVariant,
                    boxShadow: paymentTab === tab.idx ? '0 2px 8px rgba(25,28,29,0.08)' : 'none',
                    '&:hover': {
                      bgcolor: paymentTab === tab.idx ? S.surfaceLowest : 'rgba(0,0,0,0.03)',
                    },
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>

            {/* Cash tab */}
            {paymentTab === 0 && (
              <Box>
                {/* Amount input — large */}
                <TextField
                  placeholder="0"
                  type="number"
                  fullWidth
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '1rem',
                      bgcolor: S.surfaceLow,
                      height: 56,
                      fontSize: 48,
                      fontWeight: 900,
                      fontFamily: 'Manrope, sans-serif',
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: S.outline },
                      '&.Mui-focused fieldset': {
                        borderColor: S.primaryContainer,
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: S.primaryContainer,
                    },
                  }}
                  inputProps={{ min: 0 }}
                  autoFocus
                />

                {/* Change display — large tertiary */}
                <Box
                  sx={{
                    border: `2px dashed ${changeAmount > 0 ? S.tertiary : S.outline}`,
                    borderRadius: '2rem',
                    p: { xs: 2.5, md: 4 },
                    textAlign: 'center',
                    mb: 3,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: S.onSurfaceVariant,
                      mb: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Tiền thừa
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.75rem' },
                      fontWeight: 900,
                      color: changeAmount > 0 ? S.tertiary : S.onSurfaceVariant,
                      fontFamily: 'Manrope, sans-serif',
                      lineHeight: 1,
                      opacity: changeAmount > 0 ? 1 : 0.35,
                    }}
                  >
                    {formatCurrency(changeAmount)}
                  </Typography>
                </Box>

                {/* Quick amounts — grid 4 cols, 2 on mobile */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 1.5,
                  }}
                >
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outlined"
                      onClick={() => setAmountReceived(amt.toString())}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '1rem',
                        borderColor: S.outline,
                        color: S.onSurface,
                        fontWeight: 600,
                        minHeight: 48,
                        fontSize: 14,
                        '&:hover': {
                          borderColor: S.primaryContainer,
                          bgcolor: 'rgba(245,158,11,0.06)',
                        },
                      }}
                    >
                      {formatCurrency(amt)}
                    </Button>
                  ))}
                  {totals && (
                    <Button
                      variant="outlined"
                      onClick={() => setAmountReceived(totals.total.toString())}
                      sx={{
                        textTransform: 'none',
                        gridColumn: { xs: '1 / -1', md: '1 / -1' },
                        borderRadius: '1rem',
                        borderColor: S.primaryContainer,
                        color: S.primary,
                        fontWeight: 700,
                        minHeight: 48,
                        fontSize: 14,
                        '&:hover': {
                          bgcolor: 'rgba(245,158,11,0.08)',
                          borderColor: S.primaryContainer,
                        },
                      }}
                    >
                      Đúng số tiền: {formatCurrency(totals.total)}
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            {/* QR tab */}
            {paymentTab === 1 && (
              <Box sx={{ textAlign: 'center' }}>
                <Card
                  sx={{
                    borderRadius: '1.5rem',
                    boxShadow: S.shadow,
                    border: 'none',
                    display: 'inline-block',
                    p: 3,
                    mb: 3,
                    bgcolor: S.surfaceLowest,
                  }}
                >
                  <Box
                    component="img"
                    src={qrUrl}
                    alt="QR Code thanh toán"
                    sx={{
                      width: 250,
                      height: 250,
                      display: 'block',
                      borderRadius: '1rem',
                    }}
                  />
                </Card>
                <Typography
                  sx={{
                    fontSize: 24,
                    fontWeight: 700,
                    mb: 3,
                    color: S.onSurface,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  {formatCurrency(totals.total)}
                </Typography>

              </Box>
            )}

            {/* Complete button — large tertiary */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={!canPay || processing}
              onClick={handlePayment}
              startIcon={
                processing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <CheckIcon sx={{ fontSize: 28 }} />
                )
              }
              sx={{
                mt: { xs: 3, md: 4 },
                height: { xs: 64, md: 96 },
                fontSize: { xs: 16, md: 20 },
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '1.5rem',
                bgcolor: S.tertiary,
                boxShadow: 'none',
                fontFamily: 'Manrope, sans-serif',
                '&:hover': {
                  bgcolor: '#004c6a',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  bgcolor: S.tabBg,
                  color: '#9e9e9e',
                },
              }}
            >
              {processing ? 'Đang xử lý...' : 'Hoàn tất thanh toán'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
