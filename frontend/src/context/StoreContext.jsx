import React, { createContext, useState, useEffect, useContext } from 'react';
import Papa from 'papaparse';

const StoreContext = createContext();

// Default public Google Sheets CSV URL provided by user
// Default public Google Sheets CSV URL provided by user or environment variable
const DEFAULT_SHEET_URL = import.meta.env.VITE_SHEETS_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTpKijmFFMP1Ea4_wT1_X7bkoFQqIl1XbO73ywCDkDq2ImDOE6dqQ272Sa_nZOw8-Eu7hrISgcLCS5h/pub?gid=2102913718&single=true&output=csv';

// Fallback high-quality mock CSV data matching their Olavarría sheet
const FALLBACK_CSV = `
1 - ACEITES, VINAGRES Y SALSAS,,$ por unidad,
,aceite de coco GB 125ml neutro,$5.500,
,aceite de coco GB 225ml neutro,$9.800,
,aceite de coco GB 500ml neutro,$12.000,
,aceite de coco GB 125ml virgen,$7.850,
,aceite de coco  graal neutro 360ml,$8.600,
,aceite de oliva extra virgen x 1/2  Liv,$12.500,
,Aceite de oliva extra virgen x litro  Liv,$22.500,
,chimichurri con malbec pampa gourmet,$6.100,
,mayonesa vegana dellisola ajo y albahaca ,$5.200,
,Salsa de soja Sakanashi por 1 lt,$8.500,
,Vinagre organico de manzana x 1/4 lt,$8.500,
2 - AVENAS Y SOJAS,,$ por kilo ,
,Avena instantanea,$2.000,
,Avena Gruesa,$2.000,
,Salvado de avena ,$2.400,
,Soja texturizada fina,$3.500,
,soja texturizada mediana,$3.900,
3 - BEBIDAS,,$ por unidad,
,Jugo de arandano c/  Rincon de Vida 1 1/2 Lt,$6.500,
,kefir,$8.900,
,kombucha ALOJA  jengibre, cedron e hibiscus ,$5.400,
,kombucha BOOCH pomelo e hibiscus,$6.300,
,straus cerveza honey,$5.000,
4 - CEREALES Y GRANOLAS,,$ por 100 grs,$ por kilo 
,almohaditas de avena de chocolate con relleno de chocolate blanco,$1.800,$18.000
,almohaditas de avena de chocolate con relleno de limon,$1.600,$16.000
,Aritos de miel,$1.100,$11.000
,Cereal Free sin azucar,$1.700,$17.000
,granola MOLÉ,$16.900,
,Granola Crocante ,$950,$9.500
,Granola Energetica (avena, nueces, almendras, copos, miel),$1.050,$10.500
,granola dubai pasticcino,$8.500,
5 - COMPLEMENTOS DIETARIOS,,$ por unidad ,
,Aceite de Chía Sol Azteca,$11.500,
,citrato magnesio natier 50 capsulas,$18.900,
,citrato de magnesio gummies ,$21.900,
,colabella colágeno hidrolizado con zanahoria,7900,
,ENA - Creatina micronizada 300gr,$45.900,
,ENA - Proteina Whey protein x 930 grs,$99.000,
,granger pancakes proteicos veganos ,$12.500,
,quelat citrato de magnesio ,$23.900,
,Tintura madre - Oasis - Cardo Mariano,$7.900,
,Tintura madre - oasis - Boldo,$5.900,
6 - REPOSTERIA,,$ por unidad,
,Gran Budin de vainilla y nuez,$4.500,
,Chispas de chocolate amargo x 250g,$3.200,
,Polvo para hornear doble accion x 200g,$2.100,
,Esencia de vainilla premium x 250ml,$3.800,
7 - COTILLON,,$ por unidad,
,Globos perlados de colores x 50u,$2.900,
,Bengalas de cumpleanos doradas x 4u,$1.500,
,Guirnaldas feliz cumpleanos,$1.800,
,Velas magicas de cumpleanos x 10u,$1.200,
`;

// Helper: Parse currency values
const parsePriceValue = (str) => {
  if (!str) return 0;
  let cleaned = str.toString().replace(/\$/g, '').replace(/,00$/,'').trim();
  const match = cleaned.match(/([\d.,]+)/);
  if (!match) return 0;
  let numStr = match[1];
  if (numStr.includes('.') && !numStr.includes(',')) {
    numStr = numStr.replace(/\./g, '');
  } else if (numStr.includes(',')) {
    numStr = numStr.replace(/\./g, '').replace(',', '.');
  }
  const val = parseFloat(numStr);
  return isNaN(val) ? 0 : val;
};

