import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isApproved } = useAuth();

  console.log('ProtectedRoute: isAuthenticated', isAuthenticated, 'isApproved', isApproved);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isApproved) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute; 