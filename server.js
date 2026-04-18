const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer config for Excel uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, 'productos_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

// Multer config for product images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/img/'),
  filename: (req, file, cb) => cb(null, 'prod_' + Date.now() + path.extname(file.originalname))
});
const imageUpload = multer({ 
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (.jpg, .png, .webp, .gif)'));
    }
  }
});

// Data paths
const PRODUCTS_EXCEL = path.join(__dirname, 'data', 'productos.xlsx');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Admin credentials (in production, use environment variables and hashing)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ========= HELPER FUNCTIONS =========

function readProducts() {
  try {
    if (!fs.existsSync(PRODUCTS_EXCEL)) {
      return [];
    }
    const workbook = XLSX.readFile(PRODUCTS_EXCEL);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data.map((row, index) => ({
      id: row.id || index + 1,
      nombre: row.nombre || row.Nombre || '',
      descripcion: row.descripcion || row.Descripcion || row.Descripción || '',
      precio: parseFloat(row.precio || row.Precio || 0),
      categoria: row.categoria || row.Categoria || row.Categoría || '',
      imagen: row.imagen || row.Imagen || '',
      stock: parseInt(row.stock || row.Stock || 0),
      destacado: row.destacado || row.Destacado || false,
      peso: row.peso || row.Peso || '',
      marca: row.marca || row.Marca || '',
      activo: row.activo !== undefined ? row.activo : (row.Activo !== undefined ? row.Activo : true)
    }));
  } catch (err) {
    console.error('Error reading products:', err);
    return [];
  }
}

function saveProducts(products) {
  const ws = XLSX.utils.json_to_sheet(products);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, PRODUCTS_EXCEL);
}

function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading orders:', err);
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ========= API ROUTES =========

// GET all products
app.get('/api/products', (req, res) => {
  const products = readProducts();
  const activeProducts = products.filter(p => p.activo !== false && p.activo !== 'false' && p.activo !== 0);
  res.json(activeProducts);
});

// GET all products (admin - includes inactive)
app.get('/api/admin/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

// GET categories
app.get('/api/categories', (req, res) => {
  const products = readProducts();
  const categories = [...new Set(products.map(p => p.categoria).filter(Boolean))];
  res.json(categories);
});

// POST upload Excel file
app.post('/api/products/upload', upload.single('excel'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    
    // Read uploaded file
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    // Validate
    if (data.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel está vacío' });
    }
    
    // Copy to data folder
    fs.copyFileSync(req.file.path, PRODUCTS_EXCEL);
    
    res.json({ message: `Se importaron ${data.length} productos correctamente`, count: data.length });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar el archivo: ' + err.message });
  }
});

// POST import CSV (semicolon-separated data pasted from spreadsheet)
app.post('/api/products/import-csv', (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !data.trim()) {
      return res.status(400).json({ error: 'No se recibieron datos' });
    }

    // Split into rows: handle both newline-separated and ;;;;-separated formats
    let lines;
    const newlineCount = (data.match(/\n/g) || []).length;
    if (newlineCount < 10 && data.length > 500) {
      lines = data.split(/;{3,}/).map(l => l.trim()).filter(Boolean);
    } else {
      lines = data.split(/[\n\r]+/).map(l => l.replace(/;+$/, '').trim()).filter(Boolean);
    }

    const products = [];
    let currentCategory = '';
    let id = 1;

    for (const line of lines) {
      const cols = line.split(';').map(c => c.trim());
      const first = cols[0] || '';
      if (!first) continue;

      // Skip known header/meta lines
      if (/^(LISTA|INDICE|Urquiza|Rivadavia|Pedidos|Con tu)/i.test(first)) continue;
      if (first === '#REF!' || first === 'aaa') continue;

      // Category header: "N - CATEGORY NAME"
      const catMatch = first.match(/^(\d+)\s*[-–]\s*(.+)$/);
      if (catMatch) {
        const rawCat = catMatch[2].trim();
        currentCategory = rawCat.split(/\s+/).map(w => {
          const up = w.toUpperCase();
          if (['Y','DE','E','EN','A','SIN','CON','POR','PARA'].includes(up) && w.length <= 4) return w.toLowerCase();
          return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }).join(' ');
        continue;
      }

      // Skip index lines (just number + category name)
      if (/^\d+$/.test(first) && cols[1] && /^[A-Z]/.test(cols[1])) continue;
      // Skip price-format header lines like "$ por unidad"
      if (/^\$\s*por/i.test(first)) continue;
      // Skip if no category assigned yet
      if (!currentCategory) continue;

      // Try to get price from cols[1], or cols[2] if cols[1] is a price-format label
      let priceStr = cols[1] || '';
      if (/^\$\s*por/i.test(priceStr)) {
        priceStr = cols[2] || '';
      }
      const price = parsePriceValue(priceStr);

      // Skip non-product lines
      if (first.length < 3) continue;
      if (/^\$/.test(first) && first.length < 12) continue;

      // Extract weight from name
      const wm = first.match(/(\d+\s*(ml|cc|gr|grs|kg|lt|lts|litro|litros))\b/i);
      let nombre = first.replace(/^["']|["']$/g, '').trim();
      nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

      products.push({
        id: id++,
        nombre,
        descripcion: '',
        precio: price || 0,
        categoria: currentCategory,
        imagen: '',
        stock: 999,
        destacado: false,
        peso: wm ? wm[1] : '',
        marca: 'La Familia',
        activo: price > 0
      });
    }

    if (products.length === 0) {
      return res.status(400).json({ error: 'No se encontraron productos válidos en los datos. Asegurate de incluir las líneas de categoría (ej: 1 - ACEITES) antes de los productos.' });
    }

    saveProducts(products);
    res.json({ message: `Se importaron ${products.length} productos correctamente`, count: products.length });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar datos: ' + err.message });
  }
});

