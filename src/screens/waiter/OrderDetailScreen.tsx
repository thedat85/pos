// ============================================
// SCR-06: Order Detail Screen (Realtime)
// Stitch Tactile Atelier design
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  AccessTime as TimeIcon,
  Send as SendIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';
import { useRealtimeTable } from '../../hooks/useRealtime';
import {
  ORDER_STATUS_LABELS,
  ORDER_ITEM_STATUS_LABELS,
  formatOrderCode,
} from '../../lib/constants';
import type { Order, OrderItem } from '../../types';

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
  successDark: '#16a34a',
  secondaryContainer: '#ffddb8',
  outline: '#e0ddd9',
  shadow: '0 12px 32px rgba(25,28,29,0.04)',
};

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const STATUS_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  new: { bg: '#f3f4f5', color: S.onSurfaceVariant },
  sent_to_kitchen: { bg: '#e0f2fe', color: S.tertiary },
  preparing: { bg: S.secondaryContainer, color: S.primary },
  completed: { bg: '#dcfce7', color: S.successDark },
  done: { bg: '#dcfce7', color: S.successDark },
  closed: { bg: '#fee2e2', color: S.error },
};

const getChipStyle = (status: string) =>
  STATUS_CHIP_STYLES[status] || { bg: '#f3f4f5', color: S.onSurfaceVariant };

