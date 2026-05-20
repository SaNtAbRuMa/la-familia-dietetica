import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, MessageSquare } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import confetti from 'canvas-confetti';

const PICKUP_ADDRESSES = [
  'URQUIZA 1315',
  'RIVADAVIA 2581'
];

export default function CheckoutModal({ isOpen, onClose, onOrderComplete }) {
  const {
    cart,
    shippingCost,
    getCartTotal,
    postalCode,
    createSimulatedOrder,
    clearCart
  } = useStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    entrega: 'retiro', // Defaulting to pickup per business focus
    sucursalRetiro: PICKUP_ADDRESSES[0],
    direccion: '',
    notas: '',
    pago: 'efectivo' // efectivo / transferencia
  });
  
  const [errors, setErrors] = useState({});

  // Early return AFTER hooks to comply with React Rules of Hooks
  if (!isOpen) return null;

  const validateStep = () => {
    const err = {};
    if (step === 1) {
      if (!formData.nombre.trim()) err.nombre = 'El nombre es obligatorio';
      if (!formData.telefono.trim()) err.telefono = 'El teléfono es obligatorio';
      if (!/^\+?\d{6,15}$/.test(formData.telefono.replace(/\s/g, ''))) err.telefono = 'El teléfono no es válido';
    } else if (step === 2 && formData.entrega === 'envio') {
      if (!formData.direccion.trim()) err.direccion = 'La dirección de envío es obligatoria';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handlePrev = () => {
    setStep(s => s - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    const subtotal = getCartTotal();
    const finalShipping = formData.entrega === 'envio' ? (shippingCost || 0) : 0;
    const total = subtotal + finalShipping;

    // 1. Create simulated order & deduct stocks
    const orderData = {
      cliente: {
        nombre: formData.nombre,
        telefono: formData.telefono,
        email: formData.email
      },
      items: cart,
      total: total,
      metodoPago: formData.pago === 'efectivo' ? 'Efectivo / Contra reembolso' : 'Transferencia Bancaria',
      direccion: formData.entrega === 'envio' 
        ? `${formData.direccion} (CP: ${postalCode || '7400'})` 
        : `Retiro por sucursal: ${formData.sucursalRetiro}`,
      notas: formData.notas
    };

    const order = createSimulatedOrder(orderData);

    // 2. Play beautiful confetti celebration!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

    // 3. Build WhatsApp formatted message matching user specs
    const waPhone = '542284322581'; // central WhatsApp number
    
    let message = '';
    if (formData.entrega === 'retiro') {
      message += `¡Hola! Quiero realizar el siguiente pedido para RETIRAR POR SUCURSAL ${formData.sucursalRetiro}:\n\n`;
    } else {
      message += `¡Hola! Quiero realizar el siguiente pedido para ENVÍO A DOMICILIO:\n\n`;
    }

    // Detalle de productos y cantidades
    cart.forEach(item => {
      message += `- ${item.cantidad}x ${item.nombre} (${item.peso}) - $${(item.precio * item.cantidad).toLocaleString('es-AR')}\n`;
    });

    // Add shipping cost if delivery
    if (formData.entrega === 'envio') {
      message += `- Costo de envío: ${finalShipping === 0 ? 'Gratis' : `$${finalShipping.toLocaleString('es-AR')}`}\n`;
    }

    // Total Compra
    message += `\n*Total Compra:* $${total.toLocaleString('es-AR')}\n\n`;

    // Mis datos
    message += `*Mis datos:*\n`;
    message += `Nombre: ${formData.nombre}\n`;
    message += `WhatsApp: ${formData.telefono}\n`;
    if (formData.email) message += `Email: ${formData.email}\n`;
    
    if (formData.entrega === 'envio') {
      message += `Dirección: ${formData.direccion} (C.P: ${postalCode || '7400'})\n`;
    }
    
    message += `Método de pago: ${formData.pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}\n`;
    if (formData.notas) {
      message += `Notas: ${formData.notas}\n`;
    }

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodedText}`;

    // Redirect
    setTimeout(() => {
      window.open(waUrl, '_blank');
      clearCart();
      onOrderComplete();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-dark-900/50 blur-backdrop transition-opacity" 
      />

      {/* Modal Box */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-soft-lg z-10 border border-dark-100 p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[10px] font-bold text-lime-700 uppercase tracking-widest block">
              Paso {step} de 3
            </span>
            <h2 className="font-outfit text-xl font-bold text-dark-900">
              {step === 1 && 'Datos de Contacto'}
              {step === 2 && 'Método de Entrega'}
              {step === 3 && 'Forma de Pago & Confirmar'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dark-50 text-dark-400 hover:text-dark-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-dark-100 h-1.5 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-lime-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Stefanía Rossi"
                  className={`w-full px-4 py-3 border rounded-xl text-xs outline-none focus:border-lime-500 bg-white ${
                    errors.nombre ? 'border-red-400 focus:border-red-400' : 'border-dark-200'
                  }`}
                />
                {errors.nombre && <span className="text-[10px] text-red-500 mt-1 block">{errors.nombre}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                  WhatsApp de Contacto
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: 2284322581"
                  className={`w-full px-4 py-3 border rounded-xl text-xs outline-none focus:border-lime-500 bg-white ${
                    errors.telefono ? 'border-red-400 focus:border-red-400' : 'border-dark-200'
                  }`}
                />
                {errors.telefono && <span className="text-[10px] text-red-500 mt-1 block">{errors.telefono}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ej: stefania@ejemplo.com"
                  className="w-full px-4 py-3 border border-dark-200 rounded-xl text-xs outline-none focus:border-lime-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Delivery details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                  ¿Cómo querés recibir tu pedido?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entrega: 'retiro' })}
                    className={`py-4 rounded-xl border text-xs font-bold transition-all ${
                      formData.entrega === 'retiro' 
                        ? 'border-lime-500 bg-lime-50 text-lime-800 shadow-sm' 
                        : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    🏢 Retiro en Sucursal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entrega: 'envio' })}
                    className={`py-4 rounded-xl border text-xs font-bold transition-all ${
                      formData.entrega === 'envio' 
                        ? 'border-lime-500 bg-lime-50 text-lime-800 shadow-sm' 
                        : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    📍 Envío a Domicilio
                  </button>
                </div>
              </div>

              {formData.entrega === 'envio' ? (
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                    Dirección de Entrega
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Ej: Vicente López 3420, Piso 1 A"
                    className={`w-full px-4 py-3 border rounded-xl text-xs outline-none focus:border-lime-500 bg-white ${
                      errors.direccion ? 'border-red-400 focus:border-red-400' : 'border-dark-200'
                    }`}
                  />
                  {errors.direccion && <span className="text-[10px] text-red-500 mt-1 block">{errors.direccion}</span>}
                  
                  {postalCode && (
                    <div className="mt-2 p-3 bg-dark-50 border border-dark-100 rounded-xl text-[10px] text-dark-600">
                      🚚 Envío al CP *{postalCode}*: {shippingCost === 0 ? '¡Gratuito!' : `$${shippingCost}`}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                    Selecciona la Sucursal de Retiro (Obligatorio)
                  </label>
                  <select
                    value={formData.sucursalRetiro}
                    onChange={(e) => setFormData({ ...formData, sucursalRetiro: e.target.value })}
                    className="w-full px-4 py-3 border border-dark-200 rounded-xl text-xs outline-none focus:border-lime-500 bg-white text-dark-750 font-bold"
                  >
                    {PICKUP_ADDRESSES.map((addr) => (
                      <option key={addr} value={addr}>{addr}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                  Notas de Pedido (Opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Ej: Retira mi hermano, o agregar bolsa de regalo."
                  rows={2}
                  className="w-full px-4 py-3 border border-dark-200 rounded-xl text-xs outline-none focus:border-lime-500 bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Payment & Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                  Medio de Pago preferido
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pago: 'efectivo' })}
                    className={`py-4 rounded-xl border text-xs font-bold transition-all ${
                      formData.pago === 'efectivo' 
                        ? 'border-lime-500 bg-lime-50 text-lime-800 shadow-sm' 
                        : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pago: 'transferencia' })}
                    className={`py-4 rounded-xl border text-xs font-bold transition-all ${
                      formData.pago === 'transferencia' 
                        ? 'border-lime-500 bg-lime-50 text-lime-800 shadow-sm' 
                        : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    🏦 Transferencia
                  </button>
                </div>
              </div>

              {/* Order Final Summary */}
              <div className="border border-dark-100 rounded-2xl p-4 bg-dark-50/50 space-y-2.5">
                <h4 className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">
                  Resumen de la Operación
                </h4>
                <div className="text-xs space-y-1.5 border-b border-dark-100/50 pb-2">
                  <div className="flex justify-between">
                    <span className="text-dark-500">Subtotal del carrito</span>
                    <span className="font-bold">${getCartTotal().toLocaleString('es-AR')}</span>
                  </div>
                  {formData.entrega === 'envio' && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Envío a domicilio</span>
                      <span className="font-bold">
                        {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString('es-AR')}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="font-bold text-dark-800">Total a Pagar</span>
                  <span className="font-black text-black text-base">
                    ${(getCartTotal() + (formData.entrega === 'envio' ? (shippingCost || 0) : 0)).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-lime-50 border border-lime-100 rounded-xl flex items-start gap-2.5">
                <MessageSquare className="w-5 h-5 text-lime-600 text-base mt-0.5" />
                <p className="text-[10px] text-lime-800 leading-normal font-light">
                  <strong>Nota sobre el pedido:</strong> Al confirmar, abrirás un mensaje de WhatsApp para enviar el pedido formateado a <strong>La Familia</strong>. ¡Tu pedido queda registrado automáticamente en el sistema de stock!
                </p>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-dark-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 border border-dark-200 hover:bg-dark-50 text-dark-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-dark-900 hover:bg-dark-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>Continuar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3.5 bg-lime-500 hover:bg-lime-600 text-white font-bold text-xs tracking-wider rounded-xl transition-colors flex items-center gap-2 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>CONFIRMAR & ENVIAR</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
