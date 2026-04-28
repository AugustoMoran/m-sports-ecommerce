import { createSlice } from '@reduxjs/toolkit';

const loadFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('guestCart') || '[]');
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  localStorage.setItem('guestCart', JSON.stringify(items));
};

const initialState = {
  items: loadFromStorage(),
  isOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { producto, cantidad = 1 } = action.payload;
      const existing = state.items.find((i) => i.producto === producto._id || i.producto?._id === producto._id);
      if (existing) {
        existing.cantidad += cantidad;
      } else {
        state.items.push({ producto, cantidad });
      }
      saveToStorage(state.items);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(
        (i) => (i.producto._id || i.producto) !== action.payload
      );
      saveToStorage(state.items);
    },
    updateQuantity: (state, action) => {
      const { productoId, cantidad } = action.payload;
      const item = state.items.find((i) => (i.producto._id || i.producto) === productoId);
      if (item) {
        if (cantidad <= 0) {
          state.items = state.items.filter((i) => (i.producto._id || i.producto) !== productoId);
        } else {
          item.cantidad = cantidad;
        }
      }
      saveToStorage(state.items);
    },
    clearGuestCart: (state) => {
      state.items = [];
      localStorage.removeItem('guestCart');
    },
    setItems: (state, action) => {
      state.items = action.payload;
      saveToStorage(state.items);
    },
    openCart: (state) => { state.isOpen = true; },
    closeCart: (state) => { state.isOpen = false; },
    toggleCart: (state) => { state.isOpen = !state.isOpen; },
  },
});

export const { addItem, removeItem, updateQuantity, clearGuestCart, setItems, openCart, closeCart, toggleCart } = cartSlice.actions;
export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartIsOpen = (state) => state.cart.isOpen;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.cantidad, 0);
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => {
    const price = i.producto?.precioOferta || i.producto?.precio || 0;
    return sum + price * i.cantidad;
  }, 0);
