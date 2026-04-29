# 🚀 GUÍA COMPLETA DE DESPLIEGUE - RENDER + VERCEL

## ⚡ ANTES DE EMPEZAR

### Checklist Previo
- [ ] Cuenta en Render.com (conectada con GitHub)
- [ ] Cuenta en Vercel.com (conectada con GitHub)
- [ ] MongoDB Atlas configurado y accesible
- [ ] Cloudinary credentials activos
- [ ] Mercado Pago API keys activos
- [ ] Gmail App Password generada
- [ ] Keys de IA configuradas (Groq, Mistral, etc.)

---

## 📋 VARIABLES DE ENTORNO FALTANTES

Completa estas en tu `.backend/.env.production`:

```env
# Gmail App Password (para emails)
SMTP_PASS=tu_app_password_de_gmail

# IA Engine - Al menos UNO debe estar configurado
GROQ_API_KEY=obtén en https://console.groq.com/keys (GRATIS)
MISTRAL_API_KEY=obtén en https://console.mistral.ai/api-keys (GRATIS)
OPENAI_API_KEY=obtén en https://platform.openai.com/api-keys (Opcional, pago)
```

**Cómo obtener Gmail App Password:**
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona App: "Mail" | Device: "Windows"
3. Copia la contraseña generada → SMTP_PASS

---

## 🔧 PASO 1: DESPLEGAR BACKEND EN RENDER

### 1.1 Crear Web Service en Render

1. Ir a https://render.com → **New +** → **Web Service**
2. Conectar tu repositorio GitHub
3. Seleccionar: `AugustoMoran/ecomerce-caro`
4. Rama: `main`

### 1.2 Configurar el Servicio

| Campo | Valor |
|-------|-------|
| **Name** | `m-sports-backend` |
| **Region** | `Ohio` (recomendado) o la más cercana |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Starter Plus` (≈$7/mes) |

### 1.3 Variables de Entorno en Render

En **Environment**, agrega TODAS estas variables (copia del `.env.production`):

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://msportsbsports_db_user:nzrmfOlFqUWb3cVI@cluster0.zdr9e3q.mongodb.net/?appName=Cluster0
JWT_SECRET=jwt-secret-ecommerce-2024-xK9mP3nQ
REFRESH_TOKEN_SECRET=refresh-secret-ecommerce-2024-zL7wR5vY
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dzqu8pib2
CLOUDINARY_API_KEY=681394175381926
CLOUDINARY_API_SECRET=1WvTzELe3v8alT7d_aBCV5x4rhE
CLOUDINARY_STORAGE_LIMIT_MB=25000
MP_ACCESS_TOKEN=APP_USR-4783972108448843-042516-1a905e025b8f6871468257ba70550cfb-3310776735
MP_PUBLIC_KEY=APP_USR-041f2bf0-6fe6-4759-9d59-3eed14db48d7
MP_WEBHOOK_SECRET=ee037eada6187a1730c72930e24664020fb7425768c77f3137e7c546af46017e
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=m.sports.b.sports@gmail.com
SMTP_PASS=tu_app_password_aqui
WHATSAPP_NUMBER=541130837054
ADMIN_EMAIL=m.sports.b.sports@gmail.com
FRONTEND_URL=https://m-sports.vercel.app
AI_ENGINE_MODE=balanced
GROQ_API_KEY=tu_groq_key_aqui
MISTRAL_API_KEY=tu_mistral_key_aqui
OPENAI_API_KEY=tu_openai_key_aqui (opcional)
```

### 1.4 Deploy

Click en **Deploy Web Service** y espera a que termine.

**Tu backend estará en:** `https://m-sports-backend-xxxx.onrender.com`

**Nota:** Ten paciencia en el primer deploy (~2-3 minutos).

---

## 🎨 PASO 2: DESPLEGAR FRONTEND EN VERCEL

### 2.1 Importar Proyecto en Vercel

