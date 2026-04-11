import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  CameraOff,
  UserCheck,
  UserMinus,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Clock,
} from "lucide-react";

const BACKEND = "http://127.0.0.1:5000";

interface DetectionState {
  name: string;
  status: "checkin" | "checkout" | "unauthorized" | "not_verified";
  message: string;
}

export default function LiveAttendanceMarker() {
  const [detection, setDetection] = useState<DetectionState | null>(null);
  const [isCameraLive, setIsCameraLive] = useState(true);
  const [streamUrl, setStreamUrl] = useState(
    `${BACKEND}/video_feed?t=${Date.now()}`,
  );
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [checkmarkColor, setCheckmarkColor] = useState("green");
  const [todayCount, setTodayCount] = useState(0);
  const [recentMarked, setRecentMarked] = useState<string[]>([]);

  const isProcessingRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ====================== Refresh Stream ======================
  const refreshStream = () => {
    setStreamUrl(`${BACKEND}/video_feed?t=${Date.now()}`);
  };

  useEffect(() => {
    const interval = setInterval(refreshStream, 25000);
    return () => clearInterval(interval);
  }, []);

  // ====================== Load Today Count ======================
  const loadTodayCount = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/get_attendance_today`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTodayCount(data.length);
        setRecentMarked(data.slice(0, 5).map((r: { name: string }) => r.name));
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    loadTodayCount();
    const interval = setInterval(loadTodayCount, 5000);
    return () => clearInterval(interval);
  }, [loadTodayCount]);

  // ====================== Check Verification ======================
  const checkVerificationStatus = async (staffId: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `${BACKEND}/api/staff/verification-status?staffId=${staffId}`,
      );
      const data = await res.json();
      return data.status === "enrolled";
    } catch {
      return false;
    }
  };

  // ====================== Mark Attendance ======================
  const markAttendance = async (name: string) => {
    try {
      const res = await fetch(`${BACKEND}/mark_attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      return await res.json();
    } catch {
      return null;
    }
  };

  // ====================== Get Staff Info ======================
  const getStaffInfo = async (name: string) => {
    try {
      const res = await fetch(
        `${BACKEND}/get_staff_by_name?name=${encodeURIComponent(name)}`,
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  // ====================== Show Overlay ======================
  const showOverlay = (state: DetectionState, color: string) => {
    setDetection(state);
    setCheckmarkColor(color);
    setShowCheckmark(true);
    setTimeout(() => {
      setDetection(null);
      setShowCheckmark(false);
      isProcessingRef.current = false;
    }, 4500);
  };

  // ====================== Poll Backend ======================
  const pollBackend = useCallback(async () => {
    if (isProcessingRef.current) {
      pollRef.current = setTimeout(pollBackend, 800);
      return;
    }

    try {
      const res = await fetch(`${BACKEND}/get_detected_name`);
      const data = await res.json();
      const detectedNames: string[] = data.detected_names ?? [];

      if (detectedNames.length > 0) {
        const name = detectedNames[0];
        isProcessingRef.current = true;

        // Step 1: Staff exists?
        const staffInfo = await getStaffInfo(name);
        if (!staffInfo) {
          showOverlay(
            {
              name,
              status: "unauthorized",
              message: "Not Registered in System ❌",
            },
            "red",
          );
          pollRef.current = setTimeout(pollBackend, 800);
          return;
        }

        // Step 2: Face enrolled?
        const isVerified = await checkVerificationStatus(String(staffInfo.id));
        if (!isVerified) {
          showOverlay(
            {
              name,
              status: "not_verified",
              message: "Face Not Enrolled — Verification Required ⚠️",
            },
            "orange",
          );
          pollRef.current = setTimeout(pollBackend, 800);
          return;
        }

        // Step 3: Mark attendance
        const result = await markAttendance(name);
        if (result?.already_marked) {
          showOverlay(
            { name, status: "checkout", message: "Already Marked Today 🔵" },
            "blue",
          );
        } else if (result?.success) {
          showOverlay(
            {
              name,
              status: "checkin",
              message: `Attendance Marked ✅ — ${new Date().toLocaleTimeString()}`,
            },
            "green",
          );
          loadTodayCount();
        } else {
          showOverlay(
            {
              name,
              status: "unauthorized",
              message: "Failed to Mark Attendance",
            },
            "red",
          );
        }
      }

      setIsCameraLive(true);
    } catch {
      setIsCameraLive(false);
    }

    pollRef.current = setTimeout(pollBackend, 800);
  }, [loadTodayCount]);

  useEffect(() => {
    pollRef.current = setTimeout(pollBackend, 1000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [pollBackend]);

  // ====================== Colors ======================
  const colorMap: Record<
    string,
    { bg: string; icon: string; ring: string; overlay: string }
  > = {
    green: {
      bg: "bg-emerald-500",
      icon: "text-emerald-400",
      ring: "ring-emerald-400",
      overlay: "bg-emerald-900/30",
    },
    blue: {
      bg: "bg-blue-500",
      icon: "text-blue-400",
      ring: "ring-blue-400",
      overlay: "bg-blue-900/30",
    },
    orange: {
      bg: "bg-orange-500",
      icon: "text-orange-400",
      ring: "ring-orange-400",
      overlay: "bg-orange-900/30",
    },
    red: {
      bg: "bg-red-500",
      icon: "text-red-400",
      ring: "ring-red-400",
      overlay: "bg-red-900/30",
    },
  };

  const colors = colorMap[checkmarkColor] ?? colorMap.green;

  const IconComponent =
    detection?.status === "checkin"
      ? CheckCircle2
      : detection?.status === "checkout"
        ? Clock
        : detection?.status === "not_verified"
          ? ShieldCheck
          : UserMinus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Live Attendance Marker
          </h1>
          <p className="text-slate-400 mt-1">
            Auto face recognition — only verified staff attendance marked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-900/40 border border-emerald-700 px-5 py-3 rounded-2xl text-center">
            <div className="text-2xl font-black text-emerald-400">
              {todayCount}
            </div>
            <div className="text-xs text-emerald-600">Present Today</div>
          </div>
          <button
            onClick={refreshStream}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-2xl text-white transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="relative rounded-3xl overflow-hidden bg-black border-4 border-slate-800 shadow-2xl aspect-video">
        <img
          key={streamUrl}
          src={streamUrl}
          className="w-full h-full object-cover"
          alt="Live Camera Feed"
          onError={() => setIsCameraLive(false)}
          onLoad={() => setIsCameraLive(true)}
        />

        {/* LIVE badge */}
        {isCameraLive && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
            LIVE
          </div>
        )}

        {/* Count badge */}
        {isCameraLive && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-mono flex items-center gap-2">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            {todayCount} marked today
          </div>
        )}

        {/* Detection Overlay */}
        {showCheckmark && detection && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`absolute inset-0 ${colors.overlay}`} />
            <div
              className={`relative z-10 bg-black/85 backdrop-blur-md rounded-3xl px-10 py-8 text-center shadow-2xl ring-2 ${colors.ring} min-w-[340px]`}
            >
              <div
                className={`w-20 h-20 mx-auto rounded-full ${colors.bg} flex items-center justify-center mb-4 shadow-2xl`}
              >
                <IconComponent size={44} className="text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                {detection.name}
              </h2>
              <p className={`text-base font-semibold ${colors.icon}`}>
                {detection.message}
              </p>
              <div className="mt-5 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bg} rounded-full`}
                  style={{ animation: "shrink 4.5s linear forwards" }}
                />
              </div>
            </div>

            {/* Corner checkmarks on successful check-in */}
            {detection.status === "checkin" && (
              <>
                <CheckCircle2 className="absolute top-4 left-4 text-emerald-400 opacity-80 w-9 h-9" />
                <CheckCircle2 className="absolute top-4 right-4 text-emerald-400 opacity-80 w-9 h-9" />
                <CheckCircle2 className="absolute bottom-4 left-4 text-emerald-400 opacity-80 w-9 h-9" />
                <CheckCircle2 className="absolute bottom-4 right-4 text-emerald-400 opacity-80 w-9 h-9" />
              </>
            )}
          </div>
        )}

        {/* Camera Offline */}
        {!isCameraLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/95">
            <CameraOff className="w-20 h-20 text-red-500 mb-4" />
            <h3 className="text-2xl font-bold text-white">
              Camera Not Connected
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              Check backend server on port 5000
            </p>
            <button
              onClick={refreshStream}
              className="mt-6 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl text-white flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Recently Marked */}
      {recentMarked.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">
            Recently Marked Today
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentMarked.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 px-4 py-2 rounded-full text-sm text-emerald-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            color: "bg-emerald-500",
            label: "Attendance Marked",
            desc: "Verified + Present",
          },
          {
            color: "bg-blue-500",
            label: "Already Marked",
            desc: "Duplicate check-in",
          },
          {
            color: "bg-orange-500",
            label: "Not Enrolled",
            desc: "No face verification",
          },
          { color: "bg-red-500", label: "Unauthorized", desc: "Not in system" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3"
          >
            <div
              className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}
            />
            <div>
              <div className="text-white text-xs font-semibold">
                {item.label}
              </div>
              <div className="text-slate-500 text-xs">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
