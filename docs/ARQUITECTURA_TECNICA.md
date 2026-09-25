# DOCUMENTO DE ARQUITECTURA TÉCNICA DE SOFTWARE
## PROYECTO: FERROGEST
**Subtítulo:** Sistema de Gestión Integral para la Ferretería FERRO GET  
**Versión:** 1.0.0  
**Fecha:** 24 de Septiembre de 2026  
**Autores:** Equipo de Ingeniería de Software (Analista de Requisitos, Arquitecto de Software, Diseñador UX/UI, Desarrollador Full Stack, Ingeniero de Base de Datos, Ingeniero QA, Especialista en Seguridad)

---

## 1. INTRODUCCIÓN Y ALCANCE

### 1.1 Propósito del Documento
El presente documento describe la arquitectura técnica, diseño de base de datos relacional, especificación de contratos de API REST y estructura de directorios del sistema **FERROGEST**. Sirve como el marco de referencia obligatorio para la construcción secuencial por incrementos de la aplicación web empresarial para la ferretería **FERRO GET**.

### 1.2 Problemas Operativos Resueltos
1. **Alertas de stock ineficientes:** Notificación reactiva y oportuna cuando $stock\_actual \le stock\_minimo$.
2. **Localización física deficiente:** Normalización de pasillos, estantes y zonas para cada ítem del catálogo.
3. **Punto de venta y facturación lento:** Interfaz POS de alta velocidad con cálculo automático de impuestos, descuentos y actualización de existencias en tiempo real.
4. **Duplicidad y pérdida de registros:** Integridad referencial en base de datos con códigos únicos y restricciones transaccionales ACID.
5. **Falta de trazabilidad de costos y compras:** Registro inmutable de cada cambio de precio de compra por proveedor y producto en la entidad `historial_costo`.

---

## 2. ARQUITECTURA GENERAL DEL SISTEMA

### 2.1 Enfoque en Tres Capas (Three-Tier Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CAPA 1: PRESENTACIÓN (CLIENTE)                   │
│  - React 19 + TypeScript + Tailwind CSS                                │
│  - Gestión de vistas SPA modularizadas por Rol (Admin y Vendedor)      │
│  - State Management con Hooks desacoplados de la lógica de red         │
│  - Validación visual interactiva y UX optimizada para mostradores      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON + JWT Bearer Token)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    CAPA 2: LÓGICA DE NEGOCIO (BACKEND)                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: Auth (JWT), RBAC (Roles), Validator (DTOs), Logger  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ Controladores REST: Mapeo de peticiones y respuestas HTTP        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ Capa de Servicios de Negocio:                                    │  │
│  │  - InventoryService   - SalesService      - CashService          │  │
│  │  - PurchaseService    - CostHistoryService- ReportService        │  │
│  │  - AuthService        - AlertService                             │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ Patrones de Diseño:                                              │  │
│  │  - Strategy Pattern: Procesamiento de Pago (Efectivo/Tarjeta/...)│  │
│  │  - Repository / DAO Pattern: Abstracción de acceso a datos       │  │
│  │  - Unit of Work / Transacciones Atómicas para Venta y Compra     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQL Engine / Persistencia ACID
┌───────────────────────────────────▼────────────────────────────────────┐
│                       CAPA 3: DATOS Y PERSISTENCIA                    │
│  - Base de datos relacional normalizada en Tercera Forma Normal (3NF)  │
│  - Tablas transaccionales: producto, venta, detalle_venta, caja...     │
│  - Tablas de auditoría: movimiento_inventario, historial_costo, alerta │
│  - Índices B-Tree en campos clave (código, fechas, identificaciones)   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Patrones de Diseño de Software Aplicados
1. **DAO / Repository Pattern:** Cada entidad posee un repositorio que aísla la persistencia (consultas, inserciones, transacciones) de las reglas de negocio.
2. **Strategy Pattern:** Para la liquidación de ventas con múltiples medios de pago (`PaymentStrategy` implementado por `CashPaymentStrategy`, `CardPaymentStrategy`, `TransferPaymentStrategy`).
3. **Data Transfer Object (DTO):** Validación rigurosa de entradas en el backend antes de llegar a la capa de servicios.
4. **Centralized Error Handling Middleware:** Interceptación unificada de errores para garantizar respuestas con códigos HTTP semánticos (400, 401, 403, 404, 409, 500) y mensajes amigables al operador sin filtrar stack traces internos.

