import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";

// Admin Imports
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";

import { useAuth } from "./contexts/useAuth";

// Protected Route
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, isAuthenticated } = useAuth() as any;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },

  // Admin Routes
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      // { path: "staff", element: <StaffManagement /> },
      // { path: "attendance", element: <AttendanceView /> },
      // { path: "live-marker", element: <LiveAttendanceMarker /> },
      // { path: "payroll", element: <PayrollModule /> },
      // { path: "salary-config", element: <SalaryConfig /> },
      // { path: "overtime", element: <OvertimeManagement /> },
      // { path: "live-cctv", element: <LiveCCTVTracking /> },
      // { path: "reports", element: <Reports /> },
      // { path: "leave-requests", element: <LeaveManagement /> },
    ],
  },

  // HR Routes
  {
    path: "/hr",
    children: [
      // { index: true, element: <HRDashboard /> },
    ],
  },

  // Staff Routes
  {
    path: "/staff",
    children: [
      // { index: true, element: <StaffDashboard /> },
    ],
  },

  // Catch all
  { path: "*", element: <Navigate to="/" replace /> },
]);
