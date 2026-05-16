# Namo - Pharmacy Inventory Management System

## Project Overview
**Namo** is a modern pharmacy inventory management system built with Next.js 16, React 19, and Prisma. It manages multi-store pharmacy operations with capabilities for inventory tracking, order management, barcode scanning, and real-time synchronization with legacy SQL Server databases.

**Status**: Active development | **Branch**: `dev` → `main`

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, Next.js 16 (App Router), TypeScript/JavaScript
- **Styling**: Tailwind CSS 4, Radix UI components
- **Database**: PostgreSQL (via Neon) + MSSQL (store-specific)
- **ORM**: Prisma 7.3.0
- **HTTP**: Axios, Next.js API routes
- **UI Components**: Radix UI, Lucide icons, Sonner (toasts), Vaul (drawers)
- **Special**: Quagga2 (barcode scanning), Next Themes

### Database Model
```
Postgres (Main DB - Nemo):
├── Store: id, name, dbIp, dbPort, dbName, dbUser, dbPassword
├── Scanned: id, storeId, barcode, count, timestamps
└── Order: id, storeId, customerId, itemDetailId, qty, pricing, timestamps

MSSQL (Per-Store DBs):
├── tbl_Company: CompanyId, CompanyName
├── tbl_Year: YearId, YearNo, FrmTo_Date, CompanyId
├── tbl_ItemMaster: ItemDetailId, ItemName, ItemCode, Mfr details, location
├── tbl_Inward: BatchNo, ExpDate, Qty, Outward, MRP, PTR, NPR, Barcode
├── tbl_LedgerSetup: Led_Name (manufacturers)
├── tbl_GroupDetail: GrpName (generics, packaging, categories)
└── tbl_SO: Sales orders (orders synced from local DB)
```

### Context Providers
- **StoresProvider**: Manages all available stores, fetch/refetch logic
- **CompanyProvider**: Company & year selection based on store
- **CustomerProvider**: Customer data fetched per store

---

## 📱 Page Structure

| Path | Purpose | Key Features |
|------|---------|--------------|
| `/` | Store selection | List all stores, navigate to store-specific pages |
| `/[storeId]/inventory` | Browse products | Search by name/generic/location/manufacturer, view batches, pricing |
| `/[storeId]/scanner` | Barcode scanning | Scan products into cart, quantity tracking |
| `/[storeId]/cart` | Cart review | Review scanned items, modify quantities |
| `/[storeId]/order` | Order placement | Select company/year/customer, place bulk orders |
| `/[storeId]/sync` | Sync pending | View & sync orders to store's MSSQL DB |

---

## 🔌 API Routes

### Data Fetching
- **GET `/api/store`**: List all stores
- **GET `/api/companies?storeId=X`**: Companies & years for store (SQL Server query)
- **GET `/api/customer?storeId=X`**: Customers for store (SQL Server query)
- **GET `/api/inventory?storeId=X&companyId=Y&searchCriteria=Z&searchTerm=W`**: 
  - Complex SQL Server join aggregating items, batches, pricing
  - Supports search by: name, generic, location, manufacturer, barcode
  - Groups batches under items, calculates total quantities
  - Returns flat response with batch details

### Order Management
- **POST `/api/order`**: Create local order record
- **GET `/api/order?storeId=X&customerId=Y`**: Fetch local orders
- **DELETE `/api/order`**: Remove order record
- **POST `/api/order-inventory`**: Batch place orders via cart (1426 lines - most complex)
- **POST `/api/cart`**: Manage cart items (252 lines)
- **POST `/api/scanned`**: Track barcode scans (109 lines)

### Sync Operations
- **POST `/api/sync`**: Batch insert orders into store's SQL Server, clean local DB
  - Uses MSSQL batch insert with parameterized queries
  - Deletes orders from Postgres after sync succeeds

---

## 🎨 Key Components

| Component | Purpose | Features |
|-----------|---------|----------|
| `stores.jsx` | Store selection UI | Lists stores, handles navigation |
| `store-header.jsx` | Header for store pages | Shows store name, company/year dropdowns |
| `bottom-navigation.jsx` | Mobile bottom nav | Links to inventory, cart, scanner, order, sync |
| `stock-card.jsx` | Product card | Displays item details, batch accordion, quick-add |
| `order-page-content.jsx` (complex) | Order placement interface | Company/year/customer select, order form |
| `add-medicine-drawer.jsx` | Drawer for manual entry | Form to add custom items |
| `pending-syncs-card.jsx` | Sync status display | Shows orders awaiting sync |
| Skeleton components | Loading states | Cart, inventory, order, stores skeletons |