---

## 3. ESTRUCTURA COMPLETA DE DIRECTORIOS DEL PROYECTO

```text
/
├── .env.example                         # Definición de variables de entorno seguras
├── index.html                           # Entrypoint HTML SPA
├── metadata.json                        # Metadatos del sistema FERROGEST
├── package.json                         # Dependencias de producción y desarrollo
├── tsconfig.json                        # Configuración estricta de TypeScript
├── vite.config.ts                       # Configuración de empaquetado y aliases de ruta
├── docs/                                # Documentación de ingeniería y arquitectura
│   └── ARQUITECTURA_TECNICA.md
├── src/
│   ├── main.tsx                         # Bootstrap de React
│   ├── App.tsx                          # Enrutador principal y proveedores globales
│   ├── index.css                        # Estilos globales y directivas Tailwind CSS
│   │
│   ├── server/                          # CAPAS 2 Y 3: BACKEND Y ACCESO A DATOS
│   │   ├── app.ts                       # Configuración del servidor Express y middlewares
│   │   ├── config/                      # Variables de configuración (JWT_SECRET, PORT, DB)
│   │   │   └── env.ts
│   │   ├── database/                    # Esquema y semillas de datos iniciales
│   │   │   ├── schema.ts                # Definiciones DDL y tipados de tablas
│   │   │   ├── connection.ts            # Gestor de conexión y transacciones
│   │   │   └── seed.ts                  # Semilla de categorías, productos, usuarios y prov.
│   │   ├── models/                      # Interfaces de Dominio de Datos
│   │   │   ├── user.model.ts
│   │   │   ├── product.model.ts
│   │   │   ├── category.model.ts
│   │   │   ├── location.model.ts
│   │   │   ├── sale.model.ts
│   │   │   ├── cash.model.ts
│   │   │   ├── supplier.model.ts
│   │   │   ├── purchase.model.ts
│   │   │   └── movement.model.ts
│   │   ├── repositories/                # Patrón DAO / Repository
│   │   │   ├── base.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   ├── category.repository.ts
│   │   │   ├── location.repository.ts
│   │   │   ├── sale.repository.ts
│   │   │   ├── cash.repository.ts
│   │   │   ├── supplier.repository.ts
│   │   │   ├── purchase.repository.ts
│   │   │   └── movement.repository.ts
│   │   ├── strategies/                  # Patrón Strategy para Métodos de Pago
│   │   │   ├── payment.strategy.ts
│   │   │   ├── cash-payment.strategy.ts
│   │   │   ├── card-payment.strategy.ts
│   │   │   └── transfer-payment.strategy.ts
│   │   ├── services/                    # Lógica de Negocio y Reglas de Dominio
│   │   │   ├── auth.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── sales.service.ts
│   │   │   ├── cash.service.ts
│   │   │   ├── purchase.service.ts
│   │   │   ├── cost-history.service.ts
│   │   │   └── report.service.ts
│   │   ├── middlewares/                 # Control de acceso y validaciones
│   │   │   ├── auth.middleware.ts       # Verificación de Token JWT
│   │   │   ├── rbac.middleware.ts       # Control de roles: ADMIN vs VENDEDOR
│   │   │   ├── validation.middleware.ts # Validación de campos obligatorios y tipos
│   │   │   └── error.middleware.ts      # Manejador global de errores HTTP
│   │   ├── controllers/                 # Controladores de Endpoints REST
│   │   │   ├── auth.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── location.controller.ts
│   │   │   ├── sale.controller.ts
│   │   │   ├── cash.controller.ts
│   │   │   ├── supplier.controller.ts
│   │   │   ├── purchase.controller.ts
│   │   │   └── report.controller.ts
│   │   └── routes/                      # Agrupación de rutas de la API REST
│   │       ├── api.routes.ts
│   │       ├── auth.routes.ts
│   │       ├── product.routes.ts
│   │       ├── sale.routes.ts
│   │       ├── cash.routes.ts
│   │       ├── purchase.routes.ts
│   │       └── report.routes.ts
│   │
│   └── client/                          # CAPA 1: PRESENTACIÓN (FRONTEND)
│       ├── types/                       # Interfaces TypeScript para la UI
│       │   └── api.types.ts
│       ├── services/                    # Clientes API Frontend (Fetch wrapper con JWT)
│       │   ├── api.client.ts
│       │   ├── auth.service.ts
│       │   ├── inventory.service.ts
│       │   ├── sales.service.ts
│       │   ├── cash.service.ts
│       │   └── purchase.service.ts
│       ├── hooks/                       # Custom React Hooks
│       │   ├── useAuth.ts
│       │   ├── useInventory.ts
│       │   ├── usePOSCart.ts
│       │   └── useCashRegister.ts
│       ├── components/                  # Componentes visuales desacoplados
│       │   ├── ui/                      # Elementos base: Button, Input, Modal, Table, Badge
│       │   ├── layout/                  # Sidebar, Header, UserProfileMenu, StatCard
│       │   └── feedback/                # Toast notifications, ConfirmDialog, StockBadge
│       └── pages/                       # Vistas organizadas por módulo funcional
│           ├── auth/
│           │   └── LoginPage.tsx
│           ├── dashboard/
│           │   └── DashboardPage.tsx
│           ├── inventory/
│           │   ├── ProductsPage.tsx
│           │   ├── CategoriesPage.tsx
│           │   ├── LocationsPage.tsx
│           │   └── StockAlertsPage.tsx
│           ├── sales/
│           │   ├── POSPage.tsx          # Terminal Punto de Venta
│           │   ├── SalesHistoryPage.tsx
│           │   └── CashRegisterPage.tsx # Control y arqueo de caja
│           ├── purchases/
│           │   ├── NewPurchasePage.tsx
│           │   ├── PurchaseHistoryPage.tsx
│           │   ├── SuppliersPage.tsx
│           │   └── CostHistoryPage.tsx
│           ├── reports/
│           │   ├── InventoryReportPage.tsx
│           │   ├── SalesReportPage.tsx
│           │   ├── PurchasesReportPage.tsx
│           │   └── MovementsReportPage.tsx
│           └── admin/
│               ├── UsersPage.tsx
│               └── SystemSettingsPage.tsx
└── tests/                               # SUITE DE PRUEBAS AUTOMATIZADAS
    ├── unit/
    │   ├── inventory.service.test.ts
    │   ├── sales.service.test.ts
    │   └── cash.service.test.ts
    └── integration/
        ├── auth-flow.test.ts
        ├── pos-sale-stock.test.ts
        └── purchase-stock-cost.test.ts
```

