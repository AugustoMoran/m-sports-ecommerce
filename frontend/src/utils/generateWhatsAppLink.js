export const generateWhatsAppLink = (items, total, phone) => {
  const number = phone || import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const itemsList = items
    .map((i) => {
      const price = i.producto?.precioOferta || i.producto?.precio || i.precio;
      return `• ${i.producto?.nombre || i.nombre} x${i.cantidad} = $${(price * i.cantidad).toFixed(2)}`;
    })
    .join('\n');

  const message = encodeURIComponent(
    `🛒 *Nuevo pedido desde la tienda*\n\n${itemsList}\n\n*Total: $${total.toFixed(2)}*\n\n¡Quiero finalizar mi compra!`
  );

  return `https://wa.me/${number}?text=${message}`;
};
