import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import { OvertimeRequest } from "../../types";
import {
  getOvertimeRequests,
  saveOvertimeRequests,
  updateOvertimeStatus,
} from "../../utils/storage";

const HrOvertimeManagement: React.FC = () => {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<OvertimeRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load Data
  const loadRequests = () => {
    const data = getOvertimeRequests();
    setRequests(
      data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 3000); // Real-time feel
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRequests();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleApprove = (id: string) => {
    updateOvertimeStatus(id, "Approved");
    loadRequests();
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) return;

    const all = getOvertimeRequests();
    const idx = all.findIndex((r) => r.id === selectedRequest.id);
    if (idx !== -1) {
      all[idx].status = "Rejected";
      all[idx].rejectionNote = rejectionReason;
      saveOvertimeRequests(all);
    }
    loadRequests();
    setShowRejectModal(false);
    setRejectionReason("");
    setSelectedRequest(null);
  };

  // Stats
  const approvedHours = requests
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + r.hours, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Overtime Management
          </h1>
          <p className="text-slate-400 mt-1">
            HR - Review and manage staff overtime requests
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-2xl transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-right">
            <p className="text-xs text-slate-400">THIS MONTH</p>
            <p className="text-lg font-bold text-white">
              {approvedHours} hrs approved
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-700 bg-slate-950 flex justify-between items-center">
          <h2 className="font-semibold text-white">All Overtime Requests</h2>
          <span className="text-emerald-400 text-sm font-medium">
            ● Live Updates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
                <th className="px-8 py-5 text-left">EMPLOYEE</th>
                <th className="px-8 py-5 text-left">DATE</th>
                <th className="px-8 py-5 text-left">REGULAR END</th>
                <th className="px-8 py-5 text-left">OVERTIME END</th>
                <th className="px-8 py-5 text-left">HOURS</th>
                <th className="px-8 py-5 text-left">REASON</th>
                <th className="px-8 py-5 text-left">STATUS</th>
                <th className="px-8 py-5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="font-semibold text-white">
                      {req.staffName}
                    </div>
                    <div className="text-xs text-slate-500">{req.staffId}</div>
                  </td>
                  <td className="px-8 py-5 text-slate-300">{req.date}</td>
                  <td className="px-8 py-5 text-slate-300">
                    {req.regularEnd || "05:00 PM"}
                  </td>
                  <td className="px-8 py-5 text-slate-300 font-medium">
                    {req.overtimeEnd}
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-emerald-400 font-bold">
                      +{req.hours} hrs
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-400 max-w-xs truncate">
                    {req.task || req.reason}
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                        req.status === "Approved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : req.status === "Rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-3">
                      {req.status === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowRejectModal(true);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="text-slate-400 hover:text-white p-2"
                        >
                          <Eye size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-white mb-6">
              Reject Overtime Request
            </h3>

            <p className="text-slate-400 mb-2">Reason for rejection</p>
            <textarea
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-red-500"
              placeholder="Write rejection reason here..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-2xl font-medium text-white"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrOvertimeManagement;