---

## 4. MODELO DE DATOS RELACIONAL (NORMALIZACIÓN 3NF)

### 4.1 Diccionario de Datos de Entidades

#### 1. `rol`
Almacena los perfiles de acceso autorizados en el sistema.
- `id` (INT, PK, Auto-increment)
- `nombre` (VARCHAR(50), NOT NULL, UNIQUE): 'ADMINISTRADOR', 'VENDEDOR'
- `descripcion` (TEXT)

#### 2. `usuario`
Credenciales y datos de operadores del sistema.
- `id` (INT, PK, Auto-increment)
- `nombre` (VARCHAR(100), NOT NULL)
- `apellido` (VARCHAR(100), NOT NULL)
- `correo` (VARCHAR(150), NOT NULL, UNIQUE, Indexed)
- `contraseña_hash` (VARCHAR(255), NOT NULL): Hash seguro (nunca texto plano)
- `rol_id` (INT, FK -> `rol(id)`, NOT NULL)
- `estado` (VARCHAR(20), DEFAULT 'ACTIVO'): 'ACTIVO', 'INACTIVO'
- `fecha_creacion` (TIMESTAMP, DEFAULT NOW())

#### 3. `categoria`
Clasificación comercial de los productos de ferretería.
- `id` (INT, PK, Auto-increment)
- `nombre` (VARCHAR(100), NOT NULL, UNIQUE)
- `descripcion` (TEXT)
- `estado` (VARCHAR(20), DEFAULT 'ACTIVO')

