import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  addItem,
  removeItem,
  updateQuantity,
  clearGuestCart,
  toggleCart,
  setItems,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  selectCartIsOpen,
} from '../features/cart/cartSlice';
import {
  useAddToCartMutation,
  useRemoveFromCartMutation,
  useUpdateCartItemMutation,
  useClearCartMutation,
} from '../services/cartApi';
import { selectCurrentUser } from '../features/auth/authSlice';

const useCart = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const items = useSelector(selectCartItems);
  const count = useSelector(selectCartCount);
  const total = useSelector(selectCartTotal);
  const isOpen = useSelector(selectCartIsOpen);
  const [addToCartApi] = useAddToCartMutation();
  const [removeFromCartApi] = useRemoveFromCartMutation();
  const [updateCartItemApi] = useUpdateCartItemMutation();
  const [clearCartApi] = useClearCartMutation();

  const handleAddToCart = async (producto, cantidad = 1) => {
    if (user) {
      try {
        const result = await addToCartApi({ productoId: producto._id, cantidad }).unwrap();
        if (result?.items) dispatch(setItems(result.items));
        toast.success('Agregado al carrito');
      } catch (err) {
        toast.error(err?.data?.message || 'Error al agregar al carrito');
        return;
      }
    } else {
      dispatch(addItem({ producto, cantidad }));
      toast.success('Agregado al carrito');
    }
    dispatch(toggleCart());
  };

  const handleRemove = async (productoId) => {
    if (user) {
      try {
        const result = await removeFromCartApi(productoId).unwrap();
        if (result?.items) dispatch(setItems(result.items));
      } catch {
        dispatch(removeItem(productoId));
      }
    } else {
      dispatch(removeItem(productoId));
    }
  };

  const handleUpdate = async (productoId, cantidad) => {
    if (user) {
      try {
        if (cantidad <= 0) {
          const result = await removeFromCartApi(productoId).unwrap();
          if (result?.items) dispatch(setItems(result.items));
        } else {
          const result = await updateCartItemApi({ productoId, cantidad }).unwrap();
          if (result?.items) dispatch(setItems(result.items));
        }
      } catch {
        dispatch(updateQuantity({ productoId, cantidad }));
      }
    } else {
      dispatch(updateQuantity({ productoId, cantidad }));
    }
  };

  const handleClear = async () => {
    if (user) {
      try {
        await clearCartApi().unwrap();
      } catch { /* continue to clear local state */ }
    }
    dispatch(clearGuestCart());
  };

  return {
    items,
    count,
    total,
    isOpen,
    addToCart: handleAddToCart,
    removeFromCart: handleRemove,
    updateQuantity: handleUpdate,
    clearCart: handleClear,
    toggleCart: () => dispatch(toggleCart()),
  };
};

export default useCart;
