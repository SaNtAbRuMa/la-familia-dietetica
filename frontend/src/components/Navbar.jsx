import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Search, MapPin, MessageSquare } from 'lucide-react';

export default function Navbar({ onCartOpen }) {
  const { 
    rawProducts, 
    searchQuery, 
    setSearchQuery, 
    activeCategory, 
    setActiveCategory, 
    getCartCount 
  } = useStore();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Extract unique categories
  const categories = ['all', ...new Set(rawProducts.map(p => p.categoria).filter(Boolean))];

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    setDropdownOpen(false);
  };

  const scrollToFooter = (e) => {
    e.preventDefault();
    const footer = document.getElementById('sucursales-footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-dark-100/50 shadow-soft transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-6">
            <a 
              href="/" 
              className="flex items-center gap-3.5 group" 
              onClick={(e) => { e.preventDefault(); window.location.pathname = '/'; }}
            >
              {/* Logo Image */}
              <div className="w-12 h-12 rounded-full border border-lime-500/80 flex items-center justify-center bg-white shadow-soft relative overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <img 
                  src="https://i.postimg.cc/jjNHZLSW/logo-dietetica.jpg" 
                  alt="La Familia Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-outfit text-lg font-black tracking-tighter text-dark-900 leading-tight transition-colors group-hover:text-lime-700">
                  LA FAMILIA
                </span>
                <span className="text-[9px] uppercase tracking-widest text-lime-600 font-bold leading-none">
                  Almacén Natural
                </span>
              </div>
            </a>
          </div>

          {/* Search bar & Category select */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8 relative">
            <div className="relative w-full flex items-center bg-dark-50/70 border border-dark-200/80 rounded-full focus-within:border-lime-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-lime-100/40 transition-all duration-300">
              <Search className="w-5 h-5 text-dark-400 ml-4 absolute pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar repostería, cotillón, frutos secos, harinas..."
                className="w-full pl-12 pr-4 py-2.5 bg-transparent rounded-full text-sm text-dark-800 outline-none placeholder:text-dark-400 font-light"
              />
            </div>

            {/* Category Dropdown inside search */}
            <div className="relative ml-2">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-4 py-2.5 bg-white border border-dark-200 rounded-full text-xs font-bold text-dark-700 hover:bg-dark-50 hover:border-dark-300 flex items-center gap-1.5 shadow-sm transition-all duration-200"
              >
                <span>Categorías</span>
                <i className={`fa-solid fa-chevron-down transition-transform duration-200 text-[10px] ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-dark-100 rounded-2xl shadow-premium py-1 max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-dark-50 capitalize ${
                        activeCategory === cat ? 'font-bold text-lime-700 bg-lime-50' : 'text-dark-700 font-medium'
                      }`}
                    >
                      {cat === 'all' ? 'Ver Todo' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Sucursales, WhatsApp contact, Cart) */}
          <div className="flex items-center gap-3">
            {/* Sucursales anchor */}
            <button
              onClick={scrollToFooter}
              className="flex items-center gap-1.5 px-4.5 py-2 border border-dark-200 hover:bg-dark-50 hover:border-dark-300 text-dark-600 rounded-full text-xs font-bold transition-all duration-200 shadow-sm"
              title="Ver Sucursales"
            >
              <MapPin className="w-4 h-4 text-lime-600" />
              <span className="hidden sm:inline">Sucursales</span>
            </button>

            {/* WhatsApp direct contact */}
            <a
              href="https://wa.me/542284322581"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4.5 py-2 bg-lime-50 hover:bg-lime-100 hover:scale-[1.02] text-lime-800 rounded-full text-xs font-bold border border-lime-200 transition-all duration-200 shadow-sm"
              title="Contacto Directo por WhatsApp"
            >
              <MessageSquare className="w-4 h-4 text-lime-600 animate-pulse" />
              <span className="hidden sm:inline">2284-322581</span>
            </a>

            {/* Cart Button */}
            <button
              onClick={onCartOpen}
              className="relative p-3 rounded-full hover:bg-dark-50 hover:scale-105 transition-all duration-200 border border-dark-200 text-dark-800 shadow-sm"
              aria-label="Carrito de compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-lime-500 text-white text-[10px] font-bold w-5.5 h-5.5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search bar */}
        <div className="md:hidden pb-4">
          <div className="relative w-full flex items-center bg-dark-50/70 border border-dark-200 rounded-full">
            <Search className="w-4 h-4 text-dark-400 ml-4 absolute pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar repostería, cotillón, frutos secos..."
              className="w-full pl-10 pr-4 py-2 bg-transparent rounded-full text-xs text-dark-800 outline-none"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
