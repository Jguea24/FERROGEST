# FERROGEST — DETAILED TECHNICAL ARCHITECTURE DOCUMENT
**Target System:** Enterprise Management Web Application for Hardware Store FERRO GET  
**Document Version:** 1.0.0  
**Authors:** Senior Software Engineering Team (Requirements Analyst, Software Architect, UX/UI Designer, Full Stack Engineer, Database Engineer, QA Engineer, Security Specialist)

---

## 1. THREE-LAYER ARCHITECTURE PATTERN (PRESENTATION, LOGIC, DATA)

FERROGEST is architected strictly following the classical **Three-Tier Enterprise Architecture Pattern** to maintain strict separation of concerns, high testability, and enterprise-grade modularity:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: PRESENTATION LAYER                         │
│  - Single Page Application (SPA) built with React 19 + TypeScript           │
│  - Tailwind CSS for industrial-grade UI styling with zero style bloat       │
│  - Role-based views: Administrator (full control) vs Cashier/Salesperson   │
│  - High-speed POS barcode/code search, cart management, visual alerts       │
│  - Responsive layouts: Desktop counters, tablets, mobile inventory checks  │
│  - Decoupled API Clients with JWT token interceptors & optimistic UI updates│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON over REST
                                       │ Authorization: Bearer <JWT>
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    LAYER 2: BUSINESS LOGIC LAYER (BACKEND)                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Security & Middleware Pipeline                                        │  │
│  │  - Authentication Guard (Cryptographic JWT verification)              │  │
│  │  - Role-Based Access Control (RBAC): ADMIN vs VENDEDOR authorization  │  │
│  │  - Input Validation & Sanitization DTOs (fail-fast on malformed data) │  │
│  │  - Centralized Error Handling & HTTP Status Code Normalizer           │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ REST Controllers                                                      │  │
│  │  - AuthController, ProductController, CategoryController,             │  │
│  │  - LocationController, SaleController, CashController,                │  │
│  │  - SupplierController, PurchaseController, ReportController           │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ Domain Services (Core Business Rules Engine)                          │  │
│  │  - InventoryService: SKU uniqueness, stock validation, auto-alerts    │  │
│  │  - SalesService: Stock availability check, atomic inventory decrease  │  │
│  │  - CashService: Shift opening, cash-in/out, expected balance calculation│
│  │  - PurchaseService: Supplier order receipt, stock increase, cost update│
│  │  - CostHistoryService: Immutable acquisition price audit logs         │  │
│  │  - ReportService: Real-time KPIs, Kardex ledger, CSV data generator  │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ Architectural Design Patterns:                                        │  │
│  │  - Strategy Pattern: Variable Payment Processing (Cash, Card, Wire)   │  │
│  │  - Repository / DAO Pattern: Decoupled database query abstraction     │  │
│  │  - Unit of Work / Atomic Transactions: ACID consistency for orders    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ ORM / Relational Database Adapter
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       LAYER 3: DATA & PERSISTENCE LAYER                     │
│  - Relational Database Normalized in Third Normal Form (3NF)                │
│  - Referential Integrity with Foreign Key Constraints (RESTRICT / CASCADE)   │
│  - Check Constraints (prices >= 0, stock >= 0, line quantities > 0)          │
│  - B-Tree Indexes on SKUs, national tax IDs (RUC/NIT), and timestamp ranges │
│  - Immutable Audit Tables: movimiento_inventario, historial_costo, alerta    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Justification of Applied Software Design Patterns:
1. **DAO / Repository Pattern:** Isolate database operations (`find`, `create`, `updateWithLock`, `queryByCriteria`) from service classes. This guarantees that business rules contain zero database-specific syntax and can be unit-tested using mocks without spinning up real databases.
2. **Strategy Pattern:** Used for payment methods (`IPaymentStrategy` implemented by `CashPaymentStrategy`, `CardPaymentStrategy`, `TransferPaymentStrategy`). Allows adding future payment mechanisms (e.g., QR, digital wallets) without altering the core `SalesService`.
3. **Data Transfer Object (DTO) Pattern:** Enforces strict typing and validation boundaries on incoming requests, sanitizing inputs before they reach domain entities.
4. **Centralized Error Handling:** Eliminates ad-hoc `try/catch` code repetition and guarantees structured error responses (`{ success: false, error: string }`) with appropriate semantic HTTP status codes.

---

## 2. FOLDER STRUCTURE FOR FRONTEND AND BACKEND

