import React from 'react';
import { X, ShoppingCart, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

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

export default function ProductDetailModal({ product, onClose, onOpenProduct }) {
  const { products, addToCart } = useStore();

  if (!product) return null;

  const getProductImage = (item) => {
    if (item.imagen && item.imagen.startsWith('http')) return item.imagen;
    const catLower = (item.categoria || '').toLowerCase();
    const matchKey = Object.keys(categoryImages).find(k => catLower.includes(k));
    return matchKey ? categoryImages[matchKey] : defaultFoodImg;
  };

  // Find related products in the same category
  const relatedProducts = products
    .filter(p => p.categoria === product.categoria && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-dark-900/50 blur-backdrop transition-opacity" 
      />

      {/* Modal Box */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-soft-lg flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] z-10 border border-dark-100/50 animate-in fade-in zoom-in-95 duration-250">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-dark-50 hover:scale-105 text-dark-500 hover:text-dark-800 transition-all duration-200 z-20 shadow-md border border-dark-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Image & Badges */}
        <div className="md:w-1/2 bg-white flex items-center justify-center p-6 border-r border-dark-100/50">
          <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden">
            <img 
              src={getProductImage(product)} 
              alt={product.nombre}
              loading="lazy"
              className="w-full h-full object-cover rounded-2xl shadow-soft"
            />
            
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.etiquetas?.map(tag => (
                <span 
                  key={tag}
                  className="px-3 py-1 bg-white border border-dark-200 text-dark-800 text-[10px] font-bold uppercase rounded-full shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-[85vh]">
          <div>
            <span className="text-xs font-bold text-lime-700 tracking-wider uppercase block mb-1">
              {product.categoria}
            </span>
            <h2 className="font-outfit text-2xl font-extrabold text-dark-900 tracking-tight leading-snug mb-3">
              {product.nombre}
            </h2>
            
            {/* Price - bold black */}
            <div className="py-2 text-2xl font-black text-black tracking-tight mb-3">
              ${(product.precio || 0).toLocaleString('es-AR')}
              <span className="text-xs text-dark-500 font-light ml-1.5">
                / {product.peso || 'Unidad'}
              </span>
            </div>

            <p className="text-xs text-dark-500 leading-relaxed font-light mb-6">
              {product.descripcion || 'Producto 100% natural, ideal para mantener un estilo de vida saludable y equilibrado.'}
            </p>

            {/* Simulated Nutrition Table */}
            <div className="border border-dark-100 rounded-2xl p-4 bg-dark-50/50 mb-6">
              <h4 className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-3">
                Información Nutricional (Porción Estimada)
              </h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div className="flex justify-between border-b border-dark-100/50 pb-1">
                  <span className="text-dark-500 font-light">Valor Energético</span>
                  <span className="font-bold text-dark-800">140 kcal</span>
                </div>
                <div className="flex justify-between border-b border-dark-100/50 pb-1">
                  <span className="text-dark-500 font-light">Carbohidratos</span>
                  <span className="font-bold text-dark-800">18 g</span>
                </div>
                <div className="flex justify-between border-b border-dark-100/50 pb-1">
                  <span className="text-dark-500 font-light">Proteínas</span>
                  <span className="font-bold text-dark-800">4.5 g</span>
                </div>
                <div className="flex justify-between border-b border-dark-100/50 pb-1">
                  <span className="text-dark-500 font-light">Grasas Totales</span>
                  <span className="font-bold text-dark-800">5.2 g</span>
                </div>
                <div className="flex justify-between border-b border-dark-100/50 pb-1">
                  <span className="text-dark-500 font-light">Fibra Alimentaria</span>
                  <span className="font-bold text-dark-800">2.1 g</span>
                </div>
                <div className="flex justify-between border-b border-dark-100/50 pb-1">
                  <span className="text-dark-500 font-light">Sodio</span>
                  <span className="font-bold text-dark-800">12 mg</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-dark-400 font-light">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-600" />
                <span>Libre de aditivos artificiales</span>
              </div>
            </div>
            
            {/* Action Bar */}
            <button
              onClick={handleAddToCart}
              disabled={(product.stock !== undefined ? product.stock : 50) <= 0}
              className={`w-full py-4 font-bold text-sm rounded-2xl transition-all duration-350 shadow-md flex items-center justify-center gap-2 mb-8 ${
                (product.stock !== undefined ? product.stock : 50) <= 0
                  ? 'bg-dark-200 text-dark-400 cursor-not-allowed'
                  : 'bg-lime-500 hover:bg-lime-600 hover:scale-[1.02] active:scale-95 text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{(product.stock !== undefined ? product.stock : 50) <= 0 ? 'SIN STOCK' : 'AÑADIR AL CARRITO'}</span>
            </button>
          </div>

          {/* Cross-Selling Carousel */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-dark-100 pt-6">
              <h4 className="text-xs font-bold text-dark-800 tracking-tight mb-4">
                También te puede gustar...
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {relatedProducts.map(rp => (
                  <div
                    key={rp.id}
                    onClick={() => onOpenProduct(rp)}
                    className="flex gap-2 items-center p-2 rounded-xl hover:bg-dark-50 border border-transparent hover:border-dark-100/60 transition-all cursor-pointer"
                  >
                    <img 
                      src={getProductImage(rp)} 
                      alt={rp.nombre}
                      loading="lazy"
                      className="w-12 h-12 rounded-lg object-cover shadow-sm bg-white"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-dark-800 truncate leading-tight">
                        {rp.nombre}
                      </p>
                      <p className="text-[10px] text-lime-700 font-extrabold mt-0.5">
                        ${(rp.precio || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