#### 4. `ubicacion`
Geolocalización interna física en el almacén o local.
- `id` (INT, PK, Auto-increment)
- `nombre` (VARCHAR(100), NOT NULL): e.g. "Zona Central"
- `descripcion` (TEXT)
- `pasillo` (VARCHAR(50), NOT NULL): e.g. "Pasillo 2"
- `estante` (VARCHAR(50), NOT NULL): e.g. "Estante B"

#### 5. `producto`
Catálogo central de artículos ferreteros.
- `id` (INT, PK, Auto-increment)
- `codigo` (VARCHAR(50), NOT NULL, UNIQUE, Indexed): Código SKU o barras único
- `nombre` (VARCHAR(150), NOT NULL, Indexed)
- `descripcion` (TEXT)
- `categoria_id` (INT, FK -> `categoria(id)`, NOT NULL)
- `ubicacion_id` (INT, FK -> `ubicacion(id)`, NOT NULL)
- `precio_compra` (NUMERIC(12,2), NOT NULL, CHECK >= 0)
- `precio_venta` (NUMERIC(12,2), NOT NULL, CHECK >= 0)
- `stock_actual` (INT, NOT NULL, DEFAULT 0, CHECK >= 0)
- `stock_minimo` (INT, NOT NULL, DEFAULT 5, CHECK >= 0)
- `unidad_medida` (VARCHAR(20), DEFAULT 'UNIDAD'): 'UNIDAD', 'METRO', 'KG', 'BOLSA'
- `estado` (VARCHAR(20), DEFAULT 'ACTIVO'): 'ACTIVO', 'INACTIVO'
- `fecha_creacion` (TIMESTAMP, DEFAULT NOW())

#### 6. `proveedor`
Empresas y distribuidores mayoristas de suministros ferreteros.
- `id` (INT, PK, Auto-increment)
- `razon_social` (VARCHAR(150), NOT NULL, Indexed)
- `identificacion` (VARCHAR(30), NOT NULL, UNIQUE, Indexed): RUC/NIT/CIF
- `telefono` (VARCHAR(30))
- `correo` (VARCHAR(150))
- `direccion` (TEXT)
- `estado` (VARCHAR(20), DEFAULT 'ACTIVO')

#### 7. `compra`
Órdenes de abastecimiento registradas.
- `id` (INT, PK, Auto-increment)
- `proveedor_id` (INT, FK -> `proveedor(id)`, NOT NULL)
- `usuario_id` (INT, FK -> `usuario(id)`, NOT NULL)
- `fecha` (TIMESTAMP, DEFAULT NOW(), Indexed)
- `subtotal` (NUMERIC(12,2), NOT NULL)
- `impuesto` (NUMERIC(12,2), NOT NULL, DEFAULT 0)
- `total` (NUMERIC(12,2), NOT NULL)
- `estado` (VARCHAR(20), DEFAULT 'COMPLETADA'): 'COMPLETADA', 'ANULADA'

#### 8. `detalle_compra`
Artículos individuales incluidos en cada compra.
- `id` (INT, PK, Auto-increment)
- `compra_id` (INT, FK -> `compra(id)` ON DELETE CASCADE, NOT NULL)
- `producto_id` (INT, FK -> `producto(id)`, NOT NULL)
- `cantidad` (INT, NOT NULL, CHECK > 0)
- `precio_unitario` (NUMERIC(12,2), NOT NULL, CHECK >= 0)
- `subtotal` (NUMERIC(12,2), NOT NULL)

#### 9. `venta`
Cabecera de transacciones comerciales generadas en mostrador.
- `id` (INT, PK, Auto-increment)
- `usuario_id` (INT, FK -> `usuario(id)`, NOT NULL)
- `fecha` (TIMESTAMP, DEFAULT NOW(), Indexed)
- `subtotal` (NUMERIC(12,2), NOT NULL)
- `impuesto` (NUMERIC(12,2), NOT NULL, DEFAULT 0)
- `descuento` (NUMERIC(12,2), NOT NULL, DEFAULT 0)
- `total` (NUMERIC(12,2), NOT NULL)
- `metodo_pago` (VARCHAR(30), NOT NULL): 'EFECTIVO', 'TARJETA', 'TRANSFERENCIA'
- `estado` (VARCHAR(20), DEFAULT 'COMPLETADA'): 'COMPLETADA', 'ANULADA'

