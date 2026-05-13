let allProducts = [];
let cart = JSON.parse(localStorage.getItem('vv_cart') || '[]');
let currentProduct = null;
let productsPerPage = 40;
let currentlyShown = 0;
let currentFiltered = [];

// ========== DOM READY ==========
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  initNavbar();
  initSearch();
  initCart();
  initCheckout();
  initScrollEffects();
  updateCartUI();
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('status') === 'success') {
    showToast('¡Pago aprobado! Tu pedido está en preparación.', 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.get('status') === 'failure') {
    showToast('Hubo un problema con el pago. Por favor intenta nuevamente.', 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.get('status') === 'pending') {
    showToast('Tu pago está pendiente de aprobación. Te avisaremos cuando se confirme.', 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

let originalProductsMap = new Map();

// ========== PRODUCTS ==========
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const rawProducts = await res.json();
    
    // Store original products for cart lookup
    rawProducts.forEach(p => originalProductsMap.set(p.id, p));

    // Grouping logic: merge products that share the same base name (minus the size)
    let groupedMap = new Map();
    rawProducts.forEach(p => {
      let baseName = p.nombre;
      if (p.peso) {
         // Remove the peso/size string from the product name to get the base name
         const escaped = p.peso.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         const pesoRegex = new RegExp('\\s*' + escaped + '\\s*', 'i');
         baseName = p.nombre.replace(pesoRegex, ' ').replace(/\s+/g, ' ').trim();
      }
      
      const key = p.categoria + '::' + baseName;
      
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
        parent.variantes.sort((a, b) => a.precio - b.precio);
        parent.precio = parent.variantes[0].precio;
        parent.peso = parent.variantes[0].peso;
      }
    });

    allProducts = Array.from(groupedMap.values());
    
    renderNavCategories();
    renderCategoriesGrid();
    renderAllProducts();
    initLoadMore();
  } catch (e) {
    console.error('Error cargando productos:', e);
  }
}

function renderNavCategories() {
  const navCats = document.getElementById('nav-categories');
  if (!navCats) return;
  const cats = {};
  allProducts.forEach(p => { if (p.categoria) cats[p.categoria] = (cats[p.categoria] || 0) + 1; });
  navCats.innerHTML = '<a href="#" class="nav-cat-link active" data-category="all">TODOS</a>' +
    Object.keys(cats).map(c => `<a href="#" class="nav-cat-link" data-category="${c}">${c.toUpperCase()}</a>`).join('');
  navCats.addEventListener('click', e => {
    e.preventDefault();
    const link = e.target.closest('.nav-cat-link');
    if (!link) return;
    navCats.querySelectorAll('.nav-cat-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const cat = link.dataset.category;
    const title = document.getElementById('shop-title');
    if (title) title.textContent = cat === 'all' ? 'TODOS LOS PRODUCTOS' : cat.toUpperCase();
    renderAllProducts(cat, document.getElementById('sort-select').value);
    document.getElementById('tienda')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function renderCategoriesGrid() {
  const grid = document.getElementById('categories-image-grid');
  if (!grid) return;
  const cats = {};
  allProducts.forEach(p => { if (p.categoria) cats[p.categoria] = (cats[p.categoria] || 0) + 1; });
  grid.innerHTML = Object.keys(cats).map(name => {
    const img = categoryImages[name] || defaultFoodImg;
    return `<div class="cat-image-card" data-category="${name}">
      <img src="${img}" alt="${name}" loading="lazy">
      <div class="cat-overlay"><span class="cat-label">${name}</span></div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.cat-image-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      const navCats = document.getElementById('nav-categories');
      if (navCats) navCats.querySelectorAll('.nav-cat-link').forEach(l => l.classList.toggle('active', l.dataset.category === cat));
      const title = document.getElementById('shop-title');
      if (title) title.textContent = cat.toUpperCase();
      renderAllProducts(cat, document.getElementById('sort-select').value);
      document.getElementById('tienda')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderAllProducts(category = 'all', sort = 'default', search = '') {
  const grid = document.getElementById('all-products');
  let filtered = [...allProducts];
  if (category !== 'all') filtered = filtered.filter(p => p.categoria === category);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
  }
  switch (sort) {
    case 'price-asc': filtered.sort((a, b) => a.precio - b.precio); break;
    case 'price-desc': filtered.sort((a, b) => b.precio - a.precio); break;
    case 'name-asc': filtered.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
    case 'name-desc': filtered.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
  }
  
  currentFiltered = filtered;
  currentlyShown = Math.min(productsPerPage, filtered.length);
  
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;"><i class="fas fa-search" style="font-size:3rem;color:var(--primary-light);opacity:.3;display:block;margin-bottom:16px"></i><p style="color:var(--text-muted);font-size:1.1rem">No se encontraron productos.</p></div>';
  } else {
    grid.innerHTML = filtered.slice(0, currentlyShown).map(p => productCard(p)).join('');
  }
  attachProductEvents(grid);
  updateLoadMoreButton();
}

function loadMoreProducts() {
  const grid = document.getElementById('all-products');
  const nextBatch = currentFiltered.slice(currentlyShown, currentlyShown + productsPerPage);
  const temp = document.createElement('div');
  temp.innerHTML = nextBatch.map(p => productCard(p)).join('');
  while (temp.firstChild) grid.appendChild(temp.firstChild);
  currentlyShown += nextBatch.length;
  attachProductEvents(grid);
  updateLoadMoreButton();
  initScrollEffects();
}

function updateLoadMoreButton() {
  const container = document.getElementById('load-more-container');
  if (!container) return;
  if (currentlyShown < currentFiltered.length) {
    container.style.display = 'block';
    document.getElementById('load-more-btn').textContent = `Cargar más (${currentFiltered.length - currentlyShown} restantes)`;
  } else {
    container.style.display = 'none';
  }
}

function initLoadMore() {
  document.getElementById('load-more-btn')?.addEventListener('click', loadMoreProducts);
}

const categoryImages = {
  'Aceites, Vinagres y Salsas': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop',
  'Avenas y Sojas': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop',
  'Bebidas': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
  'Cereales y Granolas': 'https://images.unsplash.com/photo-1517093602195-b40af9688b46?w=400&h=300&fit=crop',
  'Complementos Dietarios': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop',
  'Congelados y Refrigerados': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop',
  'Cosmetica Saludable': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop',
  'Cotillon': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop',
  'Endulzantes': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop',
  'Especias': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop',
  'Feculas y Harinas': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
  'Fideos Varios': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=300&fit=crop',
  'Frutas Deshidratadas': 'https://images.unsplash.com/photo-1596591868264-05856e155c1e?w=400&h=300&fit=crop',
  'Frutos Secos': 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400&h=300&fit=crop',
  'Galletitas': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop',
  'Galletitas sin Azucar': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop',
  'Galletitas, Cereales y Pan sin Tacc': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
  'Golosinas Saludables': 'https://images.unsplash.com/photo-1581798459219-318e76ade559?w=400&h=300&fit=crop',
  'Herboristeria': 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&h=300&fit=crop',
  'Infusiones': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop',
  'Legumbres': 'https://images.unsplash.com/photo-1515543904738-7f29a3567146?w=400&h=300&fit=crop',
  'Mermeladas y Dulces': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
  'Miel': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop',
  'Pastas (Aptas para Diabeticos)': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=300&fit=crop',
  'Pastas sin Tacc': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=300&fit=crop',
  'Pastas y Mantequillas de Mani': 'https://images.unsplash.com/photo-1612187209234-d03e7babe937?w=400&h=300&fit=crop',
  'Premezclas y Rebozadores sin Tacc': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
  'Productos Arcor': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop',
  'Productos La Francia': 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=300&fit=crop',
  'Productos Vegetarianos y Veganos': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  'Reposteria': 'https://images.unsplash.com/photo-1486427944544-d2c246c4df6c?w=400&h=300&fit=crop',
  'Sales': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&h=300&fit=crop',
  'Semillas': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&h=300&fit=crop',
  'Snacks': 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=300&fit=crop',
  'Tostadas y Grisines': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
  'Varios': 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop',
};
const defaultFoodImg = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=400&fit=crop';

function getProductImage(p) {
  if (p.imagen) return p.imagen;
  // Try to find a matching category image (case-insensitive partial match)
  const cat = p.categoria || '';
  for (const [key, url] of Object.entries(categoryImages)) {
    if (cat.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cat.toLowerCase())) return url;
  }
  return defaultFoodImg;
}

function productCard(p) {
  const img = getProductImage(p);
  const imgSrc = `<img src="${img}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`;
  
  let sizeSelector = '';
  if (p.isGrouped && p.variantes.length > 1) {
    const options = p.variantes.map(v => `<option value="${v.id}">${v.peso || 'Normal'} - $${v.precio.toLocaleString('es-AR')}</option>`).join('');
    sizeSelector = `<select class="variant-select" data-parent-id="${p.id}" style="width:100%; margin-top:10px; padding:8px; border-radius:5px; background:var(--bg); border:1px solid var(--border); color:var(--text); font-size:0.9rem;">${options}</select>`;
  } else {
    sizeSelector = `
      <div class="product-footer">
        <span class="product-price">$${p.precio.toLocaleString('es-AR')}</span>
        <span class="product-weight">${p.peso || ''}</span>
      </div>`;
  }

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-card-image">
        ${imgSrc}
        <div class="placeholder-icon" style="${p.imagen ? 'display:none' : 'display:flex'}"><i class="fas fa-seedling"></i></div>
      </div>
      <div class="product-card-body">
        <h3 class="product-name"><a href="#" class="product-link" data-id="${p.id}">${p.nombre}</a></h3>
        ${sizeSelector}
        <div class="product-category">${p.categoria}</div>
        <button class="product-add-btn" data-id="${p.id}"><i class="fas fa-cart-plus"></i> AGREGAR</button>
      </div>
    </div>`;
}

const categoryIcons = { 'Cereales y Granolas': '🥣', 'Frutos Secos': '🥜', 'Semillas': '🌻', 'Aceites': '🫒', 'Harinas': '🌾', 'Endulzantes': '🍯', 'Untables': '🥜', 'Tés e Infusiones': '🍵', 'Suplementos': '💪', 'Superfoods': '🌿', 'Snacks': '🍪', 'Bebidas': '🥛', 'Legumbres': '🫘' };

// Sort control
document.getElementById('sort-select')?.addEventListener('change', e => {
  const activeCat = document.querySelector('.nav-cat-link.active')?.dataset.category || 'all';
  renderAllProducts(activeCat, e.target.value);
});

function attachProductEvents(container) {
  container.querySelectorAll('.product-add-btn').forEach(btn => {
    btn.addEventListener('click', e => { 
      e.stopPropagation(); 
      const card = btn.closest('.product-card');
      const select = card.querySelector('.variant-select');
      const addId = select ? parseInt(select.value) : parseInt(btn.dataset.id);
      addToCart(addId); 
    });
  });
  container.querySelectorAll('.product-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); openProductDetail(parseInt(link.dataset.id)); });
  });
  container.querySelectorAll('.product-card-image').forEach(img => {
    img.addEventListener('click', e => {
      if (e.target.closest('.product-quick-add')) return;
      const id = parseInt(img.closest('.product-card').dataset.id);
      openProductDetail(id);
    });
  });
}

// ========== PRODUCT DETAIL ==========
function openProductDetail(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;
  document.getElementById('detail-image').src = getProductImage(p);
  document.getElementById('detail-image').alt = p.nombre;
  document.getElementById('detail-category').textContent = p.categoria;
  document.getElementById('detail-name').textContent = p.nombre;
  
  const variantContainer = document.getElementById('detail-variant-container');
  if (variantContainer) {
      if (p.isGrouped && p.variantes.length > 1) {
          const options = p.variantes.map(v => `<option value="${v.id}" data-price="${v.precio}" data-peso="${v.peso||''}">${v.peso || 'Normal'} - $${v.precio.toLocaleString('es-AR')}</option>`).join('');
          variantContainer.innerHTML = `<label style="display:block; margin-bottom:5px; font-weight:600;">Tamaño/Variante:</label><select id="detail-variant-select" style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; background:var(--bg); border:1px solid var(--border); color:var(--text);">${options}</select>`;
          
          document.getElementById('detail-price').textContent = '$' + p.variantes[0].precio.toLocaleString('es-AR');
          document.getElementById('detail-weight').textContent = p.variantes[0].peso || '';
          
          document.getElementById('detail-variant-select').addEventListener('change', e => {
             const selectedOpt = e.target.options[e.target.selectedIndex];
             document.getElementById('detail-price').textContent = '$' + parseFloat(selectedOpt.dataset.price).toLocaleString('es-AR');
             document.getElementById('detail-weight').textContent = selectedOpt.dataset.peso || '';
          });
      } else {
          variantContainer.innerHTML = '';
          document.getElementById('detail-price').textContent = '$' + p.precio.toLocaleString('es-AR');
          document.getElementById('detail-weight').textContent = p.peso || '';
      }
  } else {
      document.getElementById('detail-price').textContent = '$' + p.precio.toLocaleString('es-AR');
      document.getElementById('detail-weight').textContent = p.peso || '';
  }
  
  document.getElementById('detail-desc').textContent = p.descripcion;
  document.getElementById('detail-brand').textContent = p.marca;
  document.getElementById('detail-stock').textContent = p.stock;
  document.getElementById('detail-qty').value = 1;
  
  // Render Related Products
  const relatedContainer = document.getElementById('related-products-container');
  const relatedGrid = document.getElementById('related-products-grid');
  if (relatedContainer && relatedGrid) {
      const related = allProducts.filter(x => x.categoria === p.categoria && x.id !== p.id).slice(0, 4);
      if (related.length > 0) {
          relatedGrid.innerHTML = related.map(r => productCard(r)).join('');
          attachProductEvents(relatedGrid);
          relatedContainer.style.display = 'block';
      } else {
          relatedContainer.style.display = 'none';
      }
  }

  document.getElementById('product-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.getElementById('modal-close')?.addEventListener('click', closeProductModal);
document.getElementById('product-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeProductModal(); });
function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('detail-qty-minus')?.addEventListener('click', () => {
  const inp = document.getElementById('detail-qty');
  inp.value = Math.max(1, parseInt(inp.value) - 1);
});
document.getElementById('detail-qty-plus')?.addEventListener('click', () => {
  const inp = document.getElementById('detail-qty');
  inp.value = Math.min(99, parseInt(inp.value) + 1);
});
document.getElementById('detail-add-cart')?.addEventListener('click', () => {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById('detail-qty').value) || 1;
  const variantSelect = document.getElementById('detail-variant-select');
  const addId = variantSelect ? parseInt(variantSelect.value) : currentProduct.id;
  
  addToCart(addId, qty);
  closeProductModal();
});

// ========== CART ==========
function initCart() {
  document.getElementById('cart-toggle').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('cart-explore')?.addEventListener('click', () => { closeCart(); });
  document.getElementById('checkout-btn')?.addEventListener('click', openCheckout);
}

function openCart() {
  document.getElementById('cart-sidebar').classList.add('active');
  document.getElementById('cart-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('active');
  document.getElementById('cart-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function addToCart(id, qty = 1) {
  const p = originalProductsMap.get(id);
  if (!p) return;
  const existing = cart.find(x => x.id === id);
  if (existing) existing.cantidad += qty;
  else cart.push({ id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen, peso: p.peso, cantidad: qty });
  saveCart();
  updateCartUI();
  
  // Visual feedback: animate cart icon
  const cartIcon = document.getElementById('cart-toggle');
  if (cartIcon) {
    cartIcon.classList.add('bump');
    setTimeout(() => cartIcon.classList.remove('bump'), 300);
  }
  
  showToast(`¡${p.nombre} agregado!`, 'success');
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  updateCartUI();
}

function clearCart() {
  if (confirm('¿Estás seguro de que querés vaciar tu carrito?')) {
    cart = [];
    saveCart();
    updateCartUI();
    showToast('Carrito vaciado', 'success');
  }
}

function updateQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) return removeFromCart(id);
  saveCart();
  updateCartUI();
}

function saveCart() { localStorage.setItem('vv_cart', JSON.stringify(cart)); }

function getCartTotal() { return cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0); }
function getCartCount() { return cart.reduce((sum, i) => sum + i.cantidad, 0); }

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();
  document.getElementById('cart-count').textContent = count;
  const itemsEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');
  if (cart.length === 0) {
    itemsEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    footerEl.style.display = 'none';
  } else {
    itemsEl.style.display = 'block';
    emptyEl.style.display = 'none';
    footerEl.style.display = 'block';
    itemsEl.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${i.imagen ? `<img src="${i.imagen}" alt="${i.nombre}" onerror="this.style.display='none'">` : '<i class="fas fa-seedling" style="color:var(--primary-light)"></i>'}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${i.nombre}</div>
          <div class="cart-item-price">$${i.precio.toLocaleString('es-AR')}</div>
          <div class="cart-item-qty">
            <button onclick="updateQty(${i.id},-1)"><i class="fas fa-minus"></i></button>
            <span>${i.cantidad}</span>
            <button onclick="updateQty(${i.id},1)"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${i.id})"><i class="fas fa-trash"></i></button>
      </div>`).join('');
    document.getElementById('cart-subtotal').textContent = '$' + total.toLocaleString('es-AR');
    const shipping = total >= 15000 ? 0 : 2500;
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Gratis' : '$' + shipping.toLocaleString('es-AR');
    document.getElementById('cart-total').textContent = '$' + (total + shipping).toLocaleString('es-AR');
  }
}

// ========== CHECKOUT ==========
let lastOrderData = null;

function initCheckout() {
  document.getElementById('checkout-close')?.addEventListener('click', closeCheckout);
  document.getElementById('checkout-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeCheckout(); });
  document.getElementById('clear-cart-btn')?.addEventListener('click', clearCart);
  document.getElementById('checkout-next-1')?.addEventListener('click', () => goToStep(2));
  document.getElementById('checkout-next-2')?.addEventListener('click', () => goToStep(3));
  document.getElementById('checkout-prev-2')?.addEventListener('click', () => goToStep(1));
  document.getElementById('checkout-prev-3')?.addEventListener('click', () => goToStep(2));
  document.getElementById('place-order-btn')?.addEventListener('click', placeOrder);
  document.getElementById('success-close')?.addEventListener('click', () => { closeCheckout(); location.reload(); });
  document.getElementById('whatsapp-order-btn')?.addEventListener('click', sendOrderToWhatsApp);
}

function openCheckout() {
  if (cart.length === 0) return;
  closeCart();
  goToStep(1);
  updateCheckoutSummary();
  document.getElementById('checkout-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function goToStep(n) {
  // Validate
  if (n === 2) {
    const nombre = document.getElementById('ch-nombre').value.trim();
    const email = document.getElementById('ch-email').value.trim();
    const tel = document.getElementById('ch-telefono').value.trim();
    if (!nombre || !email || !tel) return showToast('Completá todos los campos obligatorios', 'error');
  }
  if (n === 3) {
    const dir = document.getElementById('ch-direccion').value.trim();
    const ciudad = document.getElementById('ch-ciudad').value.trim();
    const cp = document.getElementById('ch-cp').value.trim();
    if (!dir || !ciudad || !cp) return showToast('Completá la dirección de envío', 'error');
    updateCheckoutSummary();
  }
  document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.checkout-step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.toggle('active', sn === n);
    s.classList.toggle('done', sn < n);
  });
  document.getElementById('checkout-step-' + n)?.classList.add('active');
}

function updateCheckoutSummary() {
  const total = getCartTotal();
  const shipping = total >= 15000 ? 0 : 2500;
  document.getElementById('checkout-items').innerHTML = cart.map(i => `
    <div class="order-item"><span>${i.nombre} x${i.cantidad}</span><span>$${(i.precio * i.cantidad).toLocaleString('es-AR')}</span></div>`).join('');
  document.getElementById('checkout-subtotal').textContent = '$' + total.toLocaleString('es-AR');
  document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'Gratis' : '$' + shipping.toLocaleString('es-AR');
  document.getElementById('checkout-total').textContent = '$' + (total + shipping).toLocaleString('es-AR');
}

async function placeOrder() {
  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  const total = getCartTotal();
  const shipping = total >= 15000 ? 0 : 2500;
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'transferencia';
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: { nombre: document.getElementById('ch-nombre').value, email: document.getElementById('ch-email').value, telefono: document.getElementById('ch-telefono').value },
        items: cart, total: total + shipping, metodoPago: payment,
        direccion: `${document.getElementById('ch-direccion').value}, ${document.getElementById('ch-ciudad').value}, CP ${document.getElementById('ch-cp').value}`,
        notas: document.getElementById('ch-notas').value
      })
    });
    const data = await res.json();
    if (res.ok) {
      lastOrderData = { ...data.order, rawItems: cart };
      cart = [];
      saveCart();
      updateCartUI();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        document.getElementById('order-id-display').textContent = '#' + data.order.id;
        document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('checkout-success').style.display = 'block';
      }
    } else {
      showToast(data.error || 'Error al crear pedido', 'error');
    }
  } catch (e) {
    showToast('Error de conexión', 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-check"></i> Confirmar Pedido';
}

function sendOrderToWhatsApp() {
  if (!lastOrderData) return;
  const phone = '5492284638849';
  let msg = `*¡Hola! Acabo de hacer un pedido en la web.*%0A%0A`;
  msg += `*Pedido:* #${lastOrderData.id}%0A`;
  msg += `*Nombre:* ${lastOrderData.cliente.nombre}%0A`;
  if (lastOrderData.cliente.direccion) msg += `*Dirección:* ${lastOrderData.cliente.direccion}%0A`;
  msg += `*Pago:* ${lastOrderData.metodoPago.toUpperCase()}%0A%0A`;
  msg += `*PRODUCTOS:*%0A`;
  lastOrderData.rawItems.forEach(i => {
    msg += `- ${i.cantidad}x ${i.nombre} ($${(i.precio * i.cantidad).toLocaleString('es-AR')})%0A`;
  });
  msg += `%0A*TOTAL: $${lastOrderData.total.toLocaleString('es-AR')}*`;
  
  if (lastOrderData.notas) {
     msg += `%0A%0A*Notas:* ${lastOrderData.notas}`;
  }

  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

// ========== NAVBAR ==========
function initNavbar() {
  document.getElementById('scroll-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    document.getElementById('scroll-top')?.classList.toggle('visible', window.scrollY > 500);
  });
}

// ========== SEARCH ==========
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = input.value.trim();
      const title = document.getElementById('shop-title');
      if (q.length >= 2) {
        document.querySelectorAll('.nav-cat-link').forEach(l => l.classList.toggle('active', l.dataset.category === 'all'));
        if (title) title.textContent = `RESULTADOS: "${q.toUpperCase()}"`;
        renderAllProducts('all', 'default', q);
      } else if (q.length === 0) {
        if (title) title.textContent = 'TODOS LOS PRODUCTOS';
        renderAllProducts();
      }
    }, 300);
  });
}

// ========== SCROLL EFFECTS ==========
function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.product-card').forEach(el => {
    el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = 'opacity .4s ease, transform .4s ease';
    observer.observe(el);
  });
}

// ========== TOAST ==========
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}
