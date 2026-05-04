import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Requires login
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Requires admin role
export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};

// Redirect logged-in users away from auth pages
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
};
