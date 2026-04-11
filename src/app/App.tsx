import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { Toaster } from 'sonner';

const ProtectedRoute: React.FC<{ children: React.ReactNode, role: 'admin' | 'staff' }> = ({ children, role }) => {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.role !== role) {
    // Redirect to their appropriate dashboard if they try to access the wrong one
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/staff'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/staff" 
        element={
          <ProtectedRoute role="staff">
            <StaffDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AppProvider>
    </BrowserRouter>
  );
}