export default function OrderDetailScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canPayDirectly = user?.role === 'cashier' || user?.role === 'manager';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const prevItemStatusRef = useRef<Map<string, string>>(new Map());

  // Track local quantity edits: itemId → new quantity
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  // Track items marked for removal
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

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

  const items: OrderItem[] = order?.items || [];

  // Check if there are pending changes
  const hasChanges = useMemo(() => {
    if (removedItems.size > 0) return true;
    for (const [itemId, newQty] of Object.entries(editedQuantities)) {
      const original = items.find((i) => i.id === itemId);
      if (original && original.quantity !== newQty) return true;
    }
    return false;
  }, [editedQuantities, removedItems, items]);

  const getDisplayQuantity = (item: OrderItem) =>
    editedQuantities[item.id] ?? item.quantity;

  const handleQuantityChange = (item: OrderItem, delta: number) => {
    const current = getDisplayQuantity(item);
    const newQty = Math.max(1, current + delta);
    setEditedQuantities((prev) => ({ ...prev, [item.id]: newQty }));
  };

  const handleRemoveItem = (itemId: string) => {
    setRemovedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId); // toggle undo
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSubmitChanges = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      // 1. Remove items
      const removeIds = Array.from(removedItems);
      for (const itemId of removeIds) {
        await orderService.removeItem(itemId);
      }

      // 2. Update quantities
      for (const [itemId, newQty] of Object.entries(editedQuantities)) {
        if (removedItems.has(itemId)) continue;
        const original = items.find((i) => i.id === itemId);
        if (original && original.quantity !== newQty) {
          await orderService.updateItemQuantity(itemId, newQty);
        }
      }

      // 3. Re-send to kitchen (updates status of 'new' items)
      await orderService.sendToKitchen(order.id);

      // Reset edit state
      setEditedQuantities({});
      setRemovedItems(new Set());
      toast.success('Đã cập nhật và gửi lại bếp!');
      await loadOrder();
    } catch (err) {
      toast.error('Lỗi cập nhật đơn hàng');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscardChanges = () => {
    setEditedQuantities({});
    setRemovedItems(new Set());
  };

  // Calculate totals based on edited state
  const displayItems = items.filter((i) => !removedItems.has(i.id));
  const subtotal = displayItems.reduce(
    (sum, item) => sum + item.item_price * getDisplayQuantity(item),
    0,
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: S.surface,
        }}
      >
        <CircularProgress sx={{ color: S.primaryContainer }} />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: S.surface, minHeight: '100vh' }}>
        <Typography sx={{ color: S.onSurfaceVariant, fontSize: '0.875rem' }}>
          Không tìm thấy đơn hàng
        </Typography>
      </Box>
    );
  }

  const orderStatusStyle = getChipStyle(order.status);

  // Can edit items that are 'new' or 'sent_to_kitchen' (not yet being prepared)
  const canEditItem = (item: OrderItem) =>
    item.status === 'new' || item.status === 'sent_to_kitchen';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: S.surface,
        fontFamily: '"Inter", sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Sticky Header ── */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: S.surfaceLowest,
          borderBottom: `1px solid ${S.outline}`,
          px: { xs: 2, md: 3 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <IconButton
          onClick={() => navigate('/waiter/tables')}
          sx={{
            color: S.onSurface,
            border: `1px solid ${S.outline}`,
            borderRadius: '0.75rem',
            width: 40,
            height: 40,
            '&:hover': { bgcolor: S.surfaceLow },
          }}
        >
          <BackIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              fontWeight: 700,
              color: S.onSurface,
              fontFamily: '"Manrope", sans-serif',
            }}
          >
            Bàn {order.table?.table_no || '---'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            <TimeIcon sx={{ fontSize: 14, color: S.onSurfaceVariant }} />
            <Typography sx={{ fontSize: '0.75rem', color: S.onSurfaceVariant }}>
              {formatTime(order.created_at)}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={ORDER_STATUS_LABELS[order.status] || order.status}
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: orderStatusStyle.bg,
            color: orderStatusStyle.color,
            borderRadius: '0.75rem',
            height: 28,
          }}
        />
      </Box>

      {/* ── Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2, md: 3 }, py: 2 }}>
        {/* Order ID */}
        <Typography sx={{ fontSize: '0.75rem', color: S.onSurfaceVariant, mb: 2 }}>
          Mã đơn: {formatOrderCode(order)}
        </Typography>

        {/* ── Items List ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {items.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                bgcolor: S.surfaceLowest,
                borderRadius: '1rem',
                border: `1px solid ${S.outline}`,
              }}
            >
              <RestaurantIcon sx={{ fontSize: 40, color: S.outline, mb: 1 }} />
              <Typography sx={{ color: S.onSurfaceVariant, fontSize: '0.875rem' }}>
                Chưa có món nào
              </Typography>
            </Box>
          ) : (
            items.map((item) => {
              const isRemoved = removedItems.has(item.id);
              const chipStyle = getChipStyle(item.status);
              const editable = canEditItem(item);
              const qty = getDisplayQuantity(item);
              const originalQty = item.quantity;
              const qtyChanged = editedQuantities[item.id] !== undefined && editedQuantities[item.id] !== originalQty;

              return (
                <Box
                  key={item.id}
                  sx={{
                    bgcolor: S.surfaceLowest,
                    borderRadius: '1rem',
                    border: `1px solid ${isRemoved ? S.error : S.outline}`,
                    p: { xs: 1.5, md: 2 },
                    opacity: isRemoved ? 0.45 : 1,
                    transition: 'all 0.2s ease',
                    textDecoration: isRemoved ? 'line-through' : 'none',
                  }}
                >
                  {/* Top row: name + status chip */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        fontWeight: 600,
                        color: S.onSurface,
                        flex: 1,
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.item_name}
                    </Typography>
                    <Chip
                      label={ORDER_ITEM_STATUS_LABELS[item.status] || item.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        bgcolor: chipStyle.bg,
                        color: chipStyle.color,
                        borderRadius: '0.5rem',
                        height: 24,
                        flexShrink: 0,
                      }}
                    />
                  </Box>

                  {/* Bottom row: price + quantity controls + remove */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    {/* Price */}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: S.onSurfaceVariant }}>
                        {formatVND(item.item_price)} x {qty}
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: S.primary }}>
                        {formatVND(item.item_price * qty)}
                        {qtyChanged && !isRemoved && (
                          <Box
                            component="span"
                            sx={{ fontSize: '0.7rem', color: S.tertiary, ml: 0.75, fontWeight: 500 }}
                          >
                            (đã sửa)
                          </Box>
                        )}
                      </Typography>
                    </Box>

                    {/* Quantity controls + remove */}
                    {editable && !isRemoved && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item, -1)}
                          disabled={qty <= 1}
                          sx={{
                            width: 32,
                            height: 32,
                            border: `1px solid ${S.outline}`,
                            borderRadius: '0.5rem',
                            color: S.onSurface,
                            '&:hover': { bgcolor: S.surfaceLow },
                            '&.Mui-disabled': { opacity: 0.3 },
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography
                          sx={{
                            minWidth: 28,
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: S.onSurface,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {qty}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item, 1)}
                          sx={{
                            width: 32,
                            height: 32,
                            border: `1px solid ${S.outline}`,
                            borderRadius: '0.5rem',
                            color: S.onSurface,
                            '&:hover': { bgcolor: S.surfaceLow },
                          }}
                        >
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(item.id)}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '0.5rem',
                            color: S.error,
                            ml: 0.5,
                            '&:hover': { bgcolor: 'rgba(186,26,26,0.08)' },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}

                    {/* Undo remove */}
                    {editable && isRemoved && (
                      <Button
                        size="small"
                        onClick={() => handleRemoveItem(item.id)}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: S.tertiary,
                          borderRadius: '0.5rem',
                          minWidth: 0,
                          px: 1.5,
                        }}
                      >
                        Hoàn tác
                      </Button>
                    )}

                    {/* Non-editable: just show qty */}
                    {!editable && (
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: S.onSurfaceVariant,
                        }}
                      >
                        SL: {item.quantity}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* ── Totals ── */}
        {items.length > 0 && (
          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: '1rem',
              bgcolor: S.surfaceLowest,
              border: `1px solid ${S.outline}`,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: S.onSurfaceVariant, fontSize: '0.875rem' }}>
                Tạm tính
              </Typography>
              <Typography sx={{ color: S.onSurface, fontSize: '0.875rem' }}>
                {formatVND(subtotal)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: S.onSurfaceVariant, fontSize: '0.875rem' }}>
                Thuế (VAT)
              </Typography>
              <Typography sx={{ color: S.onSurface, fontSize: '0.875rem' }}>
                {formatVND(order.tax_amount || 0)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ color: S.onSurfaceVariant, fontSize: '0.875rem' }}>
                Phí dịch vụ
              </Typography>
              <Typography sx={{ color: S.onSurface, fontSize: '0.875rem' }}>
                {formatVND(order.service_fee || 0)}
              </Typography>
            </Box>
            <Box
              sx={{
                pt: 1.5,
                borderTop: `2px solid ${S.surfaceLow}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: S.onSurface,
                  fontFamily: '"Manrope", sans-serif',
                }}
              >
                TỔNG CỘNG
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: S.primary,
                  fontFamily: '"Manrope", sans-serif',
                }}
              >
                {formatVND(hasChanges ? subtotal + (order.tax_amount || 0) + (order.service_fee || 0) : (order.total || subtotal))}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Sticky Bottom Actions ── */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          bgcolor: S.surfaceLowest,
          borderTop: `1px solid ${S.outline}`,
          px: { xs: 2, md: 3 },
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Changes bar — only when edits exist */}
        {hasChanges && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleDiscardChanges}
              sx={{
                flex: 1,
                minHeight: 44,
                borderRadius: '0.75rem',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderColor: S.outline,
                color: S.onSurfaceVariant,
                '&:hover': { borderColor: S.onSurfaceVariant, bgcolor: S.surfaceLow },
              }}
            >
              Hủy thay đổi
            </Button>
            <Button
              variant="contained"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
              disabled={submitting}
              onClick={handleSubmitChanges}
              sx={{
                flex: 1.5,
                minHeight: 44,
                borderRadius: '0.75rem',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                bgcolor: S.tertiary,
                boxShadow: 'none',
                fontFamily: '"Inter", sans-serif',
                '&:hover': { bgcolor: '#004c6a', boxShadow: 'none' },
              }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi lại bếp'}
            </Button>
          </Box>
        )}

        {/* Main actions */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/waiter/orders/${order.table_id}`)}
            sx={{
              flex: 1,
              minHeight: 48,
              borderRadius: '0.75rem',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderColor: S.primaryContainer,
              color: S.primary,
              '&:hover': {
                borderColor: S.primaryContainer,
                bgcolor: 'rgba(245,158,11,0.06)',
              },
            }}
          >
            Thêm món
          </Button>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={() => {
              if (canPayDirectly) {
                navigate(`/cashier/payment/${order.id}`);
              } else {
                toast.success('Đã gửi yêu cầu thanh toán cho thu ngân');
                navigate('/waiter/tables');
              }
            }}
            sx={{
              flex: 1,
              minHeight: 48,
              borderRadius: '0.75rem',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              bgcolor: S.tertiary,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#004c6a',
                boxShadow: 'none',
              },
            }}
          >
            {canPayDirectly ? 'Thanh toán' : 'Yêu cầu thanh toán'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
