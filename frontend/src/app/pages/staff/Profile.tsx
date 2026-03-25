import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Calendar,
  Clock,
  Award,
  ChevronRight,
  Activity,
  UserCircle,
  X,
} from "lucide-react";

export default function StaffProfile() {
  const { user } = useAuth();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFullAnalytics, setShowFullAnalytics] = useState(false);

  useEffect(() => {
    const loadStaffData = async () => {
      if (!user?.name) return;

      setLoading(true);
      try {
        // 1. Fetch staff details from backend (match by name)
        const staffRes = await fetch("http://127.0.0.1:5000/get_staff_list");
        if (staffRes.ok) {
          const allStaff = await staffRes.json();
          const myStaff = allStaff.find(
            (s: any) =>
              s.name.toLowerCase().trim() === user.name.toLowerCase().trim(),
          );
          if (myStaff) {
            setStaffInfo(myStaff);
          }
        }

        // 2. Fetch attendance history (all time)
        const historyRes = await fetch(
          `http://127.0.0.1:5000/get_attendance_by_name?name=${encodeURIComponent(user.name)}`,
        );
        if (historyRes.ok) {
          const data = await historyRes.json();
          setAttendance(Array.isArray(data) ? data : []);
        }

        // 3. Fetch today's attendance
        const todayRes = await fetch(
          "http://127.0.0.1:5000/get_attendance_today",
        );
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          const myToday = todayData.find(
            (r: any) =>
              r.name?.toLowerCase().trim() === user.name.toLowerCase().trim(),
          );
          setTodayAttendance(myToday || null);
        }
      } catch (err) {
        console.error("Failed to load staff/attendance data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStaffData();

    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(loadStaffData, 30000);
    return () => clearInterval(interval);
  }, [user?.name]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateStats = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthAttendance = attendance.filter((a) => {
      if (!a.date) return false;
      const attDate = new Date(a.date);
      return attDate >= firstDayOfMonth && attDate <= now;
    });

    const uniqueDays = new Set(
      thisMonthAttendance.map(
        (a) => new Date(a.date).toISOString().split("T")[0],
      ),
    );

    if (
      todayAttendance &&
      (todayAttendance.status === "PRESENT" ||
        todayAttendance.workDuration === "In Progress")
    ) {
      uniqueDays.add(now.toISOString().split("T")[0]);
    }

    const presentDays = uniqueDays.size;
    const totalDays = now.getDate();
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Weekly graph (simple random height for demo - can improve later)
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const weeklyData = daysOfWeek.map((dayName) => {
      const hasRecord = attendance.some((rec) => {
        const d = new Date(rec.date);
        return daysOfWeek[d.getDay()] === dayName;
      });
      const isToday = daysOfWeek[now.getDay()] === dayName && todayAttendance;

      return {
        day: dayName,
        height:
          hasRecord || isToday
            ? Math.floor(Math.random() * (90 - 40 + 1)) + 40
            : 5,
      };
    });

    return {
      presentDays,
      totalDays,
      attendanceRate,
      weeklyData,
      totalRecords: attendance.length + (todayAttendance ? 1 : 0),
    };
  };

  const stats = calculateStats();

  const sortedHistory = [...attendance].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-10 space-y-10 font-sans relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1E293B] flex items-center gap-2">
            Staff <span className="text-blue-600">Profile</span>
          </h1>
          <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" /> Professional
            Dashboard
          </p>
        </div>
        <div className="mt-4 md:mt-0 px-6 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
            ID: {staffInfo?.id || "N/A"}
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/20 border border-gray-100 overflow-hidden">
        <div className="h-44 w-full bg-gradient-to-r from-[#1E293B] via-[#334155] to-[#1E293B] relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="px-12 pb-10 flex flex-col md:flex-row items-end gap-8 -mt-16 relative z-10">
          <div className="bg-white p-1.5 rounded-[2rem] shadow-2xl">
            <div className="w-36 h-36 bg-blue-50 rounded-[1.8rem] flex items-center justify-center border-4 border-white">
              <span className="text-5xl font-black text-blue-600">
                {staffInfo?.name?.charAt(0) || "S"}
              </span>
            </div>
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-4xl font-black text-[#1E293B]">
                {staffInfo?.name || "Staff Member"}
              </h2>
              <span className="text-[10px] px-3 py-1 bg-green-100 text-green-600 font-black rounded-full border border-green-200 uppercase">
                Active
              </span>
            </div>
            <p className="text-gray-400 font-bold text-lg">
              {staffInfo?.position || staffInfo?.role || "Staff"}
            </p>
          </div>
          <div className="bg-[#EEF2FF] border border-blue-100 p-6 rounded-[2rem] flex items-center gap-6 mb-4 min-w-[240px]">
            <div className="text-right">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                Attendance
              </p>
              <p className="text-4xl font-black text-blue-900">
                {stats.attendanceRate}%
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        <div className="xl:col-span-3 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.25em] mb-10 flex items-center gap-3">
            <UserCircle className="w-5 h-5" /> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <DetailItem
              icon={<Mail />}
              label="Email"
              value={staffInfo?.email}
              color="blue"
            />
            <DetailItem
              icon={<Phone />}
              label="Phone"
              value={staffInfo?.phone || "—"}
              color="indigo"
            />
            <DetailItem
              icon={<Building />}
              label="Department"
              value={staffInfo?.department}
              color="purple"
            />
            <DetailItem
              icon={<Briefcase />}
              label="Role/Position"
              value={staffInfo?.position || staffInfo?.role}
              color="blue"
            />
            <DetailItem
              icon={<Calendar />}
              label="Shift Start"
              value={staffInfo?.shiftStart || staffInfo?.duty_start || "09:00"}
              color="indigo"
            />
            <DetailItem
              icon={<Clock />}
              label="Shift End"
              value={staffInfo?.shiftEnd || staffInfo?.duty_end || "18:00"}
              color="purple"
            />
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="bg-[#1E293B] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-12">
            Performance Snapshot
          </h3>
          <div className="space-y-10">
            <div>
              <div className="flex justify-between items-end mb-3 text-[11px] font-black uppercase text-gray-400">
                <span>Monthly Attendance</span>
                <span className="text-blue-400 text-2xl">
                  {stats.attendanceRate}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-800/40 border border-gray-700 p-5 rounded-2xl backdrop-blur-sm">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">
                  Present This Month
                </p>
                <p className="text-3xl font-black text-white">
                  {stats.presentDays}{" "}
                  <span className="text-sm text-gray-500 font-bold">Days</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-[#FBFDFF]">
          <h3 className="text-sm font-black text-[#1E293B] uppercase tracking-[0.2em] flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" /> Attendance History
            (Recent)
          </h3>
          <button
            onClick={() => setShowFullAnalytics(true)}
            className="text-[11px] font-black text-blue-600 uppercase flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-full transition-all"
          >
            View Full Report <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-10 py-6 text-left">Date</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-center">Check In</th>
                <th className="px-10 py-6 text-center">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {todayAttendance && (
                <tr className="bg-blue-50/30 group">
                  <td className="px-10 py-7 text-xs font-black text-blue-900 uppercase">
                    Today -{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className="px-5 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-blue-100 uppercase">
                      Present
                    </span>
                  </td>
                  <td className="px-10 py-7 text-center text-sm font-black text-gray-700">
                    {todayAttendance.time || "—"}
                  </td>
                  <td className="px-10 py-7 text-center">
                    {todayAttendance.outTime ? (
                      todayAttendance.outTime
                    ) : (
                      <span className="text-[10px] font-black text-orange-500 animate-pulse flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>{" "}
                        In Progress
                      </span>
                    )}
                  </td>
                </tr>
              )}
              {sortedHistory.slice(0, 10).map(
                (
                  record,
                  i, // Show last 10 for performance
                ) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-10 py-6 text-xs font-bold text-gray-600">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="px-4 py-1 bg-gray-100 text-gray-600 text-[10px] font-black rounded-lg uppercase">
                        Present
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center text-sm font-bold text-gray-600">
                      {record.time || record.inTime || "—"}
                    </td>
                    <td className="px-10 py-6 text-center text-sm font-bold text-gray-600">
                      {record.outTime || "—"}
                    </td>
                  </tr>
                ),
              )}
              {sortedHistory.length === 0 && !todayAttendance && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    No attendance records found yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Analytics Modal */}
      {showFullAnalytics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowFullAnalytics(false)}
              className="absolute top-8 right-8 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-12">
              <h2 className="text-3xl font-black text-[#1E293B] mb-2 uppercase italic tracking-tighter">
                Performance Report
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">
                Monthly & Weekly Insights
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <EfficiencyCard
                  label="Monthly Present"
                  value={`${stats.presentDays}/${stats.totalDays}`}
                  icon={<Activity className="text-blue-500" />}
                />
                <EfficiencyCard
                  label="Rate"
                  value={`${stats.attendanceRate}%`}
                  icon={<Award className="text-green-500" />}
                />
                <EfficiencyCard
                  label="Status"
                  value={
                    stats.attendanceRate > 85 ? "Outstanding" : "Consistent"
                  }
                  icon={<Clock className="text-orange-500" />}
                />
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest italic">
                  Weekly Attendance Pattern
                </h4>
                <div className="h-48 w-full bg-gray-50 rounded-3xl flex items-end justify-between px-10 pb-4 border border-gray-100">
                  {stats.weeklyData.map((data) => (
                    <div
                      key={data.day}
                      className="flex flex-col items-center gap-4"
                    >
                      <div
                        className="w-8 bg-blue-600 rounded-t-lg shadow-lg shadow-blue-100 transition-all hover:scale-110"
                        style={{ height: `${data.height}px` }}
                      />
                      <span className="text-[9px] font-black text-gray-400 uppercase">
                        {data.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components remain the same
function DetailItem({ icon, label, value, color }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50",
    purple: "text-purple-600 bg-purple-50",
  };
  return (
    <div className="flex items-start gap-5 group">
      <div
        className={`p-4 rounded-2xl transition-all group-hover:scale-110 shadow-sm ${colorMap[color] || colorMap.blue}`}
      >
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <div className="pt-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-base font-black text-[#1E293B] tracking-tight">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function EfficiencyCard({ label, value, icon }: any) {
  return (
    <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-[2rem] flex flex-col gap-4">
      <div className="p-3 bg-white w-fit rounded-xl shadow-sm">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-2xl font-black text-[#1E293B] italic">{value}</p>
      </div>
    </div>
  );
}
