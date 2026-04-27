import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';

export const useAuth = () => {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      clearAuth();
      navigate('/login');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    setAuth,
    clearAuth,
    logout,
  };
};
