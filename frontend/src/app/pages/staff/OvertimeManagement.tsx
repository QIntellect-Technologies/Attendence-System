import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, PlusCircle, X } from "lucide-react";
import { getOvertimeRequests, saveOvertimeRequests } from "../../utils/storage";
import { OvertimeRequest } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

const StaffOvertime = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State matching Figma Design
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    regularEnd: "17:00",
    overtimeEnd: "",
    reason: "",
  });

  useEffect(() => {
    if (user?.staffId) {
      const allRequests = getOvertimeRequests();
      const myRequests = allRequests.filter((r) => r.staffId === user.staffId);
      setRequests(myRequests);
    }
  }, [user]);

  // Proper Request Logic instead of prompts
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.overtimeEnd || !formData.reason) {
      alert("Please fill all required fields.");
      return;
    }

    // Calculate hours automatically
    const start = new Date(`2024-01-01 ${formData.regularEnd}`);
    const end = new Date(`2024-01-01 ${formData.overtimeEnd}`);
    let diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    const hours = diff > 0 ? parseFloat(diff.toFixed(1)) : 0;

    if (user?.staffId) {
      const newRequest: OvertimeRequest = {
        id: `OT-${Date.now()}`,
        staffId: user.staffId,
        staffName: user.name || "Unknown",
        date: formData.date,
        hours: hours,
        reason: formData.reason,
        task: formData.reason, // Syncing both fields to avoid errors
        status: "Pending",
        appliedOn: new Date().toLocaleDateString(), // Required by interface
      };

      const allExisting = getOvertimeRequests();
      const updatedAll = [newRequest, ...allExisting];
      saveOvertimeRequests(updatedAll);

      setRequests((prev) => [newRequest, ...prev]);
      setIsModalOpen(false);
      setFormData({ ...formData, overtimeEnd: "", reason: "" });
    }
  };

  const approvedHours = requests
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + r.hours, 0);
  const pendingHours = requests
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + r.hours, 0);

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen relative">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 text-left">
            Overtime Management
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 text-left">
            Request overtime for extended work hours
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all"
        >
          <PlusCircle size={20} /> Request Overtime
        </button>
      </div>

      {/* Stats Cards - Matching image_504ee0.png */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Clock />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Overtime
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {approvedHours + pendingHours} hrs
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
            <AlertCircle />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Pending Requests
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {requests.filter((r) => r.status === "Pending").length}
            </h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-6">Date</th>
              <th className="p-6">Hours</th>
              <th className="p-6">Reason</th>
              <th className="p-6">Status</th>
              <th className="p-6">Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
            {requests.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="p-6">{item.date}</td>
                <td className="p-6 font-black text-slate-800">
                  +{item.hours} hrs
                </td>
                <td className="p-6">{item.reason || item.task}</td>
                <td className="p-6">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                      item.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-6 text-slate-400">{item.appliedOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FIXED: Figma Design Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6 text-left">
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Request Overtime
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Submit extra work details
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-300 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Regular End *
                    </label>
                    <input
                      type="time"
                      value={formData.regularEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, regularEnd: e.target.value })
                      }
                      className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Overtime End *
                    </label>
                    <input
                      type="time"
                      value={formData.overtimeEnd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overtimeEnd: e.target.value,
                        })
                      }
                      className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                    Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    placeholder="Explain why you need overtime..."
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-200 hover:bg-black transition-all"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffOvertime;
