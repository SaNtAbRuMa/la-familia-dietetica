const fs = require('fs');
const rawData = fs.readFileSync('user_csv.txt', 'utf8');

function parsePriceValue(str) {
  if (!str) return 0;
  let cleaned = str.replace(/\$/g, '').replace(/,00$/,'').trim();
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
}

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
      
      if (typeof colText === 'string' && colText.startsWith('http')) continue;
      
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
    
    if (allVariants.length === 0) {
      console.log("No variants found for: ", first, " cols:", cols);
      continue;
    }
    
    const imgUrlCol = cols.find(c => typeof c === 'string' && c.startsWith('http'));

    for (let v of allVariants) {
      let finalLabel = v.label || sizeFromName;
      products.push({
        id: id++,
        nombre: nombre,
        precio: v.price || 0,
        categoria: currentCategory,
        peso: finalLabel,
        activo: v.price > 0
      });
    }
  }
  return products;
}

const lines = rawData.split(/[\n\r]+/).filter(Boolean);
const firstLine = lines[0] || '';
let delimiter = '\t';
if (firstLine.includes('\t')) delimiter = '\t';
else if (firstLine.includes(';')) delimiter = ';';
else delimiter = ',';

const products = convertLinesToProducts(lines, delimiter);
console.log(`Extracted products: ${products.length}`);
