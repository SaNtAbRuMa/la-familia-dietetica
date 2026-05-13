const fs = require('fs');
const XLSX = require('xlsx');

const data = fs.readFileSync('C:\\Users\\stefa\\.gemini\\antigravity\\scratch\\dietetica\\raw_data.txt', 'utf8');

let lines;
const newlineCount = (data.match(/\n/g) || []).length;
if (newlineCount < 10 && data.length > 500) {
  lines = data.split(/;{3,}/).map(l => l.trim()).filter(Boolean);
} else {
  lines = data.split(/[\n\r]+/).map(l => l.replace(/;+$/, '').trim()).filter(Boolean);
}

const rawProducts = [];
let currentCategory = '';
let id = 1;

for (const line of lines) {
  const cols = line.split(';').map(c => c.trim());
  const first = cols[0] || '';
  if (!first) continue;
  if (/^(LISTA|INDICE|Urquiza|Rivadavia|Pedidos|Con tu)/i.test(first)) continue;
  if (first === '#REF!' || first === 'aaa') continue;
  
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
  
  if (/^\d+$/.test(first) && cols[1] && /^[A-Z]/.test(cols[1])) continue;
  if (/^\$\s*por/i.test(first)) continue;
  if (!currentCategory) continue;
  
  let priceStr = cols[1] || '';
  if (/^\$\s*por/i.test(priceStr)) priceStr = cols[2] || '';
  
  const price = (function(str){
    if (!str) return 0;
    let cleaned = str.replace(/\$/g, '').replace(/,00$/,'').trim();
    const match = cleaned.match(/([\d.,]+)/);
    if (!match) return 0;
    let numStr = match[1];
    if (numStr.includes('.') && !numStr.includes(',')) numStr = numStr.replace(/\./g, '');
    else if (numStr.includes(',')) numStr = numStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(numStr) || 0;
  })(priceStr);
  
  if (first.length < 3) continue;
  if (/^\$/.test(first) && first.length < 12) continue;
  
  const wm = first.match(/(\d+\s*(ml|cc|gr|grs|kg|lt|lts|litro|litros))\b/i);
  let nombre = first.replace(/^["']|["']$/g, '').trim();
  nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
  
  rawProducts.push({
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

// Write to excel
const ws = XLSX.utils.json_to_sheet(rawProducts);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Productos');
XLSX.writeFile(wb, 'C:\\Users\\stefa\\.gemini\\antigravity\\scratch\\dietetica\\data\\productos.xlsx');
console.log('Successfully wrote', rawProducts.length, 'products to data/productos.xlsx');

// simulate grouping logic
let groupedMap = new Map();
rawProducts.forEach(p => {
  let baseName = p.nombre;
  if (p.peso) {
    const pesoRegex = new RegExp('\\s*' + p.peso.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i');
    baseName = p.nombre.replace(pesoRegex, ' ').replace(/\s+/g, ' ').trim();
  }
  const key = p.categoria + '::' + baseName;
  if (!groupedMap.has(key)) {
    groupedMap.set(key, { ...p, nombre: baseName, isGrouped: false, variantes: [p] });
  } else {
    const parent = groupedMap.get(key);
    parent.variantes.push(p);
    parent.isGrouped = true;
    parent.variantes.sort((a, b) => a.precio - b.precio);
    parent.precio = parent.variantes[0].precio;
    parent.peso = parent.variantes[0].peso;
  }
});

const allProducts = Array.from(groupedMap.values());
const groupedOnly = allProducts.filter(p => p.isGrouped);
console.log('Total grouped items:', groupedOnly.length);
if (groupedOnly.length > 0) {
  console.log('Sample grouped:', groupedOnly[0]);
}
