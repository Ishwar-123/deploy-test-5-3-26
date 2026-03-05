import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loader"></div>
            </div>
        );
    }

    if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log(`ProtectedRoute: Role mismatch. User role: ${user.role}, Allowed: ${allowedRoles}`);
        // Redirect to appropriate dashboard based on role
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'vendor') return <Navigate to="/vendor/dashboard" replace />;
        if (user.role === 'reader') return <Navigate to="/reader/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
