# Flujo de Órdenes - Documento de Referencia

## Estados de Orden

### Estados de Pago (`estadoPago`)
- `pendiente` - Inicial para ambos (MP y WhatsApp)
- `aprobado` - Pago confirmado (MP webhook → aprobado automáticamente)
- `rechazado` - Pago rechazado
- `reembolsado` - Reembolso procesado

### Estados de Envío (`estadoEnvio`)
- `pendiente` - Inicial hasta que admin marca enviado
- `preparando` - (opcional, para UI)
- `enviado` - Admin marca para despachar
- `entregado` - Admin marca cuando se entrega
- `cancelado` - Orden cancelada

---

## Flujo 1: Mercado Pago (Pago Online)

### Paso 1: Usuario compra
```
POST /api/orders
Body: { metodoPago: 'mercadopago', items: [...], guestData/userId }
Response: { order, mpData }

Resultado:
- Order creada con estadoPago='pendiente', estadoEnvio='pendiente'
- Devuelve preferenceId para redirigir a MP
```

### Paso 2: Pago confirmado (Webhook)
```
POST /webhooks/mercadopago
(MP envía notificación cuando pago es aprobado)

Automáticamente:
- estadoPago cambia a 'aprobado'
- estadoEnvio permanece 'pendiente' (admin debe despachar)
- Cart se limpia
- ⚠️ Stock NO se deduce aquí (se deduce en Finalizar)
```

### Paso 3: Admin ve orden en panel
```
Estado visible: Pago ✓ Aprobado | Envío ⏳ Pendiente
Botón "Finalizar" aún NO aparece (falta marcar envío)
```

### Paso 4: Admin marca "Enviado" o "Entregado"
```
PUT /api/orders/:id
Body: { estadoEnvio: 'enviado' } o { estadoEnvio: 'entregado' }

Resultado:
- estadoEnvio cambia a 'enviado' o 'entregado'
- ✓ Botón "Finalizar" aparece
```

### Paso 5: Admin hace clic en "Finalizar"
```
POST /api/orders/:id/finalize
(Sin body, o con force=true si stock insuficiente)

Automáticamente:
- ✓ Stock deducido para cada producto
- Order.stockDeducido = true
- Si stock resultante <= 0: devuelve lista de productos agotados

Response:
{
  order: { ... },
  agotados: [
    { _id, nombre, stock }  // Productos con stock <= 0
  ]
}
```

### Paso 6: (Opcional) Admin actualiza stock agotado
```
POST /api/orders/product/update-stock
Body: { productId: "...", newStock: 100 }

Resultado: Stock del producto actualizado
```

---

## Flujo 2: WhatsApp (Pago Manual)

### Paso 1: Usuario solicita compra por WhatsApp
```
POST /api/orders
Body: { metodoPago: 'whatsapp', items: [...], guestData }

Resultado:
- Order creada con estadoPago='pendiente', estadoEnvio='pendiente'
- ✓ Ambos estados pendientes (admin maneja manualmente)
```

### Paso 2: Admin aprueба pago (cuando recibe transferencia)
```
PUT /api/orders/:id
Body: { estadoPago: 'aprobado' }

Resultado: estadoPago cambia a 'aprobado'
```

### Paso 3: Admin marca "Enviado" o "Entregado"
```
PUT /api/orders/:id
Body: { estadoEnvio: 'enviado' } o { estadoEnvio: 'entregado' }

Resultado:
- estadoEnvio cambia
- ✓ Botón "Finalizar" aparece (Pago aprobado + Envío enviado/entregado)
```

### Paso 4: Admin hace clic en "Finalizar"
```
POST /api/orders/:id/finalize
(Igual que Mercado Pago)

- ✓ Stock deducido
- Si stock negativo: puede confirmar con force=true
```

### Paso 5: (Opcional) Admin actualiza stock
```
POST /api/orders/product/update-stock
Body: { productId: "...", newStock: 50 }
```

---

## Flujo de Stock

### Comportamiento Normal
1. Stock suficiente → Deducción exitosa ✓
2. Stock insuficiente en Finalizar → Error (puede usar force=true) ⚠️

### Con force=true (Confirmar con stock negativo)
```
POST /api/orders/:id/finalize
Body: { force: true }

- Stock se deduce igual (puede quedar negativo)
- Devuelve lista de productos agotados (stock <= 0)
- Admin entonces actualiza stock manualmente
```

### Actualizar Stock Agotado
```
POST /api/orders/product/update-stock
Body: { productId: "65abc...", newStock: 20 }

Resultado: Producto actualizado con nuevo stock
```

---

## Endpoints Disponibles

### Crear Orden
```
POST /api/orders
Body: { metodoPago, items, cuponCodigo?, guestData?, userId? }
Auth: Opcional
```

### Obtener mis órdenes (usuario logueado)
```
GET /api/orders/my
Auth: Requerido
```

### Rastrear por código
```
GET /api/orders/track/:codigo
Auth: No requerido
```

### Listar todas (admin)
```
GET /api/orders
Auth: Requerido + adminOnly
Query: ?estado=pendiente&page=1&limit=20
```

### Actualizar estado (admin)
```
PUT /api/orders/:id
Body: { estadoPago?, estadoEnvio? }
Auth: Requerido + adminOnly
```

### Marcar como enviado
```
POST /api/orders/dispatch
Body: { codigo }
Auth: Requerido + adminOnly
```

### Finalizar orden (deducir stock) (admin)
```
POST /api/orders/:id/finalize
Body: { force?: true }
Auth: Requerido + adminOnly
Response: { order, agotados }
```

### Actualizar stock de producto (admin)
```
POST /api/orders/product/update-stock
Body: { productId, newStock }
Auth: Requerido + adminOnly
```

### Eliminar orden (solo finalizadas)
```
DELETE /api/orders/:id
Auth: Requerido + adminOnly
```

---

## Resumen de Cambios

✅ **Stock NO se deduce en webhook MP** → Solo cambia estadoPago a 'aprobado'
✅ **Stock se deduce en Finalizar** → Admin control completo
✅ **Mercado Pago: pago automático** → envío pendiente (admin despacha)
✅ **WhatsApp: ambos pendientes** → Admin aprueba pago + despacha
✅ **Stock negativo permitido con force** → Admin actualiza después
✅ **Endpoint nuevo** → POST /api/orders/product/update-stock

