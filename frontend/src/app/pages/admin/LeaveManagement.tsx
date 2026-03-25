import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  CalendarDays,
} from "lucide-react";
// Humne storage.ts se real functions import kiye
import { getLeaveRequests, updateLeaveStatus } from "../../utils/storage";

const LeaveManagement = () => {
  // Local state for requests
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Data load karne ka function
  const loadData = () => {
    const data = getLeaveRequests();
    // Sort taake naye requests upar aayein
    setRequests(
      data.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  // Status handle karne ka function
  const handleAction = (id: string, status: "Approved" | "Rejected") => {
    updateLeaveStatus(id, status);
    loadData(); // Table refresh karne ke liye
  };

  // Search filter logic
  const filteredRequests = requests.filter(
    (req) =>
      req.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.status.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Stats calculation based on real data
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <CalendarDays className="text-blue-600" size={28} />
            Leave <span className="text-blue-600">Management</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            Review and Approve Employee Time-off Requests
          </p>
        </div>

        {/* Real Stats Cards */}
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Pending
            </p>
            <p className="text-xl font-black text-orange-500">
              {pendingCount < 10 ? `0${pendingCount}` : pendingCount}
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Approved
            </p>
            <p className="text-xl font-black text-green-500">
              {approvedCount < 10 ? `0${approvedCount}` : approvedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm mb-6 flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by staff name or leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-50">
              <th className="p-6">Employee Profile</th>
              <th className="p-6">Leave Details</th>
              <th className="p-6">Reason</th>
              <th className="p-6">Schedule</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-center">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-50/30 transition-all group"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg border border-blue-100 shadow-sm">
                        {req.staffName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm tracking-tight">
                          {req.staffName}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Staff ID: {req.staffId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                      {req.type}
                    </span>
                  </td>
                  <td className="p-6 text-xs font-bold text-slate-500 max-w-[200px] truncate">
                    {req.reason}
                  </td>
                  <td className="p-6 text-xs font-bold text-slate-500">
                    {req.startDate} to {req.endDate}
                  </td>
                  <td className="p-6">
                    <div
                      className={`flex items-center gap-1.5 ${
                        req.status === "Pending"
                          ? "text-orange-500"
                          : req.status === "Approved"
                            ? "text-green-500"
                            : "text-red-500"
                      }`}
                    >
                      {req.status === "Pending" && <Clock size={14} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {req.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    {req.status === "Pending" ? (
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleAction(req.id, "Approved")}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "Rejected")}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-[10px] font-bold text-slate-300 uppercase">
                        Action Taken
                      </p>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest"
                >
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveManagement;