function parsePriceValue(str) {
  if (!str) return 0;
  let cleaned = str.replace(/\$/g, '').replace(/,00$/,'').trim();
  const match = cleaned.match(/([\d.,]+)/);
  if (!match) return 0;
  let numStr = match[1];
  // Argentine format: dots are thousands, commas are decimals
  if (numStr.includes('.') && !numStr.includes(',')) {
    numStr = numStr.replace(/\./g, '');
  } else if (numStr.includes(',')) {
    numStr = numStr.replace(/\./g, '').replace(',', '.');
  }
  const val = parseFloat(numStr);
  return isNaN(val) ? 0 : val;
}

// POST upload product image
app.post('/api/products/image', imageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
    res.json({ url: '/img/' + req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Error al subir imagen: ' + err.message });
  }
});

// GET download products Excel
app.get('/api/products/download/excel', (req, res) => {
  if (!fs.existsSync(PRODUCTS_EXCEL)) {
    return res.status(404).json({ error: 'No hay archivo de productos' });
  }
  res.download(PRODUCTS_EXCEL, 'productos.xlsx');
});

// POST create order
app.post('/api/orders', (req, res) => {
  try {
    const { cliente, items, total, metodoPago, direccion, notas } = req.body;
    
    if (!cliente || !items || items.length === 0) {
      return res.status(400).json({ error: 'Datos del pedido incompletos' });
    }
    
    const orders = readOrders();
    const newOrder = {
      id: uuidv4().substring(0, 8).toUpperCase(),
      fecha: new Date().toISOString(),
      cliente: {
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: direccion || ''
      },
      items: items.map(item => ({
        productoId: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        subtotal: item.precio * item.cantidad
      })),
      total: total,
      metodoPago: metodoPago,
      estado: 'pendiente',
      notas: notas || ''
    };
    
    orders.push(newOrder);
    saveOrders(orders);
    
    // Update stock
    const products = readProducts();
    items.forEach(item => {
      const product = products.find(p => p.id == item.id);
      if (product) {
        product.stock = Math.max(0, (product.stock || 0) - item.cantidad);
      }
    });
    saveProducts(products);
    
    res.json({ message: 'Pedido creado exitosamente', order: newOrder });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear pedido: ' + err.message });
  }
});

// GET all orders (admin)
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  // Sort by date descending
  orders.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  res.json(orders);
});

// PUT update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { estado } = req.body;
  const validStates = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
  
  if (!validStates.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  
  order.estado = estado;
  order.ultimaActualizacion = new Date().toISOString();
  saveOrders(orders);
  
  res.json({ message: 'Estado actualizado', order });
});

// DELETE order
app.delete('/api/orders/:id', (req, res) => {
  let orders = readOrders();
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Pedido no encontrado' });
  
  orders.splice(index, 1);
  saveOrders(orders);
  res.json({ message: 'Pedido eliminado' });
});

// POST admin login
app.post('/api/admin/login', (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: 'admin_' + Date.now() });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// GET admin stats
app.get('/api/admin/stats', (req, res) => {
  const products = readProducts();
  const orders = readOrders();
  
  const totalVentas = orders
    .filter(o => o.estado !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);
  
  const pedidosPendientes = orders.filter(o => o.estado === 'pendiente').length;
  const pedidosHoy = orders.filter(o => {
    const today = new Date().toISOString().split('T')[0];
    return o.fecha.startsWith(today);
  }).length;
  
  res.json({
    totalProductos: products.length,
    productosActivos: products.filter(p => p.activo !== false).length,
    totalPedidos: orders.length,
    pedidosPendientes,
    pedidosHoy,
    totalVentas,
    stockBajo: products.filter(p => (p.stock || 0) <= 5).length
  });
});

// Serve SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🏠 La Familia Dietética corriendo en http://localhost:${PORT}`);
  console.log(`📊 Panel de Admin en http://localhost:${PORT}/admin`);
  
  // Create orders file if it doesn't exist
  if (!fs.existsSync(ORDERS_FILE)) {
    saveOrders([]);
  }
});