// Helper: Parse specific values inside cells for options
const parseCellToVariants = (cellText, defaultLabel) => {
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
};

// Smart Parser capable of both structures
const parseCSVToProducts = (csvString) => {
  const parsed = Papa.parse(csvString.trim(), { skipEmptyLines: true });
  const lines = parsed.data;
  
  if (lines.length === 0) return [];

  // Determine if it is the clean schema
  const firstLine = lines[0];
  const isCleanSchema = firstLine.some(cell => 
    typeof cell === 'string' && 
    (cell.toLowerCase().includes('precio_base') || cell.toLowerCase().includes('stock_disponible'))
  );

  if (isCleanSchema) {
    // Parse using requested clean columns schema
    const headers = firstLine.map(h => h.trim().toLowerCase());
    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('nombre');
    const priceIdx = headers.indexOf('precio_base_100g');
    const unitIdx = headers.indexOf('unidad');
    const stockIdx = headers.indexOf('stock_disponible');
    const catIdx = headers.indexOf('categoria') !== -1 ? headers.indexOf('categoria') : headers.indexOf('categoría');
    const imgIdx = headers.indexOf('imagen_url');
    const descIdx = headers.indexOf('descripcion') !== -1 ? headers.indexOf('descripcion') : headers.indexOf('descripción');
    const tagsIdx = headers.indexOf('etiquetas');

    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row || row.length === 0 || !row[nameIdx]) continue;
      
      const id = row[idIdx] || `clean_${i}`;
      const nombre = row[nameIdx].trim();
      const precioBase = parsePriceValue(row[priceIdx]);
      const unidad = row[unitIdx] ? row[unitIdx].trim() : '100g';
      const stock = parseInt(row[stockIdx]) || 999;
      const categoria = row[catIdx] ? row[catIdx].trim() : 'Otros';
      const imagenUrl = row[imgIdx] ? row[imgIdx].trim() : '';
      const descripcion = row[descIdx] ? row[descIdx].trim() : '';
      const etiquetasRaw = row[tagsIdx] ? row[tagsIdx].trim() : '';
      const etiquetas = etiquetasRaw ? etiquetasRaw.split(',').map(t => t.trim()) : [];

      products.push({
        id: id.toString(),
        nombre,
        precio: precioBase,
        peso: unidad,
        unidad,
        stock,
        categoria,
        imagen: imagenUrl,
        descripcion,
        etiquetas,
        marca: 'Natural',
        activo: precioBase > 0
      });
    }
    return products;
  } else {
    // Parse using their custom category-based CSV
    const products = [];
    let currentCategory = '';
    let catColLabels = ['', '', ''];
    let idCounter = 1;

    for (const cols of lines) {
      if (cols.length === 0) continue;
      let first = cols[0] ? cols[0].toString().trim() : '';
      
      if (first === '' && cols[1]) {
        cols.shift();
        first = cols[0] ? cols[0].toString().trim() : '';
      }
      
      if (!first) continue;

      // Skip list information rows
      if (/^(LISTA|INDICE|Urquiza|Rivadavia|Pedidos|Con tu|HELADERA|FREEZER)/i.test(first)) continue;
      if (first === '#REF!' || first === 'aaa') continue;

      // Check if it's a category row (e.g. "1 - ACEITES, VINAGRES Y SALSAS")
      const catMatch = first.match(/^(\d+)\s*[-–]\s*(.+)$/);
      if (catMatch) {
        const rawCat = catMatch[2].trim();
        // Capitalize Category
        currentCategory = rawCat.split(/\s+/).map(w => {
          const up = w.toUpperCase();
          if (['Y','DE','E','EN','A','SIN','CON','POR','PARA'].includes(up) && w.length <= 4) return w.toLowerCase();
          return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }).join(' ');
        
        let labels = [];
        for (let i = 1; i < cols.length; i++) {
          let lab = cols[i] ? cols[i].toString().replace(/^\$/, '').replace(/por\s+/i, '').trim() : '';
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
        
        // Skip image URL in raw lists if any
        if (typeof colText === 'string' && colText.startsWith('http')) continue;
        
        let defLabel = catColLabels[c] || '';
        let cellVariants = parseCellToVariants(colText.toString(), defLabel);
        
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
        let finalLabel = v.label || sizeFromName || '100g';
        
        // Detect tags based on name (TACC, Vegano, etc.)
        const nameLower = nombre.toLowerCase();
        const etiquetas = [];
        if (nameLower.includes('sin tacc') || nameLower.includes('celia') || nameLower.includes('cereal free')) etiquetas.push('Sin TACC');
        if (nameLower.includes('vegano') || nameLower.includes('vegana') || nameLower.includes('plant based')) etiquetas.push('Vegano');
        if (nameLower.includes('organico') || nameLower.includes('orgánica') || nameLower.includes('bio')) etiquetas.push('Orgánico');
        if (v.price < 5000 && (idCounter % 15 === 0)) etiquetas.push('Oferta');

        products.push({
          id: idCounter.toString(),
          nombre: nombre,
          descripcion: `Excelente calidad. Ideal para una alimentación saludable y equilibrada. Producido bajo estrictos controles naturales.`,
          precio: v.price || 0,
          categoria: currentCategory,
          imagen: imgUrlCol || '',
          stock: 50, // Default base stock for simulation
          destacado: idCounter % 12 === 0,
          peso: finalLabel,
          unidad: finalLabel.toLowerCase().includes('kilo') || finalLabel.toLowerCase().includes('kg') ? '1kg' : (finalLabel.toLowerCase().includes('unidad') || finalLabel.toLowerCase().includes('u') ? 'Unidad' : '100g'),
          marca: 'Verde Vida',
          etiquetas: etiquetas,
          activo: v.price > 0
        });
        idCounter++;
      }
    }
    return products;
  }
};

