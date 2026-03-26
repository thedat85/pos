// ============================================
// SCR-09: Invoice Screen — Thermal Receipt 80mm
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Print as PrintIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import { APP_NAME } from '../../lib/constants';
import type { Order, Payment } from '../../types';

function fmt(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  qr: 'Chuyển khoản QR',
};

/* ── Thermal receipt print CSS ── */
const printStyles = `
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }
  html, body {
    width: 80mm;
    margin: 0;
    padding: 0;
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body * {
    visibility: hidden !important;
  }
  #receipt, #receipt * {
    visibility: visible !important;
  }
  #receipt {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 80mm !important;
    max-width: 80mm !important;
    padding: 4mm 3mm !important;
    margin: 0 !important;
    background: #fff !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    font-size: 12px !important;
  }
  #receipt * {
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  #no-print {
    display: none !important;
  }
}
`;

export default function InvoiceScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const loadInvoice = async () => {
      try {
        const data = await paymentService.getInvoice(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load invoice:', err);
        toast.error('Không thể tải hóa đơn');
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [orderId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress sx={{ color: '#f59e0b' }} />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: '#534434', mb: 2 }}>Không tìm thấy hóa đơn</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/cashier')}
          sx={{ textTransform: 'none', color: '#855300', fontWeight: 600 }}>
          Quay lại
        </Button>
      </Box>
    );
  }

  const payments = (order as Order & { payments?: Payment[]; payment?: Payment }).payments
    ?? ((order as Order & { payment?: Payment }).payment ? [(order as Order & { payment?: Payment }).payment!] : []);
  const payment = payments.length > 0 ? payments[payments.length - 1] : null;

  const items = order.items ?? [];
  const subtotal = order.subtotal ?? 0;
  const taxAmount = order.tax_amount ?? 0;
  const serviceFee = order.service_fee ?? 0;
  const total = order.total ?? 0;

  /* ── Dashed line helper ── */
  const DashLine = () => (
    <Box sx={{
      borderTop: '1px dashed #999',
      my: 1,
      mx: 0,
    }} />
  );

  /* ── Row helper ── */
  const Row = ({ left, right, bold = false }: { left: string; right: string; bold?: boolean }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
      <Typography sx={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: '#191c1d', fontFamily: 'monospace' }}>
        {left}
      </Typography>
      <Typography sx={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: '#191c1d', fontFamily: 'monospace', textAlign: 'right' }}>
        {right}
      </Typography>
    </Box>
  );

  return (
    <>
      <style>{printStyles}</style>

      <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: { xs: 2, md: 4 } }}>
        {/* Action buttons */}
        <Box
          id="no-print"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: 360,
            mx: 'auto',
            mb: 3,
          }}
        >
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/cashier')}
            sx={{
              textTransform: 'none', color: '#855300', fontWeight: 600,
              borderRadius: 12, '&:hover': { bgcolor: 'rgba(133,83,0,0.06)' },
            }}
          >
            Quay lại
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            variant="contained"
            sx={{
              textTransform: 'none', fontWeight: 600, borderRadius: 12,
              background: 'linear-gradient(135deg, #855300, #f59e0b)',
              '&:hover': { background: 'linear-gradient(135deg, #6b4200, #d48b09)' },
            }}
          >
            In hóa đơn
          </Button>
        </Box>

        {/* Receipt — 80mm thermal paper style */}
        <Box
          id="receipt"
          sx={{
            maxWidth: 320,        // ~80mm
            mx: 'auto',
            bgcolor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(25,28,29,0.06)',
            p: '16px 14px',
            fontFamily: '"Courier New", Courier, monospace',
            // Zigzag top edge (receipt tear)
            '&::before': {
              content: '""',
              display: 'block',
              height: 8,
              mx: -1.75,
              mt: -2,
              mb: 1.5,
              background: 'linear-gradient(135deg, #f8f9fa 33.33%, transparent 33.33%) 0 0, linear-gradient(225deg, #f8f9fa 33.33%, transparent 33.33%) 0 0',
              backgroundSize: '8px 8px',
              backgroundRepeat: 'repeat-x',
            },
          }}
        >
          {/* ── Header ── */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography sx={{
              fontSize: 18, fontWeight: 800, color: '#191c1d',
              fontFamily: '"Manrope", sans-serif', letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {APP_NAME}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#999', fontFamily: 'monospace', mt: 0.25 }}>
              Nhà hàng ẩm thực
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#999', fontFamily: 'monospace' }}>
              ĐT: 0123.456.789
            </Typography>
          </Box>

          <DashLine />

          {/* ── Order Info ── */}
          <Row left="Số HĐ:" right={`#${order.id.slice(0, 8).toUpperCase()}`} />
          <Row left="Bàn:" right={order.table?.table_no ?? '---'} />
          <Row left="Ngày:" right={fmtDate(order.created_at)} />

          <DashLine />

          {/* ── Items ── */}
          {/* Header */}
          <Box sx={{ display: 'flex', py: 0.5 }}>
            <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#191c1d' }}>
              Món
            </Typography>
            <Typography sx={{ width: 30, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#191c1d', textAlign: 'center' }}>
              SL
            </Typography>
            <Typography sx={{ width: 70, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#191c1d', textAlign: 'right' }}>
              Đ.Giá
            </Typography>
            <Typography sx={{ width: 80, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#191c1d', textAlign: 'right' }}>
              T.Tiền
            </Typography>
          </Box>

          <Box sx={{ borderTop: '1px solid #ddd', mb: 0.5 }} />

          {/* Item rows */}
          {items.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', py: 0.3 }}>
              <Typography sx={{
                flex: 1, fontSize: 11, fontFamily: 'monospace', color: '#191c1d',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 0.5,
              }}>
                {item.item_name}
              </Typography>
              <Typography sx={{ width: 30, fontSize: 11, fontFamily: 'monospace', color: '#191c1d', textAlign: 'center' }}>
                {item.quantity}
              </Typography>
              <Typography sx={{ width: 70, fontSize: 11, fontFamily: 'monospace', color: '#191c1d', textAlign: 'right' }}>
                {fmt(item.item_price)}
              </Typography>
              <Typography sx={{ width: 80, fontSize: 11, fontFamily: 'monospace', color: '#191c1d', textAlign: 'right' }}>
                {fmt(item.item_price * item.quantity)}
              </Typography>
            </Box>
          ))}

          <DashLine />

          {/* ── Totals ── */}
          <Row left="Tạm tính:" right={`${fmt(subtotal)}đ`} />
          {taxAmount > 0 && <Row left="Thuế VAT:" right={`${fmt(taxAmount)}đ`} />}
          {serviceFee > 0 && <Row left="Phí DV:" right={`${fmt(serviceFee)}đ`} />}

          {/* Grand total — bold, larger */}
          <Box sx={{
            display: 'flex', justifyContent: 'space-between',
            py: 0.75, mt: 0.5,
            borderTop: '2px solid #191c1d',
            borderBottom: '2px solid #191c1d',
          }}>
            <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#191c1d', fontFamily: 'monospace' }}>
              TỔNG CỘNG
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#191c1d', fontFamily: 'monospace' }}>
              {fmt(total)}đ
            </Typography>
          </Box>

          <DashLine />

          {/* ── Payment Info ── */}
          {payment && (
            <>
              <Row left="Thanh toán:" right={METHOD_LABEL[payment.method] ?? payment.method} />
              {payment.method === 'cash' && (
                <>
                  <Row left="Khách đưa:" right={`${fmt(payment.amount_received ?? 0)}đ`} />
                  <Row left="Tiền thừa:" right={`${fmt((payment.amount_received ?? 0) - payment.amount)}đ`} bold />
                </>
              )}
              <DashLine />
            </>
          )}

          {/* ── Footer ── */}
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#191c1d', fontFamily: 'monospace' }}>
              Cảm ơn quý khách!
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#999', fontFamily: 'monospace', mt: 0.25 }}>
              Hẹn gặp lại
            </Typography>
            <Typography sx={{ fontSize: 9, color: '#bbb', fontFamily: 'monospace', mt: 1 }}>
              {fmtDate(new Date().toISOString())}
            </Typography>
          </Box>

          {/* Zigzag bottom edge */}
          <Box sx={{
            height: 8,
            mx: -1.75,
            mt: 1.5,
            mb: -2,
            background: 'linear-gradient(315deg, #f8f9fa 33.33%, transparent 33.33%) 0 0, linear-gradient(45deg, #f8f9fa 33.33%, transparent 33.33%) 0 0',
            backgroundSize: '8px 8px',
            backgroundRepeat: 'repeat-x',
          }} />
        </Box>
      </Box>
    </>
  );
}
