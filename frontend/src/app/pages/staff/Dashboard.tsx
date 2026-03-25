import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  ArrowRight,
  LogOut,
  Timer,
  X,
  Fingerprint,
  Zap,
  Activity,
  BarChart3,
  Target,
} from "lucide-react";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  // Live user data from backend (name, shift, role etc.)
  const currentUserData = useMemo(() => {
    const name = dbProfile?.name || user?.name || "Staff Member";
    const role = dbProfile?.position || dbProfile?.role || "Team Member";
    const shiftStart =
      dbProfile?.shiftStart || dbProfile?.duty_start || "--:--";
    const shiftEnd = dbProfile?.shiftEnd || dbProfile?.duty_end || "--:--";
    const shiftCategory = dbProfile?.shift || "Not Assigned";

    return {
      name,
      role,
      id: dbProfile?.id || user?.id || "N/A",
      shift: shiftCategory,
      shiftTime: `${shiftStart} - ${shiftEnd}`,
    };
  }, [dbProfile, user]);

  // Weekly stats (last 7 days)
  const weeklyStats = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      const dayName = days[d.getDay()];

      const record = allAttendance.find((r) => {
        const rDate = new Date(r.date).toISOString().split("T")[0];
        return rDate === dateString;
      });

      let hours = 0;
      if (record) {
        if (record.hours !== undefined) {
          hours = record.hours;
        } else if (
          record.workDuration &&
          record.workDuration !== "In Progress"
        ) {
          const parts = record.workDuration.split(" ")[0].split(":");
          const h = parseInt(parts[0], 10) || 0;
          const m = parseInt(parts[1], 10) || 0;
          hours = h + m / 60;
        } else if (record.workDuration === "In Progress") {
          hours = 4; // temporary for graph
        }
      }

      last7Days.push({
        day: dayName,
        date: dateString,
        hours: Math.round(hours * 10) / 10,
        fullRecord: record || null,
        status: hours >= 8 ? "full" : hours > 0 ? "half" : "absent",
      });
    }
    return last7Days;
  }, [allAttendance]);

  const [stats, setStats] = useState({
    presentDays: 0,
    absentDays: 0,
    totalDays: 0,
    attendanceRate: 0,
  });

  const loadDashboardData = async () => {
    const searchName = (user?.name || "").trim();
    console.log("Searching for staff name:", searchName); // debug

    if (!searchName) {
      console.warn("No staff name found in user object");
      return;
    }

    try {
      // 1. Fetch live staff profile (includes shift info)
      const staffRes = await fetch(
        `http://127.0.0.1:5000/get_staff_by_name?name=${encodeURIComponent(searchName)}`,
      );
      console.log("Staff API status:", staffRes.status);

      if (staffRes.ok) {
        const profile = await staffRes.json();
        console.log("Backend returned profile:", profile);

        if (profile && !profile.error && profile.id) {
          // better check
          setDbProfile(profile);
          console.log("Profile successfully set in state");
        } else {
          console.warn("Profile has error or invalid structure:", profile);
        }
      } else {
        console.error(
          "Staff fetch failed:",
          staffRes.status,
          await staffRes.text(),
        );
      }

      // 2. Today's attendance
      const todayRes = await fetch(
        "http://127.0.0.1:5000/get_attendance_today",
      );
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        const myToday = todayData.find(
          (r: any) =>
            r.name?.toLowerCase().trim() === searchName.toLowerCase().trim(),
        );
        if (myToday) {
          setTodayAttendance({
            inTime: myToday.time || myToday.checkIn || myToday.inTime,
            outTime: myToday.outTime || null,
            status: myToday.status || "Present",
            workDuration: myToday.workDuration || "In Progress",
          });
        }
      }

      // 3. Full attendance history
      const historyRes = await fetch(
        `http://127.0.0.1:5000/get_attendance_by_name?name=${encodeURIComponent(searchName)}`,
      );
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setAllAttendance(historyData);

        const uniqueDates = new Set(historyData.map((r: any) => r.date));
        const presentDays = uniqueDates.size;
        const totalDays = 22; // approx working days in month
        const rate =
          totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        setStats({
          presentDays,
          absentDays: Math.max(0, totalDays - presentDays),
          totalDays,
          attendanceRate: rate,
        });
      }
    } catch (e) {
      console.error("Dashboard data load error:", e);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // every 10s
    return () => clearInterval(interval);
  }, [user?.name]);

  // Debug: log whenever dbProfile actually changes
  useEffect(() => {
    console.log("dbProfile state updated:", dbProfile);
  }, [dbProfile]);

  // Debug: log on every render
  console.log("Component rendered. Current dbProfile:", dbProfile);
  console.log("Current displayed data:", currentUserData);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-10 space-y-8 font-sans">
      {/* Dynamic Welcome Header */}
      <div className="relative bg-slate-900 rounded-[3.5rem] p-10 lg:p-16 overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
              <Zap className="w-3 h-3 text-blue-400 fill-blue-400" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                System Authenticated
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter italic uppercase leading-[0.9]">
              Morning, <br />
              <span className="text-blue-500">
                {currentUserData.name.split(" ")[0]}
              </span>
            </h1>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Role: <span className="text-white">{currentUserData.role}</span>
              </div>
              <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Shift:{" "}
                <span className="text-blue-400">
                  {currentUserData.shiftTime}
                </span>
              </div>
              <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Category:{" "}
                <span className="text-emerald-400">
                  {currentUserData.shift}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-2xl min-w-[200px] text-center rotate-3 hover:rotate-0 transition-transform duration-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
              Today
            </p>
            <h3 className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
              {new Date().getDate()}
            </h3>
            <p className="text-sm font-black text-blue-600 uppercase mt-2 tracking-widest">
              {new Date().toLocaleDateString("en-US", { month: "long" })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 italic uppercase">
                Terminal Logs
              </h2>
            </div>
            {todayAttendance && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                  Duty On
                </span>
              </div>
            )}
          </div>

          {todayAttendance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <StatusRow
                  label="Clock In"
                  value={todayAttendance.inTime || "—"}
                  icon={<Clock className="text-blue-500" />}
                />
                <StatusRow
                  label="Clock Out"
                  value={todayAttendance.outTime || "Pending"}
                  icon={<LogOut className="text-rose-500" />}
                />
                <StatusRow
                  label="Auth Type"
                  value="Face Recognition"
                  icon={<Award className="text-amber-500" />}
                />
              </div>
              <div className="bg-slate-50 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Total Session Time
                </p>
                <div className="w-24 h-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin-slow mb-6 flex items-center justify-center">
                  <Timer className="w-8 h-8 text-blue-600 animate-none" />
                </div>
                <h4 className="text-4xl font-black text-slate-900 italic leading-none">
                  {todayAttendance.workDuration}
                </h4>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
              <Activity className="w-16 h-16 text-slate-200 mx-auto mb-6 animate-pulse" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">
                Verification Required at Terminal
              </p>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="lg:col-span-4 bg-blue-600 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-4xl font-black italic uppercase mb-4 leading-tight">
              Performance
              <br />
              Metrics
            </h4>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                  Avg. Punctuality
                </span>
                <span className="text-sm font-black italic">94%</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                  Completion Rate
                </span>
                <span className="text-sm font-black italic">
                  {stats.attendanceRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                  Shift Category
                </span>
                <span className="text-sm font-black italic">
                  {currentUserData.shift}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="relative z-10 w-full bg-white text-slate-900 font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-xl mt-6"
          >
            View Full Data <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget
          title="Total Days"
          value={stats.totalDays}
          icon={<Calendar />}
          theme="blue"
        />
        <StatWidget
          title="Present"
          value={stats.presentDays}
          icon={<CheckCircle />}
          theme="emerald"
        />
        <StatWidget
          title="Absent"
          value={stats.absentDays}
          icon={<XCircle />}
          theme="rose"
        />
        <StatWidget
          title="Efficiency"
          value={`${stats.attendanceRate}%`}
          icon={<Zap />}
          theme="amber"
        />
      </div>

      {/* Analytics Modal */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
            onClick={() => setIsAnalyticsOpen(false)}
          />
          <div className="relative bg-white w-full max-w-5xl rounded-[4rem] p-12 overflow-y-auto max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-black text-slate-900 italic uppercase">
                  Efficiency Data
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Real-time Performance analysis
                </p>
              </div>
              <button
                onClick={() => setIsAnalyticsOpen(false)}
                className="p-4 bg-slate-100 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <X />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <Target className="text-blue-600 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Monthly Goal
                </p>
                <h5 className="text-3xl font-black italic">
                  {stats.presentDays}/{stats.totalDays} Days
                </h5>
              </div>
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <TrendingUp className="text-emerald-600 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Performance
                </p>
                <h5 className="text-3xl font-black italic">
                  {stats.attendanceRate > 85 ? "Excellent" : "Good"}
                </h5>
              </div>
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <Clock className="text-amber-600 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Avg. Hours
                </p>
                <h5 className="text-3xl font-black italic">08:15 hrs</h5>
              </div>
            </div>

            <h3 className="text-xl font-black uppercase italic mb-8">
              Weekly Activity Graph
            </h3>

            <div className="flex items-end justify-between h-56 gap-4 mb-8 px-4">
              {weeklyStats.map((item, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-3 group cursor-pointer"
                  onClick={() => setSelectedDay(item)}
                >
                  <div className="w-full bg-slate-50 rounded-2xl h-full relative overflow-hidden flex items-end border border-slate-100">
                    <div
                      className={`w-full transition-all duration-1000 ease-out group-hover:brightness-110 
                        ${item.status === "full" ? "bg-blue-600" : item.status === "half" ? "bg-amber-400" : "bg-slate-200"}`}
                      style={{
                        height:
                          item.hours > 0 ? `${(item.hours / 12) * 100}%` : "8%",
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                      <span className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg font-black italic uppercase">
                        {item.hours}h
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase ${item.date === new Date().toISOString().split("T")[0] ? "text-blue-600 underline decoration-2" : "text-slate-400"}`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            {selectedDay && selectedDay.fullRecord && (
              <div className="mt-6 p-6 bg-blue-50 rounded-3xl border border-blue-100 animate-in slide-in-from-bottom-4">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-2">
                  Details for {selectedDay.date}
                </p>
                <div className="flex gap-8">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      In:
                    </span>{" "}
                    <span className="font-black italic">
                      {selectedDay.fullRecord.time ||
                        selectedDay.fullRecord.inTime ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Duration:
                    </span>{" "}
                    <span className="font-black italic">
                      {selectedDay.fullRecord.workDuration || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components (unchanged)
function StatusRow({ label, value, icon }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className="text-sm font-black text-slate-900 uppercase italic">
        {value}
      </span>
    </div>
  );
}

function StatWidget({ title, value, icon, theme }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100",
  };

  return (
    <div className="p-8 rounded-[2.5rem] border-2 bg-white flex flex-col items-center text-center shadow-lg transition-transform hover:-translate-y-2 duration-300">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[theme]}`}
      >
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
        {title}
      </p>
      <p className="text-4xl font-black text-slate-900 italic">{value}</p>
    </div>
  );
}
