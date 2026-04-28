import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser, selectIsAdmin, logout as logoutAction } from '../features/auth/authSlice';
import { useLogoutMutation } from '../services/authApi';
import { clearGuestCart } from '../features/cart/cartSlice';
import toast from 'react-hot-toast';

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAdmin = useSelector(selectIsAdmin);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (_) {}
    dispatch(logoutAction());
    dispatch(clearGuestCart());
    toast.success('Sesión cerrada');
    navigate('/');
  };

  return {
    user,
    isAdmin,
    isAuthenticated: !!user,
    logout: handleLogout,
  };
};

export default useAuth;
