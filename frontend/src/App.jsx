import React, { useState, useMemo } from 'react';
import { useStore, StoreProvider } from './context/StoreContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Benefits from './components/Benefits';
import Categories from './components/Categories';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import { ArrowUpDown, MapPin, Clock, MessageSquare, AlertTriangle } from 'lucide-react';

// Fuzzy / Typo-tolerant Matching Helper
const getEditDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1      // insertion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const fuzzyMatch = (text, query) => {
  text = (text || '').toLowerCase().trim();
  query = (query || '').toLowerCase().trim();
  if (!query) return true;
  if (text.includes(query)) return true;

  // subsequence check
  let qIdx = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === query[qIdx]) {
      qIdx++;
    }
    if (qIdx === query.length) return true;
  }

  // word check with 1-character typo tolerance
  const words = text.split(/\s+/);
  const queryWords = query.split(/\s+/);
  return queryWords.every(qw => {
    if (qw.length <= 3) {
      return words.some(w => w.includes(qw));
    }
    return words.some(w => {
      if (w.includes(qw)) return true;
      return getEditDistance(w, qw) <= 1;
    });
  });
};

function Storefront() {
  const {
    products,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy
  } = useStore();

  const [isAdmin] = useState(() => window.location.pathname.startsWith('/admin'));
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Public Catalog Pagination
  const [visibleCount, setVisibleCount] = useState(16);

  // Filter & Sort Products
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (activeCategory !== 'all') {
      result = result.filter(p => p.categoria === activeCategory);
    }

    // Filter by Search Query (Typo-Tolerant)
    if (searchQuery.trim() !== '') {
      result = result.filter(p => 
        fuzzyMatch(p.nombre, searchQuery) || 
        fuzzyMatch(p.categoria, searchQuery)
      );
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.precio - b.precio);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.precio - a.precio);
    } else if (sortBy === 'alpha-asc') {
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  const displayedProducts = processedProducts.slice(0, visibleCount);
  const hasMore = processedProducts.length > visibleCount;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between">
      
      {/* Navigation */}
      <Navbar onCartOpen={() => setCartOpen(true)} />

      {/* Main Area */}
      <main className="flex-grow">
        {isAdmin ? (
          /* Private Admin Panel */
          <AdminPanel />
        ) : (
          /* Public Store */
          <>
            <Hero />
            <Benefits />
            <Categories />

            {/* Catalog Section with layered soft-gray background */}
            <section id="catalogo" className="py-16 bg-[#F3F4F6]/50 scroll-mt-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Catalog Filters Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-dark-100/50 pb-8 mb-10">
                  <div>
                    <h2 className="font-outfit text-2xl font-bold tracking-tight text-dark-900 flex items-center gap-2">
                      <span>Nuestro Catálogo</span>
                      {activeCategory !== 'all' && (
                        <span className="px-3 py-1 bg-lime-50 border border-lime-100 text-lime-800 text-xs font-semibold rounded-full capitalize">
                          {activeCategory}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-dark-400 font-light mt-1">
                      {processedProducts.length} productos disponibles.
                    </p>
                  </div>

                  {/* Ordering Controls */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 text-xs text-dark-500 font-medium">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Ordenar por:</span>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 bg-white border border-dark-200 rounded-xl text-xs text-dark-700 outline-none focus:border-lime-500 font-medium"
                    >
                      <option value="default">Recomendados</option>
                      <option value="price-asc">Menor Precio</option>
                      <option value="price-desc">Mayor Precio</option>
                      <option value="alpha-asc">Nombre A-Z</option>
                    </select>
                  </div>
                </div>

                {/* Error Banner */}
                {error && !loading && (
                  <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 animate-fade-in-up">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">{error}</p>
                  </div>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="text-center py-20">
                    <div className="w-10 h-10 border-4 border-lime-200 border-t-lime-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xs text-dark-400 font-light">Sincronizando catálogo en tiempo real...</p>
                  </div>
                ) : processedProducts.length === 0 ? (
                  <div className="text-center py-20 border border-dark-100 rounded-3xl bg-dark-50/20 max-w-xl mx-auto">
                    <p className="font-outfit font-bold text-dark-800 text-sm">No encontramos resultados para tu búsqueda</p>
                    <p className="text-xs text-dark-400 font-light mt-1 mb-6">Intentá buscando con otras palabras o limpiá los filtros actuales.</p>
                    <button
                      onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                      className="px-6 py-2.5 bg-lime-500 text-white rounded-full text-xs font-bold tracking-wider hover:bg-lime-600 transition-colors"
                    >
                      VER TODO EL CATÁLOGO
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {displayedProducts.map((product, index) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onOpenDetails={setSelectedProduct}
                          index={index}
                        />
                      ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center mt-12">
                        <button
                          onClick={() => setVisibleCount(v => v + 12)}
                          className="px-8 py-3.5 border border-dark-200 bg-white text-dark-700 hover:bg-dark-50 hover:border-dark-300 text-xs font-bold tracking-wider rounded-xl transition-all duration-300 shadow-sm"
                        >
                          CARGAR MÁS PRODUCTOS
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>
            </section>
          </>
        )}
      </main>

      {/* Premium 3-Column Footer - Organic Crema Background */}
      <footer id="sucursales-footer" className="bg-[#FAF7F2] border-t border-lime-100/30 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-dark-250/10 pb-12">
            
            {/* Column 1: Logo & Motto */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-lime-500/80 flex items-center justify-center bg-white shadow-soft overflow-hidden flex-shrink-0">
                  <img 
                    src="https://i.postimg.cc/jjNHZLSW/logo-dietetica.jpg" 
                    alt="La Familia Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-outfit text-base font-black tracking-tight text-dark-900 leading-tight">
                    LA FAMILIA
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-lime-600 font-bold leading-none">
                    Almacén Natural
                  </span>
                </div>
              </div>
              <p className="text-xs text-dark-500 leading-relaxed font-light">
                Tu punto de encuentro familiar para una vida más saludable. 
                Especialistas en alimentos naturales, frutos secos, herboristería,
                repostería y cotillón completo para tus eventos. <strong>Horario corrido!</strong>
              </p>
            </div>

            {/* Column 2: Olavarría Locations */}
            <div className="space-y-4">
              <h3 className="font-outfit text-xs font-bold uppercase tracking-wider text-dark-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-lime-600" />
                <span>Ubicaciones en Olavarría 📍</span>
              </h3>
              <ul className="space-y-3 text-xs">
                <li>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Urquiza+1315,+Olavarria,+Buenos+Aires"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block text-dark-600 hover:text-lime-700 transition-colors font-medium"
                  >
                    🏢 <span className="underline group-hover:no-underline">Urquiza 1315</span>
                    <span className="block text-[10px] text-dark-400 font-light mt-0.5">Sucursal Centro Olavarría</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Rivadavia+2581,+Olavarria,+Buenos+Aires"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block text-dark-600 hover:text-lime-700 transition-colors font-medium"
                  >
                    🏢 <span className="underline group-hover:no-underline">Rivadavia 2581</span>
                    <span className="block text-[10px] text-dark-400 font-light mt-0.5">Sucursal Sur Olavarría</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Hours */}
            <div className="space-y-4">
              <h3 className="font-outfit text-xs font-bold uppercase tracking-wider text-dark-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-lime-600" />
                <span>Atención y Horarios</span>
              </h3>
              <ul className="space-y-3 text-xs text-dark-600">
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-lime-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block">Lunes a Sábados:</span>
                    <span className="font-light text-dark-500">08:00 a 20:00 (Horario Corrido)</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-lime-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block">Atención WhatsApp Central:</span>
                    <a 
                      href="https://wa.me/542284322581"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lime-700 font-bold hover:underline"
                    >
                      2284-322581
                    </a>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="text-center pt-8 text-[10px] text-dark-400 font-light space-y-1">
            <p>© 2026 LA FAMILIA. Todos los derechos reservados.</p>
            <p className="text-dark-300">Desarrollado y optimizado para ventas de alta conversión en Olavarría, Bs. As.</p>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-outs */}
      <CartDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)}
        onCheckoutOpen={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />

      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)}
        onOpenProduct={(item) => setSelectedProduct(item)}
      />

      <CheckoutModal 
        isOpen={checkoutOpen} 
        onClose={() => setCheckoutOpen(false)}
        onOrderComplete={() => alert('¡Pedido registrado! Se abrirá WhatsApp para completar el envío.')}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Storefront />
    </StoreProvider>
  );
}
