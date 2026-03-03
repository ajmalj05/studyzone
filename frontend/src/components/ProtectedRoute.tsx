import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, token, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex flex-col items-center justify-center">Loading...</div>;
    }

    if (!token || !user) {
        if (allowedRoles.includes('admin') && allowedRoles.length === 1) {
            return <Navigate to="/admin-login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard if they try to access another role's route
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'parent') return <Navigate to="/parent/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
