import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompany?: boolean;
}

export function ProtectedRoute({ children, requireCompany = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, currentCompany } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to company selection if authenticated but no company is selected
  if (!currentCompany) {
    return <Navigate to="/companies" replace />;
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, currentCompany } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Redirect authenticated users
  if (isAuthenticated) {
    // If user has a current company, go to dashboard
    if (currentCompany) {
      return <Navigate to="/dashboard" replace />;
    }
    // Otherwise, go to company selection
    return <Navigate to="/companies" replace />;
  }

  return <>{children}</>;
}
