# FERROGEST 🛠️
> **Sistema Web Empresarial de Gestión Integral para la Ferretería FERRO GET**

![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8.svg?logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg?logo=vite)

---

## 1. Descripción del Proyecto

**FERROGEST** es una solución web empresarial diseñada específicamente para modernizar, digitalizar y centralizar las operaciones comerciales y logísticas de la ferretería **FERRO GET**. 

El sistema reemplaza procesos manuales y registros dispersos en papel o planillas aisladas, integrando el catálogo de productos, el inventario físico con pasillos y estantes, un punto de venta (POS) de alta velocidad, arqueo de caja chica, abastecimiento con proveedores y reportes gerenciales en tiempo real.

---

## 2. Problemáticas que Resuelve

Antes de la implementación de FERROGEST, la ferretería presentaba las siguientes fricciones operativas:

1. **Inexistencia de alertas de stock mínimo:** Rupturas de stock no detectadas a tiempo, provocando pérdida de ventas de insumos de alta rotación (clavos, cemento, tornillería, discos).
2. **Dificultad en la localización física:** Pérdida de tiempo en el mostrador buscando productos dentro del almacén y anaqueles.
3. **Ventas y cobros manuales lentos:** Filas de clientes en horas pico y riesgo de errores de cálculo en subtotales, descuentos e IVA.
4. **Duplicidad de registros y descuadres:** Falta de un sistema unificado que descuente inventario de manera atómica al confirmar una venta.
5. **Falta de trazabilidad de costos:** Dificultad para auditar el incremento de precios de compra fijados por diferentes distribuidores y proveedores.

---

## 3. Objetivos del Sistema

### Objetivo General
Desarrollar e implementar **FERROGEST**, un sistema web para la gestión integral de inventario, ventas, control de stock, caja, proveedores y reportes de **FERRO GET**, mejorando el control administrativo, la velocidad de despacho y la toma de decisiones.

### Objetivos Específicos
- **Administrar el catálogo completo de productos** con código, categoría, unidad de medida, precio de costo y venta.
- **Ubicar físicamente cada producto** mediante pasillos y estantes organizados.
- **Monitorear existencias en tiempo real** y emitir alertas preventivas cuando el stock alcance o caiga bajo el mínimo.
- **Agilizar el Punto de Venta (POS)** con búsqueda predictiva por código o nombre, carrito interactivo y soporte multiformato de pago (Efectivo, Tarjeta, Transferencia).
- **Controlar el flujo de caja** con registro de apertura, entradas, salidas, arqueo ciego y cierre de turno.
- **Gestionar el aprovisionamiento** registrando órdenes de compra a proveedores con actualización automática de existencias e historial de costos.
- **Generar reportes analíticos** e historial de movimientos (Kardex) con exportación a formato CSV.
- **Garantizar la seguridad mediante RBAC** (Control de Acceso Basado en Roles) para Administradores y Vendedores.

---

## 4. Modelo de Desarrollo Incremental

El sistema fue concebido y estructurado bajo un **Modelo Incremental** en tres etapas evolutivas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MODELO INCREMENTAL                              │
├─────────────────────┬───────────────────────┬──────────────────────────┤
│    INCREMENTO 1     │     INCREMENTO 2      │       INCREMENTO 3       │
│  Inventario & Stock │  Punto de Venta & Caja│   Proveedores & Reportes │
├─────────────────────┼───────────────────────┼──────────────────────────┤
│ • Catálogo productos│ • Terminal POS rápido │ • Catálogo proveedores   │
│ • Categorías        │ • Detalle de venta    │ • Registro de compras    │
│ • Pasillo y estante │ • Métodos de pago     │ • Historial de costos    │
│ • Alertas de stock  │ • Control & cierre    │ • Kardex de movimientos  │
│ • Búsqueda ágil     │ • Stock automático    │ • Reportes y exportación │
│ • Stock mínimo      │ • Comprobante/Ticket  │ • KPIs ejecutivos        │
└─────────────────────┴───────────────────────┴──────────────────────────┘
```

---

## 5. Arquitectura de Software

FERROGEST implementa una **Arquitectura de Tres Capas** con desacoplamiento estricto de responsabilidades:

```
┌─────────────────────────────────────────────────────────┐
│              CAPA 1: PRESENTACIÓN (UI / UX)             │
│   React 19 + TypeScript + Tailwind CSS + Lucide Icons   │
│   • Dashboard interactivo • POS • Formularios modales   │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│            CAPA 2: LÓGICA DE NEGOCIO (SERVICIOS)        │
│   • Validaciones de negocio (código único, stock > 0)   │
│   • Motor de cálculo de ventas, impuestos y cambio     │
│   • Conciliación de caja (ingresos, egresos, ventas)    │
│   • Políticas de seguridad y autorización RBAC          │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│              CAPA 3: PERSISTENCIA Y DATOS               │
│   • Modelo relacional normalizado (3NF)                 │
│   • Repositorio con almacenamiento persistente local    │
│   • Semillas de datos reales para ferretería            │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Estructura de Carpetas del Proyecto

