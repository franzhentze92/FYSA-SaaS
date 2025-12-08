import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@/services/userService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const currentUser = getCurrentUser();
  const isAuthenticated = currentUser !== null && currentUser.activo;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

