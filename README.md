<div align="center">

# 🛒 Ecommerce Fullstack PRO

**Plataforma de comercio electrónico completa construida con React, Node.js y MongoDB**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## ✨ Características principales

### 🏪 Tienda (cliente)
- **Catálogo de productos** con búsqueda full-text, filtros por categoría y paginación
- **Carrito persistente** — sincronizado en base de datos para usuarios autenticados y en `localStorage` para invitados
- **Favoritos** — lista de deseos guardada por usuario
- **Detalle de producto** con galería de imágenes y selector de cantidad
- **Checkout** con soporte para usuarios registrados e invitados
- **Dos métodos de pago**: MercadoPago (checkout pro) y WhatsApp
- **Cupones de descuento** con validación en tiempo real (porcentaje o monto fijo)
- **Historial de pedidos** con seguimiento de estado para usuarios registrados
- **Seguimiento de pedido público** por código único

### 💳 Pagos — MercadoPago
- Integración con MercadoPago Checkout Pro (SDK v2)
- Generación de preferencia de pago en el servidor
- Redirección al checkout de MP y retorno automático a página de confirmación
- Webhook para actualización de estado de pago (listo para producción)

### 💬 Pedidos WhatsApp
- Generación de link con detalle completo del pedido formateado
- El stock **no se descuenta** al crear el pedido — el admin lo hace manualmente al confirmar entrega
- Flujo de finalización con confirmación y soporte para forzar descuento cuando hay stock insuficiente

### 🔐 Autenticación
- Registro e inicio de sesión con JWT (`access token` 15 min)
- Refresh tokens UUID almacenados en base de datos (7 días)
- Cookies `httpOnly` — protección contra XSS
- Rutas protegidas por rol (usuario / admin)

### 📧 Notificaciones por email
- Confirmación de pedido al cliente (invitados)
- Notificación de nuevo pedido al administrador
- Enviadas con Nodemailer (SMTP configurable)

---

## 🛡️ Panel de Administración

### 📦 Gestión de Productos
- CRUD completo con hasta **7 imágenes por producto** subidas a Cloudinary
- Editor con campo de precio, precio oferta, stock, descripción, categoría y tags
- **Alerta visual de stock bajo** (≤5 unidades) con badge de color
- **Botón inline de reposición** de stock sin salir de la tabla
- Filtros por búsqueda y categoría + paginación

### 🗂️ Categorías
- CRUD de categorías con asignación a productos

### 📋 Pedidos
- Vista de todos los pedidos con badges por método de pago (MP / WhatsApp)
- Cambio de estado de pago y envío desde la tabla (select inline)
- **Botón "Finalizar pedido"** para descontar stock manualmente (WhatsApp y MP aprobados)
  - Aparece cuando `estadoPago: aprobado` y `estadoEnvio: enviado | entregado`
  - Si el stock es insuficiente → alerta + opción de forzar descuento (stock negativo)
- **Eliminar pedidos finalizados** del historial (con confirmación)
- Paginación

### 🎟️ Cupones
- Creación y gestión de cupones (porcentaje o monto fijo)
- Límite de usos, fecha de vencimiento y monto mínimo de compra
- Activar / desactivar

### 🖼️ Banners / Carrusel Hero
- Gestión de slides del carrusel principal
- Subida de imagen, título, subtítulo, CTA, gradiente de color y orden
- Activar / desactivar por slide
- Si no hay banners activos, se muestran imágenes placeholder de Unsplash

### ☁️ Almacenamiento Cloudinary
- Vista del uso de almacenamiento en tiempo real
- Eliminación de imágenes huérfanas desde el panel

---

## 🗂️ Estructura del proyecto