```text
/
├── docs/                        # Documentación técnica y arquitectura
│   ├── ARQUITECTURA_TECNICA.md  # Especificación técnica en Español
│   └── TECHNICAL_ARCHITECTURE.md# Especificación técnica en Inglés
├── src/
│   ├── components/              # Componentes de interfaz reutilizables
│   │   ├── common/              # Badges, modales, alertas, botones
│   │   └── layout/              # Sidebar de navegación, Navbar superior, MainLayout
│   ├── hooks/                   # Custom Hooks
│   │   └── useAuth.tsx          # Gestión de sesión, usuario activo y RBAC
│   ├── pages/                   # Vistas y pantallas del sistema
│   │   ├── admin/               # Gestión de usuarios del sistema
│   │   ├── auth/                # Pantalla de inicio de sesión (Login)
│   │   ├── dashboard/           # Dashboard ejecutivo con métricas y alertas
│   │   ├── inventory/           # Productos, Categorías, Ubicaciones, Alertas de stock
│   │   ├── purchases/           # Compras a proveedores e historial de costos
│   │   ├── reports/             # Reportes de inventario, ventas y movimientos CSV
│   │   └── sales/               # Punto de Venta (POS), Historial de ventas, Control de Caja
│   ├── services/                # Capa de datos y lógica de negocio
│   │   ├── db.ts                # Motor de persistencia y operaciones CRUD relacionales
│   │   └── mockData.ts          # Datos maestros iniciales de FERRO GET
│   ├── types/                   # Modelos e interfaces TypeScript normalizadas
│   │   └── index.ts             # Definición de entidades del dominio
│   ├── utils/                   # Funciones utilitarias
│   │   └── formatters.ts        # Formateadores de moneda, fechas, CSV y estado de stock
│   ├── App.tsx                  # Enrutador principal con React Router v7
│   ├── index.css                # Estilos globales y configuración Tailwind CSS v4
│   └── main.tsx                 # Punto de entrada de la aplicación
├── index.html                   # HTML base de la aplicación
├── package.json                 # Dependencias y scripts de ejecución
├── tsconfig.json                # Configuración de TypeScript
└── vite.config.ts               # Configuración de compilador y bundler Vite
```

---

## 7. Modelo de Datos Relacional

Las entidades principales del modelo de datos son:

| Entidad | Descripción | Atributos Principales |
| :--- | :--- | :--- |
| **USUARIO** | Operadores del sistema | `id`, `nombre`, `apellido`, `correo`, `rol`, `estado` |
| **ROL** | Niveles de autorización | `id`, `nombre` (`ADMIN`, `VENDEDOR`), `descripcion` |
| **CATEGORÍA** | Familias de artículos | `id`, `nombre`, `descripcion`, `estado` |
| **UBICACIÓN** | Espacio físico en almacén | `id`, `nombre`, `pasillo`, `estante`, `descripcion` |
| **PRODUCTO** | Insumos y herramientas | `id`, `codigo`, `nombre`, `precio_compra`, `precio_venta`, `stock_actual`, `stock_minimo`, `unidad_medida` |
| **PROVEEDOR** | Distribuidores autorizados | `id`, `razon_social`, `identificacion`, `telefono`, `correo`, `direccion` |
| **COMPRA** | Abastecimiento de inventario | `id`, `proveedor_id`, `usuario_id`, `fecha`, `total`, `detalles` |
| **VENTA** | Transacciones de mostrador | `id`, `numero_factura`, `cliente`, `metodo_pago`, `total`, `detalles` |
| **CAJA** | Turnos de caja y arqueos | `id`, `usuario_id`, `monto_inicial`, `monto_final`, `estado`, `fecha_apertura` |
| **MOVIMIENTO_CAJA** | Entradas y salidas manuales | `id`, `caja_id`, `tipo` (`INGRESO`/`EGRESO`), `monto`, `concepto` |
| **MOVIMIENTO_INV** | Kardex de existencias | `id`, `producto_id`, `tipo` (`ENTRADA`/`SALIDA`/`AJUSTE`), `cantidad`, `motivo` |

---

## 8. Roles y Seguridad (RBAC)

El sistema cuenta con control de acceso por perfiles de usuario:

- 🛡️ **Administrador:** Acceso total a todas las funciones (Dashboard, Inventario completo, POS, Caja, Compras, Proveedores, Reportes financieros y Administración de Usuarios).
- 🧑‍🔧 **Vendedor / Cajero:** Acceso enfocado a la operación de mostrador (Punto de Venta POS, consulta de existencias y ubicaciones en almacén, apertura/cierre de su caja asignada). Las áreas de administración de usuarios y configuración sensible están restringidas.

### Cuentas de Demostración:
- **Administrador:** `admin@ferroget.com` (Acceso con rol `ADMIN`)
- **Vendedor:** `carlos.vendedor@ferroget.com` (Acceso con rol `VENDEDOR`)

---

## 9. Tecnologías Utilizadas

- **Frontend:** React 19, TypeScript, React Router v7.
- **Estilos & Diseño:** Tailwind CSS v4, Lucide React (iconografía técnica ferretera).
- **Herramientas de Construcción:** Vite 8, esbuild.
- **Persistencia:** Capa de abstracción DAO/Repository en TypeScript con persistencia en navegador (Local Storage sincronizado) y carga de semillas normalizadas.

---

## 10. Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (versión 18 o superior recomendada)
- npm o yarn

### Pasos de ejecución
1. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor estará disponible en `http://localhost:3000`.

3. **Verificación de tipos TypeScript:**
   ```bash
   npm run lint
   ```

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 11. Documentación Adicional

Para más detalles sobre los diagramas entidad-relación, especificación de endpoints REST y estrategia de pruebas de calidad, consulta:
- [`/docs/ARQUITECTURA_TECNICA.md`](./docs/ARQUITECTURA_TECNICA.md) (Especificación técnica detallada en Español).
- [`/docs/TECHNICAL_ARCHITECTURE.md`](./docs/TECHNICAL_ARCHITECTURE.md) (Especificación técnica en Inglés).
