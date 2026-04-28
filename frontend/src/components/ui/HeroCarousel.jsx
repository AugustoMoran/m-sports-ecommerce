import React, { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { useGetBannersQuery } from '../../services/bannersApi';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const DEFAULT_SLIDES = [
  {
    _id: '1',
    imagen: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=80',
    titulo: 'Nueva colección',
    subtitulo: 'Descubrí los mejores productos al mejor precio',
    ctaTexto: 'Ver productos',
    ctaLink: '/productos',
    gradient: 'from-gray-950/80 to-transparent',
  },
  {
    _id: '2',
    imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80',
    titulo: 'Ofertas especiales',
    subtitulo: 'Hasta 40% de descuento en productos seleccionados',
    ctaTexto: 'Ver ofertas',
    ctaLink: '/productos?sort=price-asc',
    gradient: 'from-gray-950/80 to-transparent',
  },
  {
    _id: '3',
    imagen: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80',
    titulo: 'Envíos a todo el país',
    subtitulo: 'Rápido, seguro y al mejor precio',
    ctaTexto: 'Comprar ahora',
    ctaLink: '/productos',
    gradient: 'from-gray-950/80 to-transparent',
  },
];

const HeroCarousel = () => {
  const { data: apiBanners } = useGetBannersQuery(true);
  const slides = apiBanners && apiBanners.length > 0 ? apiBanners : DEFAULT_SLIDES;
  return (
    <div className="w-full">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop
        className="w-full h-[400px] sm:h-[500px] lg:h-[600px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide._id}>
            <div className="relative w-full h-full overflow-hidden">
              {/* Image */}
              <img
                src={slide.imagen}
                alt={slide.titulo}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
              {/* Content */}
              <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-10">
                  <div className="max-w-xl animate-slide-up">
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                      {slide.titulo}
                    </h1>
                    <p className="text-base sm:text-xl text-white/90 mb-8 drop-shadow">
                      {slide.subtitulo}
                    </p>
                    <Link
                      to={slide.ctaLink}
                      className="inline-flex items-center gap-2 bg-primary-400 text-gray-900 font-bold px-8 py-3 rounded-full shadow-lg hover:bg-primary-300 transition-all hover:scale-105 active:scale-95"
                    >
                      {slide.ctaTexto}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroCarousel;
