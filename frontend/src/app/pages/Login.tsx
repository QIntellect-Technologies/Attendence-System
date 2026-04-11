import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
} from "lucide-react";
import { getUsers } from "../utils/storage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [portalType, setPortalType] = useState("Staff");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get latest users from storage
      const allUsers = getUsers();

      // Find user (HR added staff bhi isme aayega)
      const foundUser = allUsers.find(
        (u: any) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          String(u.password) === String(password),
      );

      if (foundUser) {
        console.log("✅ User Found:", foundUser);

        // Call AuthContext login
        const success = await login(email, password);

        if (success) {
          setIsSuccess(true);

          setTimeout(() => {
            const savedUser = JSON.parse(
              localStorage.getItem("currentUser") || "{}",
            );

            // Role-based Navigation
            if (savedUser.role === "admin") {
              navigate("/admin", { replace: true });
            } else if (savedUser.role === "hr") {
              navigate("/hr", { replace: true });
            } else {
              navigate("/staff", { replace: true }); // Staff Dashboard
            }
          }, 1000);
        }
      } else {
        setError(
          "Invalid Email or Password. Please check credentials given by HR.",
        );
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Demo Credentials Fill (unchanged)
  const fillCredentials = (role: string, typeName: string) => {
    setError("");
    setPortalType(typeName);

    if (role === "admin") {
      setEmail("admin@company.com");
      setPassword("admin123");
    } else if (role === "hr") {
      setEmail("hr@company.com");
      setPassword("hr123");
    } else if (role === "elon") {
      setEmail("e@co.com");
      setPassword("123");
    } else {
      setEmail("q@co.com");
      setPassword("123");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="w-full max-w-[460px] z-10">
        {/* Brand Header */}
        <div className="text-center mb-10 transform transition-all duration-700">
          <div className="inline-block px-4 py-1.5 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full mb-4">
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.4em]">
              Enterprise Security
            </p>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
            ATTENDANCE{" "}
            <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              PRO
            </span>
          </h1>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] border border-slate-700/50 p-10 md:p-12 relative overflow-hidden">
          <div className="text-center mb-10">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl transition-all duration-700 rotate-3 hover:rotate-0 ${
                isSuccess
                  ? "bg-emerald-500 shadow-emerald-500/40"
                  : "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/30"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="text-white w-10 h-10" />
              ) : (
                <Fingerprint className="text-white w-10 h-10 animate-pulse" />
              )}
            </div>

            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              {isSuccess ? (
                <span className="text-emerald-400">Identity Verified</span>
              ) : (
                <>
                  {portalType} <span className="text-blue-500">Portal</span>
                </>
              )}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-3">
              Secure Auth Protocol v3.0
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-[11px] font-bold uppercase tracking-wider animate-bounce">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                User Identity
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-blue-500 focus:bg-slate-800 transition-all font-bold text-white placeholder-slate-600"
                  placeholder="name@enterprise.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Security Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-blue-500 focus:bg-slate-800 transition-all font-bold text-white placeholder-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSuccess}
              className={`w-full py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                isSuccess
                  ? "bg-emerald-500"
                  : "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20"
              } text-white group`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSuccess ? (
                "Session Initialized"
              ) : (
                "Grant Access"
              )}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </form>

          {/* Protocol Selection */}
          <div className="mt-12 pt-8 border-t border-slate-800">
            <p className="text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">
              Override Protocols
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => fillCredentials("admin", "Administrator")}
                className="col-span-2 flex items-center justify-between p-4 bg-slate-800/80 hover:bg-blue-600 rounded-2xl text-white group transition-all border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Shield
                    size={18}
                    className="text-blue-400 group-hover:text-white"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Administrator
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all"
                />
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("hr", "HR")}
                className="col-span-2 flex items-center justify-between p-4 bg-slate-800/80 hover:bg-purple-600 rounded-2xl text-white group transition-all border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <User
                    size={18}
                    className="text-purple-400 group-hover:text-white"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Human Resources
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all"
                />
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("elon", "Staff")}
                className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700 rounded-2xl group hover:border-blue-500/50 transition-all"
              >
                <User
                  size={16}
                  className="text-slate-500 group-hover:text-blue-400"
                />
                <span className="text-[10px] font-black text-slate-300 uppercase">
                  Elon
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("qaisar", "Staff")}
                className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700 rounded-2xl group hover:border-orange-500/50 transition-all"
              >
                <User
                  size={16}
                  className="text-slate-500 group-hover:text-orange-400"
                />
                <span className="text-[10px] font-black text-slate-300 uppercase">
                  Qaisar
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-10 text-[10px] font-bold text-slate-500 uppercase tracking-[0.6em] opacity-40">
          Encrypted Biometric Terminal • 2026
        </p>
      </div>
    </div>
  );
}