The project codebase is organized into a clean, modular structure separating presentation from backend domain logic:

```text
ferrogest/
├── docs/                                  # Architectural and technical documents
│   ├── ARQUITECTURA_TECNICA.md            # Spanish technical specification
│   └── TECHNICAL_ARCHITECTURE.md          # English technical architecture manual
├── tests/                                 # Automated QA Test Suite
│   ├── unit/                              # Unit tests for domain services
│   │   ├── inventory.service.test.ts      # SKU uniqueness, alert trigger tests
│   │   ├── sales.service.test.ts          # Insufficient stock, payment strategy
│   │   └── cash.service.test.ts           # Discrepancy & balance calculation
│   └── integration/                       # Full API integration tests
│       ├── auth-flow.test.ts              # Login & RBAC permission checks
│       ├── pos-inventory-flow.test.ts     # Sale deduction & Kardex ledger check
│       └── purchase-stock-cost.test.ts    # Purchase receipt & cost history check
├── src/
│   │
│   ├── server/                            # BACKEND (LAYER 2 & LAYER 3)
│   │   ├── config/                        # Environment, constants & secret loaders
│   │   │   └── env.ts
│   │   ├── database/                      # Schema DDL, connection pool, seeds
│   │   │   ├── schema.ts                  # Table definitions & relational constraints
│   │   │   ├── connection.ts              # DB client & transaction manager
│   │   │   └── seed.ts                    # Demo seed dataset for FERRO GET
│   │   ├── models/                        # Domain entity interfaces
│   │   │   ├── user.model.ts
│   │   │   ├── product.model.ts
│   │   │   ├── category.model.ts
│   │   │   ├── location.model.ts
│   │   │   ├── sale.model.ts
│   │   │   ├── cash.model.ts
│   │   │   ├── supplier.model.ts
│   │   │   ├── purchase.model.ts
│   │   │   ├── cost-history.model.ts
│   │   │   └── movement.model.ts
│   │   ├── repositories/                  # DAO / Repository Layer
│   │   │   ├── base.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   ├── category.repository.ts
│   │   │   ├── location.repository.ts
│   │   │   ├── sale.repository.ts
│   │   │   ├── cash.repository.ts
│   │   │   ├── supplier.repository.ts
│   │   │   ├── purchase.repository.ts
│   │   │   ├── cost-history.repository.ts
│   │   │   └── movement.repository.ts
│   │   ├── strategies/                    # Strategy Pattern for Payment Methods
│   │   │   ├── payment.strategy.ts        # Strategy interface
│   │   │   ├── cash-payment.strategy.ts   # Cash handling & drawer linkage
│   │   │   ├── card-payment.strategy.ts   # Card terminal voucher handling
│   │   │   └── transfer-payment.strategy.ts # Wire transfer receipt handling
│   │   ├── services/                      # Domain Business Logic
│   │   │   ├── auth.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── sales.service.ts
│   │   │   ├── cash.service.ts
│   │   │   ├── purchase.service.ts
│   │   │   ├── cost-history.service.ts
│   │   │   └── report.service.ts
│   │   ├── middlewares/                   # HTTP Interceptors
│   │   │   ├── auth.middleware.ts         # JWT verification
│   │   │   ├── rbac.middleware.ts         # Role guard (ADMIN vs VENDEDOR)
│   │   │   ├── validation.middleware.ts   # Payload schema validation
│   │   │   └── error.middleware.ts        # Global exception handler
│   │   ├── controllers/                   # REST Handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── location.controller.ts
│   │   │   ├── sale.controller.ts
│   │   │   ├── cash.controller.ts
│   │   │   ├── supplier.controller.ts
│   │   │   ├── purchase.controller.ts
│   │   │   └── report.controller.ts
│   │   └── routes/                        # Express Route Aggregators
│   │       ├── auth.routes.ts
│   │       ├── product.routes.ts
│   │       ├── sale.routes.ts
│   │       ├── cash.routes.ts
│   │       ├── purchase.routes.ts
│   │       ├── report.routes.ts
│   │       └── index.ts
│   │
│   ├── client/                            # FRONTEND (LAYER 1)
│   │   ├── types/                         # Shared TypeScript types for UI state
│   │   │   └── index.ts
│   │   ├── services/                      # HTTP Service Clients
│   │   │   ├── api.client.ts              # Fetch wrapper with Bearer token injection
│   │   │   ├── auth.api.ts
│   │   │   ├── inventory.api.ts
│   │   │   ├── sales.api.ts
│   │   │   ├── cash.api.ts
│   │   │   ├── purchases.api.ts
│   │   │   └── reports.api.ts
│   │   ├── hooks/                         # React State & Business Hooks
│   │   │   ├── useAuth.ts                 # Session and RBAC user context
│   │   │   ├── useInventory.ts            # Fast search, filter & stock status
│   │   │   ├── usePOSCart.ts              # Cart items, taxes, discounts calculation
│   │   │   └── useCashRegister.ts         # Shift balance and status
│   │   ├── components/                    # Modular Reusable UI
│   │   │   ├── ui/                        # Button, Input, Modal, Table, Badge, Select
│   │   │   ├── layout/                    # Sidebar, Navbar, PageHeader, StatCard
│   │   │   └── feedback/                  # StockAlertBadge, Toast, ConfirmDialog
│   │   └── pages/                         # Application Views
│   │       ├── auth/
│   │       │   └── LoginPage.tsx          # Clean login form
│   │       ├── dashboard/
│   │       │   └── DashboardPage.tsx      # Real-time hardware store metrics
│   │       ├── inventory/                 # INCREMENT 1
│   │       │   ├── ProductsPage.tsx       # Search, CRUD & physical location display
│   │       │   ├── CategoriesPage.tsx     # Categories CRUD
│   │       │   ├── LocationsPage.tsx      # Aisle and shelf management
│   │       │   └── StockAlertsPage.tsx    # Low stock & replenishment view
│   │       ├── sales/                     # INCREMENT 2
│   │       │   ├── POSPage.tsx            # High-speed point-of-sale checkout
│   │       │   ├── SalesHistoryPage.tsx   # Past sales & printable receipts
│   │       │   └── CashRegisterPage.tsx   # Shift open, cash-in/out, close & audit
│   │       ├── purchases/                 # INCREMENT 3
│   │       │   ├── NewPurchasePage.tsx    # Supplier order receipt entry
│   │       │   ├── PurchaseHistoryPage.tsx# Supplier order history
│   │       │   ├── SuppliersPage.tsx      # Supplier directory CRUD
│   │       │   └── CostHistoryPage.tsx    # Unit cost fluctuation chart & table
│   │       ├── reports/                   # INCREMENT 3
│   │       │   ├── InventoryReportPage.tsx# Stock valuation report
│   │       │   ├── SalesReportPage.tsx    # Daily/monthly revenue report
│   │       │   ├── PurchasesReportPage.tsx# Procurement spend report
│   │       │   └── MovementsReportPage.tsx# Comprehensive Kardex movement ledger
│   │       └── admin/
│   │           ├── UsersPage.tsx          # User & role administration
│   │           └── SettingsPage.tsx       # System settings
│   │
│   ├── App.tsx                            # Root application with router & auth guards
│   ├── main.tsx                           # React entrypoint
│   └── index.css                          # Tailwind CSS imports
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. ENTITY-RELATIONSHIP DIAGRAM DESCRIPTION & RELATIONAL SCHEMA

### 3.1 Logical Entity Relationships & Cardinalities

```
             ┌──────────────┐
             │     ROL      │
             └──────┬───────┘
                    │ 1
                    │
                    │ 0..*
             ┌──────┴───────┐
             │   USUARIO    │
             └──────┬───────┘
     ┌──────────────┼────────────────────────┬─────────────────────────┐
     │ 1            │ 1                      │ 1                       │ 1
     │              │                        │                         │
     │ 0..*         │ 0..*                   │ 0..*                    │ 0..*
