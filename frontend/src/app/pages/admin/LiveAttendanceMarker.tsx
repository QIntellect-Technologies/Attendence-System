import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Video,
  UserCheck,
  CameraOff,
  UserMinus,
  LogOut,
  Camera,
} from "lucide-react"; // Camera icon added
import { getStaff } from "../../utils/storage";

export default function LiveAttendanceMarker() {
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string>("");
  const [isCameraLive, setIsCameraLive] = useState(true);
  const [isUnknown, setIsUnknown] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [streamUrl, setStreamUrl] = useState(
    `http://127.0.0.1:5000/video_feed?t=${Date.now()}`,
  );

  // --- New States for Capture Feature ---
  const [empName, setEmpName] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const isProcessingRef = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const pollBackend = async () => {
      if (!isMounted.current || isProcessingRef.current) {
        setTimeout(pollBackend, 1000);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:5000/get_detected_name");
        const data = await res.json();

        const registeredStaff = getStaff();
        const staffNames = registeredStaff.map((s: any) =>
          s.name.toLowerCase().trim(),
        );

        if (data.name && data.name !== "Unknown") {
          const detectedNameClean = data.name.toLowerCase().trim();
          isProcessingRef.current = true;

          if (staffNames.includes(detectedNameClean)) {
            setIsUnknown(false);
            setLastDetected(data.name);

            if (data.action === "checkout") {
              setIsCheckout(true);
              setAttendanceStatus("Checkout Marked 📤");
            } else {
              setIsCheckout(false);
              setAttendanceStatus("Attendance Marked ✅");
            }
          } else {
            setIsUnknown(true);
            setLastDetected(data.name);
            setAttendanceStatus("Unauthorized Person ❌");
          }

          setTimeout(() => {
            if (isMounted.current) {
              setLastDetected(null);
              setAttendanceStatus("");
              setIsUnknown(false);
              setIsCheckout(false);
              isProcessingRef.current = false;
            }
          }, 4000);
        }
        setIsCameraLive(true);
      } catch (e) {
        setIsCameraLive(false);
        setStreamUrl(`http://127.0.0.1:5000/video_feed?t=${Date.now()}`);
      }

      setTimeout(pollBackend, 1000);
    };

    pollBackend();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- New Function: Handle Capture ---
  const handleCapture = async () => {
    if (!empName.trim()) {
      alert("Pehle Employee ka naam likhein!");
      return;
    }

    setIsCapturing(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/capture_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: empName }),
      });

      const data = await response.json();
      if (data.status === "success") {
        alert(`Successfully Registered: ${empName}`);
        setEmpName("");
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Backend se rabta nahi ho saka!");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl font-sans">
      <Card className="border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="bg-white border-b border-slate-50 py-8 px-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4 uppercase italic">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                <Video className="w-6 h-6 text-white" />
              </div>
              Live Terminal
            </CardTitle>
            <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isCameraLive ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}
              />
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
                {isCameraLive ? "System Online" : "System Offline"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-10">
          {/* --- New Section: Capture Controls --- */}
          <div className="mb-8 p-4 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter New Employee Name..."
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="w-full pl-6 pr-4 py-4 rounded-2xl border-none ring-2 ring-slate-200 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>
            <button
              onClick={handleCapture}
              disabled={isCapturing || !isCameraLive}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all shadow-xl shadow-blue-200 ${
                isCapturing
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white"
              }`}
            >
              <Camera className="w-5 h-5" />
              {isCapturing ? "Capturing..." : "Capture Face"}
            </button>
          </div>

          <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-[12px] border-slate-50 shadow-2xl">
            {isCameraLive ? (
              <img
                src={streamUrl}
                className="w-full h-full object-cover"
                alt="AI Feed"
              />
            ) : (
              <div className="text-center p-20">
                <CameraOff className="w-20 h-20 text-slate-700 mx-auto mb-6" />
                <h4 className="text-white font-black text-xl mb-2">
                  CAMERA NOT RESPONDING
                </h4>
              </div>
            )}

            {lastDetected && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xl animate-in zoom-in duration-300">
                <div className="bg-white p-12 rounded-[4rem] text-center shadow-2xl border border-white/50 min-w-[350px]">
                  <div
                    className={`${isUnknown ? "bg-rose-500 shadow-rose-200" : isCheckout ? "bg-orange-500 shadow-orange-200" : "bg-emerald-500 shadow-emerald-200"} w-20 h-20 rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl`}
                  >
                    {isUnknown ? (
                      <UserMinus className="h-10 w-10 text-white" />
                    ) : isCheckout ? (
                      <LogOut className="h-10 w-10 text-white" />
                    ) : (
                      <UserCheck className="h-10 w-10 text-white" />
                    )}
                  </div>

                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic uppercase">
                    {lastDetected}
                  </h3>

                  <div
                    className={`inline-block px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] ${isUnknown ? "bg-rose-50 text-rose-600" : isCheckout ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}
                  >
                    {attendanceStatus.toUpperCase()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
