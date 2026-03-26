import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CircularProgress,
  Alert,
  Stack,
  Tab,
  Tabs,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  Card,
  Badge,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { inventoryService } from '../../services/inventoryService';
import { Ingredient, InventoryImport } from '../../types';
import { DEFAULT_PAGE_SIZE } from '../../lib/constants';

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

const m3LowStockRow = {
  backgroundColor: '#FFEBEE',
  borderLeft: '4px solid #C62828',
  '& .MuiTableCell-root': { borderBottom: '1px solid #E7E0EC' },
  '&:hover': { backgroundColor: '#FFCDD2' },
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

// ==================== Ingredients Tab ====================

const IngredientsTab: React.FC<{ onLowStockCount?: (count: number) => void }> = ({ onLowStockCount }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({
    name: '',
    unit: '',
    min_quantity: 0,
  });
  const [saving, setSaving] = useState(false);

  const loadIngredients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await inventoryService.getIngredients({
        page,
        limit: DEFAULT_PAGE_SIZE,
      });
      setIngredients(result.data);
      setTotalCount(result.count);
      if (onLowStockCount) {
        const lowCount = result.data.filter((ing: Ingredient) => ing.quantity <= ing.min_quantity).length;
        onLowStockCount(lowCount);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, onLowStockCount]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ name: '', unit: '', min_quantity: 0 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditing(ing);
    setForm({ name: ing.name, unit: ing.unit, min_quantity: ing.min_quantity });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.unit.trim()) {
      toast.error('Tên và đơn vị là bắt buộc');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await inventoryService.updateIngredient(editing.id, {
          name: form.name.trim(),
          unit: form.unit.trim(),
          min_quantity: form.min_quantity,
        });
        toast.success('Cập nhật nguyên liệu thành công');
      } else {
        await inventoryService.createIngredient({
          name: form.name.trim(),
          unit: form.unit.trim(),
          min_quantity: form.min_quantity,
        });
        toast.success('Thêm nguyên liệu thành công');
      }
      setDialogOpen(false);
      loadIngredients();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu nguyên liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      setSaving(true);
      await inventoryService.removeIngredient(deleting.id);
      toast.success('Xóa nguyên liệu thành công');
      setDeleteDialogOpen(false);
      setDeleting(null);
      loadIngredients();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa nguyên liệu');
    } finally {
      setSaving(false);
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
          Thêm nguyên liệu
        </Button>
      </Box>

      <Card sx={m3Card}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={m3TableHead}>
                <TableCell>Tên</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell>Đơn vị</TableCell>
                <TableCell align="right">Mức tối thiểu</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredients.map((ing) => {
                const isLowStock = ing.quantity <= ing.min_quantity;
                return (
                  <TableRow
                    key={ing.id}
                    sx={isLowStock ? m3LowStockRow : m3TableRow}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>{ing.name}</span>
                        {isLowStock && (
                          <Chip
                            icon={<WarningIcon sx={{ fontSize: 14 }} />}
                            label="Sắp hết"
                            size="small"
                            sx={{
                              borderRadius: '8px',
                              backgroundColor: '#FFEBEE',
                              color: '#B71C1C',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: isLowStock ? '#C62828' : 'inherit',
                        fontWeight: isLowStock ? 700 : 'normal',
                      }}
                    >
                      {ing.quantity}
                    </TableCell>
                    <TableCell>{ing.unit}</TableCell>
                    <TableCell align="right">{ing.min_quantity}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenEdit(ing)} sx={{ color: '#49454F' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDeleting(ing);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{ color: '#B71C1C' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {ingredients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <InventoryIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Chưa có nguyên liệu nào
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#79747E' }}>
                        Bấm "Thêm nguyên liệu" để bắt đầu
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
        <DialogTitle sx={m3DialogTitle}>{editing ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}</DialogTitle>
        <DialogContent>
          <Stack spacing={0} mt={1}>
            <TextField
              label="Tên nguyên liệu"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              sx={m3TextField}
            />
            <TextField
              label="Đơn vị"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              fullWidth
              required
              sx={m3TextField}
            />
            <TextField
              label="Mức tối thiểu"
              type="number"
              value={form.min_quantity}
              onChange={(e) =>
                setForm({ ...form, min_quantity: parseFloat(e.target.value) || 0 })
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

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} sx={m3Dialog}>
        <DialogTitle sx={m3DialogTitle}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa nguyên liệu "{deleting?.name}" không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ ...m3Btn, color: '#49454F' }}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving} sx={m3Btn}>
            {saving ? <CircularProgress size={20} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ==================== Import Tab ====================

const ImportTab: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [imports, setImports] = useState<InventoryImport[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ingredient_id: '',
    quantity: 0,
    supplier: '',
    unit_price: 0,
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ingResult, importResult] = await Promise.all([
        inventoryService.getIngredients({ page: 1, limit: 1000 }),
        inventoryService.getImportHistory({ page, limit: DEFAULT_PAGE_SIZE }),
      ]);
      setIngredients(ingResult.data);
      setImports(importResult.data);
      setTotalCount(importResult.count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImport = async () => {
    if (!form.ingredient_id) {
      toast.error('Vui lòng chọn nguyên liệu');
      return;
    }
    if (form.quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    try {
      setSaving(true);
      await inventoryService.importStock({
        ingredient_id: form.ingredient_id,
        quantity: form.quantity,
        supplier: form.supplier.trim() || undefined,
        unit_price: form.unit_price || undefined,
      });
      toast.success('Nhập kho thành công');
      setForm({ ingredient_id: '', quantity: 0, supplier: '', unit_price: 0 });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi nhập kho');
    } finally {
      setSaving(false);
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

      {/* Import Form */}
      <Card sx={{ ...m3Card, mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem', mb: 2 }}>
            Nhập kho
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Nguyên liệu</InputLabel>
              <Select
                value={form.ingredient_id}
                label="Nguyên liệu"
                onChange={(e) => setForm({ ...form, ingredient_id: e.target.value })}
                size="small"
              >
                {ingredients.map((ing) => (
                  <MuiMenuItem key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Số lượng"
              type="number"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
              }
              size="small"
              sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              label="Nhà cung cấp"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              label="Đơn giá"
              type="number"
              value={form.unit_price}
              onChange={(e) =>
                setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })
              }
              size="small"
              sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <Button variant="contained" onClick={handleImport} disabled={saving} sx={{ ...m3Btn, px: 3 }}>
              {saving ? <CircularProgress size={20} /> : 'Nhập kho'}
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Import History */}
      <Card sx={m3Card}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
            Lịch sử nhập kho
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={m3TableHead}>
                <TableCell>Ngày</TableCell>
                <TableCell>Nguyên liệu</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell align="right">Đơn giá</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {imports.map((imp) => (
                <TableRow key={imp.id} sx={m3TableRow}>
                  <TableCell>
                    {new Date(imp.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{imp.ingredient?.name || '-'}</TableCell>
                  <TableCell align="right">{imp.quantity}</TableCell>
                  <TableCell>{imp.supplier || '-'}</TableCell>
                  <TableCell align="right">
                    {imp.unit_price
                      ? new Intl.NumberFormat('vi-VN').format(imp.unit_price)
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {imports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <InventoryIcon sx={{ fontSize: 64, color: '#CAC4D0', mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Chưa có lịch sử nhập kho
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#79747E' }}>
                        Nhập kho để bắt đầu
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
      </Card>
    </Box>
  );
};

// ==================== Main Screen ====================

const InventoryScreen: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  return (
    <Box p={3}>
      {/* M3 Page Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 400 }}>
            Quản lý kho
          </Typography>
          <Typography variant="body2" sx={{ color: '#79747E', mt: 0.5 }}>
            Quản lý nguyên liệu và nhập kho
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
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>Nguyên liệu</span>
                {lowStockCount > 0 && (
                  <Chip
                    label={lowStockCount}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      borderRadius: '10px',
                      backgroundColor: '#FFEBEE',
                      color: '#B71C1C',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </Stack>
            }
          />
          <Tab label="Nhập kho" />
        </Tabs>
      </Card>

      {tabIndex === 0 && <IngredientsTab onLowStockCount={setLowStockCount} />}
      {tabIndex === 1 && <ImportTab />}
    </Box>
  );
};

export default InventoryScreen;
