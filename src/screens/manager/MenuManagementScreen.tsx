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
  Tab,
  Tabs,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Avatar,
  Card,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Restaurant as RestaurantIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { menuService } from '../../services/menuService';
import { Category, MenuItem } from '../../types';

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

// ==================== Categories Tab ====================

const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.categories.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ name: '', sort_order: 0 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, sort_order: cat.sort_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Tên danh mục là bắt buộc');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await menuService.categories.update(editing.id, {
          name: form.name.trim(),
          sort_order: form.sort_order,
        });
        toast.success('Cập nhật danh mục thành công');
      } else {
        await menuService.categories.create({
          name: form.name.trim(),
          sort_order: form.sort_order,
        });
        toast.success('Thêm danh mục thành công');
      }
      setDialogOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    try {
      await menuService.categories.remove(cat.id);
      toast.success('Xóa danh mục thành công');
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa danh mục');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ ...m3Btn, px: 3 }}>
          Thêm danh mục
        </Button>
      </Box>

      <Card sx={m3Card}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={m3TableHead}>
                <TableCell>Tên danh mục</TableCell>
                <TableCell>Thứ tự</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} sx={m3TableRow}>
                  <TableCell sx={{ fontWeight: 500 }}>{cat.name}</TableCell>
                  <TableCell>{cat.sort_order}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpenEdit(cat)} sx={{ color: '#49454F' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(cat)} sx={{ color: '#B71C1C' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <CategoryIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Chưa có danh mục nào
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#79747E' }}>
                        Bấm "Thêm danh mục" để bắt đầu
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth sx={m3Dialog}>
        <DialogTitle sx={m3DialogTitle}>{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
        <DialogContent>
          <Stack spacing={0} mt={1}>
            <TextField
              label="Tên danh mục"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              sx={m3TextField}
            />
            <TextField
              label="Thứ tự sắp xếp"
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
              }
              fullWidth
              sx={m3TextField}
            />
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

// ==================== Menu Items Tab ====================

const MenuItemsTab: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: 0,
    category_id: '',
    status: 'available' as 'available' | 'out_of_stock',
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, catsData] = await Promise.all([
        menuService.items.getAll(),
        menuService.categories.getAll(),
      ]);
      setItems(itemsData);
      setCategories(catsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ name: '', price: 0, category_id: '', status: 'available' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: item.price,
      category_id: item.category_id || '',
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Tên món là bắt buộc');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await menuService.items.update(editing.id, {
          name: form.name.trim(),
          price: form.price,
          category_id: form.category_id || null,
          status: form.status,
        });
        toast.success('Cập nhật món thành công');
      } else {
        await menuService.items.create({
          name: form.name.trim(),
          price: form.price,
          category_id: form.category_id,
          status: form.status,
        });
        toast.success('Thêm món thành công');
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu món');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: MenuItem) => {
    try {
      const newStatus = item.status === 'available' ? 'out_of_stock' : 'available';
      await menuService.items.toggleStatus(item.id, newStatus);
      toast.success('Cập nhật trạng thái thành công');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDelete = async (item: MenuItem) => {
    try {
      await menuService.items.remove(item.id);
      toast.success('Xóa món thành công');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa món');
    }
  };

  const handleImageUpload = async (item: MenuItem, file: File) => {
    try {
      await menuService.items.uploadImage(item.id, file);
      toast.success('Upload ảnh thành công');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi upload ảnh');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ ...m3Btn, px: 3 }}>
          Thêm món
        </Button>
      </Box>

      {/* Responsive Card Grid */}
      {items.length === 0 ? (
        <Card sx={{ ...m3Card, p: 6, textAlign: 'center' }}>
          <RestaurantIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Chưa có món nào
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E' }}>
            Bấm "Thêm món" để bắt đầu
          </Typography>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {items.map((item) => (
            <Card
              key={item.id}
              sx={{
                borderRadius: '1.5rem',
                overflow: 'hidden',
                border: 'none',
                boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
                transition: 'all 0.2s ease',
                opacity: item.status === 'out_of_stock' ? 0.7 : 1,
                filter: item.status === 'out_of_stock' ? 'grayscale(0.5)' : 'none',
                '&:hover': {
                  boxShadow: '0 16px 40px rgba(25,28,29,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {/* Image — responsive, fills frame */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '65%', // aspect ratio ~3:2
                  bgcolor: '#f3f4f5',
                  overflow: 'hidden',
                }}
              >
                {item.image_url ? (
                  <Box
                    component="img"
                    src={item.image_url}
                    alt={item.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RestaurantIcon sx={{ fontSize: 40, color: '#bbb' }} />
                  </Box>
                )}

                {/* Status badge */}
                <Chip
                  label={item.status === 'available' ? 'Còn hàng' : 'Hết món'}
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(item); }}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    cursor: 'pointer',
                    borderRadius: '100px',
                    fontWeight: 700,
                    fontSize: '0.625rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    height: 24,
                    bgcolor: item.status === 'available' ? 'rgba(74,222,128,0.9)' : 'rgba(186,26,26,0.85)',
                    color: '#fff',
                    backdropFilter: 'blur(4px)',
                    '&:hover': {
                      bgcolor: item.status === 'available' ? 'rgba(74,222,128,1)' : 'rgba(186,26,26,1)',
                    },
                  }}
                />

                {/* Upload button overlay */}
                <IconButton
                  component="label"
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    width: 36,
                    height: 36,
                    '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                  }}
                >
                  <UploadIcon sx={{ fontSize: 18, color: '#534434' }} />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(item, file);
                    }}
                  />
                </IconButton>
              </Box>

              {/* Content */}
              <Box sx={{ p: 2 }}>
                {/* Category chip */}
                {item.category?.name && (
                  <Typography
                    sx={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#855300',
                      mb: 0.5,
                    }}
                  >
                    {item.category.name}
                  </Typography>
                )}

                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#191c1d',
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </Typography>

                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#855300',
                    fontFamily: '"Manrope", sans-serif',
                  }}
                >
                  {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                </Typography>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={() => handleOpenEdit(item)}
                    sx={{
                      flex: 1,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      minHeight: 36,
                      borderRadius: 10,
                      borderColor: 'rgba(83,68,52,0.15)',
                      color: '#534434',
                      '&:hover': { borderColor: '#855300', bgcolor: 'rgba(133,83,0,0.04)' },
                    }}
                  >
                    Sửa
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: '1px solid rgba(186,26,26,0.2)',
                      color: '#ba1a1a',
                      '&:hover': { bgcolor: 'rgba(186,26,26,0.06)' },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth sx={m3Dialog}>
        <DialogTitle sx={m3DialogTitle}>{editing ? 'Sửa món' : 'Thêm món mới'}</DialogTitle>
        <DialogContent>
          <Stack spacing={0} mt={1}>
            <TextField
              label="Tên món"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              sx={m3TextField}
            />
            <TextField
              label="Giá"
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: parseFloat(e.target.value) || 0 })
              }
              fullWidth
              sx={m3TextField}
            />
            <FormControl fullWidth sx={{ ...m3TextField, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={form.category_id}
                label="Danh mục"
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                {categories.map((cat) => (
                  <MuiMenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={form.status === 'available'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.checked ? 'available' : 'out_of_stock',
                    })
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#6750A4' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6750A4' },
                  }}
                />
              }
              label={form.status === 'available' ? 'Còn hàng' : 'Hết món'}
              sx={{ mb: 2 }}
            />
            {editing && (
              <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={m3Btn}>
                Upload ảnh
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && editing) handleImageUpload(editing, file);
                  }}
                />
              </Button>
            )}
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

// ==================== Main Screen ====================

const MenuManagementScreen: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box p={3}>
      {/* M3 Page Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 400 }}>
            Quản lý thực đơn
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
            Quản lý danh mục và món ăn
          </Typography>
        </Box>
      </Box>

      <Card sx={{ ...m3Card, mb: 3, overflow: 'visible' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              minHeight: 48,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab label="Danh mục" />
          <Tab label="Món ăn" />
        </Tabs>
      </Card>

      {tabIndex === 0 && <CategoriesTab />}
      {tabIndex === 1 && <MenuItemsTab />}
    </Box>
  );
};

export default MenuManagementScreen;