#### 10. `detalle_venta`
Desglose de líneas de productos despachadas en la venta.
- `id` (INT, PK, Auto-increment)
- `venta_id` (INT, FK -> `venta(id)` ON DELETE CASCADE, NOT NULL)
- `producto_id` (INT, FK -> `producto(id)`, NOT NULL)
- `cantidad` (INT, NOT NULL, CHECK > 0)
- `precio_unitario` (NUMERIC(12,2), NOT NULL)
- `subtotal` (NUMERIC(12,2), NOT NULL)

#### 11. `movimiento_inventario`
Kardex y registro inmutable de trazabilidad de existencias.
- `id` (INT, PK, Auto-increment)
- `producto_id` (INT, FK -> `producto(id)`, NOT NULL, Indexed)
- `tipo_movimiento` (VARCHAR(30), NOT NULL): 'VENTA', 'COMPRA', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA'
- `cantidad` (INT, NOT NULL)
- `stock_anterior` (INT, NOT NULL)
- `stock_nuevo` (INT, NOT NULL)
- `referencia` (VARCHAR(100)): Identificador del comprobante origen
- `usuario_id` (INT, FK -> `usuario(id)`, NOT NULL)
- `fecha` (TIMESTAMP, DEFAULT NOW(), Indexed)

#### 12. `caja`
Sesiones de arqueo y turno de caja por usuario.
- `id` (INT, PK, Auto-increment)
- `usuario_id` (INT, FK -> `usuario(id)`, NOT NULL)
- `fecha_apertura` (TIMESTAMP, DEFAULT NOW())
- `fecha_cierre` (TIMESTAMP NULL)
- `monto_inicial` (NUMERIC(12,2), NOT NULL, CHECK >= 0)
- `monto_final` (NUMERIC(12,2) NULL)
- `monto_esperado` (NUMERIC(12,2) NULL)
- `diferencia` (NUMERIC(12,2) NULL)
- `estado` (VARCHAR(20), DEFAULT 'ABIERTA'): 'ABIERTA', 'CERRADA'

#### 13. `movimiento_caja`
Entradas o salidas adicionales de efectivo de la gaveta de caja.
- `id` (INT, PK, Auto-increment)
- `caja_id` (INT, FK -> `caja(id)`, NOT NULL)
- `tipo` (VARCHAR(30), NOT NULL): 'VENTA', 'INGRESO_EXTRA', 'EGRESO_GASTO'
- `descripcion` (TEXT, NOT NULL)
- `monto` (NUMERIC(12,2), NOT NULL)
- `fecha` (TIMESTAMP, DEFAULT NOW())

#### 14. `historial_costo`
Auditoría cronológica de fluctuación de precios de compra.
- `id` (INT, PK, Auto-increment)
- `producto_id` (INT, FK -> `producto(id)`, NOT NULL, Indexed)
- `proveedor_id` (INT, FK -> `proveedor(id)`, NOT NULL)
- `costo_anterior` (NUMERIC(12,2), NOT NULL)
- `costo_nuevo` (NUMERIC(12,2), NOT NULL)
- `fecha` (TIMESTAMP, DEFAULT NOW(), Indexed)
- `usuario_id` (INT, FK -> `usuario(id)`, NOT NULL)

#### 15. `alerta_stock`
Registro de notificaciones de inventario en nivel de peligro o reposición.
- `id` (INT, PK, Auto-increment)
- `producto_id` (INT, FK -> `producto(id)`, NOT NULL, Indexed)
- `stock_actual` (INT, NOT NULL)
- `stock_minimo` (INT, NOT NULL)
- `estado` (VARCHAR(30), DEFAULT 'PENDIENTE'): 'PENDIENTE', 'REVISADO', 'RESUELTO'
- `fecha` (TIMESTAMP, DEFAULT NOW())

