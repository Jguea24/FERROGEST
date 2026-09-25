export type UserRole = 'ADMINISTRADOR' | 'VENDEDOR';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: UserRole;
  estado: 'ACTIVO' | 'INACTIVO';
  fecha_creacion: string;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface Location {
  id: number;
  nombre: string;
  descripcion: string;
  pasillo: string;
  estante: string;
}

export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  categoria_nombre?: string;
  ubicacion_id: number;
  ubicacion_texto?: string; // e.g. "Pasillo 2 - Estante B"
  pasillo?: string;
  estante?: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fecha_creacion: string;
}

export interface Supplier {
  id: number;
  razon_social: string;
  identificacion: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface PurchaseDetail {
  id: number;
  compra_id: number;
  producto_id: number;
  producto_nombre?: string;
  producto_codigo?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  proveedor_id: number;
  proveedor_nombre?: string;
  usuario_id: number;
  usuario_nombre?: string;
  fecha: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: 'COMPLETADA' | 'ANULADA';
  detalles: PurchaseDetail[];
}

export interface SaleDetail {
  id: number;
  venta_id: number;
  producto_id: number;
  producto_nombre: string;
  producto_codigo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

export interface Sale {
  id: number;
  usuario_id: number;
  usuario_nombre?: string;
  fecha: string;
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
  metodo_pago: PaymentMethod;
  monto_recibido?: number;
  vuelto?: number;
  estado: 'COMPLETADA' | 'ANULADA';
  detalles: SaleDetail[];
}

export type MovementType = 'VENTA' | 'COMPRA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA';

export interface InventoryMovement {
  id: number;
  producto_id: number;
  producto_nombre?: string;
  producto_codigo?: string;
  tipo_movimiento: MovementType;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia: string;
  usuario_id: number;
  usuario_nombre?: string;
  fecha: string;
}

export interface CashRegister {
  id: number;
  usuario_id: number;
  usuario_nombre?: string;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  monto_inicial: number;
  monto_final?: number | null;
  monto_esperado?: number | null;
  diferencia?: number | null;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface CashMovement {
  id: number;
  caja_id: number;
  tipo: 'VENTA' | 'INGRESO_EXTRA' | 'EGRESO_GASTO';
  descripcion: string;
  monto: number;
  fecha: string;
}

export interface CostHistory {
  id: number;
  producto_id: number;
  producto_nombre?: string;
  proveedor_id: number;
  proveedor_nombre?: string;
  costo_anterior: number;
  costo_nuevo: number;
  fecha: string;
  usuario_id: number;
  usuario_nombre?: string;
}

export interface StockAlert {
  id: number;
  producto_id: number;
  producto_nombre: string;
  producto_codigo: string;
  categoria_nombre: string;
  ubicacion_texto: string;
  stock_actual: number;
  stock_minimo: number;
  estado: 'PENDIENTE' | 'REVISADO' | 'RESUELTO';
  fecha: string;
}

export interface DashboardStats {
  total_productos: number;
  productos_stock_bajo: number;
  ventas_hoy: number;
  total_ventas_hoy: number;
  compras_mes: number;
  total_proveedores: number;
  valor_inventario: number;
}
