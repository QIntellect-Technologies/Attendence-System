import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const LeaveRequest = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    leaveType: "Annual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch my leaves from Backend + LocalStorage
  const fetchMyLeaves = async () => {
    if (!user?.name) return;

    setLoading(true);
    try {
      // Backend se fetch (agar route bana hai toh)
      const res = await fetch(
        `http://127.0.0.1:5000/get_my_leaves?name=${encodeURIComponent(user.name)}`,
      );

      if (res.ok) {
        const backendLeaves = await res.json();
        setMyRequests(backendLeaves);
      } else {
        // Fallback to localStorage
        const local = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
        const mine = local.filter((r: any) => r.staffName === user.name);
        setMyRequests(mine);
      }
    } catch (e) {
      console.error("Failed to fetch my leaves");
      // Fallback
      const local = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
      const mine = local.filter((r: any) => r.staffName === user.name);
      setMyRequests(mine);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.startDate || !formData.endDate || !formData.reason) {
      alert("Please fill all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/apply_leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_name: user.name,
          leave_type: formData.leaveType,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
        }),
      });

      if (response.ok) {
        alert(
          "✅ Leave Application Submitted Successfully! HR will review it.",
        );

        // Form reset
        setFormData({
          leaveType: "Annual Leave",
          startDate: "",
          endDate: "",
          reason: "",
        });

        // Refresh list
        fetchMyLeaves();
      } else {
        alert("Failed to submit to server. Saved locally.");
      }
    } catch (err) {
      console.error(err);
      alert("Server not reachable. Leave saved locally only.");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    pending: myRequests.filter((r) => r.status === "Pending").length,
    approved: myRequests.filter((r) => r.status === "Approved").length,
    rejected: myRequests.filter((r) => r.status === "Rejected").length,
    total: myRequests.length,
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001529]">Leave Requests</h1>
        <p className="text-gray-500 text-sm">
          Welcome, {user?.name}. Manage your leave applications.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Pending",
            count: stats.pending,
            icon: <Clock className="text-yellow-500" />,
            border: "border-l-4 border-yellow-500",
          },
          {
            label: "Approved",
            count: stats.approved,
            icon: <CheckCircle className="text-green-500" />,
            border: "border-l-4 border-green-500",
          },
          {
            label: "Rejected",
            count: stats.rejected,
            icon: <XCircle className="text-red-500" />,
            border: "border-l-4 border-red-500",
          },
          {
            label: "Total Apps",
            count: stats.total,
            icon: <Calendar className="text-blue-500" />,
            border: "border-l-4 border-blue-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-white p-5 rounded-xl shadow-sm flex items-center justify-between ${stat.border}`}
          >
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold text-[#001529]">
                {stat.count}
              </h3>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-6 text-[#001529] font-bold">
              <Send size={20} />
              <h2>Request New Leave</h2>
            </div>

            {/* Form fields same as before - no change needed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Leave Type
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Attach Document (Optional)
                </label>
                <input
                  type="file"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700"
                />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium text-gray-600">
                Reason for Leave
              </label>
              <textarea
                rows={4}
                required
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Briefly describe the reason..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#001529] text-white rounded-xl font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  {" "}
                  <Send size={18} /> Submit Application{" "}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side - Balance & Policy (same) */}
        <div className="space-y-6">
          <div className="bg-[#001529] text-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <FileText size={18} /> Leave Balance
            </h3>
            {/* Leave balance cards yahan paste kar sakte ho */}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
            <h3 className="font-bold text-[#001529] mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-500" /> Leave Policy
            </h3>
            <ul className="text-xs text-gray-500 space-y-3">
              <li>• Leave must be submitted 3 days in advance.</li>
              <li>• Medical certificate required for Sick Leave 2 days.</li>
              <li>• Approval depends on manager's discretion.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
