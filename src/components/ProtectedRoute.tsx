// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth(); // Add 'loading'
  const location = useLocation();

  // If we are still checking auth status, don't redirect yet!
  if (loading) return null; 

  if (!isLoggedIn) {
    localStorage.setItem('afterLoginRedirect', location.pathname);
    return (
      <Navigate
        to="/login"
        replace
        state={{ redirectTo: location.pathname }}
      />
    );
  }

  return <Outlet />;
}