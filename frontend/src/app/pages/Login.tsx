import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import {
  AlertCircle,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Fingerprint,
  Shield,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

const TEAL = "#0D9488";
const NAVY = "#0F172A";
const BLUE = "#0EA5E9";
const BORDER = "#E2E8F0";
const SLATE_500 = "#64748B";
const SLATE_400 = "#94A3B8";

const ROLES = [
  {
    key: "admin",
    label: "Administrator",
    email: "admin@company.com",
    password: "admin123",
    icon: Shield,
    accent: TEAL,
    lightBg: "#F0FDFA",
    route: "/admin",
  },
  {
    key: "hr",
    label: "Human Resources",
    email: "hr@company.com",
    password: "hr123",
    icon: User,
    accent: BLUE,
    lightBg: "#F0F9FF",
    route: "/hr",
  },
  {
    key: "elon",
    label: "Elon (Staff)",
    email: "e@co.com",
    password: "123",
    icon: User,
    accent: "#6366F1",
    lightBg: "#EEF2FF",
    route: "/staff",
  },
  {
    key: "qaisar",
    label: "Qaisar (Staff)",
    email: "q@co.com",
    password: "123",
    icon: User,
    accent: "#F59E0B",
    lightBg: "#FFFBEB",
    route: "/staff",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const { login } = useAuth() as any;
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          const saved = JSON.parse(localStorage.getItem("currentUser") || "{}");
          if (saved.role === "admin") navigate("/admin", { replace: true });
          else if (saved.role === "hr") navigate("/hr", { replace: true });
          else navigate("/staff", { replace: true });
        }, 900);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillRole = (role: (typeof ROLES)[0]) => {
    setError("");
    setActiveRole(role.key);
    setEmail(role.email);
    setPassword(role.password);
  };

  const inputStyle = (focused?: boolean): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    padding: "11px 14px 11px 40px",
    borderRadius: 12,
    fontSize: 14,
    color: NAVY,
    background: "#fff",
    outline: "none",
    border: `1px solid ${focused ? TEAL : BORDER}`,
    transition: "border-color 0.15s",
  });

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'DM Sans',sans-serif", background: "#F0F4F8" }}
    >
      {/* LEFT — branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          width: 480,
          flexShrink: 0,
          background: `linear-gradient(145deg,${NAVY} 0%,#1E3A5F 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(circle,${TEAL}40,transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: `radial-gradient(circle,${BLUE}30,transparent 70%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3" style={{ marginBottom: 56 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(135deg,#0D9488,#0EA5E9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Fingerprint size={22} color="#fff" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.3px",
                }}
              >
                AttendAI
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.06em",
                }}
              >
                Management System
              </p>
            </div>
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              letterSpacing: "-0.7px",
              marginBottom: 14,
            }}
          >
            Smart Attendance
            <br />
            <span style={{ color: TEAL }}>Powered by AI</span>
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.75,
            }}
          >
            Biometric face recognition, GPS tracking,
            <br />
            and real-time analytics — all in one platform.
          </p>
        </div>

        <div className="relative z-10">
          {[
            { label: "YOLOv8 Face Recognition", dot: TEAL },
            { label: "GPS Field Staff Tracking", dot: BLUE },
            { label: "Real-time Attendance Logs", dot: "#F59E0B" },
            { label: "Role-based Access Control", dot: "#6366F1" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3"
              style={{
                marginBottom: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 16px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: f.dot,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${f.dot}`,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 500,
                }}
              >
                {f.label}
              </span>
            </div>
          ))}
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              marginTop: 20,
            }}
          >
            © 2026 AttendAI — Encrypted Biometric Terminal
          </p>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg,#0D9488,#0EA5E9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Fingerprint size={20} color="#fff" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
              AttendAI
            </p>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: NAVY,
                letterSpacing: "-0.5px",
                marginBottom: 6,
              }}
            >
              {isSuccess ? "Welcome back! 👋" : "Sign in to your account"}
            </h2>
            <p style={{ fontSize: 13, color: SLATE_500 }}>
              {isSuccess
                ? "Redirecting to your dashboard..."
                : "Enter your credentials or use quick access below"}
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-3 mb-4 rounded-xl px-4 py-3"
              style={{
                background: "#FFF1F2",
                border: "1px solid #FECDD3",
                fontSize: 13,
                color: "#E11D48",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {isSuccess && (
            <div
              className="flex items-center gap-3 mb-4 rounded-xl px-4 py-3"
              style={{
                background: "#F0FDFA",
                border: "1px solid #99F6E4",
                fontSize: 13,
                color: TEAL,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              Login successful — redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: NAVY,
                  marginBottom: 6,
                }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  color={SLATE_400}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  placeholder="name@company.com"
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setActiveRole(null);
                  }}
                  style={inputStyle()}
                  onFocus={(e) => (e.target.style.borderColor = TEAL)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: NAVY,
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  color={SLATE_400}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  placeholder="••••••••"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle(), paddingRight: 42 }}
                  onFocus={(e) => (e.target.style.borderColor = TEAL)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showPw ? (
                    <EyeOff size={16} color={SLATE_400} />
                  ) : (
                    <Eye size={16} color={SLATE_400} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isSuccess}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                cursor: loading || isSuccess ? "not-allowed" : "pointer",
                background: isSuccess
                  ? TEAL
                  : "linear-gradient(135deg,#0D9488,#0EA5E9)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                opacity: loading || isSuccess ? 0.85 : 1,
                boxShadow: "0 4px 14px rgba(13,148,136,0.25)",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 size={18} />
                  Signed In
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span
              style={{
                fontSize: 11,
                color: SLATE_400,
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Quick access
            </span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          {/* Role cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const active = activeRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => fillRole(role)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: `1.5px solid ${active ? role.accent : BORDER}`,
                    background: active ? role.lightBg : "#fff",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    className="flex items-center gap-2"
                    style={{ marginBottom: 4 }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: active ? role.accent : "#F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={13} color={active ? "#fff" : SLATE_500} />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: active ? role.accent : NAVY,
                      }}
                    >
                      {role.label.split(" ")[0]}
                    </span>
                  </div>
                  <p
                    style={{ fontSize: 10, color: SLATE_400, paddingLeft: 34 }}
                  >
                    {role.email}
                  </p>
                </button>
              );
            })}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 11,
              color: SLATE_400,
            }}
          >
            Having trouble?{" "}
            <span style={{ color: TEAL, cursor: "pointer", fontWeight: 500 }}>
              Contact your administrator
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
