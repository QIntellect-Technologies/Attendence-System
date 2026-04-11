import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LogOut,
  Users,
  Clock,
  Calendar,
  TrendingUp,
  BarChart3,
  FileText,
  Video,
  Camera,
  DollarSign, // ← Naya icon Payroll ke liye
} from "lucide-react";

export default function HRLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/hr") return location.pathname === "/hr";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">AP</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">
                ATTENDANCE <span className="text-purple-500">PRO</span>
              </h1>
              <p className="text-xs text-purple-400 -mt-1">HR PORTAL</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-5 py-2 bg-slate-800 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-lg">
                👩‍💼
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {user?.name || "Hooriya HR"}
                </p>
                <p className="text-xs text-purple-400">Human Resources</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 hover:text-red-300 transition-all font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-[#0f172a] border-r border-slate-800 p-6 flex flex-col">
          <nav className="flex-1 space-y-2">
            <div
              onClick={() => navigate("/hr")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr") && location.pathname === "/hr"
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <BarChart3 size={20} />
              HR Dashboard
            </div>

            <div
              onClick={() => navigate("/hr/employees")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/employees")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Users size={20} />
              Staff Directory
            </div>

            <div
              onClick={() => navigate("/hr/attendance")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/attendance")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Clock size={20} />
              Attendance History
            </div>

            <div
              onClick={() => navigate("/hr/leave-requests")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/leave-requests")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Calendar size={20} />
              Leave Management
            </div>

            {/* ====================== PAYROLL MANAGEMENT ====================== */}
            <div
              onClick={() => navigate("/hr/payroll")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/payroll")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <DollarSign size={20} />
              Payroll Management
            </div>
<div
  onClick={() => navigate("/hr/salary-config")}
  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
    isActive("/hr/salary-config") ? "bg-purple-600 text-white" : "hover:bg-slate-800 text-slate-300"
  }`}
>
  <DollarSign size={20} />
  Salary Configuration
</div>

            {/* ================================================================ */}

            <div
              onClick={() => navigate("/hr/overtime")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/overtime")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <TrendingUp size={20} />
              Overtime Management
            </div>

            <div
              onClick={() => navigate("/hr/performance")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/performance")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <FileText size={20} />
              Performance Reports
            </div>

            <div
              onClick={() => navigate("/hr/live-attendance")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/live-attendance")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >              
              <Camera size={20} />
              Live Attendance
            </div>

            <div
              onClick={() => navigate("/hr/verifications")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all font-medium ${
                isActive("/hr/verifications")
                  ? "bg-purple-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Video size={20} />
              Staff Verifications
            </div>
          </nav>

          <div className="mt-auto pt-8 text-xs text-slate-500 px-4">
            © 2026 Attendance Pro • HR Portal
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-[#0a0f1c]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