---

## 5. DIAGRAMA LÓGICO DE RELACIONES

```
               ┌───────────────┐
               │      ROL      │
               └───────┬───────┘
                       │ 1
                       │
                       │ 0..*
               ┌───────┴───────┐
               │    USUARIO    │
               └───────┬───────┘
       ┌───────────────┼──────────────────────────┬─────────────────────────┐
       │ 1             │ 1                        │ 1                       │ 1
       │               │                          │                         │
       │ 0..*          │ 0..*                     │ 0..*                    │ 0..*
┌──────┴───────┐ ┌─────┴────────┐         ┌───────┴───────┐         ┌───────┴──────────────┐
│     VENTA    │ │    COMPRA    │         │      CAJA     │         │ MOVIMIENTO_INVENTARIO│
└──────┬───────┘ └─────┬────────┘         └───────┬───────┘         └──────────────────────┘
       │ 1             │ 1                        │ 1
       │               │                          │ 0..*
       │ 1..*          │ 1..*             ┌───────┴───────┐
┌──────┴───────┐ ┌─────┴────────┐         │MOVIMIENTO_CAJA│
│DETALLE_VENTA │ │DETALLE_COMPRA│         └───────────────┘
└──────┬───────┘ └─────┬────────┘
       │ *             │ *
       └───────┐ ┌─────┘
               │ │
               │ │
               ▼ ▼ *
       ┌───────────────┐                  ┌───────────────┐
       │   PRODUCTO    │◄─────────────────┤   CATEGORIA   │
       └───────┬───────┘ *              1 └───────────────┘
               │ *
               ├──────────────────────────┐
               │ 1                        │ 1
       ┌───────┴───────┐          ┌───────┴───────┐
       │   UBICACION   │          │ ALERTA_STOCK  │
       │(Pasillo/Est.) │          └───────────────┘
       └───────────────┘
               ▲
               │
               │ *
       ┌───────┴───────┐ 1              * ┌───────────────┐
       │HISTORIAL_COSTO├─────────────────►│   PROVEEDOR   │
       └───────────────┘                  └───────┬───────┘
                                                  │ 1
                                                  │ 0..*
                                          ┌───────┴───────┐
                                          │     COMPRA    │
                                          └───────────────┘
```

---

## 6. ESPECIFICACIÓN DE LA API REST PARA LOS TRES INCREMENTOS

Todas las rutas privadas requieren el header:  
`Authorization: Bearer <JWT_TOKEN>`

### 6.1 MÓDULO BASE Y AUTENTICACIÓN
| Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público | Autentica usuario y retorna JWT + Datos de Rol. |
| `GET` | `/api/auth/me` | Autenticado | Retorna el perfil y rol del usuario autenticado. |
| `GET` | `/api/users` | ADMINISTRADOR | Lista todos los usuarios registrados. |
| `POST` | `/api/users` | ADMINISTRADOR | Registra nuevo usuario con contraseña hasheada. |
| `PUT` | `/api/users/:id` | ADMINISTRADOR | Actualiza rol o estado de un usuario. |

---

### 6.2 INCREMENTO 1: INVENTARIO Y CONTROL DE STOCK
| Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | VENDEDOR / ADMIN | Lista catálogo con filtros (`search`, `categoria_id`, `ubicacion_id`, `estado`). Incluye nombres de ubicación y categoría. |
| `GET` | `/api/products/:id` | VENDEDOR / ADMIN | Obtiene ficha técnica completa del producto, ubicación física y stock. |
| `POST` | `/api/products` | ADMINISTRADOR | Crea un producto validando código único y precios válidos. |
| `PUT` | `/api/products/:id` | ADMINISTRADOR | Actualiza información, precios de compra/venta o stock mínimo. |
| `DELETE` | `/api/products/:id` | ADMINISTRADOR | Desactiva lógicamente el producto (`estado = 'INACTIVO'`). |
| `GET` | `/api/categories` | VENDEDOR / ADMIN | Lista categorías de productos disponibles. |
| `POST` | `/api/categories` | ADMINISTRADOR | Registra nueva categoría de ferretería. |
| `PUT` | `/api/categories/:id` | ADMINISTRADOR | Modifica categoría existente. |
| `GET` | `/api/locations` | VENDEDOR / ADMIN | Lista las ubicaciones físicas (pasillos y estantes). |
| `POST` | `/api/locations` | ADMINISTRADOR | Crea una nueva ubicación en el almacén. |
| `PUT` | `/api/locations/:id`| ADMINISTRADOR | Actualiza pasillo o estante asignado. |
| `GET` | `/api/alerts` | VENDEDOR / ADMIN | Retorna todos los productos en stock bajo o crítico ($stock\_actual \le stock\_minimo$). |
| `PATCH`| `/api/alerts/:id/resolve`| ADMINISTRADOR | Marca una alerta de stock como atendida/resuelta. |

