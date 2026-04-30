const transporter = require('../config/mailer');

const formatOrderItems = (items) => {
  return items
    .map((i) => `- ${i.nombre} x${i.cantidad} (Talla: ${i.talla}, Color: ${i.color}) = $${(i.precio * i.cantidad).toFixed(2)}`)
    .join('\n');
};

const sendOrderConfirmationToUser = async (email, order) => {
  const itemsText = formatOrderItems(order.items);
  const userName = order.usuario 
    ? `${order.usuario.nombre} ${order.usuario.apellido}`
    : `${order.guestData.nombre} ${order.guestData.apellido}`;
  
  await transporter.sendMail({
    from: `"Tienda Online" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `✅ Confirmación de pedido #${order.codigo}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">¡Gracias por tu compra, ${userName}!</h2>
        <p>Tu código de pedido es: <strong style="font-size:20px;color:#1e40af">${order.codigo}</strong></p>
        <h3>Detalle de tu pedido:</h3>
        <pre style="background:#f1f5f9;padding:12px;border-radius:8px">${itemsText}</pre>
        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
        <p>Estado de pago: <strong>${order.estadoPago}</strong></p>
        <p>Método de pago: <strong>${order.metodoPago}</strong></p>
        <p style="color:#64748b;font-size:12px;margin-top:20px">Guardá este código para rastrear tu pedido.</p>
      </div>
    `,
  });
};

const sendOrderNotificationToAdmin = async (order) => {
  const itemsText = formatOrderItems(order.items);
  const recipientName = order.usuario
    ? `${order.usuario.nombre} ${order.usuario.apellido}`
    : `${order.guestData.nombre} ${order.guestData.apellido}`;
  const recipientEmail = order.usuario ? order.usuario.email : order.guestData.email;
  const recipientPhone = order.usuario ? order.usuario.telefono : order.guestData.telefono;
  const recipientAddress = order.usuario ? order.usuario.direccion : order.guestData.direccion;

  await transporter.sendMail({
    from: `"Sistema Tienda" <${process.env.EMAIL_FROM}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🛒 Nueva orden #${order.codigo}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">Nueva orden recibida</h2>
        <p><strong>Código:</strong> ${order.codigo}</p>
        <p><strong>Cliente:</strong> ${recipientName}</p>
        <p><strong>Email:</strong> ${recipientEmail}</p>
        <p><strong>Teléfono:</strong> ${recipientPhone || 'No proporcionado'}</p>
        <p><strong>Dirección:</strong> ${recipientAddress || 'No proporcionada'}</p>
        <p><strong>Pago:</strong> ${order.metodoPago} - ${order.estadoPago}</p>
        <h3>Productos:</h3>
        <pre style="background:#f1f5f9;padding:12px;border-radius:8px">${itemsText}</pre>
        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
      </div>
    `,
  });
};

const sendShippingCodeEmail = async (email, order) => {
  await transporter.sendMail({
    from: `"Tienda Online" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `🚚 Tu pedido #${order.codigo} fue enviado`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">¡Tu pedido está en camino!</h2>
        <p>Tu código de seguimiento: <strong style="font-size:20px;color:#15803d">${order.codigo}</strong></p>
        <p>Estado: <strong>Enviado</strong></p>
        <p>Te notificaremos cuando sea entregado.</p>
      </div>
    `,
  });
};

module.exports = {
  sendOrderConfirmationToUser,
  sendOrderNotificationToAdmin,
  sendShippingCodeEmail,
};
