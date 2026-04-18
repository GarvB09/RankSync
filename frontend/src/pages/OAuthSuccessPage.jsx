// OAuthSuccessPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { setToken, refreshUser } = useAuthStore();

  useEffect(() => {
    // Token is passed as a hash fragment (#token=...) to avoid appearing in server logs
    const hash = window.location.hash.slice(1);
    const token = new URLSearchParams(hash).get('token');

    if (token) {
      // Clear hash from URL so token doesn't linger in browser history
      window.history.replaceState(null, '', window.location.pathname);
      setToken(token);
      refreshUser().then(() => {
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
