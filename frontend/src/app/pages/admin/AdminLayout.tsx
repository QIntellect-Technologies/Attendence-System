import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  LogOut,
  Menu,
  X,
  Fingerprint,
  ChevronRight,
  Settings,
  DollarSign,
  CalendarDays,
  UserCog,
  Clock, // Added for Overtime
  BarChart3, // Added for Reports
  Sliders, // Added for Salary Config
  MonitorPlay,
} from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // FULLY UPDATED Navigation with all missing modules from Figma design
  const navigation = [
    { name: "Attendance Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "HR Module", href: "/admin/hr", icon: UserCog },
    { name: "Staff Directory", href: "/admin/staff", icon: Users },
    { name: "Attendance History", href: "/admin/attendance", icon: Calendar },
    { name: "Payroll", href: "/admin/payroll", icon: DollarSign },
    { name: "Salary Config", href: "/admin/salary-config", icon: Sliders }, // New
    { name: "Overtime Management", href: "/admin/overtime", icon: Clock }, // New
    { name: "Live Scan Terminal", href: "/admin/live-marker", icon: Video },
    { name: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 }, // New
    { name: "Live CCTV Tracking", href: "/admin/live-cctv", icon: MonitorPlay },
  
{ name: "Leave Management", href: "/admin/leave-requests", icon: CalendarDays },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-[70] h-full w-80 bg-white border-r border-slate-200 
          transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* System Branding */}
          <div className="p-8 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Fingerprint className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                  Attendance
                </h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1">
                  Management System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-6 py-8 space-y-1.5 overflow-y-auto">
            {" "}
            {/* Added overflow for many links */}
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200
                    ${
                      active
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <Icon
                      className={`w-5 h-5 ${active ? "text-blue-400" : "group-hover:text-slate-900"}`}
                    />
                    <span className="font-bold text-[11px] uppercase tracking-widest">
                      {item.name}
                    </span>
                  </div>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout Section */}
          <div className="p-6 border-t border-slate-100">
            <div className="flex items-center gap-4 px-2 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-600 border border-slate-200">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 uppercase truncate">
                  System Admin
                </p>
                <p className="text-[10px] font-medium text-slate-400 truncate italic">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-4 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em]"
            >
              <LogOut className="w-4 h-4" />
              Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-80">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-5 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                  {navigation.find((item) => isActive(item.href))?.name ||
                    "Overview"}
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Live Database Sync Active
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Rendering */}
        <main className="p-6 lg:p-10 min-h-[calc(100vh-80px)]">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
