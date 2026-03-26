import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableBar as TableBarIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { tableService } from '../../services/tableService';
import { Table as TableType } from '../../types';
import { TABLE_STATUS_COLORS } from '../../lib/constants';

interface FormData {
  table_no: string;
  capacity: number;
  zone: string;
}

const defaultForm: FormData = { table_no: '', capacity: 1, zone: '' };

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

const m3Dialog = {
  '& .MuiDialog-paper': {
    borderRadius: '28px',
    padding: '8px',
  },
};

const m3DialogTitle = {
  fontSize: '1.25rem',
  fontWeight: 500,
};

const m3TextField = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px' },
  mb: 3,
};

const m3Btn = { borderRadius: '100px', textTransform: 'none' as const };

const TableManagementScreen: React.FC = () => {
  const [tables, setTables] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [deletingTable, setDeletingTable] = useState<TableType | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tableService.getAll();
      setTables(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.table_no.trim()) errors.table_no = 'Số bàn là bắt buộc';
    if (form.capacity < 1) errors.capacity = 'Sức chứa phải >= 1';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setEditingTable(null);
    setForm(defaultForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (table: TableType) => {
    setEditingTable(table);
    setForm({
      table_no: table.table_no,
      capacity: table.capacity,
      zone: table.zone || '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenDelete = (table: TableType) => {
    setDeletingTable(table);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        table_no: form.table_no.trim(),
        capacity: form.capacity,
        zone: form.zone.trim() || undefined,
      };

      if (editingTable) {
        await tableService.update(editingTable.id, payload);
        toast.success('Cập nhật bàn thành công');
      } else {
        await tableService.create(payload);
        toast.success('Thêm bàn thành công');
      }

      setDialogOpen(false);
      loadTables();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTable) return;
    try {
      setSaving(true);
      await tableService.remove(deletingTable.id);
      toast.success('Xóa bàn thành công');
      setDeleteDialogOpen(false);
      setDeletingTable(null);
      loadTables();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa bàn');
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
            Quản lý bàn
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
            Quản lý danh sách bàn trong nhà hàng
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ ...m3Btn, px: 3 }}
        >
          Thêm bàn
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      <Card sx={m3Card}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={m3TableHead}>
                <TableCell>Số bàn</TableCell>
                <TableCell>Sức chứa</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id} sx={m3TableRow}>
                  <TableCell sx={{ fontWeight: 500 }}>{table.table_no}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>{table.zone || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={table.status}
                      size="small"
                      sx={{
                        borderRadius: '8px',
                        backgroundColor: TABLE_STATUS_COLORS[table.status] || '#E7E0EC',
                        color: '#fff',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpenEdit(table)} sx={{ color: '#49454F' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDelete(table)}
                      sx={{ color: '#B71C1C' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {tables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <TableBarIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Chưa có bàn nào
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#79747E' }}>
                        Bấm "Thêm bàn" để bắt đầu
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth sx={m3Dialog}>
        <DialogTitle sx={m3DialogTitle}>{editingTable ? 'Sửa bàn' : 'Thêm bàn mới'}</DialogTitle>
        <DialogContent>
          <Stack spacing={0} mt={1}>
            <TextField
              label="Số bàn"
              value={form.table_no}
              onChange={(e) => setForm({ ...form, table_no: e.target.value })}
              error={!!formErrors.table_no}
              helperText={formErrors.table_no}
              fullWidth
              required
              sx={m3TextField}
            />
            <TextField
              label="Sức chứa"
              type="number"
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: parseInt(e.target.value) || 1 })
              }
              error={!!formErrors.capacity}
              helperText={formErrors.capacity}
              fullWidth
              inputProps={{ min: 1 }}
              sx={m3TextField}
            />
            <TextField
              label="Zone"
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              fullWidth
              sx={m3TextField}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ ...m3Btn, color: '#49454F' }}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={m3Btn}>
            {saving ? <CircularProgress size={20} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} sx={m3Dialog}>
        <DialogTitle sx={m3DialogTitle}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa bàn "{deletingTable?.table_no}" không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ ...m3Btn, color: '#49454F' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={saving}
            sx={m3Btn}
          >
            {saving ? <CircularProgress size={20} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableManagementScreen;
