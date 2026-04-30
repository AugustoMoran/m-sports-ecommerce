export const generateWhatsAppLink = (items, total, phone) => {
  const number = phone || import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const itemsList = items
    .map((i) => {
      const price = i.producto?.precioOferta || i.producto?.precio || i.precio;
      let itemText = `• ${i.producto?.nombre || i.nombre} x${i.cantidad}`;
      if (i.talla) itemText += ` - Talla: ${i.talla}`;
      if (i.color) itemText += ` - Color: ${i.color}`;
      itemText += ` = $${(price * i.cantidad).toFixed(2)}`;
      return itemText;
    })
    .join('\n');

  const message = encodeURIComponent(
    `🛒 *Nuevo pedido desde la tienda*\n\n${itemsList}\n\n*Total: $${total.toFixed(2)}*\n\n¡Quiero finalizar mi compra!`
  );

  return `https://wa.me/${number}?text=${message}`;
};
