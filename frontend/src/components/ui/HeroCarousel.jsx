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
    video: '',
    titulo: 'Nueva colección',
    subtitulo: 'Descubrí los mejores productos al mejor precio',
    mostrarTexto: true,
    ctaTexto: 'Ver productos',
    ctaLink: '/productos',
    mostrarBoton: false,
    autoplay: false,
    gradient: 'from-gray-950/80 to-transparent',
  },
  {
    _id: '2',
    imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80',
    video: '',
    titulo: 'Ofertas especiales',
    subtitulo: 'Hasta 40% de descuento en productos seleccionados',
    mostrarTexto: true,
    ctaTexto: 'Ver ofertas',
    ctaLink: '/productos?sort=price-asc',
    mostrarBoton: false,
    autoplay: false,
    gradient: 'from-gray-950/80 to-transparent',
  },
  {
    _id: '3',
    imagen: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80',
    video: '',
    titulo: 'Envíos a todo el país',
    subtitulo: 'Rápido, seguro y al mejor precio',
    mostrarTexto: true,
    ctaTexto: 'Comprar ahora',
    ctaLink: '/productos',
    mostrarBoton: false,
    autoplay: false,
    gradient: 'from-gray-950/80 to-transparent',
  },
];

const HeroCarousel = () => {
  const handleImageLoad = (e, slideId) => {
    // Ya no necesitamos calcular aspect ratio
    // aspect-video + object-contain maneja todo
  };

  const { data: apiBanners } = useGetBannersQuery(true);
  const slides = apiBanners && apiBanners.length > 0 ? apiBanners.map(b => {
    // Normalizar valores
    const videoUrl = b.video?.trim() || '';
    const imagenUrl = b.imagen?.trim() || '';
    const esVideoValido = videoUrl && videoUrl.startsWith('http');
    const esImagenValida = imagenUrl && imagenUrl.startsWith('http');
    
    // Convertir a booleans - handle string, number, and boolean formats
    // Only true if explicitly truthy: true, "true", 1, "1"
    const isTruthy = (val) => val === true || val === 'true' || val === 1 || val === '1';
    const mostrarTexto = isTruthy(b.mostrarTexto);
    const mostrarBoton = isTruthy(b.mostrarBoton);
    
    return {
      ...b,
      video: videoUrl,
      imagen: imagenUrl,
      esVideoValido,
      esImagenValida,
      mostrarTexto,
      mostrarBoton,
      autoplay: b.autoplay === true || b.autoplay === 'true',
    };
  }) : DEFAULT_SLIDES;
  return (
    <div className="w-full">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop={slides.length > 1}
        className="w-full aspect-video"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide._id}>
            <div className="relative w-full h-full overflow-hidden bg-white">
              {/* Video o Imagen */}
              {slide.esVideoValido ? (
                <video
                  src={slide.video}
                  className="absolute inset-0 w-full h-full object-contain bg-white"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : slide.esImagenValida ? (
                <img
                  src={slide.imagen}
                  alt={slide.titulo || 'Banner'}
                  className="absolute inset-0 w-full h-full object-contain bg-white"
                  loading="lazy"
                />
              ) : null}
              {/* Overlay - para widescreen images solo */}
              {/* Content */}
              <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-10">
                  <div className="max-w-xl animate-slide-up">
                    {slide.mostrarTexto && (
                      <>
                        {slide.titulo?.trim() && (
                          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                            {slide.titulo}
                          </h1>
                        )}
                        {slide.subtitulo?.trim() && (
                          <p className="text-base sm:text-xl text-white/90 mb-8 drop-shadow">
                            {slide.subtitulo}
                          </p>
                        )}
                      </>
                    )}
                    {slide.mostrarBoton && slide.ctaTexto?.trim() && (
                      <Link
                        to={slide.ctaLink || '/'}
                        className="inline-flex items-center gap-2 bg-primary-400 text-gray-900 font-bold px-8 py-3 rounded-full shadow-lg hover:bg-primary-300 transition-all hover:scale-105 active:scale-95"
                      >
                        {slide.ctaTexto}
                      </Link>
                    )}
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
