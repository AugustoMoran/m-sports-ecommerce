import React from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/ui/HeroCarousel';
import ProductCard from '../components/products/ProductCard';
import { useGetProductsQuery } from '../services/productsApi';
import { HiArrowRight } from 'react-icons/hi';
import SEO from '../components/common/SEO';

const Home = () => {
  const { data: featuredData } = useGetProductsQuery({ limit: 8, sort: 'popular' });
  const { data: newData } = useGetProductsQuery({ limit: 8, sort: 'newest' });

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "M Sports",
    "url": "https://msportssl.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://msportssl.com/productos?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div>
      <SEO 
        title="Tienda Online de Artículos Deportivos"
        description="Encuentra la mejor selección de indumentaria y artículos deportivos en M Sports. Envíos a todo el país y las mejores marcas."
        keywords="deportes, m sports, indumentaria deportiva, zapatillas, remeras, pantalones, articulos deportivos"
        schemaData={schemaData}
      />
      {/* Hero */}
      <HeroCarousel />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured products */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Más vendidos</h2>
            <Link to="/productos?sort=popular" className="text-gray-900 hover:text-gray-600 text-sm font-semibold flex items-center gap-1">
              Ver todo <HiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(featuredData?.products || []).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>

        {/* Banner CTA */}
        <section className="py-8">
          <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">¡Comprá con confianza!</h2>
              <p className="text-gray-400">Pagá por Mercado Pago o WhatsApp. Envíos a todo el país.</p>
            </div>
            <Link to="/productos" className="bg-primary-400 text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-primary-300 transition-all whitespace-nowrap flex-shrink-0 shadow-lg">
              Ver productos
            </Link>
          </div>
        </section>

        {/* New products */}
        <section className="py-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Novedades</h2>
            <Link to="/productos?sort=newest" className="text-gray-900 hover:text-gray-600 text-sm font-semibold flex items-center gap-1">
              Ver todo <HiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(newData?.products || []).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