---

## 🔄 Data Flow

### Browsing Inventory Flow
1. User selects store → renders StoreLayout
2. StoreHeader shows companies/years for store
3. CompanyProvider fetches companies on storeId/selectedCompanyId change
4. InventoryPage fetches items from `/api/inventory` with filters
5. StockCard displays items with batches in accordion
6. User can scan via camera or add manually to cart

### Order Placement Flow
1. User navigates to Order page
2. Select company → year → customer
3. OrderPageContent renders order form (batch place interface)
4. POST to `/api/order-inventory` with batch items
5. Orders stored in local Postgres Order table
6. Orders appear in Sync page pending syncing

### Sync Flow
1. User views `/sync` page with PendingSyncsCard
2. Click sync → POST to `/api/sync`
3. Batch insert orders into store's MSSQL tbl_SO
4. Delete orders from local Postgres
5. Show success toast, refresh pending syncs list

---

## 🔑 Key Design Patterns

### Multi-Database Strategy
- **Main DB (Postgres)**: Central store config, local order staging, scan tracking
- **Store DBs (MSSQL)**: Per-store inventory, masters, actual sales orders
- **Dual-write sync**: Orders written locally, then synced to remote DB

### Connection Pooling
- MSSQL pools cached globally (`lib/db.js`) keyed by `ip:port:dbname`
- Pool reuse across requests to same store
- Connection timeout: 30s, request timeout: 30s

### Search Optimization
- Debounced search (500ms) on inventory page
- Prevents redundant criteria changes on empty search
- Query optimized with indexed JOINs on MSSQL

### Context + Axios Pattern
- StoresContext: Global store list
- CompanyContext: Reactive to storeId, manages selected company
- CustomerContext: Separate fetch per store with abort on unmount
- No Redux/Zustand—contexts sufficient for current scope

---

## ⚠️ Important Notes

### Store Credentials
- Each store has plaintext DB credentials stored in Postgres
- **Security**: Should be encrypted or moved to vault in production
- **Impact**: Credentials used to dynamically connect to store DBs

### Order Sync Guarantees
- Orders deleted from Postgres **after** successful MSSQL insert
- If sync fails mid-operation: orders remain local, can retry
- No distributed transaction—best-effort model

### MSSQL Query Complexity
- Inventory query: 8-table LEFT JOIN, calculated PTR (with tax), batch grouping
- Company query: Window function to get top 2 years per company
- No ORM on MSSQL side—raw SQL queries, parameterized inputs

### UI/UX
- Mobile-first design, safe-area padding for notched devices
- Radix UI for accessibility
- Sonner toasts for feedback
- Bottom navigation fixed for persistent access

---

## 🛠️ Development Workflow

### Setup
```bash
npm install
npx prisma generate  # Generate Prisma client
npm run dev          # Next.js dev server on :3000
```

### Adding Features
1. Update Prisma schema if needed (local DB changes)
2. Create/update API route in `/app/api/`
3. Create component or page in `/app/[storeId]/` or `/components/`
4. Update context if sharing state across pages
5. Add route to bottom-navigation if new page section

### Testing Data Flow
- Use VS Code Debugger or Chrome DevTools
- Check Network tab for API calls
- Verify local order creation in Postgres
- Confirm MSSQL insert via store DB query
- Validate context values in React DevTools

---

## 📋 TODO / Known Issues
- [ ] Encrypt DB credentials in storage
- [ ] Add request/response logging middleware
- [ ] Implement optimistic updates for cart/order
- [ ] Add error boundary & fallback pages
- [ ] Barcode scanning tested but not fully integrated in all flows
- [ ] Customer context not wired to CompanyProvider (separate fetch pattern)

---

## 🔍 File Statistics
- Total API routes: 9 files, ~1426 LOC
- Components: 15+ files (mostly functional, JSX)
- Contexts: 3 providers with hooks
- Schema: 3 models, indexed for performance
- No test files—manual testing only

---

## 📞 Quick Reference
- **Main DB URL**: `process.env.DATABASE_URL` (Neon PostgreSQL)
- **Store DB**: Dynamic per store from Prisma Store record
- **Barcode lib**: `@ericblade/quagga2`
- **Toast provider**: `<Toaster />` already in layout.js
- **UI kit**: Radix UI Primitives + CVA for variants
- **Font**: Geist (Google Fonts)
