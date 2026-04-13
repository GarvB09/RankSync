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
      refreshUser().then(() => navigate('/dashboard'));
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div className="min-h-screen bg-valo-dark flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-valo-red border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
