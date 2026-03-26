import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  FileDownload as FileDownloadIcon,
  BarChart as BarChartIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { reportService } from '../../services/reportService';

/* ── Stitch Tactile Atelier tokens ── */
const S = {
  surface: '#f8f9fa',
  surfaceLow: '#f3f4f5',
  surfaceLowest: '#ffffff',
  surfaceContainerLowest: '#fafafa',
  onSurface: '#191c1d',
  onSurfaceVariant: '#534434',
  primary: '#855300',
  primaryContainer: '#f59e0b',
  tertiary: '#00658b',
  tertiaryContainer: '#1abdff',
  error: '#ba1a1a',
  success: '#4ade80',
  shadow: '0 12px 32px rgba(25,28,29,0.04)',
};

interface RevenueData {
  total_revenue: number;
  total_orders: number;
  avg_per_order: number;
}

interface DailyRevenueItem {
  date: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  item_name: string;
  quantity: number;
  revenue: number;
}

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getToday = (): string => new Date().toISOString().split('T')[0];

const getStartOfWeek = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
};

const getStartOfMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
};

/* ── KPI card config ── */
const kpiConfig = [
  {
    key: 'revenue' as const,
    label: 'Tong doanh thu',
    icon: <AttachMoneyIcon />,
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: S.primaryContainer,
    getValue: (r: RevenueData) => formatVND(r.total_revenue),
    trend: '+12.5%',
    trendUp: true,
  },
  {
    key: 'orders' as const,
    label: 'So don hang',
    icon: <ShoppingCartIcon />,
    iconBg: 'rgba(0,101,139,0.10)',
    iconColor: S.tertiary,
    getValue: (r: RevenueData) => String(r.total_orders),
    trend: '+8.2%',
    trendUp: true,
  },
  {
    key: 'avg' as const,
    label: 'Trung binh/don',
    icon: <TrendingUpIcon />,
    iconBg: 'rgba(74,222,128,0.12)',
    iconColor: '#16a34a',
    getValue: (r: RevenueData) => formatVND(r.avg_per_order),
    trend: '+3.1%',
    trendUp: true,
  },
];