┌────┴─────┐ ┌──────┴──────┐         ┌───────┴──────┐         ┌────────┴─────────────┐
│  VENTA   │ │   COMPRA    │         │     CAJA     │         │ MOVIMIENTO_INVENTARIO│
└────┬─────┘ └──────┬──────┘         └───────┬──────┘         └──────────────────────┘
     │ 1            │ 1                      │ 1
     │              │                        │ 0..*
     │ 1..*         │ 1..*           ┌───────┴───────┐
┌────┴─────────┐ ┌──┴───────────┐    │MOVIMIENTO_CAJA│
│DETALLE_VENTA │ │DETALLE_COMPRA│    └───────────────┘
└────┬─────────┘ └──┬───────────┘
     │ *            │ *
     └──────┐ ┌─────┘
            │ │
            ▼ ▼ *
     ┌──────────────┐                 ┌──────────────┐
     │   PRODUCTO   │◄────────────────┤  CATEGORIA   │
     └──────┬───────┘ *             1 └──────────────┘
            │ *
            ├────────────────────────┐
            │ 1                      │ 1
     ┌──────┴───────┐        ┌───────┴──────┐
     │  UBICACION   │        │ ALERTA_STOCK │
     │(Aisle/Shelf) │        └──────────────┘
     └──────────────┘
            ▲
            │
            │ *
     ┌──────┴───────┐ 1            * ┌──────────────┐
     │HISTORIAL_COST├───────────────►│  PROVEEDOR   │
     └──────────────┘                └───────┬──────┘
                                             │ 1
                                             │ 0..*
                                     ┌───────┴──────┐
                                     │    COMPRA    │
                                     └──────────────┘
