// ============================================
// SCR-04: Table Map — Stitch "Tactile Atelier"
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Fab,
  Snackbar,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventSeat as EventSeatIcon,
  Add as AddIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { tableService } from '../../services/tableService';
import { orderService } from '../../services/orderService';
import { useTableRealtime } from '../../hooks/useRealtime';
import { TABLE_STATUS } from '../../lib/constants';
import type { Table } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  available: 'Trống',
  occupied: 'Có khách',
  reserved: 'Đã đặt',
};

const STITCH_STATUS: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: 'rgba(0,101,139,0.1)', text: '#00658b', dot: '#00658b' },
  occupied: { bg: '#ffcb8f', text: '#855300', dot: '#f59e0b' },
  reserved: { bg: '#ffddb8', text: '#855300', dot: '#855300' },
};

export default function TableMapScreen() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [reservedInfo, setReservedInfo] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const filter = selectedZone !== 'all' ? { zone: selectedZone } : undefined;
      const [tablesData, zonesData] = await Promise.all([
        tableService.getAll(filter),
        tableService.getZones(),
      ]);
      setTables(tablesData);
      setZones(zonesData);
    } catch (err) {
      toast.error('Không thể tải danh sách bàn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh on realtime table changes
  useTableRealtime(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleTableClick = async (table: Table) => {
    if (table.status === TABLE_STATUS.AVAILABLE) {
      navigate(`/waiter/orders/${table.id}`);
      return;
    }

    if (table.status === TABLE_STATUS.OCCUPIED) {
      try {
        const order = await orderService.getActiveByTable(table.id);
        if (order) {
          navigate(`/waiter/order/${order.id}`);
        } else {
          toast.error('Không tìm thấy order cho bàn này');
        }
      } catch {
        toast.error('Lỗi khi tải thông tin order');
      }
      return;
    }

    if (table.status === TABLE_STATUS.RESERVED) {
      setReservedInfo(`Bàn ${table.table_no} đã được đặt trước.`);
    }
  };

  const getStatus = (status: string) =>
    STITCH_STATUS[status] || { bg: '#f3f4f5', text: '#534434', dot: '#534434' };

  const allZones = ['all', ...zones];

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        pb: 12,
        bgcolor: '#f8f9fa',
        minHeight: '100vh',
        position: 'relative',
        // Subtle radial dot grid pattern
        backgroundImage:
          'radial-gradient(circle, rgba(83,68,52,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 800,
            color: '#191c1d',
            letterSpacing: '-0.02em',
          }}
        >
          Sơ đồ bàn
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.875rem',
            color: '#534434',
            mt: 0.5,
          }}
        >
          {tables.length} bàn trong hệ thống
        </Typography>
      </Box>

      {/* Zone Filter Chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        {allZones.map((zone) => {
          const isSelected = selectedZone === zone;
          return (
            <Chip
              key={zone}
              label={zone === 'all' ? 'Tất cả' : zone}
              onClick={() => {
                setSelectedZone(zone);
                setLoading(true);
              }}
              sx={{
                borderRadius: '100px',
                height: 44,
                px: 1,
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 500,
                bgcolor: isSelected ? '#f59e0b' : 'transparent',
                color: isSelected ? '#ffffff' : '#534434',
                border: 'none',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(245,158,11,0.25)'
                  : 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: isSelected ? '#e8920a' : 'rgba(83,68,52,0.06)',
                },
                '& .MuiChip-label': {
                  px: 2.5,
                },
              }}
            />
          );
        })}
      </Box>

      {/* Table Grid */}
      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(auto-fill, minmax(200px, 1fr))',
              md: 'repeat(auto-fill, minmax(280px, 1fr))',
            },
            gap: { xs: '1rem', md: '1.5rem' },
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={200}
              sx={{ borderRadius: '1.5rem' }}
            />
          ))}
        </Box>
      ) : tables.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <EventSeatIcon sx={{ fontSize: 64, color: '#534434', mb: 2, opacity: 0.3 }} />
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              color: '#534434',
              fontSize: '0.95rem',
            }}
          >
            Không có bàn nào trong khu vực này
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(auto-fill, minmax(200px, 1fr))',
              md: 'repeat(auto-fill, minmax(280px, 1fr))',
            },
            gap: { xs: '1rem', md: '1.5rem' },
          }}
        >
          {tables.map((table) => {
            const status = getStatus(table.status);
            const isReserved = table.status === 'reserved';
            return (
              <Card
                key={table.id}
                sx={{
                  borderRadius: '1.5rem',
                  border: 'none',
                  bgcolor: '#ffffff',
                  boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 16px 40px rgba(25,28,29,0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleTableClick(table)}
                  sx={{ borderRadius: '1.5rem' }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Table Number */}
                    <Typography
                      sx={{
                        fontFamily: '"Manrope", sans-serif',
                        fontSize: { xs: '2.5rem', md: '3rem' },
                        fontWeight: 900,
                        color: '#191c1d',
                        lineHeight: 1,
                        mb: 1,
                      }}
                    >
                      {table.table_no}
                    </Typography>

                    {/* Capacity */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mb: 2,
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: 18, color: '#534434' }} />
                      <Typography
                        sx={{
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '0.875rem',
                          color: '#534434',
                        }}
                      >
                        {table.capacity} chỗ
                      </Typography>
                    </Box>

                    {/* Status Badge */}
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        bgcolor: status.bg,
                        borderRadius: '100px',
                        px: 1.5,
                        py: 0.5,
                      }}
                    >
                      <DotIcon
                        sx={{
                          fontSize: 10,
                          color: status.dot,
                          ...(isReserved && {
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1 },
                              '50%': { opacity: 0.4 },
                            },
                          }),
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '0.625rem',
                          fontWeight: 900,
                          color: status.text,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {STATUS_LABELS[table.status] || table.status}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Legend — Glass card */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 88, md: 24 },
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 3,
          bgcolor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '1rem',
          px: 3,
          py: 1.5,
          boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
          zIndex: 1100,
        }}
      >
        {Object.entries(STITCH_STATUS).map(([key, st]) => (
          <Box
            key={key}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: st.dot,
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#534434',
              }}
            >
              {STATUS_LABELS[key]}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* FAB - New Reservation */}
      <Fab
        variant="extended"
        onClick={() => navigate('/waiter/reservations/new')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1200,
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, #855300, #f59e0b)',
          color: '#fff',
          boxShadow: '0 16px 40px rgba(245,158,11,0.3)',
          textTransform: 'none',
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          fontSize: '0.875rem',
          height: 56,
          px: 3,
          transition: 'all 0.15s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #6b4400, #e8920a)',
            boxShadow: '0 20px 48px rgba(245,158,11,0.4)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Đặt bàn
      </Fab>

      {/* Reserved Info Snackbar */}
      <Snackbar
        open={!!reservedInfo}
        autoHideDuration={4000}
        onClose={() => setReservedInfo(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          onClose={() => setReservedInfo(null)}
          variant="filled"
          sx={{
            borderRadius: '0.75rem',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {reservedInfo}
        </Alert>
      </Snackbar>
    </Box>
  );
}
