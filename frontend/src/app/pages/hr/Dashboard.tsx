import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

interface StaffMember {
  id: number | string;
  name: string;
  department: string;
  position?: string;
  present_days?: number;
}

interface AttendanceRecord {
  id: string | number;
  name: string;
  time: string | null;
  status: string;
  arrival_status?: string;
}

export default function HRDashboard() {
  const { user } = useAuth();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>(
    [],
  );
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingRequests: 0,
  });

  // Fetch Staff List
  const fetchStaff = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_staff_list");
      if (res.ok) {
        const data: StaffMember[] = await res.json();
        setStaffList(data);
        setStats((prev) => ({ ...prev, totalEmployees: data.length }));
      }
    } catch (err) {
      console.error("Error fetching staff list:", err);
    }
  };

  // Fetch Today's Attendance + Remove Duplicates
  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_attendance_today");
      if (res.ok) {
        let data: AttendanceRecord[] = await res.json();

        // ✅ Duplicate remove: Har staff ka sirf latest record rakho
        const uniqueAttendance = new Map<string, AttendanceRecord>();

        data.forEach((att) => {
          const existing = uniqueAttendance.get(att.name);
          if (
            !existing ||
            (att.time && (!existing.time || att.time > existing.time))
          ) {
            uniqueAttendance.set(att.name, att);
          }
        });

        const finalData = Array.from(uniqueAttendance.values());
        setTodayAttendance(finalData);

        const presentCount = finalData.filter(
          (a) => a.status === "PRESENT" || a.status === "COMPLETED",
        ).length;

        setStats((prev) => ({ ...prev, presentToday: presentCount }));
      }
    } catch (err) {
      console.error("Error fetching today's attendance:", err);
    }
  };

  // Fetch Pending Leave Requests
  const fetchPendingLeaves = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_pending_leaves");
      if (res.ok) {
        const data = await res.json();
        setPendingLeavesCount(data.length);
        setStats((prev) => ({
          ...prev,
          pendingRequests: data.length,
          onLeave: data.length,
        }));
      }
    } catch (err) {
      console.error("Error fetching pending leaves:", err);
    }
  };

  // Real Recent Attendance (Unique + Latest only)
  const recentAttendance = useMemo(() => {
    if (todayAttendance.length === 0) return [];

    const latestByName = new Map<string, AttendanceRecord>();

    todayAttendance.forEach((att) => {
      const existing = latestByName.get(att.name);
      if (
        !existing ||
        (att.time && (!existing.time || att.time > existing.time))
      ) {
        latestByName.set(att.name, att);
      }
    });

    return Array.from(latestByName.values())
      .sort((a, b) => (b.time || "").localeCompare(a.time || ""))
      .slice(0, 5)
      .map((att) => ({
        id: String(att.id),
        name: att.name,
        department:
          staffList.find((s) => s.name === att.name)?.department || "General",
        checkInTime: att.time || "--:--",
        status: att.status || "Present",
        initials: att.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }));
  }, [todayAttendance, staffList]);

  // Initial Load + Auto Refresh
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await Promise.all([
        fetchStaff(),
        fetchTodayAttendance(),
        fetchPendingLeaves(),
      ]);
      setLoading(false);
    };

    loadDashboard();

    // Auto refresh every 20 seconds
    const interval = setInterval(() => {
      fetchTodayAttendance();
      fetchPendingLeaves();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">Loading HR Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Welcome back,{" "}
            <span className="text-purple-500">
              {user?.name?.split(" ")[0] || "HR Admin"}
            </span>
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Here's what's happening with your team today
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Today</p>
          <p className="text-2xl font-semibold text-white">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Employees",
            value: stats.totalEmployees,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            title: "Present Today",
            value: stats.presentToday,
            icon: UserCheck,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            title: "On Leave",
            value: stats.onLeave,
            icon: Calendar,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            title: "Pending Requests",
            value: stats.pendingRequests,
            icon: AlertTriangle,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-slate-900/70 border border-slate-700 rounded-3xl p-6 hover:border-purple-500/50 transition-all group"
          >
            <div
              className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <h3 className="text-4xl font-black text-white tracking-tighter mb-1">
              {stat.value}
            </h3>
            <p className="text-slate-400 font-medium">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Attendance & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-slate-900/70 border border-slate-700 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="text-purple-400" />
              Recent Attendance
            </h2>
            <button
              onClick={() => (window.location.href = "/hr/attendance")}
              className="text-purple-400 text-sm hover:text-purple-300 font-medium"
            >
              View All →
            </button>
          </div>

          {recentAttendance.length === 0 ? (
            <p className="text-slate-400 py-10 text-center">
              No attendance recorded yet today.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              {recentAttendance.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {person.initials}
                    </div>
                    <div>
                      <p className="font-medium text-white">{person.name}</p>
                      <p className="text-xs text-slate-500">
                        {person.department} • Checked in at {person.checkInTime}
                      </p>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-xs font-medium px-3 py-1 bg-emerald-500/10 rounded-full">
                    {person.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/70 border border-slate-700 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => (window.location.href = "/hr/employees")}
              className="h-28 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:border-purple-500 group"
            >
              <Users className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Manage Employees</span>
            </button>

            <button
              onClick={() => (window.location.href = "/hr/leave-requests")}
              className="h-28 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:border-purple-500 group"
            >
              <Calendar className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Leave Requests</span>
            </button>

            <button
              onClick={() => (window.location.href = "/hr/attendance")}
              className="h-28 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:border-purple-500 group"
            >
              <Clock className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Live Attendance</span>
            </button>

            <button
              onClick={() => (window.location.href = "/hr/reports")}
              className="h-28 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:border-purple-500 group"
            >
              <TrendingUp className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Reports</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-8">
        Human Resources Portal • Attendance Pro © 2026
      </div>
    </div>
  );
}
