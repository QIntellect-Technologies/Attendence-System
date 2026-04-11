import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getStaffById } from "../../utils/storage";
import { Staff } from "../../types";
import {
  Home,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Calendar,
  Briefcase,
} from "lucide-react";

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staffInfo, setStaffInfo] = useState<Staff | null>(null);

  useEffect(() => {
    const allowedStaffRoles = [
      "staff",
      "manager",
      "developer",
      "hr_executive",
      "ceo",
      "product_lead",
      "strategic_advisor",
    ];

    if (!user || !allowedStaffRoles.includes(user.role)) {
      navigate("/", { replace: true });
      return;
    }

    if (user.staffId) {
      const staff = getStaffById(user.staffId);
      if (staff) {
        setStaffInfo(staff);
      }
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // --- UPDATED NAVIGATION WITH LEAVE & OVERTIME ---
  const navigation = [
    { name: "Dashboard", href: "/staff", icon: Home },
    { name: "My Profile", href: "/staff/profile", icon: User },
    { name: "Leave Requests", href: "/staff/leave", icon: Calendar },
    {
      name: "Overtime Management",
      href: "/staff/overtime",
      icon: Briefcase,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/staff") {
      return location.pathname === "/staff" || location.pathname === "/staff/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-100 
          transform transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 border-b border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter">
                Staff <span className="text-green-600">Portal</span>
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-[10px] text-green-600 font-black uppercase tracking-[0.2em]">
                System Authenticated
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group ${
                    active
                      ? "bg-green-600 text-white shadow-lg shadow-green-100 scale-[1.02]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? "text-white" : "text-slate-400 group-hover:text-green-500"}`}
                  />
                  <span className="font-bold tracking-tight">{item.name}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section (Bottom) */}
          <div className="p-6 mt-auto">
            <div className="bg-slate-50 rounded-[2rem] p-5 border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 font-black text-xl shadow-sm border border-slate-100">
                    {staffInfo?.name?.charAt(0) || "U"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white w-4 h-4 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 truncate text-sm">
                    {staffInfo?.name || "User"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                    {staffInfo?.position || "Team Member"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-red-500 hover:bg-red-50 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-slate-100 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-5 lg:px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                Current Session
              </h2>
              <p className="text-lg font-black text-slate-800">
                {navigation.find((item) => isActive(item.href))?.name ||
                  "Dashboard"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">
                Server Status
              </span>
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                Operational
              </span>
            </div>
            <div className="p-2.5 bg-green-50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
