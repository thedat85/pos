// ============================================
// SCR-07: Kitchen Display System
// Fullscreen dark-themed Kanban board — Stitch Tactile Atelier
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Logout as LogoutIcon,
  RadioButtonUnchecked as UncheckedIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { kitchenService } from '../../services/kitchenService';
import { useKitchenRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../hooks/useAuth';
import { ORDER_ITEM_STATUS } from '../../lib/constants';
import type { Order, OrderItem } from '../../types';

/* ── Stitch Tactile Atelier — Dark Kitchen tokens ── */
const T = {
  bg: '#191c1d',
  inverseSurface: '#2e3132',
  inverseOnSurface: '#f0f1f2',
  primaryContainer: '#f59e0b',
  primary: '#855300',
  tertiaryContainer: '#1abdff',
  tertiary: '#00658b',
  success: '#4ade80',
  error: '#ba1a1a',
  primaryFixed: '#ffddb8',
  onSurfaceVariant: '#534434',
  textMuted: 'rgba(240,241,242,0.5)',
};

const pulseKeyframes = `
@keyframes stitch-pulse {
  0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.45); }
  70% { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
  100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
}
`;

interface GroupedOrder {
  order: Order;
  items: OrderItem[];
}

function getElapsedTime(createdAt: string): string {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vua moi';
  if (mins < 60) return `${mins} phut`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function isUrgent(createdAt: string): boolean {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  return mins > 15;
}

export default function KitchenDisplayScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connected, setConnected] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await kitchenService.getKitchenOrders();
      setOrders(data);
      setConnected(true);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime subscription
  useKitchenRealtime(loadOrders);

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Re-render elapsed times every 30s
  useEffect(() => {
    const timer = setInterval(() => setOrders((prev) => [...prev]), 30000);
    return () => clearInterval(timer);
  }, []);

  // Group items by order and item status
  const { pendingOrders, preparingOrders, completedOrders } = useMemo(() => {
    const grouped: Record<string, GroupedOrder> = {};

    for (const order of orders) {
      if (!order.items || order.items.length === 0) continue;
      grouped[order.id] = { order, items: order.items };
    }

    const pending: GroupedOrder[] = [];
    const preparing: GroupedOrder[] = [];
    const completed: GroupedOrder[] = [];

    Object.values(grouped).forEach((g) => {
      const pendingItems = g.items.filter(
        (i) => i.status === ORDER_ITEM_STATUS.SENT_TO_KITCHEN
      );
      const preparingItems = g.items.filter(
        (i) => i.status === ORDER_ITEM_STATUS.PREPARING
      );
      const completedItems = g.items.filter(
        (i) => i.status === ORDER_ITEM_STATUS.COMPLETED
      );

      if (pendingItems.length > 0) {
        pending.push({ order: g.order, items: pendingItems });
      }
      if (preparingItems.length > 0) {
        preparing.push({ order: g.order, items: preparingItems });
      }
      if (completedItems.length > 0) {
        completed.push({ order: g.order, items: completedItems });
      }
    });

    // FIFO - oldest first
    const sortByCreated = (a: GroupedOrder, b: GroupedOrder) =>
      new Date(a.order.created_at).getTime() - new Date(b.order.created_at).getTime();

    pending.sort(sortByCreated);
    preparing.sort(sortByCreated);
    completed.sort(sortByCreated);

    return {
      pendingOrders: pending,
      preparingOrders: preparing,
      completedOrders: completed.slice(0, 10), // limit completed shown
    };
  }, [orders]);

  const handleUpdateStatus = async (
    itemId: string,
    status: 'preparing' | 'completed'
  ) => {
    try {
      await kitchenService.updateItemStatus(itemId, status);
      if (soundOn && status === 'completed') {
        // Simple beep via Web Audio API
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          osc.frequency.value = 800;
          osc.connect(ctx.destination);
          osc.start();
          setTimeout(() => osc.stop(), 150);
        } catch {
          // Audio not available
        }
      }
      toast.success(
        status === 'preparing' ? 'Bat dau lam' : 'Da hoan tat!'
      );
      await loadOrders();
    } catch (err) {
      toast.error('Loi cap nhat trang thai');
      console.error(err);
    }
  };

  const handleStartAll = async (items: OrderItem[]) => {
    try {
      await Promise.all(
        items.map((i) => kitchenService.updateItemStatus(i.id, 'preparing'))
      );
      toast.success('Bat dau lam tat ca');
      await loadOrders();
    } catch {
      toast.error('Loi cap nhat trang thai');
    }
  };

  const handleCompleteAll = async (items: OrderItem[]) => {
    try {
      await Promise.all(
        items.map((i) => kitchenService.updateItemStatus(i.id, 'completed'))
      );
      toast.success('Hoan tat tat ca!');
      await loadOrders();
    } catch {
      toast.error('Loi cap nhat trang thai');
    }
  };

  /* ── Order Card ── */
  const renderOrderCard = (
    group: GroupedOrder,
    type: 'pending' | 'preparing' | 'completed'
  ) => {
    const tableName = group.order.table?.table_no ?? '??';
    const isComp = type === 'completed';
    const urgent = isUrgent(group.order.created_at);

    const borderLeftColor =
      type === 'pending'
        ? T.tertiaryContainer
        : type === 'preparing'
          ? T.primaryContainer
          : T.success;

    return (
      <Card
        key={`${group.order.id}-${type}`}
        sx={{
          bgcolor: isComp ? 'rgba(46,49,50,0.50)' : T.inverseSurface,
          color: T.inverseOnSurface,
          mb: 2,
          borderRadius: '1.5rem',
          opacity: isComp ? 0.6 : 1,
          transition: 'all 0.25s ease',
          borderLeft: `${isComp ? 4 : 8}px solid ${borderLeftColor}`,
          boxShadow: type === 'preparing'
            ? '0 25px 50px -12px rgba(0,0,0,0.4)'
            : '0 12px 32px rgba(25,28,29,0.04)',
          ...(type === 'preparing' && {
            ring: 2,
            outline: `2px solid rgba(245,158,11,0.20)`,
            outlineOffset: '0px',
          }),
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          {/* Header: table + timer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography
              sx={{
                fontSize: '3rem',
                fontWeight: 900,
                lineHeight: 1,
                color: T.inverseOnSurface,
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              {tableName}
            </Typography>
            <Box
              sx={{
                bgcolor: urgent ? T.error : T.primaryFixed,
                color: urgent ? '#fff' : T.onSurfaceVariant,
                px: 1.5,
                py: 1,
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {getElapsedTime(group.order.created_at)}
            </Box>
          </Box>

          {/* Items list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {group.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: 48,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                  {/* Status icon */}
                  {isComp ? (
                    <CheckCircleIcon sx={{ color: T.success, fontSize: 22 }} />
                  ) : (
                    <UncheckedIcon sx={{ color: T.textMuted, fontSize: 22 }} />
                  )}
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontFamily: 'Inter, sans-serif',
                      color: T.inverseOnSurface,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 700,
                        mr: 1,
                        color: T.tertiaryContainer,
                      }}
                    >
                      x{item.quantity}
                    </Box>
                    {item.item_name}
                  </Typography>
                </Box>

                {type === 'pending' && (
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      bgcolor: T.tertiary,
                      fontSize: 14,
                      minWidth: 90,
                      minHeight: 44,
                      borderRadius: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#004c6a', boxShadow: 'none' },
                      '&:active': { transform: 'scale(0.95)' },
                    }}
                    onClick={() => handleUpdateStatus(item.id, 'preparing')}
                  >
                    Bat dau
                  </Button>
                )}

                {type === 'preparing' && (
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      bgcolor: T.success,
                      color: T.bg,
                      fontSize: 14,
                      minWidth: 90,
                      minHeight: 44,
                      borderRadius: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#22c55e', boxShadow: 'none' },
                      '&:active': { transform: 'scale(0.95)' },
                    }}
                    onClick={() => handleUpdateStatus(item.id, 'completed')}
                  >
                    Xong
                  </Button>
                )}

                {type === 'completed' && (
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: T.success,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Xong
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* Bulk action buttons — outlined style */}
          {type === 'pending' && group.items.length > 1 && (
            <Button
              fullWidth
              variant="outlined"
              sx={{
                mt: 2.5,
                minHeight: 48,
                borderRadius: '0.75rem',
                borderColor: T.tertiaryContainer,
                color: T.tertiaryContainer,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                '&:hover': {
                  borderColor: T.tertiaryContainer,
                  bgcolor: 'rgba(26,189,255,0.08)',
                },
              }}
              onClick={() => handleStartAll(group.items)}
            >
              Bat dau tat ca
            </Button>
          )}

          {type === 'preparing' && group.items.length > 1 && (
            <Button
              fullWidth
              variant="outlined"
              sx={{
                mt: 2.5,
                minHeight: 48,
                borderRadius: '0.75rem',
                borderColor: T.success,
                color: T.success,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                '&:hover': {
                  borderColor: T.success,
                  bgcolor: 'rgba(74,222,128,0.08)',
                },
              }}
              onClick={() => handleCompleteAll(group.items)}
            >
              Xong tat ca
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  /* ── Column ── */
  const renderColumn = (
    title: string,
    borderColor: string,
    countBg: string,
    items: GroupedOrder[],
    type: 'pending' | 'preparing' | 'completed'
  ) => (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Column header — border-b-4 style */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          mb: 2,
          borderBottom: `4px solid ${borderColor}`,
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: 18,
            color: T.inverseOnSurface,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            bgcolor: countBg,
            color: type === 'completed' ? T.bg : T.bg,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            minWidth: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
          }}
        >
          {items.length}
        </Box>
      </Box>

      {/* Column body — scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(240,241,242,0.15)',
            borderRadius: 3,
          },
        }}
      >
        {items.length === 0 ? (
          <Typography
            sx={{
              textAlign: 'center',
              color: T.textMuted,
              mt: 6,
              fontSize: 16,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Khong co mon
          </Typography>
        ) : (
          items.map((g) => renderOrderCard(g, type))
        )}
      </Box>
    </Box>
  );

  /* ── Loading state ── */
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: T.bg,
        }}
      >
        <CircularProgress sx={{ color: T.primaryContainer }} size={48} />
      </Box>
    );
  }

  /* ── Main Render ── */
  return (
    <>
      <style>{pulseKeyframes}</style>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: T.bg,
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 4,
            py: 2,
          }}
        >
          {/* Left: Title */}
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 800,
              color: T.inverseOnSurface,
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Bep
          </Typography>

          {/* Right: User + logout | status + clock + sound toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            {/* User name + Logout */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                sx={{
                  fontSize: 14,
                  color: T.textMuted,
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {user?.full_name ?? user?.username ?? ''}
              </Typography>
              <IconButton
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                sx={{
                  color: T.inverseOnSurface,
                  border: '1px solid rgba(240,241,242,0.20)',
                  borderRadius: '0.75rem',
                  width: 44,
                  height: 44,
                  '&:hover': { bgcolor: 'rgba(240,241,242,0.06)' },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Divider */}
            <Box sx={{ width: 1, height: 28, bgcolor: 'rgba(240,241,242,0.12)' }} />

            {/* Connection indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: connected ? T.success : T.error,
                  animation: connected ? 'stitch-pulse 2s infinite' : 'none',
                }}
              />
              <Typography
                sx={{ fontSize: 13, color: T.textMuted, fontFamily: 'Inter, sans-serif' }}
              >
                {connected ? 'Ket noi' : 'Mat ket noi'}
              </Typography>
            </Box>

            {/* Clock */}
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 600,
                color: T.inverseOnSurface,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {currentTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Typography>

            {/* Sound toggle */}
            <IconButton
              onClick={() => setSoundOn((prev) => !prev)}
              sx={{
                color: T.inverseOnSurface,
                border: '1px solid rgba(240,241,242,0.20)',
                borderRadius: '0.75rem',
                width: 44,
                height: 44,
                '&:hover': { bgcolor: 'rgba(240,241,242,0.06)' },
              }}
            >
              {soundOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* ── 3-column Kanban ── */}
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 3,
            px: 4,
            pb: 3,
            minHeight: 0,
            height: 'calc(100vh - 80px)',
          }}
        >
          {renderColumn(
            'Don moi',
            T.tertiaryContainer,
            T.tertiaryContainer,
            pendingOrders,
            'pending'
          )}
          {renderColumn(
            'Dang lam',
            T.primaryContainer,
            T.primaryContainer,
            preparingOrders,
            'preparing'
          )}
          {renderColumn(
            'Hoan tat',
            T.success,
            T.success,
            completedOrders,
            'completed'
          )}
        </Box>
      </Box>
    </>
  );
}
