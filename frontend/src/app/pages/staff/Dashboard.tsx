import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Camera,
  Video,
} from "lucide-react";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  // ==================== VIDEO VERIFICATION STATES ====================
  const [showVideoPopup, setShowVideoPopup] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showUploadOption, setShowUploadOption] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [recordingTime, setRecordingTime] = useState(15);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Live user data
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

  // Weekly stats
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
        if (record.hours !== undefined) hours = record.hours;
        else if (record.workDuration && record.workDuration !== "In Progress") {
          const parts = record.workDuration.split(" ")[0].split(":");
          const h = parseInt(parts[0], 10) || 0;
          const m = parseInt(parts[1], 10) || 0;
          hours = h + m / 60;
        } else if (record.workDuration === "In Progress") {
          hours = 4;
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

  // ==================== VIDEO RECORDING FUNCTIONS ====================
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && recordingTime > 0) {
      timer = setTimeout(() => setRecordingTime((prev) => prev - 1), 1000);
    } else if (isRecording && recordingTime === 0) {
      stopRecording();
    }
    return () => clearTimeout(timer);
  }, [isRecording, recordingTime]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        setVideoRecorded(true);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(15);
    } catch (err) {
      alert("Camera access nahi mila. Permission allow karein.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  // ==================== DIRECT FILE UPLOAD FUNCTION (Original - unchanged) ====================
  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a video file first!");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append(
      "video",
      selectedFile,
      `verification_${currentUserData.id || "unknown"}_${Date.now()}.${selectedFile.name.split(".").pop()}`,
    );
    formData.append("staffId", currentUserData.id || "");
    formData.append("staffName", currentUserData.name || "");

    try {
      const res = await fetch(
        "http://127.0.0.1:5000/api/staff/self-verification",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        alert(`✅ Verification successful!\nWelcome ${currentUserData.name}`);
        setShowRecorder(false);
        setShowVideoPopup(false);
        setShowUploadOption(false);
        setSelectedFile(null);
        loadDashboardData();
      } else {
        alert(
          "Upload failed: " +
            (result.error || result.message || "Unknown error"),
        );
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Network error - Backend se connect nahi ho raha.");
    } finally {
      setIsUploading(false);
    }
  };

  // ==================== NEW: RECORDED VIDEO UPLOAD FUNCTION ====================
  const handleRecordedVideoUpload = async () => {
    if (!videoBlob) {
      alert("No video recorded! Please record again.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append(
      "video",
      videoBlob,
      `verification_${currentUserData.id || "unknown"}_${Date.now()}.webm`,
    );
    formData.append("staffId", currentUserData.id || "");
    formData.append("staffName", currentUserData.name || "");
    formData.append("verificationType", "recorded"); // Optional but helpful

    try {
      const res = await fetch(
        "http://127.0.0.1:5000/api/staff/self-verification",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        alert(`✅ Verification successful!\nWelcome ${currentUserData.name}`);

        // Reset everything
        setShowRecorder(false);
        setShowVideoPopup(false);
        setVideoRecorded(false);
        setVideoBlob(null);
        loadDashboardData();
      } else {
        alert(
          "Upload failed: " +
            (result.error || result.message || "Unknown error"),
        );
      }
    } catch (err) {
      console.error("Recorded Video Upload Error:", err);
      alert("Network error - Backend se connect nahi ho raha.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    setVideoRecorded(false);
    setVideoBlob(null);
    setIsRecording(false);
  };

  const closeAll = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowRecorder(false);
    setShowVideoPopup(false);
    setShowUploadOption(false);
    setSelectedFile(null);
    setVideoRecorded(false);
    setVideoBlob(null);
  };

  // ==================== EXISTING DASHBOARD FUNCTIONS ====================
  const loadDashboardData = async () => {
    const searchName = (user?.name || "").trim();
    if (!searchName) return;
    try {
      const staffRes = await fetch(
        `http://127.0.0.1:5000/get_staff_by_name?name=${encodeURIComponent(searchName)}`,
      );
      if (staffRes.ok) {
        const profile = await staffRes.json();
        if (profile && !profile.error && profile.id) setDbProfile(profile);
      }
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
      const historyRes = await fetch(
        `http://127.0.0.1:5000/get_attendance_by_name?name=${encodeURIComponent(searchName)}`,
      );
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setAllAttendance(historyData);
        const uniqueDates = new Set(historyData.map((r: any) => r.date));
        const presentDays = uniqueDates.size;
        const totalDays = 22;
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
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, [user?.name]);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-10 space-y-8 font-sans">
      {/* Dynamic Welcome Header - Same as before */}
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

      {/* Quick Stats Row - Same */}
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

      {/* ===================== VERIFICATION POPUP ===================== */}
      {showVideoPopup && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-10 max-w-sm w-full text-center border border-slate-700">
            <div className="mx-auto w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Video className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">
              Verification Required
            </h2>
            <p className="text-slate-400 mb-8">
              Security ke liye ek 15-second verification video record karna
              zaroori hai
            </p>

            <button
              onClick={() => {
                setShowVideoPopup(false);
                setShowRecorder(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-semibold text-white text-lg transition-all"
            >
              Record Verification Video
            </button>

            <button
              onClick={() => {
                setShowVideoPopup(false);
                setShowUploadOption(true);
              }}
              className="w-full mt-3 bg-slate-700 hover:bg-slate-600 py-5 rounded-2xl font-semibold text-white text-lg transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              Upload Existing Video
            </button>

            <button
              onClick={closeAll}
              className="mt-6 text-slate-400 hover:text-white text-sm"
            >
              Skip for now (Not Recommended)
            </button>
          </div>
        </div>
      )}

      {/* ===================== VIDEO RECORDER MODAL ===================== */}
      {showRecorder && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto border border-slate-700">
            <div className="text-center mb-6">
              <Camera className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">
                Record 15 Second Video
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Face clearly visible rakhein
              </p>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden aspect-video mb-6 relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Recording • {recordingTime}s
                </div>
              )}
              {videoRecorded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <CheckCircle className="w-20 h-20 text-green-500" />
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 mb-6 space-y-1">
              <p>• Arm length distance se record karein</p>
              <p>• Poora face camera mein clearly dikhe</p>
              <p>• Good lighting mein record karein</p>
            </div>
            <div className="flex flex-col gap-3">
              {!isRecording && !videoRecorded && (
                <button
                  onClick={startRecording}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-semibold text-white"
                >
                  Start Recording
                </button>
              )}
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-semibold text-white"
                >
                  Stop Recording
                </button>
              )}
              {videoRecorded && (
                <>
                  <button
                    onClick={handleRecordedVideoUpload}
                    disabled={isUploading}
                    className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-semibold text-white disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
                  >
                    {isUploading
                      ? "Uploading Video..."
                      : "✓ Upload & Continue to Dashboard"}
                  </button>
                  <button
                    onClick={resetRecording}
                    disabled={isUploading}
                    className="w-full py-3 text-slate-400 hover:text-white"
                  >
                    Record Again
                  </button>
                </>
              )}
            </div>
            <button
              onClick={closeAll}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ===================== UPLOAD EXISTING VIDEO MODAL ===================== */}
      {showUploadOption && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto border border-slate-700 relative">
            <div className="text-center mb-6">
              <Video className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">
                Upload Verification Video
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Apni device se video select karein
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center mb-6 hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Video className="w-12 h-12 text-slate-400 mb-3" />
                <p className="text-white font-medium">
                  {selectedFile
                    ? selectedFile.name
                    : "Click to select video file"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported: .webm, .mp4, .mov
                </p>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 py-4 rounded-2xl font-semibold text-white disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? "Uploading..." : "Upload Video & Verify"}
              </button>

              <button
                onClick={() => {
                  setShowUploadOption(false);
                  setSelectedFile(null);
                  setShowVideoPopup(true);
                }}
                className="w-full py-3 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <button
              onClick={closeAll}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
            >
              ✕
            </button>
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
