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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  Card,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { User, UserRole } from '../../types';
import { DEFAULT_PAGE_SIZE, ROLES } from '../../lib/constants';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'waiter', label: 'Waiter' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'manager', label: 'Manager' },
];

/* M3 tonal role chip colors */
const ROLE_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  waiter: { bg: '#E3F2FD', color: '#0D47A1' },
  kitchen: { bg: '#FFF3E0', color: '#E65100' },
  cashier: { bg: '#E8F5E9', color: '#1B5E20' },
  manager: { bg: '#F3E5F5', color: '#6A1B9A' },
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

const m3Dialog = {
  '& .MuiDialog-paper': { borderRadius: '28px', padding: '8px' },
};

const m3DialogTitle = { fontSize: '1.25rem', fontWeight: 500 };

const m3TextField = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px' },
  mb: 3,
};

const m3Btn = { borderRadius: '100px', textTransform: 'none' as const };

const m3Switch = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#6750A4' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6750A4' },
};

const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'waiter' as UserRole,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.getUsers(page, DEFAULT_PAGE_SIZE);
      setUsers(result.data);
      setTotalCount(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.username.trim()) errors.username = 'Username là bắt buộc';
    if (!editing && !form.password) errors.password = 'Password là bắt buộc khi tạo mới';
    if (!form.full_name.trim()) errors.full_name = 'Họ tên là bắt buộc';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ username: '', password: '', full_name: '', role: 'waiter' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: '',
      full_name: user.full_name,
      role: user.role,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      if (editing) {
        await authService.updateUser(editing.id, {
          full_name: form.full_name.trim(),
          role: form.role,
        });
        toast.success('Cập nhật nhân viên thành công');
      } else {
        await authService.createUser({
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          role: form.role,
          branch_id: 1,
        });
        toast.success('Thêm nhân viên thành công');
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu nhân viên');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      if (user.is_active) {
        await authService.deactivateUser(user.id);
        toast.success(`Đã vô hiệu hóa ${user.full_name}`);
      } else {
        await authService.activateUser(user.id);
        toast.success(`Đã kích hoạt ${user.full_name}`);
      }
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái');
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
            Quản lý nhân viên
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
            Quản lý tài khoản và phân quyền nhân viên
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ ...m3Btn, px: 3 }}
        >
          Thêm nhân viên
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
                <TableCell>Username</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} sx={m3TableRow}>
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
                        fontSize: '0.85rem',
                      }}
                    >
                      {user.username}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{user.full_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        borderRadius: '8px',
                        fontWeight: 500,
                        backgroundColor: ROLE_CHIP_STYLES[user.role]?.bg || '#E7E0EC',
                        color: ROLE_CHIP_STYLES[user.role]?.color || '#49454F',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_active}
                      onChange={() => handleToggleActive(user)}
                      size="small"
                      sx={m3Switch}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 0.5,
                        color: user.is_active ? '#1B5E20' : '#B71C1C',
                        fontWeight: 500,
                      }}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpenEdit(user)} sx={{ color: '#49454F' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <PeopleIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Chưa có nhân viên nào
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#79747E' }}>
                        Bấm "Thêm nhân viên" để bắt đầu
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth sx={m3Dialog}>
        <DialogTitle sx={m3DialogTitle}>
          {editing ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={0} mt={1}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              error={!!formErrors.username}
              helperText={formErrors.username}
              fullWidth
              required
              disabled={!!editing}
              sx={m3TextField}
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={!!formErrors.password}
              helperText={
                formErrors.password ||
                (editing ? 'Để trống nếu không đổi mật khẩu' : '')
              }
              fullWidth
              required={!editing}
              sx={m3TextField}
            />
            <TextField
              label="Họ tên"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              error={!!formErrors.full_name}
              helperText={formErrors.full_name}
              fullWidth
              required
              sx={m3TextField}
            />
            <FormControl fullWidth sx={{ ...m3TextField, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as UserRole })
                }
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ ...m3Btn, color: '#49454F' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={m3Btn}>
            {saving ? <CircularProgress size={20} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementScreen;
