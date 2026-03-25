import React, { useState, useEffect } from "react";
import { getStaff as getLocalStaff } from "../../utils/storage";
import { Staff } from "../../types";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Users,
  Activity,
  Timer,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";

interface ApiAttendance {
  id?: number;
  name: string;
  time: string | null;
  outTime: string | null;
  workDuration: string | null;
  status: string;
}

export default function AttendanceView() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<ApiAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  const fetchAttendance = async () => {
    try {
      const attRes = await fetch("http://127.0.0.1:5000/get_attendance_today");
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendance(attData);
      }
    } catch (error) {
      console.error("Attendance fetch error:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const staffRes = await fetch("http://127.0.0.1:5000/get_staff_list");
        if (staffRes.ok) {
          setStaff(await staffRes.json());
        } else {
          setStaff(getLocalStaff());
        }
        await fetchAttendance();
      } catch (error) {
        console.error("Initial load error:", error);
        setStaff(getLocalStaff());
      }
    };

    loadInitialData();
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const getDailyAttendance = () => {
    if (!staff || staff.length === 0) return [];
    return staff.map((s) => {
      const record = attendance.find(
        (a) => a.name?.toLowerCase().trim() === s.name?.toLowerCase().trim(),
      );
      return { staff: s, record: record || null };
    });
  };

  const presentCount = getDailyAttendance().filter(
    (d) =>
      d.record &&
      (d.record.status === "PRESENT" || d.record.status === "COMPLETED"),
  ).length;

  return (
    <div className="p-4 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen font-sans relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 relative z-10">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-600 p-5 rounded-[2rem] shadow-2xl -rotate-3">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Live <span className="text-emerald-600">Attendance</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">
                System Log:{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === "daily" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Daily
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === "monthly" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Monthly
          </button>
        </div>
      </div>

      {viewMode === "daily" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Personnel On-Duty
                </p>
                <p className="text-5xl font-black text-slate-900 tabular-nums">
                  {presentCount}
                  <span className="text-lg text-slate-300 ml-1">
                    /{staff.length}
                  </span>
                </p>
              </div>
              <div className="w-16 h-16 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Absent/Off
                </p>
                <p className="text-5xl font-black text-slate-900 tabular-nums">
                  {staff.length - presentCount}
                </p>
              </div>
              <div className="w-16 h-16 bg-rose-50 rounded-[1.8rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-slate-300 flex items-center justify-between group overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  System Sync
                </p>
                <p className="text-xl font-black text-white italic uppercase tracking-tighter">
                  Real-Time Active
                </p>
                <p className="text-[9px] font-bold text-emerald-400 uppercase mt-1 animate-pulse">
                  ● Refreshing every 30s
                </p>
              </div>
              <Timer className="w-20 h-20 text-white/5 absolute -right-4 -bottom-4 rotate-12" />
              <Download className="w-6 h-6 text-white group-hover:translate-y-1 transition-transform cursor-pointer relative z-10" />
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Staff Profile
                    </th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                      Current Status
                    </th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                      Check-In
                    </th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Duty Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getDailyAttendance().map(({ staff, record }) => {
                    const isPresent =
                      record &&
                      (record.status === "PRESENT" ||
                        record.status === "COMPLETED");
                    const inTimeDisplay = record?.time
                      ? record.time.substring(0, 5)
                      : "— : —";

                    return (
                      <tr
                        key={staff.id}
                        className="group hover:bg-slate-50/50 transition-all duration-300"
                      >
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 font-black text-lg border-2 border-white shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                              {staff.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 uppercase tracking-tight text-sm">
                                {staff.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                {staff.department || "General"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-10 py-7 text-center">
                          <div
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
                              isPresent
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/50"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                            />
                            {isPresent ? "On Duty" : "Absent"}
                          </div>
                        </td>

                        <td className="px-10 py-7 text-center">
                          <div className="inline-flex items-center gap-2 text-sm font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {inTimeDisplay}
                          </div>
                        </td>

                        <td className="px-10 py-7 text-right">
                          {record?.time ? (
                            <div className="inline-block">
                              <p
                                className={`text-sm font-black italic tabular-nums ${record.outTime ? "text-slate-900" : "text-blue-600 animate-pulse"}`}
                              >
                                {record.outTime
                                  ? record.workDuration
                                  : "Counting..."}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {record.outTime ? "Total Shift" : "In Progress"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold italic text-sm">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === "monthly" && (
        <div className="bg-white rounded-[3.5rem] p-20 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <CalendarDays className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
            Analytics Engine Offline
          </h3>
          <p className="text-slate-500 max-w-md mt-3 font-medium">
            Monthly history requires a specialized backend endpoint to aggregate
            long-term logs. System administrators have been notified.
          </p>
          <button
            onClick={() => setViewMode("daily")}
            className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all"
          >
            Return to Live Feed
          </button>
        </div>
      )}
    </div>
  );
}
