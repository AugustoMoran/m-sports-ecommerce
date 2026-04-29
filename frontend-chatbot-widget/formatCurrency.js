// Simple currency formatter (puedes mejorar esto según tu app)
export function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}
