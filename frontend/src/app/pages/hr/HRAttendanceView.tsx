import React, { useState, useEffect } from "react";
import { Activity, Users, RefreshCw, CheckCircle } from "lucide-react";
import { getStaff as getLocalStaff } from "../../utils/storage";

interface ApiAttendance {
  name: string;
  time: string | null;
  outTime: string | null;
  workDuration: string | null;
  status: string;
  arrival_status?: string;
  user_id?: number;
}

export default function HRAttendanceView() {
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<ApiAttendance[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [justMarked, setJustMarked] = useState<string | null>(null);

  // Fetch Staff List - Strong Fallback
  const fetchStaff = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_staff_list");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setStaff(data);
          return;
        }
      }
      console.log("Backend se staff nahi mila → localStorage fallback");
      const localData = getLocalStaff();
      setStaff(localData || []);
    } catch (e) {
      console.error("Backend fetch failed, using localStorage");
      const localData = getLocalStaff();
      setStaff(localData || []);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_attendance_today");
      if (res.ok) {
        const data = await res.json();
        setAttendance(data || []);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error("Failed to fetch attendance");
    }
  };

  // ==================== IMPROVED LIVE DETECTION ====================
  const checkLiveDetection = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_detected_name");
      if (res.ok) {
        const data = await res.json();
        const detectedNames = data.detected_names || [];

        if (detectedNames.length > 0) {
          console.log("🎥 CCTV Detected:", detectedNames);

          for (const name of detectedNames) {
            const alreadyPresent = attendance.some(
              (a) => a.name?.toLowerCase().trim() === name.toLowerCase().trim(),
            );
            if (!alreadyPresent) {
              await autoMarkAttendance(name);
            }
          }
        }
      }
    } catch (e) {
      // Silent - CCTV ya server temporarily down ho sakta hai
    }
  };

  // ==================== IMPROVED AUTO MARK ATTENDANCE ====================
  const autoMarkAttendance = async (name: string) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/mark_attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const result = await res.json();
        console.log(`✅ Attendance marked for ${name}`, result);

        setJustMarked(name);
        setTimeout(() => setJustMarked(null), 2500);
        fetchAttendance(); // Refresh table
      } else if (res.status === 404) {
        console.warn(`❌ /mark_attendance route not found`);
      } else {
        console.error(`Mark attendance failed for ${name}: ${res.status}`);
      }
    } catch (err) {
      console.error(`Auto mark failed for ${name}:`, err);
    }
  };

  const markAsAbsent = async (name: string) => {
    if (!window.confirm(`Mark "${name}" as Absent?`)) return;
    try {
      const res = await fetch("http://127.0.0.1:5000/mark_as_absent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        alert("Failed to update status on server.");
        return;
      }
      fetchAttendance();
    } catch (err) {
      alert("Server error while marking absent");
    }
  };

  const refreshAll = () => {
    fetchStaff();
    fetchAttendance();
  };

  useEffect(() => {
    refreshAll();

    const mainInterval = setInterval(() => {
      if (isAutoRefreshing) refreshAll();
    }, 8000);

    const detectionInterval = setInterval(checkLiveDetection, 4000);

    return () => {
      clearInterval(mainInterval);
      clearInterval(detectionInterval);
    };
  }, [isAutoRefreshing, attendance]); // attendance dependency added for better detection

  const getDailyAttendance = () => {
    if (!staff || staff.length === 0) return [];
    return staff.map((s: any) => ({
      staff: s,
      record: attendance.find(
        (a) => a.name?.toLowerCase().trim() === s.name?.toLowerCase().trim(),
      ),
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl">
            <Activity className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Live Attendance
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              Real-time CCTV Face Recognition
              <span className="text-emerald-500 text-sm">● LIVE</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
            className={`px-5 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all ${
              isAutoRefreshing
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {isAutoRefreshing ? "Auto Refresh ON" : "Auto Refresh OFF"}
          </button>
          <button
            onClick={refreshAll}
            className="px-5 py-3 bg-slate-700 hover:bg-slate-600 rounded-2xl text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Now
          </button>
        </div>
      </div>

      {justMarked && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-400">
              Auto Marked: {justMarked}
            </p>
            <p className="text-sm text-emerald-300/80">
              Attendance marked from CCTV detection
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-700 bg-slate-950 flex justify-between items-center">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Users className="text-purple-400" />
            All Staff Attendance (Auto from CCTV)
          </h2>
          <span className="text-emerald-400 text-sm font-medium">
            ● Real-time Detection
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-950 text-xs uppercase tracking-widest text-slate-400 border-b border-slate-700">
                <th className="px-8 py-6 text-left">Staff</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-center">Check-In</th>
                <th className="px-8 py-6 text-right">Duration</th>
                <th className="px-8 py-6 text-center">Arrival</th>
                <th className="px-8 py-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    No staff found.
                    <br />
                    Please add staff from <strong>Staff Directory</strong>.
                  </td>
                </tr>
              ) : (
                getDailyAttendance().map(({ staff: s, record }) => {
                  const isPresent =
                    record &&
                    (record.status === "PRESENT" ||
                      record.status === "COMPLETED");
                  const isJustMarked = justMarked === s.name;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-800/50 transition-colors ${isJustMarked ? "bg-emerald-900/40" : ""}`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center text-lg font-bold">
                            {s.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{s.name}</p>
                            <p className="text-xs text-slate-500">
                              {s.department || "General"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span
                          className={`inline-block px-5 py-2 rounded-full text-xs font-bold ${
                            isPresent
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isPresent ? "✅ ON DUTY" : "ABSENT"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center font-mono text-slate-300">
                        {record?.time ? record.time.substring(0, 5) : "— : —"}
                      </td>
                      <td className="px-8 py-6 text-right text-slate-300 font-medium">
                        {record?.workDuration || "—"}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {record?.arrival_status ? (
                          <span className="text-orange-400 font-medium">
                            {record.arrival_status}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => markAsAbsent(s.name)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-6 py-2.5 rounded-2xl transition-all"
                        >
                          Mark Absent
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
