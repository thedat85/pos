# System Design - Restaurant POS

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI Framework | Tailwind CSS + Material Design (MUI) |
| Routing | React Router v6 |
| State | React Context + useReducer |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Realtime | Supabase Realtime (WebSocket channels) |

## Architecture

```
Frontend (React SPA)
  └── Screens (17 screens, role-based)
       └── Services (10 service modules)
            └── Supabase Client (@supabase/supabase-js)
                 ├── PostgreSQL (Data)
                 ├── Auth (JWT + RBAC)
                 ├── Realtime (WebSocket channels)
                 └── Storage (Menu images)
```

## Module Breakdown

| Module | Service | Screens | BD Function |
|--------|---------|---------|------------|
| Auth | authService | LoginScreen | FN-10 |
| Reservation | reservationService | ReservationList, ReservationForm | FN-01 |
| Order | orderService | TableMap, OrderScreen, OrderDetail | FN-02 |
| Kitchen | kitchenService | KitchenDisplay | FN-03 |
| Payment | paymentService | PaymentScreen, InvoiceScreen | FN-04 |
| Table | tableService | TableManagement | FN-05 |
| Menu | menuService | MenuManagement | FN-06 |
| Inventory | inventoryService | InventoryScreen | FN-09 |
| Report | reportService | DashboardScreen | FN-08 |
| Config | configService | PaymentConfig, SystemConfig, UserManagement | FN-07 |

## Routing

| Path | Screen | Role |
|------|--------|------|
| /login | LoginScreen | All |
| /waiter/tables | TableMapScreen | Waiter |
| /waiter/orders/:tableId | OrderScreen | Waiter |
| /waiter/order/:orderId | OrderDetailScreen | Waiter |
| /waiter/reservations | ReservationListScreen | Waiter |
| /waiter/reservations/new | ReservationFormScreen | Waiter |
| /kitchen | KitchenDisplayScreen | Kitchen |
| /cashier/payment/:orderId | PaymentScreen | Cashier |
| /cashier/invoice/:orderId | InvoiceScreen | Cashier |
| /manager/dashboard | DashboardScreen | Manager |
| /manager/tables | TableManagementScreen | Manager |
| /manager/menu | MenuManagementScreen | Manager |
| /manager/inventory | InventoryScreen | Manager |
| /manager/payments | PaymentHistoryScreen | Manager |
| /manager/payment-config | PaymentConfigScreen | Manager |
| /manager/users | UserManagementScreen | Manager |
| /manager/config | SystemConfigScreen | Manager |

## Data Flow

- **Order Flow**: Waiter → orderService.create() → Supabase INSERT → Realtime channel `kitchen-orders` → Kitchen subscription
- **Kitchen Flow**: Kitchen → kitchenService.updateItemStatus() → Supabase UPDATE → Realtime channel `order-updates` → Waiter subscription
- **Payment Flow**: Cashier → paymentService.process() → Supabase INSERT payment + UPDATE order.status='closed' + UPDATE table.status='available'
- **Auth Flow**: Login → Supabase Auth → JWT → get user role → RBAC routing
