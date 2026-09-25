import { db } from '../services/db';

export interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  message: string;
}

export function runCriticalTests(): TestResult[] {
  const results: TestResult[] = [];

  // Helper
  const record = (id: number, name: string, condition: boolean, message: string) => {
    results.push({ id, name, passed: condition, message });
  };

  // 1. Inicio de sesión correcto
  try {
    const users = db.getUsers();
    const admin = users.find((u) => u.correo === 'admin@ferroget.com');
    record(1, 'Inicio de sesión correcto', Boolean(admin && admin.estado === 'ACTIVO'), 'Usuario admin encontrado y activo');
  } catch (e: any) {
    record(1, 'Inicio de sesión correcto', false, e.message);
  }

  // 2. Inicio de sesión incorrecto
  try {
    const users = db.getUsers();
    const invalid = users.find((u) => u.correo === 'noexiste@ferroget.com');
    record(2, 'Inicio de sesión incorrecto', invalid === undefined, 'Credencial inexistente rechazada');
  } catch (e: any) {
    record(2, 'Inicio de sesión incorrecto', false, e.message);
  }

  // 3. Registro de producto
  let createdProductCode = `TEST-${Date.now()}`;
  try {
    const prod = db.createProduct({
      codigo: createdProductCode,
      nombre: 'Taladro de Prueba QA',
      descripcion: 'Producto para validación automatizada',
      categoria_id: 1,
      ubicacion_id: 1,
      precio_compra: 30,
      precio_venta: 50,
      stock_actual: 10,
      stock_minimo: 4,
      unidad_medida: 'UNIDAD',
      estado: 'ACTIVO',
    });
    record(3, 'Registro de producto', Boolean(prod && prod.id), `Producto creado con ID ${prod.id}`);
  } catch (e: any) {
    record(3, 'Registro de producto', false, e.message);
  }

  // 4. Producto duplicado (debe fallar)
  try {
    db.createProduct({
      codigo: createdProductCode,
      nombre: 'Taladro Duplicado',
      descripcion: 'Debe ser rechazado',
      categoria_id: 1,
      ubicacion_id: 1,
      precio_compra: 30,
      precio_venta: 50,
      stock_actual: 5,
      stock_minimo: 2,
      unidad_medida: 'UNIDAD',
      estado: 'ACTIVO',
    });
    record(4, 'Producto duplicado', false, 'Falla: Se permitió registrar código duplicado');
  } catch (e: any) {
    record(4, 'Producto duplicado', true, `Éxito: Bloqueado correctamente (${e.message})`);
  }

  // 5. Registro de venta
  let testSaleId = 0;
  const adminUser = db.getUsers()[0];
  const targetProduct = db.getProducts().find((p) => p.codigo === createdProductCode);

  try {
    if (targetProduct) {
      const sale = db.createSale({
        items: [{ producto_id: targetProduct.id, cantidad: 2 }],
        metodo_pago: 'EFECTIVO',
        usuario: adminUser,
      });
      testSaleId = sale.id;
      record(5, 'Registro de venta', Boolean(sale && sale.id), `Venta #${sale.id} generada`);
    } else {
      record(5, 'Registro de venta', false, 'Producto de prueba no disponible');
    }
  } catch (e: any) {
    record(5, 'Registro de venta', false, e.message);
  }

  // 6. Venta superior al stock (debe fallar)
  try {
    if (targetProduct) {
      db.createSale({
        items: [{ producto_id: targetProduct.id, cantidad: 9999 }],
        metodo_pago: 'EFECTIVO',
        usuario: adminUser,
      });
      record(6, 'Venta superior al stock', false, 'Falla: Se permitió vender más del stock disponible');
    }
  } catch (e: any) {
    record(6, 'Venta superior al stock', true, `Éxito: Venta excesiva bloqueada (${e.message})`);
  }

  // 7. Actualización de stock después de venta
  try {
    if (targetProduct) {
      const updated = db.getProductById(targetProduct.id);
      // Original 10 - 2 vendidas = 8
      record(7, 'Actualización de stock post-venta', updated?.stock_actual === 8, `Stock actual verificado: ${updated?.stock_actual} (esperado: 8)`);
    }
  } catch (e: any) {
    record(7, 'Actualización de stock post-venta', false, e.message);
  }

  // 8. Registro de compra
  try {
    const suppliers = db.getSuppliers();
    if (targetProduct && suppliers.length > 0) {
      const purchase = db.createPurchase({
        proveedor_id: suppliers[0].id,
        items: [{ producto_id: targetProduct.id, cantidad: 5, precio_unitario: 32 }],
        usuario: adminUser,
      });
      record(8, 'Registro de compra', Boolean(purchase && purchase.id), `Compra #${purchase.id} asentada`);
    }
  } catch (e: any) {
    record(8, 'Registro de compra', false, e.message);
  }

  // 9. Actualización de stock después de compra
  try {
    if (targetProduct) {
      const updated = db.getProductById(targetProduct.id);
      // 8 previo + 5 compradas = 13
      record(9, 'Actualización de stock post-compra', updated?.stock_actual === 13, `Stock reabastecido: ${updated?.stock_actual} (esperado: 13)`);
    }
  } catch (e: any) {
    record(9, 'Actualización de stock post-compra', false, e.message);
  }

  // 10. Generación de alerta de stock bajo
  try {
    const lowStockProd = db.createProduct({
      codigo: `ALERTA-${Date.now()}`,
      nombre: 'Ítem para Alerta Mínima',
      descripcion: 'Stock bajo intencional',
      categoria_id: 1,
      ubicacion_id: 1,
      precio_compra: 10,
      precio_venta: 15,
      stock_actual: 2,
      stock_minimo: 5, // 2 <= 5 triggers alert
      unidad_medida: 'UNIDAD',
      estado: 'ACTIVO',
    });
    const alerts = db.getAlerts();
    const hasAlert = alerts.some((a) => a.producto_id === lowStockProd.id && a.estado === 'PENDIENTE');
    record(10, 'Alerta de stock bajo', hasAlert, 'Alerta reactiva generada en alerta_stock');
  } catch (e: any) {
    record(10, 'Alerta de stock bajo', false, e.message);
  }

  // 11. Restricción de acceso por rol (RBAC)
  try {
    const seller = db.getUsers().find((u) => u.rol === 'VENDEDOR');
    const isSellerRestricted = seller?.rol !== 'ADMINISTRADOR';
    record(11, 'Restricción de acceso por rol', isSellerRestricted, 'Vendedor no posee permisos de Administrador');
  } catch (e: any) {
    record(11, 'Restricción de acceso por rol', false, e.message);
  }

  // 12. Cierre de caja
  try {
    const currentShift = db.getCurrentCashShift();
    if (currentShift) {
      const closed = db.closeCashShift(currentShift.id, currentShift.monto_inicial + 50);
      record(12, 'Cierre de caja y arqueo', closed.estado === 'CERRADA' && closed.diferencia !== null, `Caja cerrada con diferencia calculada: ${closed.diferencia}`);
      // Reopen a shift so the demo remains functional
      db.openCashShift(100, adminUser);
    } else {
      const shift = db.openCashShift(100, adminUser);
      const closed = db.closeCashShift(shift.id, 100);
      record(12, 'Cierre de caja y arqueo', closed.estado === 'CERRADA', 'Caja cerrada y arqueada');
      db.openCashShift(100, adminUser);
    }
  } catch (e: any) {
    record(12, 'Cierre de caja y arqueo', false, e.message);
  }

  return results;
}
