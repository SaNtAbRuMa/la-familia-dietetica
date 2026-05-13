const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-12345678' });

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
const OVERRIDES_FILE = path.join(__dirname, 'data', 'local_overrides.json');

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

function readOverrides() {
  try {
    if (!fs.existsSync(OVERRIDES_FILE)) return {};
    return JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

function saveOverrides(overrides) {
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2));
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

// PUT update product (admin)
app.put('/api/admin/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const products = readProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
    
    products[index] = { ...products[index], ...updates };
    saveProducts(products);
    
    const overrides = readOverrides();
    overrides[id] = { ...(overrides[id] || {}), ...updates };
    saveOverrides(overrides);
    
    res.json({ message: 'Producto actualizado', product: products[index] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    
    let isRawFormat = false;
    let workbook, sheet, data;
    
    if (req.file.originalname.toLowerCase().endsWith('.csv')) {
       // Si suben un .csv directamente, lo leemos como texto y lo pasamos al parser inteligente
       const text = fs.readFileSync(req.file.path, 'utf8');
       const lines = text.split(/[\n\r]+/).filter(Boolean);
       let delimiter = ',';
       if (text.includes('\t')) delimiter = '\t';
       else if (text.includes(';')) delimiter = ';';
       
       const products = convertLinesToProducts(lines, delimiter);
       if (products.length === 0) {
          return res.status(400).json({ error: 'No se encontraron productos válidos en el CSV.' });
       }
       saveProducts(products);
       return res.json({ message: `Se importaron ${products.length} productos correctamente desde el CSV`, count: products.length });
    } else {
       // Es un Excel (.xls, .xlsx)
       workbook = XLSX.readFile(req.file.path);
       sheet = workbook.Sheets[workbook.SheetNames[0]];
       data = XLSX.utils.sheet_to_json(sheet);
       
       if (data.length === 0) {
         return res.status(400).json({ error: 'El archivo Excel está vacío' });
       }
       
       // Verificamos si ya es el formato limpio (app.js espera 'nombre', 'precio')
       if (data[0].nombre !== undefined || data[0].Nombre !== undefined) {
          fs.copyFileSync(req.file.path, PRODUCTS_EXCEL);
          return res.json({ message: `Se importaron ${data.length} productos correctamente`, count: data.length });
       } else {
          // Es un Excel en formato raw (como el de Google Sheets).
          const csvStr = XLSX.utils.sheet_to_csv(sheet);
          const lines = csvStr.split(/[\n\r]+/).filter(Boolean);
          const products = convertLinesToProducts(lines, ',');
          if (products.length === 0) {
             return res.status(400).json({ error: 'No se reconocieron productos válidos en este Excel. Asegurate de que tenga las categorías (ej: 1 - ACEITES).' });
          }
          saveProducts(products);
          return res.json({ message: `Se importaron ${products.length} productos correctamente`, count: products.length });
       }
    }
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

    let delimiter = ',';
    if (data.includes('\t')) delimiter = '\t';
    else if (data.includes(';')) delimiter = ';';

    const products = convertLinesToProducts(lines, delimiter);
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

// ========== GOOGLE SHEETS SYNC ==========
function parseCSVRow(str, delimiter = ',') {
  let result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && str[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCellToVariants(cellText, defaultLabel) {
  const variants = [];
  if (!cellText || cellText.trim() === '') return variants;
  
  const parts = cellText.split(/(?:\s{2,}|,|-|\|)/).map(p => p.trim()).filter(Boolean);
  
  for (let part of parts) {
    let price = 0;
    let label = defaultLabel || '';
    
    let priceMatch = part.match(/\$\s*([\d.,]+)/);
    let numMatch = part.match(/^([\d.,]+)\s*[xX]\s*(.+)$/i);
    
    if (priceMatch) {
      price = parsePriceValue(priceMatch[1]);
      label = part.replace(priceMatch[0], '').replace(/^[xX]\s*/i, '').trim() || defaultLabel;
    } else if (numMatch) {
      price = parsePriceValue(numMatch[1]);
      label = numMatch[2].trim() || defaultLabel;
    } else {
      const tokens = part.split(/\s+/);
      let foundPrice = false;
      for (let i = 0; i < tokens.length; i++) {
        if (/^[\d.,]+$/.test(tokens[i])) {
          let val = parsePriceValue(tokens[i]);
          if (val > 0 && val !== 100 && val !== 500 && val !== 250) { 
            price = val;
            let labelTokens = [...tokens];
            labelTokens.splice(i, 1);
            label = labelTokens.join(' ').replace(/^[xX]\s*/i, '').trim() || defaultLabel;
            foundPrice = true;
            break;
          }
        }
      }
      if (!foundPrice) continue;
    }
    
    label = label.replace(/por\s+/i, '').replace(/unidad/i, '').trim();
    if (label.toLowerCase() === 'u') label = '';
    if (price > 0) variants.push({ price, label });
  }
  return variants;
}

function convertLinesToProducts(lines, delimiter) {
  const products = [];
  let currentCategory = '';
  let catColLabels = ['', '', ''];
  let id = 1;

  for (const line of lines) {
    const cols = parseCSVRow(line, delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    let first = cols[0] || '';
    
    // Sometimes Google Sheets exports have empty first column but data in second
    if (first === '' && cols[1]) {
       cols.shift();
       first = cols[0] || '';
    }
    
    if (!first) continue;

    if (/^(LISTA|INDICE|Urquiza|Rivadavia|Pedidos|Con tu|HELADERA|FREEZER)/i.test(first)) continue;
    if (first === '#REF!' || first === 'aaa') continue;

    const catMatch = first.match(/^(\d+)\s*[-–]\s*(.+)$/);
    if (catMatch) {
      const rawCat = catMatch[2].trim();
      currentCategory = rawCat.split(/\s+/).map(w => {
        const up = w.toUpperCase();
        if (['Y','DE','E','EN','A','SIN','CON','POR','PARA'].includes(up) && w.length <= 4) return w.toLowerCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(' ');
      
      let labels = [];
      for (let i = 1; i < cols.length; i++) {
         let lab = cols[i] ? cols[i].replace(/^\$/, '').replace(/por\s+/i, '').trim() : '';
         if (lab) labels.push(lab);
      }
      catColLabels = ['', ...labels];
      continue;
    }

    if (/^\d+$/.test(first) && cols[1] && /^[A-Z]/.test(cols[1])) continue;
    if (/^\$\s*por/i.test(first)) continue;
    if (!currentCategory) continue;
    if (first.length < 3) continue;

    const wm = first.match(/(\d+\s*(ml|cc|gr|grs|kg|lt|lts|litro|litros|mk|oz|lb|cm|mm))\b/i);
    const sizeFromName = wm ? wm[1] : '';
    let nombre = first.charAt(0).toUpperCase() + first.slice(1);

    let allVariants = [];
    for (let c = 1; c < cols.length; c++) {
      let colText = cols[c];
      if (!colText) continue;
      
      // Check if it's an image URL column
      if (typeof colText === 'string' && colText.startsWith('http')) {
          continue;
      }
      
      let defLabel = catColLabels[c] || '';
      let cellVariants = parseCellToVariants(colText, defLabel);
      
      if (cellVariants.length === 0 && c === 1) {
         let directVal = parsePriceValue(colText);
         if (directVal > 0) {
            cellVariants.push({ price: directVal, label: defLabel });
         }
      }
      allVariants.push(...cellVariants);
    }
    
    if (allVariants.length === 0) continue;
    
    const imgUrlCol = cols.find(c => typeof c === 'string' && c.startsWith('http'));

    for (let v of allVariants) {
      let finalLabel = v.label || sizeFromName;
      
      products.push({
        id: id++,
        nombre: nombre,
        descripcion: '',
        precio: v.price || 0,
        categoria: currentCategory,
        imagen: imgUrlCol || '',
        stock: 999,
        destacado: false,
        peso: finalLabel,
        marca: 'La Familia',
        activo: v.price > 0
      });
    }
  }
  return products;
}

const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpKijmFFMP1Ea4_wT1_X7bkoFQqIl1XbO73ywCDkDq2ImDOE6dqQ272Sa_nZOw8-Eu7hrISgcLCS5h/pub?gid=2102913718&single=true&output=csv';

async function syncGoogleSheetsProducts() {
  try {
    const res = await fetch(GOOGLE_SHEETS_CSV_URL);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.text();
    const lines = data.split(/[\n\r]+/).filter(Boolean);
    const products = convertLinesToProducts(lines, ',');
    
    if (products.length > 100) {
      // Apply local overrides before saving
      const overrides = readOverrides();
      const finalProducts = products.map(p => {
        if (overrides[p.id]) {
          return { ...p, ...overrides[p.id] };
        }
        return p;
      });
      saveProducts(finalProducts);
      console.log(`Synced ${finalProducts.length} products from Google Sheets with overrides applied`);
    }
  } catch (err) {
    console.error('Error syncing Google Sheets:', err);
  }
}

// Run initial sync on startup
setTimeout(syncGoogleSheetsProducts, 2000);
// Sync every 5 minutes
setInterval(syncGoogleSheetsProducts, 5 * 60 * 1000);

// POST force sync (admin)
app.post('/api/admin/sync', async (req, res) => {
  try {
    await syncGoogleSheetsProducts();
    const products = readProducts();
    res.json({ message: 'Sincronización completada', count: products.length });
  } catch (err) {
    res.status(500).json({ error: 'Error al sincronizar: ' + err.message });
  }
});

// PUT update product (admin)
app.put('/api/admin/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    // Read current products
    const products = readProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Update in memory
    products[index] = { ...products[index], ...updates };
    
    // Save to overrides
    const overrides = readOverrides();
    overrides[id] = { ...(overrides[id] || {}), ...updates };
    saveOverrides(overrides);
    
    // Save to excel
    saveProducts(products);
    
    res.json({ message: 'Producto actualizado', product: products[index] });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto: ' + err.message });
  }
});

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
app.post('/api/orders', async (req, res) => {
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
    
    let init_point = null;
    if (metodoPago === 'mercadopago' || metodoPago === 'tarjeta') {
       try {
          const preference = new Preference(mpClient);
          const mpItems = items.map(i => ({
             title: i.nombre,
             unit_price: Number(i.precio),
             quantity: Number(i.cantidad),
             currency_id: 'ARS'
          }));
          
          const shipping = total - items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
          if (shipping > 0) {
              mpItems.push({ title: 'Envío', unit_price: shipping, quantity: 1, currency_id: 'ARS' });
          }

          const response = await preference.create({
             body: {
                items: mpItems,
                back_urls: {
                   success: 'https://la-familia-dietetica-production.up.railway.app/?status=success',
                   failure: 'https://la-familia-dietetica-production.up.railway.app/?status=failure',
                   pending: 'https://la-familia-dietetica-production.up.railway.app/?status=pending'
                },
                auto_return: 'approved',
                external_reference: newOrder.id
             }
          });
          init_point = response.init_point;
       } catch (err) {
          console.error('MercadoPago Error:', err);
       }
    }
    
    res.json({ message: 'Pedido creado exitosamente', order: newOrder, init_point });
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
