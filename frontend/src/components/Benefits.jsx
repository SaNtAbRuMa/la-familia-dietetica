import React from 'react';
import { Truck, ShieldCheck, Award } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: <Truck className="w-8 h-8 text-olive-700" />,
      title: 'Envíos en Olavarría',
      description: 'Entrega rápida a domicilio. Gratis en compras desde $20.000.',
    },
    {
      icon: <Award className="w-8 h-8 text-olive-700" />,
      title: 'Calidad 100% Natural',
      description: 'Seleccionamos los mejores frutos secos y productos orgánicos.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-olive-700" />,
      title: 'Compra WhatsApp Directa',
      description: 'Armás tu carrito en la web y finalizás por chat de forma segura.',
    },
  ];

  return (
    <section className="bg-white border-y border-dark-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div 
              key={i} 
              className="flex items-start gap-4 p-6 hover:bg-dark-50/50 rounded-2xl transition-all duration-300"
            >
              <div className="p-3 bg-olive-50 rounded-xl flex-shrink-0">
                {b.icon}
              </div>
              <div>
                <h3 className="font-outfit font-semibold text-dark-900 text-sm tracking-tight mb-1">
                  {b.title}
                </h3>
                <p className="text-xs text-dark-500 font-light leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