#### Contrato de Ejemplo: Registro de Producto
`POST /api/products`
```json
// Request Payload:
{
  "codigo": "HER-E001",
  "nombre": "Taladro Percutor 750W",
  "descripcion": "Taladro eléctrico de velocidad variable con reversa",
  "categoria_id": 1,
  "ubicacion_id": 2,
  "precio_compra": 45.00,
  "precio_venta": 68.50,
  "stock_actual": 12,
  "stock_minimo": 4,
  "unidad_medida": "UNIDAD"
}

// Success Response (HTTP 201 Created):
{
  "success": true,
  "message": "Producto registrado correctamente.",
  "data": {
    "id": 101,
    "codigo": "HER-E001",
    "nombre": "Taladro Percutor 750W",
    "stock_actual": 12,
    "stock_minimo": 4,
    "ubicacion": "Pasillo 2 - Estante B"
  }
}
```

---

### 6.3 INCREMENTO 2: PUNTO DE VENTA (POS) Y CONTROL DE CAJA
| Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sales` | VENDEDOR / ADMIN | Registra venta atómica: valida existencias, aplica estrategia de pago, descuenta stock, crea `detalle_venta`, genera `movimiento_inventario` y asienta en `caja`. |
| `GET` | `/api/sales` | VENDEDOR / ADMIN | Historial de ventas. Si es Vendedor, filtra automáticamente sus ventas; si es Admin, muestra todas. |
| `GET` | `/api/sales/:id` | VENDEDOR / ADMIN | Obtiene el comprobante detallado de venta con líneas, subtotales e impuestos. |
| `GET` | `/api/cash/current` | VENDEDOR / ADMIN | Consulta el estado de la caja del turno actual del usuario. |
| `POST` | `/api/cash/open` | VENDEDOR / ADMIN | Apertura de turno de caja ingresando el monto base inicial. |
| `POST` | `/api/cash/movement` | VENDEDOR / ADMIN | Registra entrada o salida manual de caja justificada. |
| `POST` | `/api/cash/close` | VENDEDOR / ADMIN | Cierre de caja con arqueo físico: calcula monto esperado vs declarado y determina diferencia. |

#### Contrato de Ejemplo: Registro de Venta Atómica
`POST /api/sales`
```json
// Request Payload:
{
  "items": [
    { "producto_id": 101, "cantidad": 2 },
    { "producto_id": 104, "cantidad": 5 }
  ],
  "metodo_pago": "EFECTIVO", // EFECTIVO | TARJETA | TRANSFERENCIA
  "descuento": 0.00,
  "monto_recibido": 150.00
}

