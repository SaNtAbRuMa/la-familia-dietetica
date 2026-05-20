import React from 'react';
import { X, Plus, Minus, Trash2, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const categoryImages = {
  'frutos': 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=200&h=200&fit=crop',
  'harina': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
  'fecula': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
  'fécula': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
  'reposteria': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop',
  'repostería': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop',
  'cotillon': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&h=200&fit=crop',
  'cotillón': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&h=200&fit=crop',
  'herbor': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=200&h=200&fit=crop',
  'infusion': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=200&h=200&fit=crop',
  'infusión': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=200&h=200&fit=crop',
  'aceite': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop',
  'vinagre': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop',
  'salsa': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop',
  'suplemento': 'https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=200&h=200&fit=crop',
  'complemento': 'https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=200&h=200&fit=crop',
  'bebida': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop',
  'jugo': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop',
  'snack': 'https://images.unsplash.com/photo-1558961309-db62e737d992?w=200&h=200&fit=crop',
  'galleta': 'https://images.unsplash.com/photo-1558961309-db62e737d992?w=200&h=200&fit=crop'
};

const defaultFoodImg = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=200&h=200&fit=crop';

export default function CartDrawer({ isOpen, onClose, onCheckoutOpen }) {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    getCartTotal,
    postalCode,
    setPostalCode,
    shippingCost
  } = useStore();

  const getProductImage = (item) => {
    if (item.imagen && item.imagen.startsWith('http')) return item.imagen;
    const catLower = (item.categoria || '').toLowerCase();
    const matchKey = Object.keys(categoryImages).find(k => catLower.includes(k));
    return matchKey ? categoryImages[matchKey] : defaultFoodImg;
  };

  const subtotal = getCartTotal();
  const freeShippingThreshold = 20000;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  
  const finalTotal = subtotal + (shippingCost || 0);

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-dark-900/40 blur-backdrop transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Drawer Panel */}
        <div className={`w-screen max-w-md bg-white shadow-soft-lg flex flex-col justify-between border-l border-dark-100/50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-dark-100 flex items-center justify-between bg-white">
            <h2 className="font-outfit text-lg font-bold text-dark-900">Tu Carrito</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-dark-50 text-dark-400 hover:text-dark-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-dark-50 text-dark-400 rounded-full flex items-center justify-center mb-4">
                  <i className="fa-solid fa-basket-shopping text-2xl" />
                </div>
                <h3 className="font-outfit font-bold text-dark-800 text-sm">Tu carrito está vacío</h3>
                <p className="text-xs text-dark-400 font-light mt-1 max-w-xs">
                  Explorá nuestro catálogo de alimentos saludables, repostería y cotillón para empezar a agregar.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-lime-500 text-white rounded-full text-xs font-bold tracking-wider hover:bg-lime-600 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                >
                  VOLVER A LA TIENDA
                </button>
              </div>
            ) : (
              <>
                {/* Free Shipping Progress Indicator */}
                <div className="bg-lime-50/50 border border-lime-100 rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-lime-800 flex items-center gap-1">
                      <Truck className="w-4 h-4 text-lime-600" />
                      {remainingForFreeShipping > 0 
                        ? `¡Estás a $${remainingForFreeShipping.toLocaleString('es-AR')} del envío gratis!`
                        : '¡Felicidades! Tenés envío gratis a domicilio.'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-dark-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-lime-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-dark-400 font-light mt-1.5">
                    (Válido en Olavarría y provincia de Bs. As. superando los $20.000)
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex gap-4 p-3 hover:bg-dark-50/50 border border-transparent hover:border-dark-100/60 rounded-2xl transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-dark-100 flex-shrink-0">
                        <img 
                          src={getProductImage(item)} 
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info & Quantity Controls */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-dark-800 tracking-tight line-clamp-1">
                              {item.nombre}
                            </h4>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-dark-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-dark-400">
                            Medida: {item.peso}
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          {/* Qty edit buttons */}
                          <div className="flex items-center border border-dark-200 rounded-lg">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="p-2.5 hover:bg-dark-50 text-dark-600 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-dark-800">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="p-2.5 hover:bg-dark-50 text-dark-600 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Item price */}
                          <span className="text-xs font-extrabold text-dark-800">
                            ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Checkout & Shipping Section */}
          {cart.length > 0 && (
            <div className="px-6 py-6 border-t border-dark-100 bg-white">
              {/* Shipping Zip Code Entry */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                  Calcular costo de envío (Si preferís envío a domicilio)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Código Postal (ej: 7400)"
                    className="flex-1 px-4 py-2 border border-dark-200 rounded-xl text-xs outline-none focus:border-lime-500"
                  />
                </div>
                {postalCode && (
                  <p className="text-[10px] text-lime-700 font-semibold mt-1 flex items-center gap-1 animate-pulse">
                    <Truck className="w-3.5 h-3.5" />
                    {shippingCost === 0 
                      ? 'Envío Gratis a domicilio' 
                      : `Costo de envío estimado: $${(shippingCost || 0).toLocaleString('es-AR')}`
                    }
                  </p>
                )}
              </div>

              {/* Total calculations */}
              <div className="space-y-2 border-t border-dark-100 pt-4 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-500 font-light">Subtotal</span>
                  <span className="font-bold text-dark-800">${subtotal.toLocaleString('es-AR')}</span>
                </div>
                {shippingCost !== null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-500 font-light">Costo de Envío</span>
                    <span className="font-bold text-dark-800">
                      {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString('es-AR')}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-dashed border-dark-100">
                  <span className="font-bold text-dark-900">Total</span>
                  <span className="font-black text-black text-lg">
                    ${finalTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={onCheckoutOpen}
                className="w-full py-4 bg-lime-500 hover:bg-lime-600 hover:scale-[1.02] active:scale-95 text-white font-bold text-xs tracking-wider rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2"
              >
                <span>PROCEDER AL CHECKOUT</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