const DashboardScreen: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>(getStartOfMonth());
  const [toDate, setToDate] = useState<string>(getToday());
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueItem[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'today' | 'week' | 'month'>('month');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const from = `${fromDate}T00:00:00`;
      const to = `${toDate}T23:59:59`;

      const [revenueData, dailyData, topItemsData] = await Promise.all([
        reportService.getRevenue(from, to),
        reportService.getDailyRevenue(from, to),
        reportService.getTopItems(from, to, 10),
      ]);

      setRevenue(revenueData);
      setDailyRevenue(dailyData);
      setTopItems(topItemsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      toast.error('Loi tai du lieu thong ke');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePreset = (preset: 'today' | 'week' | 'month') => {
    setActivePreset(preset);
    setToDate(getToday());
    switch (preset) {
      case 'today':
        setFromDate(getToday());
        break;
      case 'week':
        setFromDate(getStartOfWeek());
        break;
      case 'month':
        setFromDate(getStartOfMonth());
        break;
    }
  };

  const handleExport = () => {
    toast.success('Tinh nang xuat bao cao dang phat trien');
  };

  const presets: { key: 'today' | 'week' | 'month'; label: string }[] = [
    { key: 'today', label: 'Hom nay' },
    { key: 'week', label: 'Tuan nay' },
    { key: 'month', label: 'Thang nay' },
  ];

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
        <CircularProgress sx={{ color: S.primaryContainer }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        bgcolor: S.surface,
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 24, md: 32 },
              fontWeight: 700,
              color: S.onSurface,
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            Thong ke doanh thu
          </Typography>
          <Typography
            sx={{
              color: S.onSurfaceVariant,
              mt: 0.5,
              fontSize: 15,
            }}
          >
            Tong quan hieu suat kinh doanh
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          sx={{
            borderRadius: '1rem',
            textTransform: 'none',
            px: 3,
            py: 1.5,
            bgcolor: S.tertiary,
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#004c6a', boxShadow: 'none' },
          }}
        >
          Xuat bao cao
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: '1rem',
            bgcolor: 'rgba(186,26,26,0.06)',
            color: S.error,
            '& .MuiAlert-icon': { color: S.error },
          }}
        >
          {error}
        </Alert>
      )}

      {/* ── Date Range Picker ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          label="Tu ngay"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '0.75rem',
              bgcolor: S.surfaceLowest,
              '& fieldset': { borderColor: S.surfaceLow },
              '&.Mui-focused fieldset': { borderColor: S.primaryContainer },
            },
          }}
        />
        <TextField
          label="Den ngay"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '0.75rem',
              bgcolor: S.surfaceLowest,
              '& fieldset': { borderColor: S.surfaceLow },
              '&.Mui-focused fieldset': { borderColor: S.primaryContainer },
            },
          }}
        />
        {/* Segmented preset buttons */}
        <Box
          sx={{
            display: 'inline-flex',
            bgcolor: S.surfaceLow,
            borderRadius: '1rem',
            p: '4px',
            gap: 0.5,
          }}
        >
          {presets.map((p) => (
            <Button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              sx={{
                borderRadius: '0.75rem',
                textTransform: 'none',
                px: 2.5,
                py: 0.75,
                fontSize: 14,
                fontWeight: 600,
                minWidth: 0,
                bgcolor: activePreset === p.key ? S.surfaceLowest : 'transparent',
                color: activePreset === p.key ? S.onSurface : S.onSurfaceVariant,
                boxShadow: activePreset === p.key ? '0 2px 8px rgba(25,28,29,0.06)' : 'none',
                '&:hover': {
                  bgcolor: activePreset === p.key ? S.surfaceLowest : 'rgba(0,0,0,0.03)',
                },
              }}
            >
              {p.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* ── KPI Cards ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        {kpiConfig.map((kpi) => (
          <Card
            key={kpi.key}
            sx={{
              borderRadius: '1.5rem',
              bgcolor: S.surfaceLow,
              boxShadow: 'none',
              border: 'none',
              transition: 'background 0.2s ease',
              '&:hover': { bgcolor: S.surfaceContainerLowest },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Icon + trend row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: kpi.iconBg,
                    p: 1,
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: kpi.iconColor,
                  }}
                >
                  {kpi.icon}
                </Box>
                <Box
                  sx={{
                    bgcolor: kpi.trendUp ? 'rgba(0,101,139,0.10)' : 'rgba(186,26,26,0.10)',
                    color: kpi.trendUp ? S.tertiary : S.error,
                    fontSize: 12,
                    fontWeight: 700,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '9999px',
                  }}
                >
                  {kpi.trend}
                </Box>
              </Box>
              {/* Label */}
              <Typography
                sx={{
                  fontSize: 14,
                  color: S.onSurfaceVariant,
                  fontWeight: 500,
                  mb: 1,
                }}
              >
                {kpi.label}
              </Typography>
              {/* Value */}
              <Typography
                sx={{
                  fontSize: '3rem',
                  fontWeight: 900,
                  color: S.onSurface,
                  fontFamily: 'Manrope, sans-serif',
                  lineHeight: 1.1,
                }}
              >
                {revenue ? kpi.getValue(revenue) : '--'}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Chart + Table grid ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
        }}
      >
        {/* Revenue Chart */}
        <Card
          sx={{
            borderRadius: '1.5rem',
            bgcolor: S.surfaceLowest,
            boxShadow: S.shadow,
            border: 'none',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(245,158,11,0.12)',
                  p: 1,
                  borderRadius: '0.75rem',
                  display: 'flex',
                  color: S.primaryContainer,
                }}
              >
                <BarChartIcon />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: S.onSurface,
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                Doanh thu theo ngay
              </Typography>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke={S.surfaceLow} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: S.onSurfaceVariant }}
                    axisLine={{ stroke: S.surfaceLow }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: S.onSurfaceVariant }}
                    axisLine={{ stroke: S.surfaceLow }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => formatVND(value)}
                    labelFormatter={(label: string) => `Ngay: ${label}`}
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: 'none',
                      boxShadow: S.shadow,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill={S.primaryContainer}
                    name="Doanh thu"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Top Items Table */}
        <Card
          sx={{
            borderRadius: '1.5rem',
            bgcolor: S.surfaceLowest,
            boxShadow: S.shadow,
            border: 'none',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(0,101,139,0.10)',
                  p: 1,
                  borderRadius: '0.75rem',
                  display: 'flex',
                  color: S.tertiary,
                }}
              >
                <TrophyIcon />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: S.onSurface,
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                Top 10 mon ban chay
              </Typography>
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['#', 'Ten mon', 'SL ban', 'Doanh thu'].map((h, i) => (
                      <TableCell
                        key={h}
                        align={i >= 2 ? 'right' : 'left'}
                        sx={{
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontSize: 10,
                          letterSpacing: '0.1em',
                          color: S.onSurfaceVariant,
                          borderBottom: `2px solid ${S.surfaceLow}`,
                          py: 1.5,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topItems.map((item, index) => (
                    <TableRow
                      key={item.item_name}
                      sx={{
                        '& .MuiTableCell-root': {
                          borderBottom: `1px solid ${S.surfaceLow}`,
                          py: 2.5,
                          px: { xs: 2, md: 4 },
                        },
                        '&:hover': { bgcolor: S.surfaceContainerLowest },
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: S.onSurfaceVariant,
                          fontSize: 14,
                        }}
                      >
                        {index + 1}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          color: S.onSurface,
                          fontSize: 15,
                        }}
                      >
                        {item.item_name}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          color: S.onSurface,
                          fontSize: 15,
                        }}
                      >
                        {item.quantity}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          color: S.onSurface,
                          fontSize: 15,
                        }}
                      >
                        {formatVND(item.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {topItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <BarChartIcon sx={{ fontSize: 56, color: S.surfaceLow, mb: 2 }} />
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: S.onSurface,
                              fontSize: 16,
                              fontFamily: 'Manrope, sans-serif',
                            }}
                          >
                            Khong co du lieu
                          </Typography>
                          <Typography sx={{ color: S.onSurfaceVariant, fontSize: 14, mt: 0.5 }}>
                            Chua co du lieu thong ke trong khoang thoi gian nay
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardScreen;
