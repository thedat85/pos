// ============================================
// SCR-03: Reservation Create/Edit Form Screen (M3)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { reservationService } from '../../services/reservationService';
import type { Table } from '../../types';

const today = () => new Date().toISOString().split('T')[0];

const reservationSchema = z.object({
  reservation_date: z
    .string()
    .min(1, 'Ngày là bắt buộc')
    .refine((val) => val >= today(), {
      message: 'Ngày phải từ hôm nay trở đi',
    }),
  reservation_time: z.string().min(1, 'Giờ là bắt buộc'),
  party_size: z
    .number({ invalid_type_error: 'Số khách phải là số' })
    .min(1, 'Số khách tối thiểu là 1'),
  table_id: z.string().min(1, 'Vui lòng chọn bàn'),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  note: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

// M3 outlined input styling
const m3InputSx = {
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
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#C62828',
  },
};

export default function ReservationFormScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      reservation_date: today(),
      reservation_time: '',
      party_size: 1,
      table_id: '',
      customer_name: '',
      customer_phone: '',
      note: '',
    },
  });

  const watchDate = watch('reservation_date');
  const watchTime = watch('reservation_time');
  const watchPartySize = watch('party_size');

  // Load existing reservation data in edit mode
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await reservationService.getById(id);
        reset({
          reservation_date: res.reservation_date,
          reservation_time: res.reservation_time,
          party_size: res.party_size,
          table_id: res.table_id,
          customer_name: res.customer_name || '',
          customer_phone: res.customer_phone || '',
          note: res.note || '',
        });
      } catch (err) {
        toast.error('Không thể tải thông tin đặt bàn');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [id, reset]);

  // Load available tables when date/time/party_size change
  useEffect(() => {
    if (!watchDate || !watchTime || !watchPartySize) {
      setAvailableTables([]);
      return;
    }

    const loadTables = async () => {
      setLoadingTables(true);
      try {
        const tables = await reservationService.getAvailableTables(
          watchDate,
          watchTime,
          watchPartySize,
        );
        setAvailableTables(tables);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, [watchDate, watchTime, watchPartySize]);

  const onSubmit = async (data: ReservationFormData) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        await reservationService.update(id, data);
        toast.success('Cập nhật đặt bàn thành công!');
      } else {
        await reservationService.create(data);
        toast.success('Đặt bàn thành công!');
      }
      navigate('/waiter/reservations');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
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

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: 'auto', bgcolor: '#FFFBFE', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/waiter/reservations')}
            sx={{
              color: '#49454F',
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '100px',
              minHeight: 48,
              '&:hover': { bgcolor: '#F7F2FA' },
            }}
          >
            Quay lại
          </Button>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 400,
              color: '#1C1B1F',
            }}
          >
            {isEditMode ? 'Chỉnh sửa đặt bàn' : 'Tạo đặt bàn mới'}
          </Typography>
        </Box>
      </Box>

      {/* Form Card */}
      <Box
        sx={{
          p: 4,
          borderRadius: '20px',
          border: '1px solid #E7E0EC',
          bgcolor: '#fff',
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            {/* Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('reservation_date')}
                label="Ngay"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: today() }}
                error={!!errors.reservation_date}
                helperText={errors.reservation_date?.message}
                sx={m3InputSx}
              />
            </Grid>

            {/* Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('reservation_time')}
                label="Gio"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.reservation_time}
                helperText={errors.reservation_time?.message}
                sx={m3InputSx}
              />
            </Grid>

            {/* Party Size */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('party_size', { valueAsNumber: true })}
                label="Số khách"
                type="number"
                fullWidth
                inputProps={{ min: 1 }}
                error={!!errors.party_size}
                helperText={errors.party_size?.message}
                sx={m3InputSx}
              />
            </Grid>

            {/* Table Selection */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="table_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Chọn bàn"
                    fullWidth
                    error={!!errors.table_id}
                    helperText={
                      errors.table_id?.message ||
                      (!watchDate || !watchTime
                        ? 'Chọn ngày và giờ trước'
                        : loadingTables
                        ? 'Đang tải...'
                        : `${availableTables.length} bàn trống`)
                    }
                    disabled={
                      !watchDate || !watchTime || loadingTables
                    }
                    sx={m3InputSx}
                  >
                    {availableTables.map((table) => (
                      <MenuItem key={table.id} value={table.id}>
                        Bàn {table.table_no} ({table.capacity} chỗ)
                        {table.zone ? ` - ${table.zone}` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Customer Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('customer_name')}
                label="Tên khách hàng"
                fullWidth
                sx={m3InputSx}
              />
            </Grid>

            {/* Customer Phone */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('customer_phone')}
                label="Số điện thoại"
                fullWidth
                sx={m3InputSx}
              />
            </Grid>

            {/* Note */}
            <Grid item xs={12}>
              <TextField
                {...register('note')}
                label="Ghi chú"
                fullWidth
                multiline
                rows={3}
                sx={m3InputSx}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'flex-end',
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate('/waiter/reservations')}
                  disabled={submitting}
                  sx={{
                    borderRadius: '100px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    borderColor: '#79747E',
                    color: '#49454F',
                    minHeight: 48,
                    px: 3,
                    '&:hover': {
                      borderColor: '#49454F',
                      bgcolor: 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                  sx={{
                    borderRadius: '100px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    bgcolor: '#C62828',
                    boxShadow: 'none',
                    minHeight: 48,
                    minWidth: 140,
                    px: 3,
                    '&:hover': {
                      bgcolor: '#B71C1C',
                      boxShadow: '0 2px 8px rgba(198,40,40,0.3)',
                    },
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : isEditMode ? (
                    'Lưu'
                  ) : (
                    'Xác nhận'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
