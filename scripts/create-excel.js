const XLSX = require('xlsx');
const path = require('path');

const productos = [
  { id: 1, nombre: "Granola Artesanal con Miel", descripcion: "Granola crocante hecha con avena orgánica, miel pura, almendras y pasas de uva. Sin conservantes ni aditivos.", precio: 2850, categoria: "Cereales y Granolas", imagen: "/img/granola.jpg", stock: 45, destacado: true, peso: "350g", marca: "Verde Vida", activo: true },
  { id: 2, nombre: "Mix de Frutos Secos Premium", descripcion: "Selección premium de almendras, nueces, castañas de cajú y pistachos. Energía natural para tu día.", precio: 4200, categoria: "Frutos Secos", imagen: "/img/frutos-secos.jpg", stock: 60, destacado: true, peso: "250g", marca: "Verde Vida", activo: true },
  { id: 3, nombre: "Semillas de Chía Orgánica", descripcion: "Chía 100% orgánica, fuente de omega-3, fibra y proteínas. Ideal para smoothies y ensaladas.", precio: 1950, categoria: "Semillas", imagen: "/img/chia.jpg", stock: 80, destacado: true, peso: "300g", marca: "NaturaSem", activo: true },
  { id: 4, nombre: "Aceite de Coco Extra Virgen", descripcion: "Aceite de coco prensado en frío, ideal para cocinar, hornear y uso cosmético. 100% natural.", precio: 5800, categoria: "Aceites", imagen: "/img/aceite-coco.jpg", stock: 30, destacado: true, peso: "500ml", marca: "CocoVida", activo: true },
  { id: 5, nombre: "Harina de Almendras", descripcion: "Harina de almendras finamente molida, perfecta para recetas keto, celíacas y sin gluten.", precio: 4500, categoria: "Harinas", imagen: "/img/harina-almendras.jpg", stock: 35, destacado: false, peso: "500g", marca: "Verde Vida", activo: true },
  { id: 6, nombre: "Miel Orgánica Pura", descripcion: "Miel de abejas 100% pura y orgánica, cosechada de manera sustentable. Sabor floral intenso.", precio: 3200, categoria: "Endulzantes", imagen: "/img/miel.jpg", stock: 50, destacado: true, peso: "500g", marca: "Apiario Natural", activo: true },
  { id: 7, nombre: "Pasta de Maní Natural", descripcion: "Pasta de maní sin azúcar agregada, sin sal, sin aceite de palma. Solo maní tostado.", precio: 2400, categoria: "Untables", imagen: "/img/pasta-mani.jpg", stock: 40, destacado: false, peso: "400g", marca: "Verde Vida", activo: true },
  { id: 8, nombre: "Té Matcha Premium", descripcion: "Matcha japonés de grado ceremonial. Rico en antioxidantes, L-teanina y clorofila.", precio: 6500, categoria: "Tés e Infusiones", imagen: "/img/matcha.jpg", stock: 25, destacado: true, peso: "100g", marca: "ZenTea", activo: true },
  { id: 9, nombre: "Avena Arrollada Integral", descripcion: "Avena integral de grano entero, sin azúcar. Base perfecta para porridges y overnight oats.", precio: 1200, categoria: "Cereales y Granolas", imagen: "/img/avena.jpg", stock: 100, destacado: false, peso: "500g", marca: "Verde Vida", activo: true },
  { id: 10, nombre: "Almendras Tostadas", descripcion: "Almendras seleccionadas, tostadas sin sal. Snack saludable rico en vitamina E y magnesio.", precio: 3800, categoria: "Frutos Secos", imagen: "/img/almendras.jpg", stock: 55, destacado: false, peso: "250g", marca: "NutriNuts", activo: true },
  { id: 11, nombre: "Semillas de Lino Dorado", descripcion: "Lino dorado molido, excelente fuente de omega-3 y lignanos. Ideal para panificación.", precio: 1400, categoria: "Semillas", imagen: "/img/lino.jpg", stock: 70, destacado: false, peso: "300g", marca: "NaturaSem", activo: true },
  { id: 12, nombre: "Aceite de Oliva Extra Virgen", descripcion: "Aceite de oliva primera prensada en frío. Aroma frutado y sabor equilibrado.", precio: 4800, categoria: "Aceites", imagen: "/img/aceite-oliva.jpg", stock: 40, destacado: false, peso: "500ml", marca: "Olivares del Sur", activo: true },
  { id: 13, nombre: "Proteína Vegana en Polvo", descripcion: "Blend de proteínas de arveja, arroz y hemp. 25g de proteína por porción. Sabor vainilla.", precio: 8900, categoria: "Suplementos", imagen: "/img/proteina.jpg", stock: 20, destacado: true, peso: "750g", marca: "PlantPower", activo: true },
  { id: 14, nombre: "Spirulina en Polvo", descripcion: "Superalimento con alto contenido de proteínas, vitaminas B12 y hierro. Cultivo orgánico.", precio: 5200, categoria: "Superfoods", imagen: "/img/spirulina.jpg", stock: 30, destacado: false, peso: "150g", marca: "Verde Vida", activo: true },
  { id: 15, nombre: "Barrita de Cereal y Frutos", descripcion: "Barrita energética con avena, miel, almendras y arándanos. Sin azúcar refinada.", precio: 850, categoria: "Snacks", imagen: "/img/barrita.jpg", stock: 90, destacado: false, peso: "35g", marca: "Verde Vida", activo: true },
  { id: 16, nombre: "Azúcar Mascabo Orgánica", descripcion: "Azúcar integral mascabo sin refinar, con todos sus minerales naturales.", precio: 1800, categoria: "Endulzantes", imagen: "/img/mascabo.jpg", stock: 65, destacado: false, peso: "500g", marca: "DulceNatura", activo: true },
  { id: 17, nombre: "Leche de Almendras Casera", descripcion: "Mix para preparar tu propia leche de almendras. Rinde 2 litros. Sin aditivos.", precio: 2600, categoria: "Bebidas", imagen: "/img/leche-almendras.jpg", stock: 45, destacado: false, peso: "200g", marca: "Verde Vida", activo: true },
  { id: 18, nombre: "Cúrcuma en Polvo", descripcion: "Cúrcuma orgánica de alta concentración de curcumina. Antiinflamatorio natural.", precio: 2100, categoria: "Superfoods", imagen: "/img/curcuma.jpg", stock: 50, destacado: false, peso: "150g", marca: "SpiceLife", activo: true },
  { id: 19, nombre: "Chips de Banana Deshidratada", descripcion: "Banana deshidratada crocante sin azúcar agregada ni conservantes.", precio: 1600, categoria: "Snacks", imagen: "/img/chips-banana.jpg", stock: 75, destacado: false, peso: "200g", marca: "Verde Vida", activo: true },
  { id: 20, nombre: "Mix de Semillas para Ensalada", descripcion: "Mezcla de girasol, sésamo, lino y chía. Tostado suave para máximo sabor.", precio: 1800, categoria: "Semillas", imagen: "/img/mix-semillas.jpg", stock: 60, destacado: false, peso: "250g", marca: "NaturaSem", activo: true },
  { id: 21, nombre: "Harina de Coco", descripcion: "Harina de coco desgrasada, alta en fibra y sin gluten. Ideal para repostería saludable.", precio: 3200, categoria: "Harinas", imagen: "/img/harina-coco.jpg", stock: 40, destacado: false, peso: "500g", marca: "CocoVida", activo: true },
  { id: 22, nombre: "Nueces de Pecán", descripcion: "Nueces pecán seleccionadas, ricas en antioxidantes y grasas saludables.", precio: 5500, categoria: "Frutos Secos", imagen: "/img/pecan.jpg", stock: 30, destacado: false, peso: "200g", marca: "NutriNuts", activo: true },
  { id: 23, nombre: "Infusión Detox con Jengibre", descripcion: "Blend de hierbas con jengibre, limón y menta. Ayuda a la digestión y depuración.", precio: 1900, categoria: "Tés e Infusiones", imagen: "/img/infusion-detox.jpg", stock: 55, destacado: false, peso: "50g (20 saquitos)", marca: "ZenTea", activo: true },
  { id: 24, nombre: "Mantequilla de Almendras", descripcion: "Mantequilla cremosa de almendras tostadas. Sin azúcar, sin sal, 100% almendras.", precio: 5800, categoria: "Untables", imagen: "/img/mantequilla-almendras.jpg", stock: 20, destacado: false, peso: "350g", marca: "NutriNuts", activo: true },
  { id: 25, nombre: "Copos de Quinoa", descripcion: "Quinoa en copos precocida, alta en proteínas y hierro. Ideal como cereal de desayuno.", precio: 3400, categoria: "Cereales y Granolas", imagen: "/img/quinoa.jpg", stock: 35, destacado: false, peso: "350g", marca: "AndinaGrain", activo: true },
  { id: 26, nombre: "Aceite de Lino Prensado en Frío", descripcion: "Aceite de linaza orgánico, rica fuente de omega-3. Para uso en frío.", precio: 3600, categoria: "Aceites", imagen: "/img/aceite-lino.jpg", stock: 25, destacado: false, peso: "250ml", marca: "NaturaSem", activo: true },
  { id: 27, nombre: "Stevia Natural en Hojas", descripcion: "Hojas de stevia deshidratada. Endulzante natural sin calorías. Sabor puro.", precio: 1500, categoria: "Endulzantes", imagen: "/img/stevia.jpg", stock: 60, destacado: false, peso: "50g", marca: "DulceNatura", activo: true },
  { id: 28, nombre: "Goji Berries Deshidratadas", descripcion: "Bayas de goji importadas, superfood rico en vitamina C y antioxidantes.", precio: 4800, categoria: "Superfoods", imagen: "/img/goji.jpg", stock: 30, destacado: true, peso: "200g", marca: "SuperBerry", activo: true },
  { id: 29, nombre: "Galletitas de Avena y Coco", descripcion: "Galletas artesanales de avena y coco, endulzadas con miel. Sin TACC.", precio: 1400, categoria: "Snacks", imagen: "/img/galletitas.jpg", stock: 50, destacado: false, peso: "180g", marca: "Verde Vida", activo: true },
  { id: 30, nombre: "Lentejas Orgánicas", descripcion: "Lentejas verdes orgánicas, alto contenido de proteína vegetal y hierro.", precio: 1200, categoria: "Legumbres", imagen: "/img/lentejas.jpg", stock: 80, destacado: false, peso: "500g", marca: "TierraFértil", activo: true },
  { id: 31, nombre: "Garbanzos Orgánicos", descripcion: "Garbanzos orgánicos de primera calidad. Ideales para hummus y guisos.", precio: 1400, categoria: "Legumbres", imagen: "/img/garbanzos.jpg", stock: 70, destacado: false, peso: "500g", marca: "TierraFértil", activo: true },
  { id: 32, nombre: "Cacao Amargo en Polvo", descripcion: "Cacao puro sin azúcar, alcalinizado. Perfecto para repostería y bebidas.", precio: 3800, categoria: "Superfoods", imagen: "/img/cacao.jpg", stock: 40, destacado: false, peso: "250g", marca: "ChocoNatura", activo: true },
];

// Create Excel file
const ws = XLSX.utils.json_to_sheet(productos);
const wb = XLSX.utils.book_new();

// Set column widths
ws['!cols'] = [
  { width: 5 },   // id
  { width: 35 },  // nombre
  { width: 60 },  // descripcion
  { width: 10 },  // precio
  { width: 20 },  // categoria
  { width: 30 },  // imagen
  { width: 8 },   // stock
  { width: 10 },  // destacado
  { width: 10 },  // peso
  { width: 15 },  // marca
  { width: 8 },   // activo
];

XLSX.utils.book_append_sheet(wb, ws, 'Productos');

const outputPath = path.join(__dirname, '..', 'data', 'productos.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Archivo Excel creado con ${productos.length} productos en: ${outputPath}`);
console.log('Categorías:', [...new Set(productos.map(p => p.categoria))].join(', '));
