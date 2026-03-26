// ============================================
// SCR-05: Order Screen — Stitch "Tactile Atelier"
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Button,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  Kitchen as KitchenIcon,
  Restaurant as RestaurantIcon,
  ImageNotSupported as NoImageIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { tableService } from '../../services/tableService';
import { menuService } from '../../services/menuService';
import { orderService } from '../../services/orderService';
import type { Table, Category, MenuItem, Order, OrderItem } from '../../types';

interface CartItem {
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    amount,
  );

export default function OrderScreen() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();

  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load table info, categories, menu items, and check for active order
  useEffect(() => {
    if (!tableId) return;

    const loadData = async () => {
      try {
        const [tableData, cats, items, activeOrder] = await Promise.all([
          tableService.getById(tableId),
          menuService.categories.getAll(),
          menuService.items.getAll(),
          orderService.getActiveByTable(tableId),
        ]);

        setTable(tableData);
        setCategories(cats);
        setMenuItems(items);

        if (activeOrder) {
          setOrder(activeOrder);
          // Only load items with status='new' into editable cart
          // Items already sent to kitchen are not editable
          if (activeOrder.items && activeOrder.items.length > 0) {
            const newItems = activeOrder.items.filter(
              (item: OrderItem) => item.status === 'new'
            );
            if (newItems.length > 0) {
              const existingItems: CartItem[] = newItems.map(
                (item: OrderItem) => ({
                  menu_item_id: item.menu_item_id || '',
                  item_name: item.item_name,
                  item_price: item.item_price,
                  quantity: item.quantity,
                }),
              );
              setCart(existingItems);
            }
          }
        }
      } catch (err) {
        toast.error('Không thể tải dữ liệu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tableId]);

  // Filter menu items by category
  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  // Add item to cart
  const addToCart = useCallback((item: MenuItem) => {
    if (item.status === 'out_of_stock') return;

    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          item_name: item.name,
          item_price: item.price,
          quantity: 1,
        },
      ];
    });
  }, []);

  // Update item quantity in cart
  const updateQuantity = useCallback(
    (menuItemId: string, delta: number) => {
      setCart((prev) => {
        return prev
          .map((c) =>
            c.menu_item_id === menuItemId
              ? { ...c, quantity: c.quantity + delta }
              : c,
          )
          .filter((c) => c.quantity > 0);
      });
    },
    [],
  );

  // Remove item from cart
  const removeFromCart = useCallback((menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menu_item_id !== menuItemId));
  }, []);

  // Calculate total
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.item_price * item.quantity,
    0,
  );

  // Send to kitchen
  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 món');
      return;
    }

    setSending(true);
    try {
      // Create order if not exists
      let currentOrder = order;
      if (!currentOrder) {
        currentOrder = await orderService.create(tableId!);
        setOrder(currentOrder);
      }

      // Only items with status='new' in DB are "pending" (editable, not yet sent)
      // Items already sent to kitchen (sent_to_kitchen/preparing/completed) are done
      const pendingDbItems = (currentOrder.items ?? []).filter(
        (i: OrderItem) => i.status === 'new'
      );
      const pendingMenuIds = new Set(pendingDbItems.map((i: OrderItem) => i.menu_item_id));

      // Cart items NOT matching any pending DB item -> need to INSERT as new rows
      const itemsToInsert = cart.filter((c) => !pendingMenuIds.has(c.menu_item_id));

      // Cart items matching pending DB items -> UPDATE quantity if changed
      const itemsToUpdate = cart.filter((c) => pendingMenuIds.has(c.menu_item_id));

      // Insert new order_item rows
      for (const item of itemsToInsert) {
        await orderService.addItem(currentOrder.id, {
          menu_item_id: item.menu_item_id,
          item_name: item.item_name,
          item_price: item.item_price,
          quantity: item.quantity,
        });
      }

      // Update quantity for existing pending items
      for (const cartItem of itemsToUpdate) {
        const dbItem = pendingDbItems.find(
          (i: OrderItem) => i.menu_item_id === cartItem.menu_item_id
        );
        if (dbItem && dbItem.quantity !== cartItem.quantity) {
          await orderService.updateItemQuantity(dbItem.id, cartItem.quantity);
        }
      }

      if (itemsToInsert.length === 0 && itemsToUpdate.length === 0) {
        toast('Không có món mới để gửi bếp', { icon: '\u2139\uFE0F' });
        setSending(false);
        return;
      }

      // Send to kitchen (updates items with status='new' to 'sent_to_kitchen')
      await orderService.sendToKitchen(currentOrder.id);

      toast.success('Đã gửi bếp thành công!');
      navigate(`/waiter/order/${currentOrder.id}`);
    } catch (err) {
      toast.error('Lỗi khi gửi bếp. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress sx={{ color: '#f59e0b' }} />
      </Box>
    );
  }

  const allCats = [{ id: 'all', name: 'Tất cả' }, ...categories];

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
      }}
    >
      {/* LEFT PANEL - Menu (60%) */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 60%' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: '#f8f9fa',
        }}
      >
        {/* Category Tabs — horizontal scroll, pill chips */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            px: { xs: 2, md: 3 },
            pt: 3,
            pb: 2,
            flexShrink: 0,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {allCats.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                label={cat.name}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{
                  borderRadius: '100px',
                  height: 44,
                  flexShrink: 0,
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

        {/* Menu Items Grid */}
        <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2, md: 3 }, pb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: '1.5rem',
            }}
          >
            {filteredItems.map((item) => {
              const isOutOfStock = item.status === 'out_of_stock';
              const cartItem = cart.find((c) => c.menu_item_id === item.id);

              return (
                <Card
                  key={item.id}
                  className="group"
                  sx={{
                    opacity: isOutOfStock ? 0.7 : 1,
                    filter: isOutOfStock ? 'grayscale(1)' : 'none',
                    position: 'relative',
                    borderRadius: '1rem',
                    border: 'none',
                    bgcolor: '#ffffff',
                    boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: isOutOfStock
                        ? '0 12px 32px rgba(25,28,29,0.04)'
                        : '0 16px 40px rgba(25,28,29,0.08)',
                      transform: isOutOfStock ? 'none' : 'translateY(-2px)',
                    },
                  }}
                >
                  <CardActionArea
                    disabled={isOutOfStock}
                    onClick={() => addToCart(item)}
                    sx={{
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                    }}
                  >
                    {/* Image */}
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '65%', // aspect ratio ~3:2
                        bgcolor: item.image_url ? undefined : '#f3f4f5',
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
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: isOutOfStock ? 'none' : 'scale(1.05)',
                            },
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
                          <NoImageIcon
                            sx={{ fontSize: 40, color: '#534434', opacity: 0.25 }}
                          />
                        </Box>
                      )}

                      {/* Sold out overlay */}
                      {isOutOfStock && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(15,23,42,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Chip
                            label="Hết món"
                            size="small"
                            sx={{
                              fontFamily: '"Inter", sans-serif',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              bgcolor: '#ffffff',
                              color: '#ba1a1a',
                              borderRadius: '100px',
                            }}
                          />
                        </Box>
                      )}
                    </Box>

                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography
                        sx={{
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '0.925rem',
                          fontWeight: 500,
                          color: '#191c1d',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '0.925rem',
                          fontWeight: 700,
                          color: '#855300',
                          mt: 0.5,
                        }}
                      >
                        {formatVND(item.price)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>

                  {/* Cart quantity badge */}
                  {cartItem && (
                    <Badge
                      badgeContent={cartItem.quantity}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        '& .MuiBadge-badge': {
                          bgcolor: '#f59e0b',
                          color: '#ffffff',
                          fontFamily: '"Inter", sans-serif',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          minWidth: 24,
                          height: 24,
                          borderRadius: '100px',
                        },
                      }}
                    />
                  )}
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* RIGHT PANEL - Cart (40%) */}
      <Box
        sx={{
          flex: { xs: 'none', md: '0 0 40%' },
          height: { xs: '50vh', md: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f3f4f5',
        }}
      >
        {/* Cart Header */}
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <RestaurantIcon sx={{ color: '#855300', fontSize: 24 }} />
          <Typography
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#191c1d',
            }}
          >
            Bàn {table?.table_no || '---'}
          </Typography>
          {order && (
            <Chip
              label={`#${order.id.slice(0, 8)}`}
              size="small"
              sx={{
                ml: 'auto',
                bgcolor: 'rgba(83,68,52,0.08)',
                color: '#534434',
                borderRadius: '100px',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: '0.75rem',
                border: 'none',
              }}
            />
          )}
        </Box>

        {/* Cart Items — "Breathable" list, no dividers */}
        <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2, md: 3 } }}>
          {cart.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <RestaurantIcon
                sx={{ fontSize: 48, mb: 1.5, color: '#534434', opacity: 0.2 }}
              />
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  color: '#534434',
                  fontSize: '0.925rem',
                  fontWeight: 500,
                }}
              >
                Chưa có món nào
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  color: '#534434',
                  fontSize: '0.8125rem',
                  mt: 0.5,
                  opacity: 0.6,
                }}
              >
                Chọn món từ menu bên trái
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map((item) => (
                <Box
                  key={item.menu_item_id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.5,
                    px: 1.5,
                    borderRadius: '0.75rem',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      bgcolor: 'rgba(83,68,52,0.04)',
                    },
                  }}
                >
                  {/* Item Name & Price */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#191c1d',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.item_name}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.8125rem',
                        color: '#534434',
                        opacity: 0.7,
                      }}
                    >
                      {formatVND(item.item_price)}
                    </Typography>
                  </Box>

                  {/* Quantity Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.menu_item_id, -1)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '0.5rem',
                        bgcolor: 'rgba(83,68,52,0.06)',
                        color: '#534434',
                        border: 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(83,68,52,0.12)' },
                      }}
                    >
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography
                      sx={{
                        minWidth: 28,
                        textAlign: 'center',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#191c1d',
                      }}
                    >
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.menu_item_id, 1)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '0.5rem',
                        bgcolor: 'rgba(83,68,52,0.06)',
                        color: '#534434',
                        border: 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(83,68,52,0.12)' },
                      }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>

                  {/* Subtotal */}
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      minWidth: 80,
                      textAlign: 'right',
                      color: '#191c1d',
                    }}
                  >
                    {formatVND(item.item_price * item.quantity)}
                  </Typography>

                  {/* Remove */}
                  <IconButton
                    size="small"
                    onClick={() => removeFromCart(item.menu_item_id)}
                    sx={{
                      color: '#534434',
                      opacity: 0.4,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        color: '#ba1a1a',
                        opacity: 1,
                        bgcolor: 'rgba(186,26,26,0.06)',
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Cart Footer */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Total */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              p: 2.5,
              bgcolor: '#ffffff',
              borderRadius: '1rem',
              boxShadow: '0 12px 32px rgba(25,28,29,0.04)',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '1rem',
                fontWeight: 500,
                color: '#534434',
              }}
            >
              Tổng cộng
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#855300',
              }}
            >
              {formatVND(cartTotal)}
            </Typography>
          </Box>

          {/* Send to Kitchen Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<KitchenIcon />}
            onClick={handleSendToKitchen}
            disabled={cart.length === 0 || sending}
            disableElevation
            sx={{
              height: 56,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #855300, #f59e0b)',
              color: '#ffffff',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(245,158,11,0.25)',
              transition: 'all 0.15s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #6b4400, #e8920a)',
                boxShadow: '0 12px 28px rgba(245,158,11,0.35)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
              '&.Mui-disabled': {
                background: '#f3f4f5',
                color: '#534434',
                boxShadow: 'none',
                opacity: 0.5,
              },
            }}
          >
            {sending ? (
              <CircularProgress size={24} sx={{ color: '#ffffff' }} />
            ) : (
              'Gửi bếp'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
