import React from 'react';
import { useStore } from '../context/StoreContext';

const categoryImages = {
  'Frutos Secos': 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400&h=300&fit=crop',
  'Cereales y Granolas': 'https://images.unsplash.com/photo-1517093602195-b40af9688b46?w=400&h=300&fit=crop',
  'Aceites, Vinagres y Salsas': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop',
  'Complementos Dietarios': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop',
  'Avenas y Sojas': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop',
  'Feculas y Harinas': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
  'Féculas y Harinas': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
  'Bebidas': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
  'Reposteria': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
  'Repostería': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
  'Cotillon': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
  'Cotillón': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
  'Herboristeria': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&h=300&fit=crop',
  'Herboristería': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&h=300&fit=crop',
  'Cosmetica Saludable': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop',
  'Cosmética Saludable': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop'
};

export default function Categories() {
  const { setActiveCategory } = useStore();

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const catalog = document.getElementById('catalogo');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dedup categories to display unique buttons
  const uniqueCategories = [
    'Frutos Secos',
    'Cereales y Granolas',
    'Aceites, Vinagres y Salsas',
    'Avenas y Sojas',
    'Féculas y Harinas',
    'Bebidas',
    'Repostería',
    'Cotillón'
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-outfit text-3xl font-bold tracking-tight text-dark-900">
            Comprar por Rubro
          </h2>
          <p className="text-sm text-dark-500 font-light mt-2">
            Explorá nuestras secciones destacadas y encontrá lo que necesitás.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {uniqueCategories.map((name) => {
            const url = categoryImages[name] || 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop';
            return (
              <button
                key={name}
                onClick={() => handleCategoryClick(name)}
                className="group relative h-48 w-full overflow-hidden rounded-2xl bg-dark-900 text-left shadow-soft hover:shadow-soft-lg transition-all duration-500 focus:outline-none"
              >
                {/* Image */}
                <img
                  src={url}
                  alt={name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-70 group-hover:opacity-60"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />

                {/* Title label */}
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="font-outfit text-sm font-semibold tracking-wide text-white uppercase block">
                    {name}
                  </span>
                  <span className="text-[10px] text-white/70 font-light tracking-wider mt-1 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Ver productos <i className="fa-solid fa-arrow-right text-[8px]" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
