import React, { useState, useEffect } from "react";
import { Staff, AttendanceRecord } from "../../types";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  RefreshCcw,
  Timer,
  Activity,
  ArrowUpRight,
  AlertCircle,
  Zap,
  ShieldAlert,
  Wifi,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Cell,
  Tooltip,
} from "recharts";

// Interfaces
interface LeaveRequestProps {
  name: string;
  dept: string;
  type: string;
  days: number;
  onAction: (name: string, action: "approved" | "rejected") => void;
}

interface CctvAlertProps {
  location: string;
  time: string;
  status: "Normal" | "Alert" | "Offline";
}

interface PendingLeave {
  name: string;
  dept: string;
  type: string;
  days: number;
}

export default function AdminDashboard() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]); // New state for real pending leaves

  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    avgAttendance: 0,
    lateToday: 0,
    earlyLeft: 0,
    onDuty: 0,
    inShift: 0,
  });

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    loadData();
    const handleStaffChange = () => loadData();
    window.addEventListener("staffDataChanged", handleStaffChange);

    const interval = setInterval(() => {
      loadData();
      setCurrentHour(new Date().getHours());
    }, 30000);

    return () => {
      window.removeEventListener("staffDataChanged", handleStaffChange);
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      // Staff list
      const staffRes = await fetch("http://127.0.0.1:5000/get_staff_list");
      const allStaff: Staff[] = await staffRes.json();

      // Today's attendance
      const attendanceRes = await fetch(
        "http://127.0.0.1:5000/get_attendance_today",
      );
      const todayAttendance: AttendanceRecord[] = await attendanceRes.json();

      // Pending leave requests (real data from backend)
      const leavesRes = await fetch("http://127.0.0.1:5000/get_pending_leaves");
      let pending: PendingLeave[] = [];
      if (leavesRes.ok) {
        pending = await leavesRes.json();
      } else {
        console.warn("Pending leaves endpoint returned:", leavesRes.status);
      }

      const presentCount = todayAttendance.length;
      const totalStaffCount = allStaff.length;

      let lateCount = 0;
      let earlyCount = 0;

      todayAttendance.forEach((record) => {
        const staffMember = allStaff.find((s) => s.name === record.name);
        if (staffMember) {
          if (
            record.time &&
            staffMember.shiftStart &&
            record.time > staffMember.shiftStart
          ) {
            lateCount++;
          }
          if (
            record.status === "left_early" ||
            record.status === "Early Left"
          ) {
            earlyCount++;
          }
        }
      });

      const avgAttendance =
        totalStaffCount > 0
          ? Math.round((presentCount / totalStaffCount) * 100)
          : 0;

      // Chart data (same as before)
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dynamicDaily = days.map((day) => ({
        day,
        rate:
          totalStaffCount > 0
            ? Math.floor(Math.random() * (95 - 70 + 1)) + 70
            : 0,
      }));

      const dynamicWeekly = [1, 2, 3, 4].map((w) => ({
        week: `Week ${w}`,
        value:
          w === 3
            ? avgAttendance
            : Math.floor(Math.random() * (90 - 60 + 1)) + 60,
      }));

      setStaff(allStaff);
      setAttendance(todayAttendance);
      setPendingLeaves(pending); // Real pending leaves set here
      setDailyData(dynamicDaily);
      setWeeklyData(dynamicWeekly);
      setStats({
        totalStaff: totalStaffCount,
        presentToday: presentCount,
        absentToday: Math.max(0, totalStaffCount - presentCount),
        avgAttendance,
        lateToday: lateCount,
        earlyLeft: earlyCount,
        onDuty: presentCount - earlyCount,
        inShift: presentCount,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleLeaveAction = async (
    staffName: string,
    action: "approved" | "rejected",
  ) => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/update_leave_status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: staffName, status: action }),
        },
      );
      if (response.ok) {
        alert(
          `Leave request for ${staffName} has been ${action.toUpperCase()}!`,
        );
        loadData(); // Refresh everything including pending list
      } else {
        alert("Failed to update leave status");
      }
    } catch (error) {
      console.error("Error updating leave:", error);
      alert("Something went wrong while updating leave");
    }
  };

  const getShiftGroups = () => {
    const groups: Record<string, string[]> = {
      Morning: [],
      Evening: [],
      Night: [],
      Other: [],
    };
    staff.forEach((member) => {
      const shiftStr = (member.shift || "").toLowerCase();
      if (shiftStr.includes("morning")) groups.Morning.push(member.name);
      else if (shiftStr.includes("evening")) groups.Evening.push(member.name);
      else if (shiftStr.includes("night")) groups.Night.push(member.name);
      else groups.Other.push(member.name);
    });
    return groups;
  };

  const activeShiftName = () => {
    if (currentHour >= 6 && currentHour < 14) return "Morning";
    if (currentHour >= 14 && currentHour < 22) return "Evening";
    return "Night";
  };

  const shiftGroups = getShiftGroups();

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-8 font-sans space-y-8 pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px]" />
      </div>

      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-sm">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 p-4 rounded-3xl shadow-lg rotate-3">
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Command <span className="text-blue-600">Center</span>
            </h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              Intelligence Unit Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <RefreshCcw
              className={`w-4 h-4 text-slate-600 group-hover:text-blue-600 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Sync Data
            </span>
          </button>
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
            <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Live Stream
            </span>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardKpi
          title="Active Force"
          value={stats.presentToday}
          total={stats.totalStaff}
          icon={Users}
          color="blue"
          percent={stats.avgAttendance}
        />
        <StatCardKpi
          title="Absent Today"
          value={stats.absentToday}
          icon={UserX}
          color="rose"
          percent={100 - stats.avgAttendance}
        />
        <StatCardKpi
          title="Daily Efficiency"
          value={`${stats.avgAttendance}%`}
          icon={TrendingUp}
          color="emerald"
          percent={stats.avgAttendance}
        />
        <StatCardKpi
          title="Security Alerts"
          value={stats.lateToday + stats.earlyLeft}
          icon={AlertCircle}
          color="amber"
          percent={45}
        />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700" />

          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-sm font-black text-slate-900 uppercase italic flex items-center gap-2 tracking-tighter">
              <Zap className="w-5 h-5 text-indigo-600 animate-bounce" />{" "}
              Deployment Grid
            </h3>
            <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Live Roster
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar relative z-10">
            {Object.keys(shiftGroups).map((shiftName) => {
              const isActive = shiftName === activeShiftName();
              const count = shiftGroups[shiftName].length;

              return (
                <div
                  key={shiftName}
                  className={`relative p-1 rounded-[2rem] transition-all duration-500 ${
                    isActive
                      ? "bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.5)] scale-[1.03] z-20"
                      : "bg-slate-50 hover:bg-white hover:shadow-xl border border-slate-100"
                  }`}
                >
                  <div
                    className={`p-5 rounded-[1.8rem] h-full ${isActive ? "bg-slate-900/10 backdrop-blur-sm" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-white text-indigo-600 border border-slate-100"
                          }`}
                        >
                          {shiftName === "Morning" && (
                            <Clock className="w-5 h-5" />
                          )}
                          {shiftName === "Evening" && (
                            <Timer className="w-5 h-5" />
                          )}
                          {shiftName === "Night" && (
                            <ShieldAlert className="w-5 h-5" />
                          )}
                          {shiftName === "Other" && (
                            <Users className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4
                            className={`text-lg font-black tracking-tight ${isActive ? "text-white" : "text-slate-800"}`}
                          >
                            {shiftName}
                          </h4>
                          <p
                            className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isActive ? "text-blue-200" : "text-slate-400"}`}
                          >
                            {count} Personnel Assigned
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[8px] font-black text-emerald-400 uppercase">
                            On-Duty
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {count > 0 ? (
                        shiftGroups[shiftName].map((name, idx) => (
                          <div
                            key={idx}
                            className={`group/item flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl transition-all ${
                              isActive
                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                : "bg-white hover:border-indigo-200 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                isActive
                                  ? "bg-blue-400 text-slate-900"
                                  : "bg-slate-100 text-indigo-600"
                              }`}
                            >
                              {name.charAt(0)}
                            </div>
                            <span className="text-[10px] font-bold whitespace-nowrap">
                              {name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div
                          className={`text-[10px] italic py-2 ${isActive ? "text-white/40" : "text-slate-400"}`}
                        >
                          No operatives deployed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOGS SECTION */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]" />
          <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase italic mb-8 relative z-10">
            <Timer className="w-6 h-6 text-blue-400 animate-pulse" /> Real-time
            Logs
          </h2>
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {attendance.length > 0 ? (
              [...attendance].reverse().map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black">
                      {record.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm uppercase">
                        {record.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Verified Entry
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-blue-400 font-black text-sm">
                      <Clock className="w-3 h-3" /> {record.time}
                    </div>
                    <span className="text-[9px] font-black text-emerald-500 uppercase">
                      Live Sync
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center opacity-20 text-white font-black uppercase tracking-widest">
                Scanning Network...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CCTV & LEAVE PANEL - Updated with real pending leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase italic flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" /> Pending Leave
              Requests
            </h3>
            <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-full uppercase tracking-tighter">
              {pendingLeaves.length} Pending
            </span>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((req, index) => (
                <LeaveRequestItem
                  key={index}
                  name={req.name}
                  dept={req.dept}
                  type={req.type}
                  days={req.days}
                  onAction={handleLeaveAction}
                />
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 italic font-medium">
                No pending leave requests right now
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-8 border border-slate-800 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2 mb-8">
            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />{" "}
            Sentinel CCTV Feed
          </h3>
          <div className="space-y-4">
            <CctvAlertItem
              location="Main Lobby Entrance"
              time="Just Now"
              status="Normal"
            />
            <CctvAlertItem
              location="Server Room Door"
              time="2m ago"
              status="Alert"
            />
            <CctvAlertItem
              location="Parking Zone B"
              time="Offline"
              status="Offline"
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Attendance Yield
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: "800", fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "24px",
                    border: "none",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={4}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Retention Stability
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: "800", fill: "#94a3b8" }}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                  {weeklyData.map((e, i) => (
                    <Cell key={i} fill={i === 2 ? "#3b82f6" : "#f1f5f9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* HUD Footer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-slate-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-white/10">
          <div className="flex items-center gap-3 border-r border-white/10 pr-6">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Core: Operational
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Node Sync: 100%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components (same as before)
function StatCardKpi({ title, value, total, icon: Icon, color, percent }: any) {
  const colorMap: any = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-5">
        <div
          className={`w-12 h-12 rounded-2xl ${selectedColor.bg} flex items-center justify-center group-hover:rotate-6 transition-transform`}
        >
          <Icon className={`w-6 h-6 ${selectedColor.text}`} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
      </div>
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1.5">
        {title}
      </p>
      <div className="flex items-baseline gap-2 mb-4">
        <p className="text-4xl font-black text-slate-900 tracking-tighter">
          {value}
        </p>
        {total && <p className="text-xs font-bold text-slate-400">/ {total}</p>}
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-1000"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function LeaveRequestItem({
  name,
  dept,
  type,
  days,
  onAction,
}: LeaveRequestProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center font-black text-sm">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">{name}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {dept} • {days} Days
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction(name, "approved")}
          className="text-emerald-600 bg-emerald-50 p-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
        >
          <CheckCircle size={18} />
        </button>
        <button
          onClick={() => onAction(name, "rejected")}
          className="text-rose-600 bg-rose-50 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
        >
          <XCircle size={18} />
        </button>
      </div>
    </div>
  );
}

function CctvAlertItem({ location, time, status }: CctvAlertProps) {
  const statusConfig: any = {
    Normal: { color: "emerald", class: "bg-emerald-500 text-emerald-400" },
    Alert: { color: "rose", class: "bg-rose-500 text-rose-400" },
    Offline: { color: "slate", class: "bg-slate-500 text-slate-400" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full bg-${config.color}-500 shadow-[0_0_8px] shadow-${config.color}-500`}
        />
        <div>
          <p className="text-xs font-black text-white">{location}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase">
            {time}
          </p>
        </div>
      </div>
      <div
        className={`text-[9px] font-black uppercase bg-${config.color}-500/20 text-${config.color}-400 px-3 py-1 rounded-full border border-${config.color}-500/20`}
      >
        {status}
      </div>
    </div>
  );
}
