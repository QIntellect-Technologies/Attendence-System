import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { OvertimeRequest } from "../../types";
import {
  getOvertimeRequests,
  saveOvertimeRequests,
  updateOvertimeStatus,
} from "../../utils/storage";

const OvertimeManagement: React.FC = () => {
  // Real-time data storage se load karne ke liye
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<OvertimeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  // Load data on component mount
  useEffect(() => {
    const data = getOvertimeRequests();
    setRequests(data);
  }, []);

  const handleStatusUpdate = (
    id: string,
    newStatus: "Approved" | "Rejected",
    note: string = "",
  ) => {
    // 1. Storage update
    updateOvertimeStatus(id, newStatus);

    // 2. Agar reject hua hai to note save karein
    if (newStatus === "Rejected") {
      const all = getOvertimeRequests();
      const idx = all.findIndex((r) => r.id === id);
      if (idx !== -1) {
        all[idx].rejectionNote = note;
        saveOvertimeRequests(all);
      }
    }

    // 3. UI sync
    setRequests(getOvertimeRequests());
    setSelectedRequest(null);
    setShowRejectModal(false);
    setRejectionReason("");
  };

  // Dynamic stats calculation based on real data
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const totalHours = requests
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + r.hours, 0);
  const estimatedCost = totalHours * 1250; // PKR 1,250 per hour assume kiya hai

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen font-sans">
      {/* Top Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          OVERTIME MANAGEMENT
        </h1>
        <div className="flex items-center text-[10px] text-green-600 font-bold mt-1">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          LIVE DATABASE SYNC ACTIVE (PKR)
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            Pending Requests
          </p>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-3xl font-black text-orange-500">
              {pendingCount}
            </h3>
            <AlertCircle className="text-orange-200" size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            Approved This Month
          </p>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-3xl font-black text-green-500">
              {approvedCount}
            </h3>
            <CheckCircle className="text-green-200" size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            Total Overtime
          </p>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-3xl font-black text-blue-500">
              {totalHours} hrs
            </h3>
            <Clock className="text-blue-200" size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            Estimated Cost
          </p>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-3xl font-black text-purple-600">
              Rs. {estimatedCost.toLocaleString()}
            </h3>
            <Banknote className="text-purple-200" size={24} />
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              All Overtime Requests
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage staff extra hours and PK currency payouts
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fcfcfd] text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Regular End</th>
                <th className="px-6 py-4">Overtime End</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Applied</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800 text-sm">
                      {req.staffName}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                      {req.staffId}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {req.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                    {req.regularEnd || "18:00"}
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-black">
                    {req.overtimeEnd || "--:--"}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-gray-700">
                    +{req.hours} hrs
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        req.status === "Pending"
                          ? "bg-orange-50 text-orange-600 border border-orange-100"
                          : req.status === "Approved"
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : "bg-red-50 text-red-600 border border-red-100"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-gray-400 font-medium">
                    {req.appliedOn}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      {req.status === "Pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(req.id, "Approved")
                            }
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowRejectModal(true);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reason & Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-xl font-black text-gray-800 mb-6">
              OVERTIME DETAILS
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Task / Request Reason
                </label>
                <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-700 italic border border-gray-100">
                  "{selectedRequest.task}"
                </div>
              </div>

              {showRejectModal ? (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">
                    Rejection Note (Required)
                  </label>
                  <textarea
                    autoFocus
                    className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm h-32 focus:border-red-200 focus:ring-4 focus:ring-red-50/50 outline-none transition-all"
                    placeholder="Provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          selectedRequest.id,
                          "Rejected",
                          rejectionReason,
                        )
                      }
                      disabled={!rejectionReason.trim()}
                      className="bg-red-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 shadow-lg shadow-red-100"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="bg-gray-100 text-gray-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedRequest.status === "Rejected" && (
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <label className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">
                        Admin Rejection Reason
                      </label>
                      <p className="text-sm text-red-800 font-medium">
                        {selectedRequest.rejectionNote}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200"
                  >
                    Close Window
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimeManagement;
