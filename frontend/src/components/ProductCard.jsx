import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingCart } from 'lucide-react';

const categoryImages = {
  'frutos': 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=500&auto=format&fit=crop&q=80',
  'harina': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  'fecula': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  'fécula': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  'reposteria': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
  'repostería': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
  'cotillon': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
  'cotillón': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
  'herbor': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80',
  'infusion': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80',
  'infusión': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80',
  'aceite': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
  'vinagre': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
  'salsa': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
  'suplemento': 'https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=500&auto=format&fit=crop&q=80',
  'complemento': 'https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=500&auto=format&fit=crop&q=80',
  'bebida': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  'jugo': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  'snack': 'https://images.unsplash.com/photo-1558961309-db62e737d992?w=500&auto=format&fit=crop&q=80',
  'galleta': 'https://images.unsplash.com/photo-1558961309-db62e737d992?w=500&auto=format&fit=crop&q=80'
};

const defaultFoodImg = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=500&auto=format&fit=crop&q=80';

export default function ProductCard({ product, onOpenDetails, index = 0 }) {
  const { addToCart } = useStore();
  const [selectedWeight, setSelectedWeight] = useState('');
  const [displayPrice, setDisplayPrice] = useState(product.precio);
  const [pricePop, setPricePop] = useState(false);
  
  // Decide what image to show using category fuzzy matching
  const getProductImage = () => {
    if (product.imagen && product.imagen.startsWith('http')) return product.imagen;
    const catLower = (product.categoria || '').toLowerCase();
    const matchKey = Object.keys(categoryImages).find(k => catLower.includes(k));
    return matchKey ? categoryImages[matchKey] : defaultFoodImg;
  };

  // Determine selector type
  const isBulk = product.unidad?.toLowerCase()?.includes('g') || 
                 product.unidad?.toLowerCase()?.includes('kilo') || 
                 product.unidad?.toLowerCase()?.includes('kg');

  const getWeightOptions = () => {
    if (product.isGrouped) {
      return product.variantes.map(v => ({
        id: v.id,
        label: v.peso || 'Normal',
        price: v.precio,
        type: 'variant'
      }));
    } else if (isBulk) {
      const baseWeightInGrams = product.unidad?.toLowerCase()?.includes('kilo') || product.unidad?.toLowerCase()?.includes('kg') ? 1000 : 100;
      return [
        { label: '100g', factor: 100 / baseWeightInGrams, type: 'math' },
        { label: '250g', factor: 250 / baseWeightInGrams, type: 'math' },
        { label: '500g', factor: 500 / baseWeightInGrams, type: 'math' },
        { label: '1kg', factor: 1000 / baseWeightInGrams, type: 'math' },
      ];
    } else {
      return [
        { label: '1 Unidad', factor: 1, type: 'math' },
        { label: '2 Unidades', factor: 2, type: 'math' },
        { label: '3 Unidades', factor: 3, type: 'math' },
      ];
    }
  };

  const options = getWeightOptions();

  // Initialize selected weight option
  useEffect(() => {
    if (options.length > 0) {
      if (product.isGrouped) {
        setSelectedWeight(options[0].id);
        setDisplayPrice(options[0].price);
      } else {
        setSelectedWeight(options[0].label);
        setDisplayPrice(product.precio * options[0].factor);
      }
    }
  }, [product]);

  // Trigger price pop animation on price change
  useEffect(() => {
    setPricePop(true);
    const timer = setTimeout(() => setPricePop(false), 250);
    return () => clearTimeout(timer);
  }, [displayPrice]);

  // Recalculate price when selection changes
  const handleWeightChange = (e) => {
    const val = e.target.value;
    setSelectedWeight(val);
    
    if (product.isGrouped) {
      const match = options.find(o => o.id === val);
      if (match) setDisplayPrice(match.price);
    } else {
      const match = options.find(o => o.label === val);
      if (match) setDisplayPrice(product.precio * match.factor);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (product.isGrouped) {
      const targetVar = product.variantes.find(v => v.id === selectedWeight) || product.variantes[0];
      addToCart(targetVar, 1);
    } else {
      const adjustedItem = {
        ...product,
        nombre: `${product.nombre} (${selectedWeight})`,
        precio: displayPrice,
        peso: selectedWeight
      };
      addToCart(adjustedItem, 1);
    }
  };

  // Stagger loading delay calculations
  const staggerDelay = `${(index % 12) * 50}ms`;

  // Stock check - disable card when out of stock
  const productStock = product.stock !== undefined ? product.stock : 50;
  const isOutOfStock = productStock <= 0;

  return (
    <div 
      onClick={() => onOpenDetails(product)}
      style={{ animationDelay: staggerDelay }}
      className="group bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(132,204,22,0.12)] hover:-translate-y-1.5 border border-dark-100/30 p-4.5 transition-all duration-300 flex flex-col justify-between cursor-pointer animate-fade-in-up"
    >
      {/* Product Image Area */}
      <div className="product-image-container aspect-square w-full rounded-2xl mb-4 bg-white relative">
        <img
          src={getProductImage()}
          alt={product.nombre}
          loading="lazy"
          className={`product-image w-full h-full object-cover rounded-2xl ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
        />

        {/* Labels Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isOutOfStock && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-red-500 text-white border-red-600">
              Sin Stock
            </span>
          )}
          {product.etiquetas?.map((tag) => {
            let colorClass = 'bg-white text-dark-800 border-dark-200';
            if (tag === 'Sin TACC') colorClass = 'bg-yellow-50 text-yellow-800 border-yellow-200';
            if (tag === 'Vegano') colorClass = 'bg-green-50 text-green-800 border-green-200';
            if (tag === 'Orgánico') colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
            if (tag === 'Oferta') colorClass = 'bg-red-50 text-red-800 border-red-200';
            
            return (
              <span 
                key={tag} 
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${colorClass}`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          {/* Price - bold black with popping container */}
          <div className="py-2 flex items-center">
            <span 
              className={`text-xl font-black text-black tracking-tight block ${pricePop ? 'animate-price-pop' : ''}`}
            >
              ${(displayPrice || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-outfit text-sm font-semibold text-dark-800 tracking-tight leading-snug line-clamp-2 group-hover:text-lime-700 transition-colors mb-1.5">
            {product.nombre}
          </h3>

          <span className="text-[10px] text-dark-400 capitalize block mb-3 font-medium">
            {product.categoria}
          </span>
        </div>

        {/* Weight Selector & Cart Button */}
        <div className="mt-auto">
          <div className="mb-3.5" onClick={e => e.stopPropagation()}>
            <select
              value={selectedWeight}
              onChange={handleWeightChange}
              className="w-full px-3 py-2 bg-dark-50/80 border border-dark-200/60 rounded-xl text-xs text-dark-700 outline-none focus:border-lime-500 font-bold cursor-pointer hover:bg-dark-50 transition-colors"
            >
              {options.map((opt) => (
                <option key={opt.id || opt.label} value={opt.id || opt.label}>
                  {opt.label} {opt.price ? `($${opt.price.toLocaleString('es-AR')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Buy Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-3 rounded-xl text-xs font-bold tracking-wider transition-all duration-350 flex items-center justify-center gap-2 shadow-md ${
              isOutOfStock
                ? 'bg-dark-200 text-dark-400 cursor-not-allowed'
                : 'bg-lime-500 hover:bg-lime-600 active:scale-95 text-white hover:scale-[1.02]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'AGOTADO' : 'AGREGAR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
