import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  allowedRoles: string[];
}

export default function RoleRoute({ allowedRoles }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);

  if (authLoading || profileLoading) return <LoadingSpinner />;

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role → go to their correct dashboard
  if (!allowedRoles.includes(profile?.role || '')) {
    const role = profile?.role || 'customer';
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'restaurant_admin') return <Navigate to="/restaurant/dashboard" replace />;
    if (role === 'rider') return <Navigate to="/rider/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}