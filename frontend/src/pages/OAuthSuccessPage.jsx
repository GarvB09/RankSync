// OAuthSuccessPage.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';

export default function OAuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, refreshUser } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      refreshUser().then((state) => {
        // Check if Google user still needs to choose a username
        const user = useAuthStore.getState().user;
        if (user?.needsUsername) {
          navigate('/setup-username', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      });
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div className="min-h-screen bg-pp-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-pp-orange border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
