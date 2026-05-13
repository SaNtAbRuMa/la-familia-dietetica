const fs = require('fs');

const rawData = `,,,
,,,
,,,
,,,
,,,
,,,
,,,
,           LISTA DE PRECIOS,,
Urquiza 1315 - Rivadavia 2581,,,
Pedidos a whatsapp 2284-638849,,,
Con tu compra mayor o igual a $ 20000 el envio a domicilio es gratis ,,,
,INDICE DE RUBROS,,
,,,
1,"ACEITES, VINAGRES Y SALSAS",,
2,AVENAS Y SOJAS,,
3,BEBIDAS,,
4,CEREALES Y GRANOLAS,,
5,COMPLEMENTOS DIETARIOS,,
6,CONGELADOS Y REFRIGERADOS,,
7,COSMETICA SALUDABLE,,
8,COTILLON,,
9,ENDULZANTES,,
10,ESPECIAS,,
11,FECULAS Y HARINAS,,
12,FIDEOS VARIOS,,
13,FRUTAS DESHIDRATADAS,,
14,FRUTOS SECOS,,
15,GALLETITAS,,
16,GALLETITAS SIN AZUCAR,,
17,"GALLETITAS, CEREALES Y PAN SIN TACC",,
18,GOLOSINAS SALUDABLES,,
19,HERBORISTERIA,,
20,INFUSIONES,,
21,LEGUMBRES,,
22,MERMELADAS Y DULCES,,
23,MIEL,,
24,PASTAS (APTAS PARA DIABETICOS),,
25,PASTAS SIN TACC,,
26,PASTAS Y MANTEQUILLAS DE MANI,,
27,PREMEZCLAS Y REBOZADORES SIN TACC,,
28,PRODUCTOS ARCOR,,
29,PRODUCTOS LA FRANCIA,,
30,PRODUCTOS VEGETARIANOS Y VEGANOS,,
31,REPOSTERIA,#REF!,
32,SALES,,
33,SEMILLAS,,
34,SNACKS,,
35,"SNACKS, GOLOSINAS Y CEREALES SIN TACC",,
36,TOSTADAS Y GRISINES,,
37,VARIOS,,
38,VARIOS SIN TACC,,
,,,
"1 - ACEITES, VINAGRES Y SALSAS",,$ por unidad,
,aceite de coco GB 125ml neutro,$5.500,
,aceite de coco GB 225ml neutro,$9.800,
,aceite de coco GB 500ml neutro,$12.000,
,aceite de coco GB 125ml virgen,$7.850,
,aceite de coco GB 225ml virgen,$17.400,
,aceite de coco GB 500ml virgen,$19.800,
,aceite de coco  graal neutro 360ml,$8.600,
,aceite de coco  graal 360ml virgen,$14.400,
,aceite de coco  graal 180mk neutro,$5.100,
,aceite de coco  graal  180ml virgen,$8.200,
,aceite de coco beepure,$9.500,
,aceite coco MK 100 ml,$7.600,
,aceite de coco virgen MK 200gr,$14.900,
,aceite de coco MK organico 360ml,$12.900,
,"Aceite de coco ""El Cosaco"" x 360 Cc",$7.500,
,aceite de coco doña Magdalena ,$9.900,
,entrenuts aceite de coco neutro 200cc,$6.900,
,entrenuts aceite de coco virgen 200cc,$9.900,
,entrenuts aceite de coco neutro 360cc,$7.900,
,entrenuts aceite de coco virgen 360cc,$14.900,
,entrenuts aceite de coco neutro 500cc,$9.900,
,entrenuts aceite de coco virgen 500cc,$19.900,
,entrenuts aceite de coco neutro 1lt,$18.900,
,entrenuts aceite de coco virgen 1lt,$37.900,
,entrenuts ghee,$12.900,
,entrenuts ghee 150gr,$8.500,
,kony aceite de coco 250cc,$8.900,
,Aceite de coco ts ,$6.600,
,Aceite de coco Green Leaf,$6.500,
,aceite coco liquido MCT,$22.900,
,mtc  250gr oh yeah ,$31.700,
,aceite de coco oh yeah 300cc,$9.800,
,aceite de coco oh yeah 250gr oh yeah,$12.900,
,aceite coco spray,$15.800,
,aceite de coco savona fit,$8.400,
,aceire coco good bless you neutro,$11.300,
,aceite coco good bless you mediano virgen,$19.800,
,aceite coco good bless you chico virgen,$10.850,
,aceite de  nutra sem,$11.400,
,Aceite de lino nutra sem ,$11.900,
,aceite de lino sol azteca,$7.900,
,aceite de lino bio nativa,$9.300,
,aceite de sesamo sol azteca,$5.800,
,aceite de girasol organico Pampa Organico,$9.900,
,Aceite de oliva extra virgen x 1/2  Liv,$12.500,
,Aceite de oliva extra virgen x litro  Liv,$22.500,
,Aceite de oliva Extra Organico materia prima x 500,$8.100,
,aceite de oliva el faro,$21.900,
,aceite de oliva dicomere orgánico ,$10.900,
,aceite de oliva liv oil plastico x500ml,$5.900,
,aceite de oliva liv oil vidrio x500ml,$7.900,
,aceite de oliva dellisola organico x500ml,$25.900,
,aceite de oliva dellisola extra medio,$17.500,
,aceite de oliva dellisola extra suave 250ml,$11.500,
,aceite de oliva dellisola extra suave 500ml,$20.900,
,Aceite de oliva Olivares,$8.900,
,aceite de oliva estilo oliva arbosano,$8.900,
,aceite de oliva estilo oliva blend,$9.900,
,aceite de oliva estilo oliva coratina,$10.900,
,aceite de oliva extra arauco 250 cc,$11.500,
,aceita oliva extea arauco 500 cc,$20.900,
,aceite oliva medio 250 cc,$17.500,
,aceite oliva medio 500 cc,$9.750,
,Aceite de oliva genovesa x 250,$12.300,
,aceite oliva zuelo x 250,$10.200,
,aceite oliva zuelo x 500,$17.800,
,Aceite de oliva- girasol 1/2 lt San Agustin,$3.000,
,Aceite de oliva- girasol 1 lt  san agustin,$5.600,
,Aceite de oliva- girasol 2 lt San Agustin,$9.900,
,Aceite de oliva-girasol san agustin 5 lts,$19.200,
,aceite de oliva sabor pampeano ,$18.900,
,aceite de oliva savona 500cc,$11.900,
,Aceite de sesamo nutra sem,$7.900,
,aceite de palta  graal 250ml,$26.900,
,aceite de palta y oliva  graal 250ml,$16.300,
,aceite de palta avocado,$16.900,
,aceitunas verdes rellenas con morron,$6.900,
,Aceto balsamico malbec,$2.130,
,Aceto balsamico reserva,$2.900,
,aceto balsamico FD 500cc,$7.900,
,aceto cremoso famiglia dellisola,$8.900,
,alcaraz dressing salsa cesar ,$8.900,
,alcaraz dressing salsa wasabi,$8.900,
,alcaraz dressing barbacao,$8.900,
,2 - AVENAS Y SOJAS,,$ por kilo ,
,Avena instantanea,$2.000,
,Avena Gruesa,$2.000,
,Avena tradicional fina,$2.000,
,3 - BEBIDAS,,$ por unidad,
,Jugo de arandano c/  Rincon de Vida 1 1/2 Lt,$5.900,
,4 - CEREALES Y GRANOLAS,,$ por 100 grs,$ por kilo 
,almohaditas de avena de chocolate con relleno de chocolate blanco,$1.800,$18.000
,almohaditas de avena de chocolate con relleno de limon,$1.600,$16.000
,Almohaditas de avena dos dos,$1.200,12000
`;

function parsePriceValue(str) {
  if (!str) return 0;
  let cleaned = str.replace(/\\$/g, '').replace(/,00$/,'').trim();
  const match = cleaned.match(/([\d.,]+)/);
  if (!match) return 0;
  let numStr = match[1];
  if (numStr.includes('.') && !numStr.includes(',')) {
    numStr = numStr.replace(/\\./g, '');
  } else if (numStr.includes(',')) {
    numStr = numStr.replace(/\\./g, '').replace(',', '.');
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
    
    if (allVariants.length === 0) continue;
    
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
console.log(`Detected delimiter: '${delimiter}'`);
console.log(`Extracted products: ${products.length}`);
console.log("First 10 products:");
console.log(products.slice(0, 10));
