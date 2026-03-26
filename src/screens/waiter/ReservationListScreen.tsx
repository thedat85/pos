// ============================================
// SCR-02: Reservation List Screen (M3)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { reservationService } from '../../services/reservationService';
import type { Reservation } from '../../types';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('vi-VN');

export default function ReservationListScreen() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reservationService.getAll(date);
      setReservations(data);
    } catch (err) {
      toast.error('Không thể tải danh sách đặt bàn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await reservationService.cancel(cancelId);
      toast.success('Đã hủy đặt bàn');
      setCancelId(null);
      loadReservations();
    } catch (err) {
      toast.error('Không thể hủy đặt bàn');
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#FFFBFE', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
        }}
      >
        <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 400,
            color: '#1C1B1F',
            letterSpacing: '-0.02em',
          }}
        >
          Đặt bàn
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            sx={{
              minWidth: 170,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': {
                  borderColor: '#E7E0EC',
                },
                '&:hover fieldset': {
                  borderColor: '#79747E',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#C62828',
                },
              },
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/waiter/reservations/new')}
            sx={{
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              bgcolor: '#C62828',
              boxShadow: 'none',
              minHeight: 48,
              px: 3,
              '&:hover': {
                bgcolor: '#B71C1C',
                boxShadow: '0 2px 8px rgba(198,40,40,0.3)',
              },
            }}
          >
            Tạo đặt bàn mới
          </Button>
        </Box>
      </Box>

      {/* Reservation Table */}
      <TableContainer
        sx={{
          borderRadius: '16px',
          border: '1px solid #E7E0EC',
          bgcolor: '#fff',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#C62828' }} />
          </Box>
        ) : reservations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <EventBusyIcon sx={{ fontSize: 64, color: '#79747E', opacity: 0.4, mb: 2 }} />
            <Typography sx={{ color: '#49454F', fontSize: '0.875rem' }}>
              Không có đặt bàn nào cho ngày {formatDate(date)}
            </Typography>
            <Typography sx={{ color: '#79747E', fontSize: '0.8125rem', mt: 0.5 }}>
              Tạo đặt bàn mới bằng nút phía trên
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F7F2FA' }}>
                {['STT', 'Thời gian', 'Khách hàng', 'Số khách', 'Bàn', 'Trạng thái', 'Thao tác'].map(
                  (header, idx) => (
                    <TableCell
                      key={header}
                      align={[3, 5, 6].includes(idx) ? 'center' : 'left'}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        color: '#49454F',
                        borderBottom: '1px solid #E7E0EC',
                      }}
                    >
                      {header}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((res, idx) => (
                <TableRow
                  key={res.id}
                  sx={{
                    '&:hover': { bgcolor: '#F7F2FA' },
                    '& td': { borderBottom: '1px solid #E7E0EC' },
                  }}
                >
                  <TableCell sx={{ fontSize: '0.875rem', color: '#1C1B1F' }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: '#1C1B1F' }}>
                    {res.reservation_time}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.875rem', color: '#1C1B1F' }}>
                      {res.customer_name || '---'}
                    </Typography>
                    {res.customer_phone && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#79747E' }}>
                        {res.customer_phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.875rem', color: '#1C1B1F' }}>
                    {res.party_size}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: '#1C1B1F' }}>
                    {res.table?.table_no || '---'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        res.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'
                      }
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                        bgcolor:
                          res.status === 'confirmed' ? '#E8F5E9' : '#FFEBEE',
                        color:
                          res.status === 'confirmed' ? '#1B5E20' : '#B71C1C',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          onClick={() =>
                            navigate(`/waiter/reservations/${res.id}/edit`)
                          }
                          sx={{
                            width: 40,
                            height: 40,
                            color: '#49454F',
                            '&:hover': { bgcolor: '#F7F2FA', color: '#C62828' },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                      {res.status === 'confirmed' && (
                        <Tooltip title="Hủy đặt bàn">
                          <IconButton
                            onClick={() => setCancelId(res.id)}
                            sx={{
                              width: 40,
                              height: 40,
                              color: '#49454F',
                              '&:hover': { bgcolor: '#FFEBEE', color: '#B71C1C' },
                            }}
                          >
                            <CancelIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '28px',
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#1C1B1F',
          }}
        >
          Xác nhận hủy đặt bàn
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              fontSize: '0.875rem',
              color: '#49454F',
            }}
          >
            Bạn có chắc chắn muốn hủy đặt bàn này không? Hành động này không thể
            hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setCancelId(null)}
            disabled={cancelling}
            sx={{
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 600,
              color: '#49454F',
              minHeight: 48,
              px: 3,
            }}
          >
            Không
          </Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            disabled={cancelling}
            sx={{
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#B71C1C',
              boxShadow: 'none',
              minHeight: 48,
              px: 3,
              '&:hover': {
                bgcolor: '#C62828',
                boxShadow: '0 2px 8px rgba(198,40,40,0.3)',
              },
            }}
          >
            {cancelling ? <CircularProgress size={20} color="inherit" /> : 'Xác nhận hủy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
