import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  const handleScrollToProducts = (e) => {
    e.preventDefault();
    const catalog = document.getElementById('catalogo');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-50/80 py-20 lg:py-32">
      {/* Background soft ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lime-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-100/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fade-in-up">
        {/* Subtle badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime-150/40 text-lime-900 border border-lime-200/50 text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-lime-600 animate-spin-slow" />
          <span>Almacén Natural • Repostería • Cotillón • Horario Corrido</span>
        </div>

        {/* Refined heading */}
        <h1 className="font-outfit text-4xl sm:text-5xl lg:text-7xl font-black text-dark-900 tracking-tight leading-none mb-6">
          Todo para tu hogar <br className="hidden sm:inline" />
          y tus eventos en <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-600 to-lime-500">
            LA FAMILIA.
          </span>
        </h1>

        {/* Supporting text */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-dark-500 mb-10 font-light leading-relaxed">
          Encontrá alimentos saludables, frutos secos premium, herboristería,
          los mejores insumos para repostería y cotillón para celebrar. 
          Retirá tu compra de forma rápida en cualquiera de nuestras dos sucursales en Olavarría.
        </p>

        {/* Elegant CTA button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#catalogo"
            onClick={handleScrollToProducts}
            className="group px-8 py-4 bg-lime-500 text-white rounded-full text-sm font-semibold tracking-wide shadow-lg shadow-lime-900/10 hover:bg-lime-600 hover:scale-[1.03] hover:shadow-xl hover:shadow-lime-900/20 transition-all duration-300 flex items-center gap-2"
          >
            <span>Explorar Catálogo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <a
            href="https://wa.me/542284322581"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 text-dark-700 hover:text-dark-950 hover:scale-[1.03] font-semibold text-sm transition-all duration-300 flex items-center gap-1.5"
          >
            <i className="fa-brands fa-whatsapp text-lg text-lime-600" />
            <span>Consultas por WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
