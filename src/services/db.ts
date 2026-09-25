import {
  Category,
  Location,
  Product,
  Supplier,
  User,
  Sale,
  Purchase,
  InventoryMovement,
  CashRegister,
  CashMovement,
  CostHistory,
  StockAlert,
  DashboardStats,
  PaymentMethod,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'ferrogest_users',
  CATEGORIES: 'ferrogest_categories',
  LOCATIONS: 'ferrogest_locations',
  SUPPLIERS: 'ferrogest_suppliers',
  PRODUCTS: 'ferrogest_products',
  SALES: 'ferrogest_sales',
  PURCHASES: 'ferrogest_purchases',
  MOVEMENTS: 'ferrogest_movements',
  CASH_REGISTERS: 'ferrogest_cash_registers',
  CASH_MOVEMENTS: 'ferrogest_cash_movements',
  COST_HISTORY: 'ferrogest_cost_history',
  ALERTS: 'ferrogest_alerts',
  AUTH_USER: 'ferrogest_auth_user',
};

// Safe localStorage helper
function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error', e);
  }
}

// Initial Database Seeder
export function initializeDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    setStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
    setStored(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
    setStored(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  // Prepopulate stock alerts for items with stock <= stock_minimo
  const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const categories = getStored<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const locations = getStored<Location[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);

  if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
    const alerts: StockAlert[] = [];
    products.forEach((prod) => {
      if (prod.stock_actual <= prod.stock_minimo) {
        const cat = categories.find((c) => c.id === prod.categoria_id);
        const loc = locations.find((l) => l.id === prod.ubicacion_id);
        alerts.push({
          id: alerts.length + 1,
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          producto_codigo: prod.codigo,
          categoria_nombre: cat?.nombre || 'General',
          ubicacion_texto: loc ? `${loc.pasillo} - ${loc.estante}` : 'Sin asignar',
          stock_actual: prod.stock_actual,
          stock_minimo: prod.stock_minimo,
          estado: 'PENDIENTE',
          fecha: new Date().toISOString(),
        });
      }
    });
    setStored(STORAGE_KEYS.ALERTS, alerts);
  }

  if (!localStorage.getItem(STORAGE_KEYS.CASH_REGISTERS)) {
    // Default open shift for the demo
    const defaultShift: CashRegister = {
      id: 1,
      usuario_id: 2, // Elena Rivas (Vendedora)
      usuario_nombre: 'Elena Rivas',
      fecha_apertura: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      monto_inicial: 100.0,
      estado: 'ABIERTA',
    };
    setStored(STORAGE_KEYS.CASH_REGISTERS, [defaultShift]);
  }
}

// Ensure database is initialized on import
initializeDatabase();

// --- DATA ACCESS LAYER / SERVICES ---