export const StoreProvider = ({ children }) => {
  const [rawProducts, setRawProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('vv_cart') || '[]'));
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('vv_orders') || '[]'));
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('vv_sheet_url') || DEFAULT_SHEET_URL);
  const [postalCode, setPostalCode] = useState(() => localStorage.getItem('vv_postal_code') || '');
  const [shippingCost, setShippingCost] = useState(null);
  
  // Local overrides for stock and price to support Admin inline edits locally
  const [localOverrides, setLocalOverrides] = useState(() => {
    return JSON.parse(localStorage.getItem('vv_local_overrides') || '{}');
  });

  // Category & Filter state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Load and sync products
  const fetchAndSyncProducts = async (customUrl = null) => {
    setLoading(true);
    setError(null);
    const targetUrl = customUrl || sheetUrl;
    let csvData = '';

    try {
      // First try to fetch from backend API if running
      const apiRes = await fetch('/api/products');
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.length > 0) {
          // If backend loaded products, adjust structure
          const formatted = data.map(p => ({
            id: p.id.toString(),
            nombre: p.nombre,
            descripcion: p.descripcion || 'Producto natural de alta calidad.',
            precio: p.precio,
            categoria: p.categoria,
            imagen: p.imagen,
            stock: p.stock !== undefined ? p.stock : 50,
            peso: p.peso || '100g',
            unidad: p.peso?.toLowerCase()?.includes('kg') ? '1kg' : '100g',
            marca: p.marca || 'Verde Vida',
            etiquetas: p.etiquetas || [],
            activo: p.activo !== false
          }));
          setRawProducts(formatted);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('Backend not available, syncing directly from CSV URL...');
    }

    try {
      // Fetch directly from Google Sheets CSV or fallback
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Failed to load Google Sheet CSV');
      csvData = await response.text();
    } catch (err) {
      console.warn('Network issue fetching CSV. Loading default fallback products.', err);
      setError('No se pudo establecer conexión en tiempo real con Google Sheets. Mostrando catálogo local de respaldo.');
      csvData = FALLBACK_CSV;
    }

    const parsed = parseCSVToProducts(csvData);
    setRawProducts(parsed);
    setLoading(false);
  };

  useEffect(() => {
    fetchAndSyncProducts();
  }, [sheetUrl]);

  // Combine rawProducts with local overrides and group them
  useEffect(() => {
    if (rawProducts.length === 0) return;

    // Apply overrides
    const overriden = rawProducts.map(p => {
      const override = localOverrides[p.id];
      if (override) {
        return { ...p, ...override };
      }
      return p;
    });

    // Group items sharing the exact same base name
    const groupedMap = new Map();
    overriden.forEach(p => {
      let baseName = p.nombre;
      
      // Clean size markers from name to extract base name for selection
      if (p.peso) {
        const escaped = p.peso.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pesoRegex = new RegExp('\\s*' + escaped + '\\s*', 'i');
        baseName = p.nombre.replace(pesoRegex, ' ').replace(/\s+/g, ' ').trim();
      }

      const key = `${p.categoria}::${baseName}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          ...p,
          nombre: baseName,
          isGrouped: false,
          variantes: [p]
        });
      } else {
        const parent = groupedMap.get(key);
        parent.variantes.push(p);
        parent.isGrouped = true;
        // Sort variants by price ascending
        parent.variantes.sort((a, b) => a.precio - b.precio);
        parent.precio = parent.variantes[0].precio;
        parent.peso = parent.variantes[0].peso;
      }
    });

    setProducts(Array.from(groupedMap.values()));
  }, [rawProducts, localOverrides]);

  // Cart operations
  const addToCart = (product, quantity = 1, selectedVariantId = null) => {
    setCart(prev => {
      let targetProduct = product;
      if (product.isGrouped && selectedVariantId) {
        targetProduct = product.variantes.find(v => v.id === selectedVariantId) || product.variantes[0];
      } else if (product.isGrouped && !selectedVariantId) {
        targetProduct = product.variantes[0];
      }

      const existing = prev.find(item => item.id === targetProduct.id);
      let updated;
      if (existing) {
        updated = prev.map(item => 
          item.id === targetProduct.id 
            ? { ...item, cantidad: item.cantidad + quantity } 
            : item
        );
      } else {
        updated = [...prev, {
          id: targetProduct.id,
          nombre: targetProduct.nombre,
          precio: targetProduct.precio,
          imagen: targetProduct.imagen,
          peso: targetProduct.peso,
          categoria: targetProduct.categoria,
          cantidad: quantity
        }];
      }
      localStorage.setItem('vv_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('vv_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newQty = item.cantidad + delta;
          return newQty <= 0 ? null : { ...item, cantidad: newQty };
        }
        return item;
      }).filter(Boolean);
      localStorage.setItem('vv_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('vv_cart');
  };

  // Shipping calculation based on Postal Code (Olavarría area code is 7400)
  // local shipping: 7400 (Olavarria) -> Free or $1000. Under 20k -> $1200, over 20k -> free
  // other cities in PC of Buenos Aires -> $2500, rest of Argentina -> $4500
  useEffect(() => {
    if (!postalCode) {
      setShippingCost(null);
      return;
    }
    localStorage.setItem('vv_postal_code', postalCode);
    const total = getCartTotal();

    if (total >= 20000) {
      setShippingCost(0);
      return;
    }

    const code = parseInt(postalCode);
    if (code === 7400) {
      setShippingCost(1200); // Delivery within Olavarría
    } else if (code >= 7000 && code < 8500) {
      setShippingCost(2500); // Interior Buenos Aires province
    } else {
      setShippingCost(4500); // Rest of Argentina
    }
  }, [postalCode, cart]);

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const getCartCount = () => cart.reduce((sum, item) => sum + item.cantidad, 0);

  // Admin Actions
  const updateProductStock = async (productId, newStock) => {
    // 1. Update locally in State & LocalStorage
    const updatedOverrides = {
      ...localOverrides,
      [productId]: {
        ...(localOverrides[productId] || {}),
        stock: newStock
      }
    };
    setLocalOverrides(updatedOverrides);
    localStorage.setItem('vv_local_overrides', JSON.stringify(updatedOverrides));

    // 2. Try to sync to backend if server is active
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
    } catch (e) {
      console.log('Standalone mode: Stock override saved locally');
    }

    // Proactively update rawProducts to trigger immediate table re-render
    setRawProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
  };

  const createSimulatedOrder = (orderData) => {
    const newOrder = {
      id: Math.random().toString(36).substring(2, 10).toUpperCase(),
      fecha: new Date().toISOString(),
      cliente: orderData.cliente,
      items: orderData.items,
      total: orderData.total,
      metodoPago: orderData.metodoPago,
      estado: 'Pendiente', // Pendiente, Armado/Preparado, Entregado/Enviado
      direccion: orderData.direccion,
      notas: orderData.notas || ''
    };

    // Deduct stock for all items
    orderData.items.forEach(item => {
      const match = rawProducts.find(rp => rp.id === item.id);
      if (match) {
        const currentStock = match.stock !== undefined ? match.stock : 50;
        updateProductStock(item.id, Math.max(0, currentStock - item.cantidad));
      }
    });

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('vv_orders', JSON.stringify(updated));
      return updated;
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, estado: newStatus } : o);
      localStorage.setItem('vv_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const saveSheetUrl = (newUrl) => {
    setSheetUrl(newUrl);
    localStorage.setItem('vv_sheet_url', newUrl);
  };

  return (
    <StoreContext.Provider value={{
      loading,
      error,
      products,
      rawProducts,
      cart,
      orders,
      sheetUrl,
      postalCode,
      shippingCost,
      activeCategory,
      searchQuery,
      sortBy,
      setPostalCode,
      setActiveCategory,
      setSearchQuery,
      setSortBy,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      getCartTotal,
      getCartCount,
      updateProductStock,
      createSimulatedOrder,
      updateOrderStatus,
      saveSheetUrl,
      forceSync: () => fetchAndSyncProducts()
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
