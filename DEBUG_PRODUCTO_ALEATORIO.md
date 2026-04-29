# Debug: Valores Aleatorios en Edición de Productos

## Problema Reportado
Cuando se edita un producto sin escribir nada y se guarda rápido, los valores (especialmente stock) cambian solos a valores aleatorios.

## Causa Raíz: Inconsistencia de Tipos

### El Bug
El formulario tenía **tipos de datos inconsistentes**:

```javascript
// Inicio del formulario (strings vacíos):
EMPTY = { stock: '' }

// Al cargar un producto (números):
setForm({ stock: p.stock })  // p.stock es Number
// form.stock = 100 (number)

// En inputs HTML (siempre strings):
<input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
// form.stock = "100" (string)
```

### El Escenario Problemático
1. Admin abre modal para editar producto
2. `handleEdit()` carga: `stock: 100` (number desde BD)
3. Si admin **no toca** el input de stock y guarda rápido
4. El estado `form.stock` puede estar mezclado entre número/string
5. Al hacer `handleSubmit()`, `Number(form.stock)` con un valor inconsistente genera un valor impredecible

### Posibles Causas Adicionales
- **React batching**: Si había múltiples cambios de estado sin sincronización
- **Convertir número ↔ string**: Sin normalización clara
- **Falta de validación**: No verificaba que inputs requeridos tuvieran valores antes de convertir

---

## Solución Aplicada

### 1. Función `normalizeForm()` (Nueva)
```javascript
const normalizeForm = (formData) => ({
  nombre: String(formData.nombre || ''),
  descripcion: String(formData.descripcion || ''),
  precio: String(formData.precio || ''),
  precioOferta: String(formData.precioOferta || ''),
  stock: String(formData.stock || ''),
  categoria: String(formData.categoria || ''),
  tags: String(formData.tags || ''),
});
```

✅ Todos los valores siempre son **strings** en el estado
✅ Consistencia garantizada entre carga y entrada del usuario

### 2. Actualizar `handleEdit()`
```javascript
const handleEdit = (p) => {
  setForm(normalizeForm({  // ← ANTES: mezclaba tipos
    nombre: p.nombre,
    precio: p.precio,      // Número desde BD
    stock: p.stock,        // Número desde BD
    // ...
  }));
};
```

✅ Ahora convierte a string inmediatamente

### 3. Mejorar `handleSubmit()`
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // NUEVA: Validación antes de convertir
  if (!form.nombre.trim() || !form.precio) {
    toast.error('Nombre y Precio son requeridos');
    return;
  }

  const payload = {
    nombre: form.nombre.trim(),
    precio: Number(form.precio),         // ← Conversión clara
    stock: Number(form.stock) || 0,      // ← Fallback a 0 si vacío
    precioOferta: form.precioOferta ? Number(form.precioOferta) : undefined,
    tags: form.tags 
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [],
  };
  
  // Guarda con payload validado
};
```

✅ Valida antes de enviar
✅ Conversiones explícitas con fallbacks
✅ No envía valores vacíos o NaN

---

## Cambios Aplicados

| Archivo | Cambio | Efecto |
|---------|--------|--------|
| ProductsAdmin.jsx | + `normalizeForm()` | Garantiza tipos string consistentes |
| ProductsAdmin.jsx | `handleEdit()` usa normalizeForm() | Conversión inmediata de BD → string |
| ProductsAdmin.jsx | `handleSubmit()` con validación | Evita valores NaN o incompletos |
| ProductsAdmin.jsx | Labels con `*` | Clarifica campos requeridos |

---

## Pruebas Recomendadas

1. **Editar sin cambiar valores**
   - Abre producto → No toca nada → Guarda
   - Resultado: Valores deben mantenerse igual ✓

2. **Cambiar solo stock**
   - Abre producto → Cambia solo stock → Guarda
   - Resultado: Otros valores intactos ✓

3. **Guardar rápido (antes que cargue)**
   - Abre producto → Toca nombre → Guarda inmediatamente
   - Resultado: Sin valores aleatorios ✓

4. **Valores vacíos**
   - Abre producto → Vacía nombre → Intenta guardar
   - Resultado: Error "Nombre y Precio son requeridos" ✓

5. **Stock 0 o vacío**
   - Edita → Vacía stock → Guarda
   - Resultado: Stock se establece a 0 ✓

---

## Resumen

**Antes**: Valores número/string mezclados → Conversiones impredecibles → Valores aleatorios
**Después**: Todos string en estado → Validación clara → Conversión predecible → Valores correctos