1. Ve a https://vercel.com
2. Click en **Add New** → **Project**
3. Importar: `AugustoMoran/ecomerce-caro`
4. Seleccionar carpeta raíz: `frontend`

### 2.2 Configuración del Proyecto

| Campo | Valor |
|-------|-------|
| **Project Name** | `m-sports-frontend` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.3 Variables de Entorno en Vercel

En **Settings → Environment Variables**, agrega:

```env
VITE_API_URL=https://m-sports-backend-xxxx.onrender.com
```

(Reemplaza `xxxx` con tu URL real de Render)

### 2.4 Deploy

Click en **Deploy** y espera a que termine (~1-2 minutos).

**Tu frontend estará en:** `https://m-sports.vercel.app`

---

## ⚠️ PASO 3: ACTUALIZAR URLS DESPUÉS DE DEPLOY

Una vez que tengas ambas URLs:

### 3.1 En Render Backend - Actualizar FRONTEND_URL

1. Ve a tu servicio en Render
2. **Settings** → **Environment** → Editar
3. Cambiar:
```env
FRONTEND_URL=https://m-sports.vercel.app
```

### 3.2 En Vercel Frontend - Actualizar VITE_API_URL

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables** → Editar
3. Cambiar:
```env
VITE_API_URL=https://m-sports-backend-xxxx.onrender.com
```

**Ambas plataformas harán redeploy automático después de cambios de variables.**

---

## 🔗 PASO 4: VERIFICAR WEBHOOKS (Mercado Pago)

Tu webhook debe apuntar a:
```
https://m-sports-backend-xxxx.onrender.com/api/webhook/mercadopago
```

Verifica en Mercado Pago:
1. Panel → Integraciones → Webhooks
2. Confirma que está apuntando a tu URL de Render

---

## 📱 PASO 5: PRUEBAS FINALES

### Checklist de Validación:

- [ ] Frontend carga correctamente: https://m-sports.vercel.app
- [ ] API responde: `https://m-sports-backend-xxxx.onrender.com/api/health` (si existe)
- [ ] Puedo login/logout
- [ ] Puedo agregar productos al carrito
- [ ] Las imágenes de Cloudinary cargan
- [ ] Puedo hacer pedido (Mercado Pago)
- [ ] Recibo email de confirmación
- [ ] El chat de IA responde (si está habilitado)

### Debugging Tips:

**Si falla la conexión backend:**
1. Verifica que `FRONTEND_URL` en Render sea correcto
2. Verifica que `VITE_API_URL` en Vercel sea correcto
3. Mira logs en Render: **Logs** en el dashboard

**Si falla Mercado Pago:**
1. Verifica que `MP_ACCESS_TOKEN` sea correcto
2. Confirma webhook URL en panel de MP
3. Prueba en sandbox primero

**Si falla el email:**
1. Verifica `SMTP_PASS` (debe ser App Password, no contraseña normal)
2. Verifica `SMTP_USER` sea correcto
3. Activa "Aplicaciones menos seguras" en Google (si es necesario)

---

## 💰 COSTOS MENSUALES ESTIMADOS

| Servicio | Plan | Costo |
|----------|------|-------|
| **Render (Backend)** | Starter Plus | $7 |
| **Vercel (Frontend)** | Pro | $20 |
| **MongoDB Atlas** | M0 | $0 (Free) |
| **Cloudinary** | Free/Pro | $0-82 |
| **Total** | - | ~$27-109 |

---

## 🔐 SEGURIDAD - Checklist Final

- [ ] No subir `.env.production` a GitHub
- [ ] Todas las keys están en Render/Vercel (no en código)
- [ ] JWT_SECRET es único y fuerte
- [ ] CORS está configurado correctamente
- [ ] Rate limiting está activo
- [ ] HTTPS en ambas plataformas ✅ (automático)

---

## 📞 Soporte Rápido

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://docs.mongodb.com/atlas
- **Mercado Pago:** https://www.mercadopago.com.ar/developers/es

---

¡Listo! Sigue estos pasos y tu app estará en producción. 🎉
