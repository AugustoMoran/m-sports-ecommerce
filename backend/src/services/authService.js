const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Cart = require('../models/Cart');
const {
  generateAccessToken,
  generateRefreshToken,
  clearRefreshTokenCookie,
} = require('../utils/generateToken');

const register = async ({ nombre, apellido, email, password, telefono }) => {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('El email ya está registrado.'), { statusCode: 400 });

  const user = await User.create({ nombre, apellido, email, password, telefono });
  return user;
};

const login = async (email, password) => {
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) throw Object.assign(new Error('Credenciales inválidas.'), { statusCode: 401 });

  const valid = await user.comparePassword(password);
  if (!valid) throw Object.assign(new Error('Credenciales inválidas.'), { statusCode: 401 });

  return user;
};

const refreshTokens = async (oldToken) => {
  const stored = await RefreshToken.findOne({ token: oldToken, revoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token inválido o expirado.'), { statusCode: 401 });
  }

  // Rotate: revoke old, issue new
  stored.revoked = true;
  await stored.save();

  const newRefreshToken = await generateRefreshToken(stored.usuario);
  const newAccessToken = generateAccessToken(stored.usuario);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (token, res) => {
  if (token) {
    await RefreshToken.updateOne({ token }, { revoked: true });
  }
  clearRefreshTokenCookie(res);
};

const mergeGuestCart = async (userId, guestItems) => {
  if (!guestItems || !guestItems.length) return;

  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) {
    cart = new Cart({ usuario: userId, items: [] });
  }

  for (const guestItem of guestItems) {
    const existing = cart.items.find(
      (i) => i.producto.toString() === guestItem.producto
    );
    if (existing) {
      existing.cantidad += guestItem.cantidad;
    } else {
      cart.items.push({ producto: guestItem.producto, cantidad: guestItem.cantidad });
    }
  }
  await cart.save();
};

module.exports = { register, login, refreshTokens, logout, mergeGuestCart };
