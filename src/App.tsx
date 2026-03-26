import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import theme from './lib/theme';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import MainLayout from './components/layout/MainLayout';
import KitchenLayout from './components/layout/KitchenLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Screens
import LoginScreen from './screens/LoginScreen';
import TableMapScreen from './screens/waiter/TableMapScreen';
import OrderScreen from './screens/waiter/OrderScreen';
import OrderDetailScreen from './screens/waiter/OrderDetailScreen';
import ReservationListScreen from './screens/waiter/ReservationListScreen';
import ReservationFormScreen from './screens/waiter/ReservationFormScreen';
import KitchenDisplayScreen from './screens/kitchen/KitchenDisplayScreen';
import PaymentScreen from './screens/cashier/PaymentScreen';
import InvoiceScreen from './screens/cashier/InvoiceScreen';
import DashboardScreen from './screens/manager/DashboardScreen';
import TableManagementScreen from './screens/manager/TableManagementScreen';
import MenuManagementScreen from './screens/manager/MenuManagementScreen';
import InventoryScreen from './screens/manager/InventoryScreen';
import PaymentHistoryScreen from './screens/manager/PaymentHistoryScreen';
import PaymentConfigScreen from './screens/manager/PaymentConfigScreen';
import UserManagementScreen from './screens/manager/UserManagementScreen';
import SystemConfigScreen from './screens/manager/SystemConfigScreen';

export default function App() {
  const auth = useAuthProvider();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AuthContext.Provider value={auth}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginScreen />} />

            {/* Waiter + Cashier routes (cashier has same UI as waiter + payment) */}
            <Route element={
              <ProtectedRoute allowedRoles={['waiter', 'cashier', 'manager']}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="/waiter/tables" element={<TableMapScreen />} />
              <Route path="/waiter/orders/:tableId" element={<OrderScreen />} />
              <Route path="/waiter/order/:orderId" element={<OrderDetailScreen />} />
              <Route path="/waiter/reservations" element={<ReservationListScreen />} />
              <Route path="/waiter/reservations/new" element={<ReservationFormScreen />} />
              <Route path="/waiter/reservations/:id/edit" element={<ReservationFormScreen />} />
            </Route>

            {/* Kitchen routes - fullscreen layout */}
            <Route element={
              <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                <KitchenLayout />
              </ProtectedRoute>
            }>
              <Route path="/kitchen" element={<KitchenDisplayScreen />} />
            </Route>

            {/* Cashier routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="/cashier" element={<PaymentScreen />} />
              <Route path="/cashier/payment/:orderId" element={<PaymentScreen />} />
              <Route path="/cashier/invoice/:orderId" element={<InvoiceScreen />} />
            </Route>

            {/* Manager routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['manager']}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="/manager/dashboard" element={<DashboardScreen />} />
              <Route path="/manager/tables" element={<TableManagementScreen />} />
              <Route path="/manager/menu" element={<MenuManagementScreen />} />
              <Route path="/manager/inventory" element={<InventoryScreen />} />
              <Route path="/manager/payments" element={<PaymentHistoryScreen />} />
              <Route path="/manager/payment-config" element={<PaymentConfigScreen />} />
              <Route path="/manager/users" element={<UserManagementScreen />} />
              <Route path="/manager/config" element={<SystemConfigScreen />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
