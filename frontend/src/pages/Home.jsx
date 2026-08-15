import React from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/ui/HeroCarousel';
import ProductCard from '../components/products/ProductCard';
import { useGetProductsQuery, useGetCategoriesQuery } from '../services/productsApi';
import { HiArrowRight, HiOutlineTruck, HiOutlineCreditCard, HiOutlineChatAlt2, HiLocationMarker } from 'react-icons/hi';
import SEO from '../components/common/SEO';

const TRUST = [
  { icon: HiOutlineTruck, title: 'Envíos a todo el país', text: 'Rápido y seguro' },
  { icon: HiOutlineCreditCard, title: 'Mercado Pago', text: 'Tarjeta, efectivo o transferencia' },
  { icon: HiOutlineChatAlt2, title: 'Atención por WhatsApp', text: 'Te asesoramos en minutos' },
  { icon: HiLocationMarker, title: 'Sucursales en Morón', text: 'Retirá en el local' },
];

const Home = () => {
  const { data: featuredData } = useGetProductsQuery({ limit: 8, sort: 'popular' });
  const { data: newData } = useGetProductsQuery({ limit: 8, sort: 'newest' });
  const { data: categories = [] } = useGetCategoriesQuery();

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
        title="M Sports | Tienda Online de Artículos Deportivos"
        description="Encuentra la mejor selección de indumentaria y artículos deportivos en M Sports. Envíos a todo el país y las mejores marcas."
        keywords="deportes, m sports, indumentaria deportiva, zapatillas, remeras, pantalones, articulos deportivos"
        schemaData={schemaData}
      />
      <HeroCarousel />

      <section className="border-b border-pearl-dark bg-white">
        <div className="page-wrap py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-400 text-ink flex items-center justify-center flex-shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-ink">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="page-wrap">
        {categories.length > 0 && (
          <section className="pt-14">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="section-kicker mb-1">Explorá</p>
                <h2 className="section-title">Categorías</h2>
              </div>
              <Link to="/productos" className="text-ink hover:text-gray-600 text-sm font-semibold flex items-center gap-1">
                Ver todo <HiArrowRight size={16} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/productos?categoria=${cat._id}`}
                  className="flex-shrink-0 px-5 py-2.5 rounded-full bg-white border border-pearl-dark text-sm font-semibold text-ink hover:bg-ink hover:text-white hover:border-ink transition-colors"
                >
                  {cat.nombre}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="pt-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="section-kicker mb-1">Destacados</p>
              <h2 className="section-title">Más vendidos</h2>
            </div>
            <Link to="/productos?sort=popular" className="text-ink hover:text-gray-600 text-sm font-semibold flex items-center gap-1">
              Ver todo <HiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(featuredData?.products || []).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>

        <section className="pt-14">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-400/20 blur-2xl pointer-events-none" />
            <div className="relative">
              <p className="section-kicker text-primary-400 mb-2">Comprá con confianza</p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">Listo para tu próximo entrenamiento</h2>
              <p className="text-gray-400 max-w-md">Pagá por Mercado Pago o WhatsApp. Envíos a todo el país y retiro en sucursal.</p>
            </div>
            <Link to="/productos" className="btn-accent relative whitespace-nowrap flex-shrink-0">
              Ver productos
            </Link>
          </div>
        </section>

        <section className="py-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="section-kicker mb-1">Recién llegados</p>
              <h2 className="section-title">Novedades</h2>
            </div>
            <Link to="/productos?sort=newest" className="text-ink hover:text-gray-600 text-sm font-semibold flex items-center gap-1">
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