```
ecommerce/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, Cloudinary, Mailer
│   │   ├── controllers/   # Lógica de cada recurso
│   │   ├── middleware/    # Auth, errorHandler, rateLimiter, validate
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routers
│   │   ├── services/      # Lógica de negocio desacoplada
│   │   └── utils/         # Helpers (tokens, emails, códigos)
│   ├── .env.example
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── app/           # Redux store
    │   ├── components/    # UI reutilizable (layout, cart, admin)
    │   ├── features/      # Redux slices (auth, cart, ui)
    │   ├── hooks/         # useCart, useAuth, useInfiniteScroll
    │   ├── pages/         # Páginas públicas y admin
    │   ├── services/      # RTK Query API slices
    │   └── utils/         # formatCurrency, whatsapp link
    ├── .env.example
    └── vite.config.js
```

---

## 🛠️ Stack tecnológico

### Backend
| Tecnología | Uso |
|---|---|
| **Node.js + Express 4** | Servidor HTTP y API REST |
| **MongoDB + Mongoose 8** | Base de datos y ODM |
| **JWT + UUID** | Access tokens + Refresh tokens |
| **Cloudinary v2** | Almacenamiento y CDN de imágenes |
| **MercadoPago SDK v2** | Procesamiento de pagos |
| **Nodemailer** | Envío de emails transaccionales |
| **Helmet** | Headers de seguridad HTTP |
| **express-rate-limit** | Rate limiting por IP |
| **express-mongo-sanitize** | Sanitización contra NoSQL injection |
| **express-validator** | Validación de inputs |
| **bcryptjs** | Hash de contraseñas |
| **Multer + Cloudinary Storage** | Upload de imágenes |
| **Morgan** | HTTP request logger |
| **Compression** | Compresión gzip de responses |

### Frontend
| Tecnología | Uso |
|---|---|
| **React 18** | UI declarativa con hooks |
| **Vite 6** | Build tool y dev server |
| **Redux Toolkit + RTK Query** | Estado global y data fetching/caching |
| **React Router v6** | Routing SPA con rutas protegidas |
| **Tailwind CSS 3.4** | Estilos utility-first |
| **Swiper** | Carrusel de banners hero |
| **React Hot Toast** | Notificaciones toast |
| **React Icons** | Iconografía (Heroicons) |

---

## 🚀 Instalación y uso local

### Requisitos
- Node.js 18+
- Cuenta en MongoDB Atlas (o instancia local)
- Cuenta en Cloudinary
- Cuenta en MercadoPago (para pagos)

### 1. Clonar el repositorio

```bash
git clone https://github.com/AugustoMoran/Ecommerce-Fullstack-PRO-React-Node-MongoDB-.git
cd Ecommerce-Fullstack-PRO-React-Node-MongoDB-
```

### 2. Configurar el backend

```bash
cd backend
npm install --legacy-peer-deps
cp .env.example .env
# Completar las variables en .env
npm run dev
```

### 3. Configurar el frontend

```bash
cd frontend
npm install
cp .env.example .env
# Completar VITE_API_URL si corresponde
npm run dev
```

El frontend corre en `http://localhost:5173` y el backend en `http://localhost:5000`.

### Variables de entorno requeridas (backend)

```env
MONGO_URI=           # Connection string de MongoDB
JWT_SECRET=          # Clave secreta para JWT
REFRESH_TOKEN_SECRET=# Clave para refresh tokens
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MP_ACCESS_TOKEN=     # Token de MercadoPago
FRONTEND_URL=        # http://localhost:5173 en desarrollo
SMTP_USER=           # Email para notificaciones
SMTP_PASS=           # App password de Gmail
WHATSAPP_NUMBER=     # Número con código de país (ej: 5491112345678)
```

---

## 🔒 Seguridad implementada

- Headers HTTP seguros con **Helmet**
- Rate limiting en endpoints sensibles (login, registro)
- Sanitización de inputs para prevenir **NoSQL Injection** y **XSS**
- Contraseñas hasheadas con **bcrypt** (salt rounds: 12)
- Refresh tokens rotados y revocables almacenados en DB
- Cookies `httpOnly` y `sameSite: strict`
- Variables de entorno separadas del código fuente
- `.env` excluido del repositorio via `.gitignore`

---

## 📄 Licencia

MIT © [Augusto Moran](https://github.com/AugustoMoran)