```

### 3.2 Relational Entity Schema (15 Normalized Entities)

```sql
-- 1. ROLES
CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,      -- 'ADMINISTRADOR', 'VENDEDOR'
    descripcion TEXT
);

-- 2. USERS
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contraseña_hash VARCHAR(255) NOT NULL,    -- Secure cryptographic hash
    rol_id INT NOT NULL REFERENCES rol(id) ON DELETE RESTRICT,
    estado VARCHAR(20) DEFAULT 'ACTIVO',     -- 'ACTIVO', 'INACTIVO'
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES
CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVO'
);

-- 4. PHYSICAL LOCATIONS (Aisles and Shelves)
CREATE TABLE ubicacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,            -- e.g. "Main Warehouse"
    descripcion TEXT,
    pasillo VARCHAR(50) NOT NULL,            -- e.g. "Pasillo 2" (Aisle 2)
    estante VARCHAR(50) NOT NULL             -- e.g. "Estante B" (Shelf B)
);

-- 5. PRODUCTS (Central Hardware Catalog)
CREATE TABLE producto (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,      -- SKU / Barcode unique identifier
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id INT NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    ubicacion_id INT NOT NULL REFERENCES ubicacion(id) ON DELETE RESTRICT,
    precio_compra NUMERIC(12, 2) NOT NULL CHECK (precio_compra >= 0),
    precio_venta NUMERIC(12, 2) NOT NULL CHECK (precio_venta >= 0),
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    unidad_medida VARCHAR(20) DEFAULT 'UNIDAD', -- 'UNIDAD', 'METRO', 'KG', 'BOLSA'
    estado VARCHAR(20) DEFAULT 'ACTIVO',     -- 'ACTIVO', 'INACTIVO'
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SUPPLIERS
CREATE TABLE proveedor (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    identificacion VARCHAR(30) UNIQUE NOT NULL, -- Tax ID: RUC/NIT/CIF
    telefono VARCHAR(30),
    correo VARCHAR(150),
    direccion TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVO'
);

-- 7. PURCHASES (Header)
CREATE TABLE compra (
    id SERIAL PRIMARY KEY,
    proveedor_id INT NOT NULL REFERENCES proveedor(id) ON DELETE RESTRICT,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    impuesto NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(20) DEFAULT 'COMPLETADA'
);

-- 8. PURCHASE DETAILS (Lines)
CREATE TABLE detalle_compra (
    id SERIAL PRIMARY KEY,
    compra_id INT NOT NULL REFERENCES compra(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 9. SALES (Header)
CREATE TABLE venta (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    impuesto NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    metodo_pago VARCHAR(30) NOT NULL,        -- 'EFECTIVO', 'TARJETA', 'TRANSFERENCIA'
    estado VARCHAR(20) DEFAULT 'COMPLETADA'
);

-- 10. SALE DETAILS (Lines)
CREATE TABLE detalle_venta (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 11. INVENTORY MOVEMENTS (Kardex Immutable Audit)
CREATE TABLE movimiento_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(30) NOT NULL,    -- 'VENTA', 'COMPRA', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA'
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia VARCHAR(100),
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. CASH REGISTERS (Shifts)
CREATE TABLE caja (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    monto_inicial NUMERIC(12, 2) NOT NULL CHECK (monto_inicial >= 0),
    monto_final NUMERIC(12, 2) NULL,
    monto_esperado NUMERIC(12, 2) NULL,
    diferencia NUMERIC(12, 2) NULL,
    estado VARCHAR(20) DEFAULT 'ABIERTA'     -- 'ABIERTA', 'CERRADA'
);

-- 13. CASH MOVEMENTS
CREATE TABLE movimiento_caja (
    id SERIAL PRIMARY KEY,
    caja_id INT NOT NULL REFERENCES caja(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,               -- 'VENTA', 'INGRESO_EXTRA', 'EGRESO_GASTO'
    descripcion TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. COST HISTORY
CREATE TABLE historial_costo (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
    proveedor_id INT NOT NULL REFERENCES proveedor(id) ON DELETE RESTRICT,
    costo_anterior NUMERIC(12, 2) NOT NULL,
    costo_nuevo NUMERIC(12, 2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT
);

-- 15. STOCK ALERTS
CREATE TABLE alerta_stock (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    stock_actual INT NOT NULL,
    stock_minimo INT NOT NULL,
    estado VARCHAR(30) DEFAULT 'PENDIENTE',  -- 'PENDIENTE', 'REVISADO', 'RESUELTO'
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. REST API ENDPOINT DEFINITIONS ACROSS THE THREE INCREMENTS

Every authenticated endpoint requires: `Authorization: Bearer <JWT_TOKEN>`.

### 4.0 Foundation & Authentication Endpoints
| HTTP Verb | Path | Min. Role | Request Body | Success Code | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | `{ correo, contraseña }` | `200 OK` | Validates credentials, issues signed JWT with user profile & role. |
| `GET` | `/api/auth/me` | VENDEDOR | - | `200 OK` | Returns current active session user profile. |
| `GET` | `/api/users` | ADMIN | Query: `estado, page` | `200 OK` | Lists all users and assigned roles. |
| `POST` | `/api/users` | ADMIN | `{ nombre, apellido, correo, contraseña, rol_id }` | `201 Created` | Registers user with securely hashed password. |
| `PUT` | `/api/users/:id` | ADMIN | `{ nombre, apellido, rol_id, estado }` | `200 OK` | Updates user status or role. |

---

### 4.1 INCREMENT 1: Inventory & Stock Management
| HTTP Verb | Path | Min. Role | Request Body / Query Params | Success Code | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/products` | VENDEDOR | Query: `search, categoria_id, ubicacion_id, status` | `200 OK` | Returns filtered product list with aisle, shelf, prices and stock level. |
| `GET` | `/api/products/:id` | VENDEDOR | Path: `id` | `200 OK` | Returns complete product technical sheet, physical location and current stock. |
| `POST` | `/api/products` | ADMIN | `{ codigo, nombre, descripcion, categoria_id, ubicacion_id, precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida }` | `201 Created` | Validates unique SKU code and registers product in catalog. |
| `PUT` | `/api/products/:id` | ADMIN | `{ nombre, descripcion, categoria_id, ubicacion_id, precio_compra, precio_venta, stock_minimo, unidad_medida }` | `200 OK` | Updates product details and thresholds. |
| `DELETE` | `/api/products/:id` | ADMIN | Path: `id` | `200 OK` | Soft-deletes product (`estado = 'INACTIVO'`). |
| `GET` | `/api/categories` | VENDEDOR | Query: `estado` | `200 OK` | Lists available hardware categories. |
| `POST` | `/api/categories` | ADMIN | `{ nombre, descripcion }` | `201 Created` | Adds new category. |
| `PUT` | `/api/categories/:id`| ADMIN | `{ nombre, descripcion, estado }` | `200 OK` | Edits category details. |
| `GET` | `/api/locations` | VENDEDOR | - | `200 OK` | Lists physical locations (aisles and shelves). |
| `POST` | `/api/locations` | ADMIN | `{ nombre, pasillo, estante, descripcion }` | `201 Created` | Creates warehouse location. |
| `PUT` | `/api/locations/:id` | ADMIN | `{ nombre, pasillo, estante, descripcion }` | `200 OK` | Edits warehouse aisle/shelf. |
| `GET` | `/api/alerts` | VENDEDOR | Query: `estado` | `200 OK` | Fetches products where $stock\_actual \le stock\_minimo$. |
| `PATCH` | `/api/alerts/:id/resolve`| ADMIN | Path: `id` | `200 OK` | Marks stock alert as acknowledged/resolved. |

---

### 4.2 INCREMENT 2: Point of Sale (POS) & Cash Control
| HTTP Verb | Path | Min. Role | Request Body / Query Params | Success Code | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/sales` | VENDEDOR | `{ items: [{ producto_id, cantidad }], metodo_pago, descuento, monto_recibido }` | `201 Created` | **Atomic Sale Transaction:** Validates stock sufficiency, decrements stock, records sale lines, adds Kardex movement, registers cash movement. |
| `GET` | `/api/sales` | VENDEDOR | Query: `fecha_desde, fecha_hasta` (Salespersons restricted to their own sales) | `200 OK` | Sales transaction history. |
| `GET` | `/api/sales/:id` | VENDEDOR | Path: `id` | `200 OK` | Complete printable ticket/voucher with line breakdown, VAT, and discounts. |
| `GET` | `/api/cash/status` | VENDEDOR | - | `200 OK` | Checks if current user's cash drawer is open or closed. |
| `POST` | `/api/cash/open` | VENDEDOR | `{ monto_inicial }` | `201 Created` | Opens cash drawer shift with starting float amount. |
| `POST` | `/api/cash/movement`| VENDEDOR | `{ tipo, descripcion, monto }` | `201 Created` | Records auxiliary cash inflow or petty cash expense. |
| `POST` | `/api/cash/close` | VENDEDOR | `{ monto_declarado }` | `200 OK` | **Cash Drawer Audit:** Calculates expected cash balance vs declared count and logs overage/shortage discrepancy. |

---

### 4.3 INCREMENT 3: Suppliers, Purchases, Cost History & Reports
| HTTP Verb | Path | Min. Role | Request Body / Query Params | Success Code | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/suppliers` | ADMIN | Query: `search, estado` | `200 OK` | Supplier directory and search. |
| `POST` | `/api/suppliers` | ADMIN | `{ razon_social, identificacion, telefono, correo, direccion }` | `201 Created` | Registers supplier with unique Tax ID. |
| `PUT` | `/api/suppliers/:id`| ADMIN | `{ razon_social, telefono, correo, direccion, estado }` | `200 OK` | Updates supplier contact details. |
| `DELETE` | `/api/suppliers/:id`| ADMIN | Path: `id` | `200 OK` | Soft-deletes supplier. |
| `POST` | `/api/purchases` | ADMIN | `{ proveedor_id, items: [{ producto_id, cantidad, precio_unitario }] }` | `201 Created` | **Procurement Inbound:** Increases stock, adds Kardex entry, and records cost change in `historial_costo`. |
| `GET` | `/api/purchases` | ADMIN | Query: `proveedor_id, fecha_desde, fecha_hasta` | `200 OK` | Supplier purchase order history. |
| `GET` | `/api/cost-history` | ADMIN | Query: `producto_id, proveedor_id` | `200 OK` | Audits acquisition cost evolution over time. |
| `GET` | `/api/reports/dashboard`| VENDEDOR | - | `200 OK` | Hardware store executive dashboard KPIs. |
| `GET` | `/api/reports/inventory`| ADMIN | Query: `categoria_id, format (json/csv)` | `200 OK` | Valued inventory balance report. |
| `GET` | `/api/reports/movements`| ADMIN | Query: `producto_id, tipo, fecha_desde, fecha_hasta` | `200 OK` | Full Kardex movement audit trail. |
| `GET` | `/api/reports/sales` | ADMIN | Query: `fecha_desde, fecha_hasta, metodo_pago` | `200 OK` | Aggregated sales revenue and volume report. |

---

## 5. INCREMENTAL DELIVERY ROADMAP & VERIFICATION CRITERIA

```
      INCREMENT 1                  INCREMENT 2                   INCREMENT 3
  INVENTORY & STOCK              POS & CASH CONTROL         SUPPLIERS, PURCHASES & REPORTS
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────────────┐
│ • Products Catalog   │      │ • POS Counter UI     │      │ • Supplier Directory         │
│ • Categories & Aisles│ ───► │ • Strategy Payments  │ ───► │ • Inbound Purchase Orders    │
│ • Physical Locations │      │ • Atomic Stock Deduct│      │ • Cost History Fluctuations  │
│ • Auto Stock Alerts  │      │ • Cash Drawer Shifts │      │ • Executive Reports & CSV    │
└──────────────────────┘      └──────────────────────┘      └──────────────────────────────┘
```

1. **Increment 1 Validation:** Instant search by code, name and physical location; SKU uniqueness enforcement; automatic alert flagging when $stock\_actual \le stock\_minimo$.
2. **Increment 2 Validation:** Zero negative inventory allowance; atomic transaction on checkout; multi-payment handling (Cash, Card, Wire); shift audit with automatic discrepancy formula.
3. **Increment 3 Validation:** Seamless inventory replenishment on purchase confirmation; automatic tracking of historical unit cost updates; KPI dashboards and exportable Kardex movements.

---
*End of Technical Architecture Document. Project ready for Incremental Implementation.*
