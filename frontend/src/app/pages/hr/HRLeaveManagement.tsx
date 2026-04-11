import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";

type LeaveRequest = {
  id: number | string;
  user_id?: number;
  name: string;
  dept?: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

export default function HRLeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "All" | "Pending" | "Approved" | "Rejected"
  >("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all pending + approved/rejected leaves
  const fetchLeaves = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/get_pending_leaves");

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Leaves fetched:", data.length);
        setLeaveRequests(data);
      } else {
        console.error("❌ Failed to fetch leaves - Status:", res.status);
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error("❌ Error fetching leave requests:", err);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Filter
  const filteredRequests = leaveRequests
    .filter(
      (req) =>
        req.name.toLowerCase().includes(search.toLowerCase()) ||
        req.type.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((req) => filterStatus === "All" || req.status === filterStatus);

  const pendingCount = leaveRequests.filter(
    (r) => r.status === "Pending",
  ).length;
  const approvedCount = leaveRequests.filter(
    (r) => r.status === "Approved",
  ).length;

  // Approve / Reject
  const handleStatusChange = async (
    id: number | string,
    newStatus: "Approved" | "Rejected",
  ) => {
    if (!confirm(`Are you sure you want to ${newStatus} this leave request?`))
      return;

    try {
      const res = await fetch("http://127.0.0.1:5000/update_leave_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        alert(`Leave ${newStatus} successfully!`);
        fetchLeaves(); // Real refresh
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to update: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(
        "Server error while updating leave status. Please check if Flask is running.",
      );
    }
  };

  const handleRefresh = () => {
    fetchLeaves();
  };

  if (loading && leaveRequests.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading leave requests...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Leave Management</h1>
          <p className="text-slate-400">
            Review and approve employee time-off requests
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900 px-5 py-2.5 rounded-2xl flex items-center gap-3">
            <Clock className="text-orange-400" size={22} />
            <div>
              <p className="text-xs text-slate-400">PENDING</p>
              <p className="text-xl font-semibold text-white">{pendingCount}</p>
            </div>
          </div>
          <div className="bg-slate-900 px-5 py-2.5 rounded-2xl flex items-center gap-3">
            <CheckCircle className="text-emerald-400" size={22} />
            <div>
              <p className="text-xs text-slate-400">APPROVED</p>
              <p className="text-xl font-semibold text-white">
                {approvedCount}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all disabled:opacity-70"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by staff name or leave type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-3xl py-4 pl-12 pr-6 text-white placeholder-slate-400 focus:border-purple-500 outline-none"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["All", "Pending", "Approved", "Rejected"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                  filterStatus === status
                    ? "bg-purple-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-8 py-5 text-left text-sm font-medium text-slate-400">
                  EMPLOYEE
                </th>
                <th className="px-6 py-5 text-left text-sm font-medium text-slate-400">
                  LEAVE TYPE
                </th>
                <th className="px-6 py-5 text-left text-sm font-medium text-slate-400">
                  REASON
                </th>
                <th className="px-6 py-5 text-left text-sm font-medium text-slate-400">
                  DATES
                </th>
                <th className="px-6 py-5 text-left text-sm font-medium text-slate-400">
                  STATUS
                </th>
                <th className="px-8 py-5 text-right text-sm font-medium text-slate-400">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    No leave requests found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/60">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {req.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-semibold">{req.name}</p>
                          {req.dept && (
                            <p className="text-xs text-slate-500">{req.dept}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-4 py-1.5 bg-slate-800 rounded-2xl text-sm">
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-slate-300 max-w-xs truncate">
                      {req.reason}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {req.start_date} — {req.end_date}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`px-4 py-1 rounded-2xl text-sm font-medium ${
                          req.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : req.status === "Rejected"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {req.status === "Pending" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() =>
                              handleStatusChange(req.id, "Approved")
                            }
                            className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-2xl text-sm font-medium transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(req.id, "Rejected")
                            }
                            className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-2xl text-sm font-medium transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-sm font-medium">
                          ✓ Action Taken
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
