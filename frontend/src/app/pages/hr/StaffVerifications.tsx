import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Clock,
  Video as VideoIcon,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface Verification {
  id: number;
  staff_id: string;
  staff_name: string;
  video_path: string;
  recorded_at: string;
  status: string;
}

export default function StaffVerifications() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://127.0.0.1:5000/api/staff/verifications");

      if (res.ok) {
        const data = await res.json();
        setVerifications(Array.isArray(data) ? data : []);
      } else {
        setError(`Server error: ${res.status}`);
        setVerifications([]);
      }
    } catch (err: any) {
      console.error("Network Error:", err);
      setError("Cannot connect to backend. Is the server running?");
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  // Delete verification (from list + delete video file from backend)
  const deleteVerification = async (id: number, videoPath: string) => {
    if (
      !confirm(
        `Delete verification for ${verifications.find((v) => v.id === id)?.staff_name}?`,
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/staff/verification/${id}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        // Remove from UI immediately
        setVerifications((prev) => prev.filter((v) => v.id !== id));
        alert("Verification deleted successfully.");
      } else {
        const result = await res.json();
        alert("Delete failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">Loading staff verifications...</div>
    );
  }

  return (
    <div className="p-6 lg:p-10 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Staff Verifications
            </h1>
            <p className="text-slate-500 mt-2">
              List of all staff verification records
            </p>
          </div>
          <button
            onClick={fetchVerifications}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh List
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {verifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center">
            <VideoIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-400">
              No verification records found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verifications.map((ver) => (
              <div
                key={ver.id}
                className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-slate-900 truncate">
                      {ver.staff_name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      ID: {ver.staff_id}
                    </p>

                    <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(ver.recorded_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      <Clock className="w-4 h-4 ml-2" />
                      {new Date(ver.recorded_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {/* Optional: Play button if you want to keep it */}
                  <button
                    onClick={() => {
                      // You can keep play functionality if needed later
                      alert("Video playback is disabled in this view.");
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-medium transition flex items-center justify-center gap-2"
                  >
                    <VideoIcon className="w-4 h-4" />
                    Video Saved
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteVerification(ver.id, ver.video_path)}
                    disabled={deletingId === ver.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-2xl font-medium transition flex items-center justify-center gap-2"
                  >
                    {deletingId === ver.id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
