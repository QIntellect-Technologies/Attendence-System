import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import AttendanceView from "./pages/admin/AttendanceView";
import LiveAttendanceMarker from "./pages/admin/LiveAttendanceMarker";
import HRModule from "./pages/admin/HRModule";
import PayrollModule from "./pages/admin/PayrollModule";
import OvertimeManagement from "./pages/admin/OvertimeManagement";
import LiveCCTVTracking from "./pages/admin/LiveCCTVTracking";
import Reports from "./pages/admin/Reports"; // Dashboard analytics page
import LeaveManagement from "./pages/admin/LeaveManagement";

// --- Naye Modules ke Imports ---
import SalaryConfig from "./pages/admin/SalaryConfig";

import StaffLayout from "./pages/staff/StaffLayout";
import StaffDashboard from "./pages/staff/Dashboard";
import StaffProfile from "./pages/staff/Profile";

// --- Staff ke naye pages yahan import karein ---
import LeaveRequest from "./pages/staff/LeaveRequest";
import StaffOvertime from "./pages/staff/OvertimeManagement"; // Naam change kiya taake Admin wale se clash na ho

import { useAuth } from "./contexts/AuthContext";

// --- Protected Route Wrapper ---
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/staff"} replace />
    );
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "staff", element: <StaffManagement /> },
      { path: "attendance", element: <AttendanceView /> },
      { path: "live-marker", element: <LiveAttendanceMarker /> },
      { path: "hr", element: <HRModule /> },
      { path: "payroll", element: <PayrollModule /> },
      { path: "salary-config", element: <SalaryConfig /> },
      { path: "overtime", element: <OvertimeManagement /> },
      { path: "live-cctv", element: <LiveCCTVTracking /> },
      { path: "reports", element: <Reports /> },
      { path: "leave-requests", element: <LeaveManagement /> },
    ],
  },
  {
    path: "/staff",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "staff",
          "manager",
          "developer",
          "hr_executive",
          "ceo",
          "product_lead",
          "strategic_advisor",
        ]}
      >
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StaffDashboard /> },
      { path: "profile", element: <StaffProfile /> },
      // --- Staff ke liye naye Routes ---
      { path: "leave", element: <LeaveRequest /> },
      { path: "overtime", element: <StaffOvertime /> },
    ],
  },
]);