// Success Response (HTTP 201 Created):
{
  "success": true,
  "message": "Venta procesada exitosamente.",
  "data": {
    "venta_id": 2045,
    "fecha": "2026-09-24T20:10:00Z",
    "subtotal": 142.00,
    "impuesto": 0.00,
    "total": 142.00,
    "vuelto": 8.00,
    "metodo_pago": "EFECTIVO",
    "items_procesados": 2
  }
}
```

---

### 6.4 INCREMENTO 3: PROVEEDORES, COMPRAS, COSTOS Y REPORTES
| Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/suppliers` | ADMINISTRADOR | Directorio de proveedores de ferretería. |
| `POST` | `/api/suppliers` | ADMINISTRADOR | Registra nuevo proveedor con validación de identificación única. |
| `PUT` | `/api/suppliers/:id` | ADMINISTRADOR | Actualiza datos de contacto de proveedor. |
| `DELETE` | `/api/suppliers/:id`| ADMINISTRADOR | Desactiva proveedor (`estado = 'INACTIVO'`). |
| `POST` | `/api/purchases` | ADMINISTRADOR | Registra orden de compra: incrementa el stock de cada producto, registra auditoría en `movimiento_inventario` y asienta registros en `historial_costo` si varió el precio de costo. |
| `GET` | `/api/purchases` | ADMINISTRADOR | Lista historial de compras recibidas. |
| `GET` | `/api/cost-history` | ADMINISTRADOR | Consulta la evolución temporal del costo de compra por producto o proveedor. |
| `GET` | `/api/reports/dashboard`| VENDEDOR / ADMIN | KPIs consolidados: productos activos, stock bajo, ventas del día, compras del mes, valor total de inventario. |
| `GET` | `/api/reports/inventory`| ADMINISTRADOR | Reporte valorizado de inventario con filtros por categoría y ubicación. |
| `GET` | `/api/reports/movements`| ADMINISTRADOR | Kardex completo de entradas y salidas de inventario con usuario responsable y motivo. |
| `GET` | `/api/reports/sales` | ADMINISTRADOR | Reporte consolidado de facturación por rango de fechas y método de pago. |

---

## 7. ARQUITECTURA DE SEGURIDAD Y REGLAS DE NEGOCIO

### 7.1 Reglas Críticas del Sistema
1. **Regla de Stock No Negativo:** Ninguna venta puede ser procesada si la cantidad requerida supera el stock disponible actual ($cantidad > stock\_actual$).
2. **Atomicidad de Venta y Compra:** Las operaciones que alteran inventario se ejecutan dentro de transacciones aisladas. Si falla cualquier inserción o validación de línea, se realiza un Rollback inmediato.
3. **Protección Criptográfica de Credenciales:** Contraseñas hasheadas empleando funciones unidireccionales con salt aleatorio.
4. **Manejo Seguro de Errores:** Todos los errores retornan un formato homogéneo JSON `{ success: false, error: "Mensaje comprensible" }` evitando exponer trazas de base de datos o stack traces al usuario final.

---

## 8. PLAN DE VERIFICACIÓN Y PRUEBAS AUTOMATIZADAS (MATRIZ QA)

| ID | Caso de Prueba Crítico | Capa Evaluada | Criterio de Aceptación |
| :---: | :--- | :--- | :--- |
| **TC-01** | Inicio de sesión válido | Auth Controller | Token JWT generado, datos de rol válidos (HTTP 200). |
| **TC-02** | Contraseña incorrecta | Auth Controller | Retorna HTTP 401 con mensaje "Credenciales inválidas". |
| **TC-03** | Registro de producto válido | Inventory Service | Producto insertado, código indexado, estado ACTIVO (HTTP 201). |
| **TC-04** | Registro de código duplicado | Database Constraint | Rechazo con HTTP 409 y mensaje "El código de producto ya existe". |
| **TC-05** | Venta normal con stock suficiente | Sales Service | Venta registrada, stock decrementado en $N$, movimiento generado. |
| **TC-06** | Intento de venta sin stock | Sales Service | Rechazo con HTTP 400 "Stock insuficiente para el producto". |
| **TC-07** | Activación de alerta de stock bajo | Alert Engine | Alerta generada automáticamente cuando $stock \le stock\_minimo$. |
| **TC-08** | Registro de compra a proveedor | Purchase Service | Stock incrementado en $M$, nuevo costo asentado en historial. |
| **TC-09** | Restricción RBAC de Vendedor | RBAC Middleware | Intento de acceso a `/api/users` o `/api/suppliers` retorna HTTP 403. |
| **TC-10** | Arqueo y cierre de caja | Cash Service | Cálculo exacto de $monto\_esperado = monto\_inicial + ventas\_efectivo \pm movimientos$. |

---

**Fin del Documento de Arquitectura Técnica**  
*Documento aprobado para proceder a la implementación del INCREMENTO 1: INVENTARIO Y STOCK.*
