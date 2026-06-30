import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  allowedRoles: string[];
}

function getPathRole(pathname: string): string {
  if (pathname.startsWith('/admin/')) return 'admin';
  if (pathname.startsWith('/restaurant/')) return 'restaurant_admin';
  if (pathname.startsWith('/rider/')) return 'rider';
  return '';
}

export default function RoleRoute({ allowedRoles }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const location = useLocation();

  if (authLoading || profileLoading) return <LoadingSpinner />;

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  const resolvedRole = profile?.role || user?.user_metadata?.role || user?.app_metadata?.role || getPathRole(location.pathname) || '';

  if (!allowedRoles.includes(resolvedRole)) {
    if (resolvedRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (resolvedRole === 'restaurant_admin') return <Navigate to="/restaurant/dashboard" replace />;
    if (resolvedRole === 'rider') return <Navigate to="/rider/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}