export const db = {
  // PRODUCTS
  getProducts(): Product[] {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const categories = this.getCategories();
    const locations = this.getLocations();

    return products.map((prod) => {
      const cat = categories.find((c) => c.id === prod.categoria_id);
      const loc = locations.find((l) => l.id === prod.ubicacion_id);
      return {
        ...prod,
        categoria_nombre: cat ? cat.nombre : 'Sin categoría',
        ubicacion_texto: loc ? `${loc.pasillo} - ${loc.estante}` : 'Sin asignar',
        pasillo: loc?.pasillo,
        estante: loc?.estante,
      };
    });
  },

  getProductById(id: number): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  },

  createProduct(data: Omit<Product, 'id' | 'fecha_creacion'>): Product {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    // RULE 7: Código único
    const exists = products.some((p) => p.codigo.trim().toLowerCase() === data.codigo.trim().toLowerCase());
    if (exists) {
      throw new Error(`El código de producto "${data.codigo}" ya está registrado.`);
    }

    const newProduct: Product = {
      ...data,
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      fecha_creacion: new Date().toISOString(),
    };

    products.push(newProduct);
    setStored(STORAGE_KEYS.PRODUCTS, products);

    // Initial movement
    if (newProduct.stock_actual > 0) {
      this.recordInventoryMovement({
        producto_id: newProduct.id,
        tipo_movimiento: 'AJUSTE_ENTRADA',
        cantidad: newProduct.stock_actual,
        stock_anterior: 0,
        stock_nuevo: newProduct.stock_actual,
        referencia: 'Stock inicial de alta de producto',
        usuario_id: 1,
        usuario_nombre: 'Administrador',
      });
    }

    this.checkAndGenerateAlert(newProduct);
    return newProduct;
  },

  updateProduct(id: number, data: Partial<Product>): Product {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');

    if (data.codigo) {
      const exists = products.some(
        (p) => p.id !== id && p.codigo.trim().toLowerCase() === data.codigo!.trim().toLowerCase()
      );
      if (exists) throw new Error(`El código "${data.codigo}" ya pertenece a otro producto.`);
    }

    const updated: Product = { ...products[index], ...data };
    products[index] = updated;
    setStored(STORAGE_KEYS.PRODUCTS, products);

    this.checkAndGenerateAlert(updated);
    return updated;
  },

  deleteProduct(id: number): boolean {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    // Soft delete
    products[index].estado = 'INACTIVO';
    setStored(STORAGE_KEYS.PRODUCTS, products);
    return true;
  },

  // CATEGORIES
  getCategories(): Category[] {
    return getStored<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  createCategory(nombre: string, descripcion: string): Category {
    const categories = this.getCategories();
    if (categories.some((c) => c.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
      throw new Error(`La categoría "${nombre}" ya existe.`);
    }
    const newCat: Category = {
      id: categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1,
      nombre: nombre.trim(),
      descripcion,
      estado: 'ACTIVO',
    };
    categories.push(newCat);
    setStored(STORAGE_KEYS.CATEGORIES, categories);
    return newCat;
  },

  updateCategory(id: number, data: Partial<Category>): Category {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Categoría no encontrada');
    const updated = { ...categories[index], ...data };
    categories[index] = updated;
    setStored(STORAGE_KEYS.CATEGORIES, categories);
    return updated;
  },

  // LOCATIONS
  getLocations(): Location[] {
    return getStored<Location[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
  },

  createLocation(nombre: string, pasillo: string, estante: string, descripcion: string): Location {
    const locations = this.getLocations();
    const newLoc: Location = {
      id: locations.length > 0 ? Math.max(...locations.map((l) => l.id)) + 1 : 1,
      nombre: nombre.trim(),
      pasillo: pasillo.trim(),
      estante: estante.trim(),
      descripcion,
    };
    locations.push(newLoc);
    setStored(STORAGE_KEYS.LOCATIONS, locations);
    return newLoc;
  },

  // ALERTS (RULE 5)
  getAlerts(): StockAlert[] {
    return getStored<StockAlert[]>(STORAGE_KEYS.ALERTS, []);
  },

  checkAndGenerateAlert(product: Product) {
    if (product.stock_actual <= product.stock_minimo) {
      const alerts = this.getAlerts();
      const existing = alerts.find((a) => a.producto_id === product.id && a.estado === 'PENDIENTE');
      const cat = this.getCategories().find((c) => c.id === product.categoria_id);
      const loc = this.getLocations().find((l) => l.id === product.ubicacion_id);

      if (!existing) {
        alerts.unshift({
          id: alerts.length > 0 ? Math.max(...alerts.map((a) => a.id)) + 1 : 1,
          producto_id: product.id,
          producto_nombre: product.nombre,
          producto_codigo: product.codigo,
          categoria_nombre: cat?.nombre || 'General',
          ubicacion_texto: loc ? `${loc.pasillo} - ${loc.estante}` : 'Sin asignar',
          stock_actual: product.stock_actual,
          stock_minimo: product.stock_minimo,
          estado: 'PENDIENTE',
          fecha: new Date().toISOString(),
        });
        setStored(STORAGE_KEYS.ALERTS, alerts);
      } else {
        existing.stock_actual = product.stock_actual;
        existing.stock_minimo = product.stock_minimo;
        setStored(STORAGE_KEYS.ALERTS, alerts);
      }
    } else {
      // Auto-resolve if stock was replenished
      const alerts = this.getAlerts();
      let modified = false;
      alerts.forEach((a) => {
        if (a.producto_id === product.id && a.estado === 'PENDIENTE') {
          a.estado = 'RESUELTO';
          modified = true;
        }
      });
      if (modified) setStored(STORAGE_KEYS.ALERTS, alerts);
    }
  },

  resolveAlert(id: number) {
    const alerts = this.getAlerts();
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      alert.estado = 'RESUELTO';
      setStored(STORAGE_KEYS.ALERTS, alerts);
    }
  },

  // INVENTORY MOVEMENTS (RULE 4)
  getInventoryMovements(): InventoryMovement[] {
    return getStored<InventoryMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  },

  recordInventoryMovement(data: Omit<InventoryMovement, 'id' | 'fecha'>): InventoryMovement {
    const movements = this.getInventoryMovements();
    const product = this.getProductById(data.producto_id);

    const newMov: InventoryMovement = {
      ...data,
      id: movements.length > 0 ? Math.max(...movements.map((m) => m.id)) + 1 : 1,
      producto_nombre: product?.nombre,
      producto_codigo: product?.codigo,
      fecha: new Date().toISOString(),
    };

    movements.unshift(newMov);
    setStored(STORAGE_KEYS.MOVEMENTS, movements);
    return newMov;
  },

  // SALES & POS (RULES 1, 2, 8, 9)
  getSales(): Sale[] {
    return getStored<Sale[]>(STORAGE_KEYS.SALES, []);
  },

  createSale(data: {
    items: { producto_id: number; cantidad: number }[];
    metodo_pago: PaymentMethod;
    descuento?: number;
    monto_recibido?: number;
    usuario: User;
  }): Sale {
    // RULE 9: Al menos un producto
    if (!data.items || data.items.length === 0) {
      throw new Error('La venta debe incluir al menos un producto.');
    }

    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);

    // RULE 1: Verificar stock suficiente para todos los ítems antes de proceder
    for (const item of data.items) {
      const prod = products.find((p) => p.id === item.producto_id);
      if (!prod) throw new Error(`Producto con ID ${item.producto_id} no existe.`);
      if (prod.stock_actual < item.cantidad) {
        throw new Error(
          `Stock insuficiente para "${prod.nombre}". Solicitado: ${item.cantidad}, Disponible: ${prod.stock_actual}.`
        );
      }
    }

    // Atomic transaction execution
    let subtotal = 0;
    const saleDetails: Sale['detalles'] = [];

    data.items.forEach((item, index) => {
      const prodIndex = products.findIndex((p) => p.id === item.producto_id);
      const prod = products[prodIndex];
      const lineSubtotal = prod.precio_venta * item.cantidad;
      subtotal += lineSubtotal;

      const previousStock = prod.stock_actual;
      const newStock = previousStock - item.cantidad;

      // RULE 2: Disminución de stock
      products[prodIndex].stock_actual = newStock;

      saleDetails.push({
        id: index + 1,
        venta_id: 0, // Assigned below
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        producto_codigo: prod.codigo,
        cantidad: item.cantidad,
        precio_unitario: prod.precio_venta,
        subtotal: lineSubtotal,
      });

      // RULE 4: Registrar movimiento de inventario
      this.recordInventoryMovement({
        producto_id: prod.id,
        tipo_movimiento: 'VENTA',
        cantidad: item.cantidad,
        stock_anterior: previousStock,
        stock_nuevo: newStock,
        referencia: 'Venta en mostrador',
        usuario_id: data.usuario.id,
        usuario_nombre: `${data.usuario.nombre} ${data.usuario.apellido}`,
      });

      // RULE 5: Check and trigger alert
      this.checkAndGenerateAlert(products[prodIndex]);
    });

    // Save updated products stock
    setStored(STORAGE_KEYS.PRODUCTS, products);

    const descuento = data.descuento || 0;
    const total = Math.max(0, subtotal - descuento);
    const montoRecibido = data.monto_recibido || total;
    const vuelto = data.metodo_pago === 'EFECTIVO' ? Math.max(0, montoRecibido - total) : 0;

    const sales = this.getSales();
    const newSaleId = sales.length > 0 ? Math.max(...sales.map((s) => s.id)) + 1 : 1;

    saleDetails.forEach((d) => (d.venta_id = newSaleId));

    const newSale: Sale = {
      id: newSaleId,
      usuario_id: data.usuario.id,
      usuario_nombre: `${data.usuario.nombre} ${data.usuario.apellido}`,
      fecha: new Date().toISOString(),
      subtotal,
      impuesto: 0,
      descuento,
      total,
      metodo_pago: data.metodo_pago,
      monto_recibido: montoRecibido,
      vuelto,
      estado: 'COMPLETADA',
      detalles: saleDetails,
    };

    sales.unshift(newSale);
    setStored(STORAGE_KEYS.SALES, sales);

    // Record movement in active cash shift if cash payment
    const currentShift = this.getCurrentCashShift();
    if (currentShift && currentShift.estado === 'ABIERTA') {
      this.recordCashMovement({
        caja_id: currentShift.id,
        tipo: 'VENTA',
        descripcion: `Venta #${newSale.id} (${data.metodo_pago})`,
        monto: total,
      });
    }

    return newSale;
  },

  // CASH REGISTER
  getCashShifts(): CashRegister[] {
    return getStored<CashRegister[]>(STORAGE_KEYS.CASH_REGISTERS, []);
  },

  getCurrentCashShift(): CashRegister | undefined {
    const shifts = this.getCashShifts();
    return shifts.find((s) => s.estado === 'ABIERTA');
  },

  openCashShift(montoInicial: number, user: User): CashRegister {
    const current = this.getCurrentCashShift();
    if (current) {
      throw new Error(`Ya existe una caja abierta (Turno #${current.id}). Debe cerrarla antes de abrir una nueva.`);
    }

    const shifts = this.getCashShifts();
    const newShift: CashRegister = {
      id: shifts.length > 0 ? Math.max(...shifts.map((s) => s.id)) + 1 : 1,
      usuario_id: user.id,
      usuario_nombre: `${user.nombre} ${user.apellido}`,
      fecha_apertura: new Date().toISOString(),
      monto_inicial: montoInicial,
      estado: 'ABIERTA',
    };

    shifts.unshift(newShift);
    setStored(STORAGE_KEYS.CASH_REGISTERS, shifts);
    return newShift;
  },

  getCashMovements(cajaId?: number): CashMovement[] {
    const movs = getStored<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
    return cajaId ? movs.filter((m) => m.caja_id === cajaId) : movs;
  },

  recordCashMovement(data: Omit<CashMovement, 'id' | 'fecha'>): CashMovement {
    const movs = this.getCashMovements();
    const newMov: CashMovement = {
      ...data,
      id: movs.length > 0 ? Math.max(...movs.map((m) => m.id)) + 1 : 1,
      fecha: new Date().toISOString(),
    };
    movs.unshift(newMov);
    setStored(STORAGE_KEYS.CASH_MOVEMENTS, movs);
    return newMov;
  },

  closeCashShift(cajaId: number, montoDeclarado: number): CashRegister {
    const shifts = this.getCashShifts();
    const shiftIndex = shifts.findIndex((s) => s.id === cajaId);
    if (shiftIndex === -1) throw new Error('Caja no encontrada');

    const shift = shifts[shiftIndex];
    if (shift.estado === 'CERRADA') throw new Error('Esta caja ya se encuentra cerrada.');

    const movements = this.getCashMovements(cajaId);
    let netMovements = 0;
    movements.forEach((m) => {
      if (m.tipo === 'VENTA' || m.tipo === 'INGRESO_EXTRA') {
        netMovements += m.monto;
      } else if (m.tipo === 'EGRESO_GASTO') {
        netMovements -= m.monto;
      }
    });

    const montoEsperado = shift.monto_inicial + netMovements;
    const diferencia = montoDeclarado - montoEsperado;

    shift.fecha_cierre = new Date().toISOString();
    shift.monto_final = montoDeclarado;
    shift.monto_esperado = montoEsperado;
    shift.diferencia = diferencia;
    shift.estado = 'CERRADA';

    shifts[shiftIndex] = shift;
    setStored(STORAGE_KEYS.CASH_REGISTERS, shifts);
    return shift;
  },

  // SUPPLIERS & PURCHASES (RULES 3, 8, 10)
  getSuppliers(): Supplier[] {
    return getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },

  createSupplier(data: Omit<Supplier, 'id' | 'estado'>): Supplier {
    const suppliers = this.getSuppliers();
    if (suppliers.some((s) => s.identificacion.trim() === data.identificacion.trim())) {
      throw new Error(`Ya existe un proveedor con la identificación ${data.identificacion}.`);
    }

    const newSup: Supplier = {
      ...data,
      id: suppliers.length > 0 ? Math.max(...suppliers.map((s) => s.id)) + 1 : 1,
      estado: 'ACTIVO',
    };
    suppliers.push(newSup);
    setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
    return newSup;
  },

  getPurchases(): Purchase[] {
    return getStored<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  },

  getCostHistory(): CostHistory[] {
    return getStored<CostHistory[]>(STORAGE_KEYS.COST_HISTORY, []);
  },

  createPurchase(data: {
    proveedor_id: number;
    items: { producto_id: number; cantidad: number; precio_unitario: number }[];
    usuario: User;
  }): Purchase {
    // RULE 10: Proveedor obligatorio
    const supplier = this.getSuppliers().find((s) => s.id === data.proveedor_id);
    if (!supplier) throw new Error('Debe seleccionar un proveedor válido.');

    if (!data.items || data.items.length === 0) {
      throw new Error('La compra debe contener al menos un producto.');
    }

    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const costHistories = this.getCostHistory();
    let subtotal = 0;
    const purchaseDetails: Purchase['detalles'] = [];

    data.items.forEach((item, index) => {
      const prodIndex = products.findIndex((p) => p.id === item.producto_id);
      if (prodIndex === -1) throw new Error(`Producto ${item.producto_id} no encontrado.`);

      const prod = products[prodIndex];
      const lineSubtotal = item.cantidad * item.precio_unitario;
      subtotal += lineSubtotal;

      const previousStock = prod.stock_actual;
      const newStock = previousStock + item.cantidad;

      // RULE 3: Incremento de stock
      products[prodIndex].stock_actual = newStock;

      // Check if purchase cost changed -> record in historial_costo
      if (prod.precio_compra !== item.precio_unitario) {
        costHistories.unshift({
          id: costHistories.length > 0 ? Math.max(...costHistories.map((c) => c.id)) + 1 : 1,
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          proveedor_id: supplier.id,
          proveedor_nombre: supplier.razon_social,
          costo_anterior: prod.precio_compra,
          costo_nuevo: item.precio_unitario,
          fecha: new Date().toISOString(),
          usuario_id: data.usuario.id,
          usuario_nombre: `${data.usuario.nombre} ${data.usuario.apellido}`,
        });
        products[prodIndex].precio_compra = item.precio_unitario;
      }

      purchaseDetails.push({
        id: index + 1,
        compra_id: 0,
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        producto_codigo: prod.codigo,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: lineSubtotal,
      });

      // RULE 4: Registrar movimiento de inventario
      this.recordInventoryMovement({
        producto_id: prod.id,
        tipo_movimiento: 'COMPRA',
        cantidad: item.cantidad,
        stock_anterior: previousStock,
        stock_nuevo: newStock,
        referencia: `Compra a ${supplier.razon_social}`,
        usuario_id: data.usuario.id,
        usuario_nombre: `${data.usuario.nombre} ${data.usuario.apellido}`,
      });

      // Update alert if needed
      this.checkAndGenerateAlert(products[prodIndex]);
    });

    setStored(STORAGE_KEYS.PRODUCTS, products);
    setStored(STORAGE_KEYS.COST_HISTORY, costHistories);

    const purchases = this.getPurchases();
    const newPurchaseId = purchases.length > 0 ? Math.max(...purchases.map((p) => p.id)) + 1 : 1;
    purchaseDetails.forEach((d) => (d.compra_id = newPurchaseId));

    const newPurchase: Purchase = {
      id: newPurchaseId,
      proveedor_id: supplier.id,
      proveedor_nombre: supplier.razon_social,
      usuario_id: data.usuario.id,
      usuario_nombre: `${data.usuario.nombre} ${data.usuario.apellido}`,
      fecha: new Date().toISOString(),
      subtotal,
      impuesto: 0,
      total: subtotal,
      estado: 'COMPLETADA',
      detalles: purchaseDetails,
    };

    purchases.unshift(newPurchase);
    setStored(STORAGE_KEYS.PURCHASES, purchases);
    return newPurchase;
  },

  // USERS (RULE 6)
  getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  createUser(data: Omit<User, 'id' | 'fecha_creacion' | 'estado'>): User {
    const users = this.getUsers();
    if (users.some((u) => u.correo.toLowerCase() === data.correo.trim().toLowerCase())) {
      throw new Error(`El correo ${data.correo} ya está en uso.`);
    }
    const newUser: User = {
      ...data,
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      estado: 'ACTIVO',
      fecha_creacion: new Date().toISOString(),
    };
    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // DASHBOARD STATS
  getDashboardStats(): DashboardStats {
    const products = this.getProducts().filter((p) => p.estado === 'ACTIVO');
    const sales = this.getSales();
    const purchases = this.getPurchases();
    const suppliers = this.getSuppliers();

    const lowStockCount = products.filter((p) => p.stock_actual <= p.stock_minimo).length;

    // Today's date YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.fecha.startsWith(today));
    const totalVentasHoy = todaySales.reduce((acc, s) => acc + s.total, 0);

    const valorInventario = products.reduce((acc, p) => acc + p.stock_actual * p.precio_compra, 0);

    return {
      total_productos: products.length,
      productos_stock_bajo: lowStockCount,
      ventas_hoy: todaySales.length,
      total_ventas_hoy: totalVentasHoy,
      compras_mes: purchases.length,
      total_proveedores: suppliers.length,
      valor_inventario: valorInventario,
    };
  },
};
