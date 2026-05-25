import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";

interface AuthUser {
  name?: string;
  email?: string;
  role?: string;
}

import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  LogOut,
  Menu,
  X,
  Fingerprint,
  Settings,
  DollarSign,
  CalendarDays,
  UserCog,
  Clock,
  BarChart3,
  Sliders,
  MonitorPlay,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "HR Module", href: "/admin/hr", icon: UserCog },
  { name: "Staff Directory", href: "/admin/staff", icon: Users },
  { name: "Attendance", href: "/admin/attendance", icon: Calendar },
  { name: "Payroll", href: "/admin/payroll", icon: DollarSign },
  { name: "Salary Config", href: "/admin/salary-config", icon: Sliders },
  { name: "Overtime", href: "/admin/overtime", icon: Clock },
  { name: "Live Scan", href: "/admin/live-marker", icon: Video },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Live CCTV", href: "/admin/live-cctv", icon: MonitorPlay },
  { name: "Leave Requests", href: "/admin/leave-requests", icon: CalendarDays },
];

export default function AdminLayout() {
  const { user: _user, logout: _logout } = useAuth() as any;
  const user: AuthUser | null = (_user as AuthUser) ?? null;
  const logout: () => void = _logout ?? (() => {});
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const currentPage =
    navigation.find((item) => isActive(item.href))?.name || "Dashboard";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-page)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(15,23,42,0.4)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-50 lg:static lg:z-auto hide-scrollbar ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: "var(--sidebar-width)",
          minWidth: "var(--sidebar-width)",
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "22px 18px 18px",
            borderBottom: "1px solid var(--sidebar-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              flexShrink: 0,
              background:
                "linear-gradient(135deg, var(--teal-600), var(--teal-700))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Fingerprint size={20} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-heading)",
                letterSpacing: "-0.3px",
                lineHeight: 1,
              }}
            >
              AttendAI
            </p>
            <p
              style={{
                fontSize: 10,
                color: "var(--text-light)",
                marginTop: 2,
                letterSpacing: "0.05em",
              }}
            >
              Admin Panel
            </p>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{
              color: "var(--text-light)",
              lineHeight: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Section label */}
        <p
          style={{
            padding: "18px 18px 8px",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-light)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            flexShrink: 0,
          }}
        >
          Main Menu
        </p>

        {/* Nav */}
        <nav
          style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}
          className="hide-scrollbar"
        >
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "15px 10px",
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: "none",
                  background: active ? "var(--teal-100)" : "transparent",
                  borderLeft: active
                    ? "3px solid var(--teal-600)"
                    : "3px solid transparent",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--teal-50)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <Icon
                  size={17}
                  color={active ? "var(--text-heading)" : "var(--sidebar-icon)"}
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active
                      ? "var(--text-heading)"
                      : "var(--sidebar-text)",
                    flex: 1,
                  }}
                >
                  {item.name}
                </span>
                {active && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--teal-600)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div
          style={{
            padding: "12px",
            borderTop: "1px solid var(--sidebar-border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "var(--slate-50)",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  "linear-gradient(135deg, var(--teal-600), var(--navy-600))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "A"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-heading)",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.name || "Admin"}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-light)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.email || "admin@attendai.com"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--red-100)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "transparent")
              }
            >
              <LogOut size={14} color="var(--red-600)" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid var(--sidebar-border)",
            padding: "0 32px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--slate-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Menu size={18} color="var(--slate-600)" />
            </button>
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text-heading)",
                  letterSpacing: "-0.4px",
                  lineHeight: 1,
                }}
              >
                {currentPage}
              </h1>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-light)",
                  marginTop: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22C55E",
                  }}
                />
                Live database sync active
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: 8,
                padding: "0 14px",
                height: 38,
                background: "var(--slate-50)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                width: 210,
              }}
            >
              <Search size={14} color="var(--text-light)" />
              <input
                placeholder="Search anything..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "var(--slate-600)",
                  flex: 1,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              style={{
                position: "relative",
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--slate-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Bell size={16} color="var(--slate-600)" />
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--red-600)",
                  border: "1.5px solid #fff",
                }}
              />
            </button>
            <button
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--slate-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Settings size={16} color="var(--slate-600)" />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--teal-600), var(--navy-600))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="hidden md:block">
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-heading)",
                    lineHeight: 1,
                  }}
                >
                  {user?.name || "Admin"}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--text-light)",
                    marginTop: 2,
                  }}
                >
                  {user?.role || "Administrator"}
                </p>
              </div>
              <ChevronDown size={14} color="var(--text-light)" />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
