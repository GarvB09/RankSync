/**
 * App.jsx — Root component with routing
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './context/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthSuccessPage from './pages/OAuthSuccessPage';
import SetUsernamePage from './pages/SetUsernamePage';
import DashboardPage from './pages/DashboardPage';
import FindDuoPage from './pages/FindDuoPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import AppLayout from './components/layout/AppLayout';

// ─── Route Guards ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  // Wait for Zustand to read from localStorage before deciding.
  // Without this, the first render always sees isAuthenticated=false and
  // redirects to /login before the stored token is loaded.
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-4 border-pp-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.needsUsername) return <Navigate to="/setup-username" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  if (!_hasHydrated) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { refreshUser, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) refreshUser();
  }, [_hasHydrated]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/oauth-success" element={<OAuthSuccessPage />} />

      {/* Username setup — requires auth but bypasses needsUsername check */}
      <Route
        path="/setup-username"
        element={
          useAuthStore.getState().isAuthenticated
            ? <SetUsernamePage />
            : <Navigate to="/login" replace />
        }
      />

      {/* Protected routes inside AppLayout */}
      <Route
        path="/"
        element={<PrivateRoute><AppLayout /></PrivateRoute>}
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="find-duo" element={<FindDuoPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
