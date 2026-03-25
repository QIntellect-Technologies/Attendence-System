import React, { useState, useEffect } from "react";
import { Staff } from "../../types";

const HRModule: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [activeTab, setActiveTab] = useState("Profile");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // --- Modal & Form States ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Staff>>({});

  // --- Load data: local first → backend sync ---
  const fetchStaff = async () => {
    try {
      setLoading(true);

      // 1. Pehle localStorage se load (turant UI dikhao)
      const saved = localStorage.getItem("staff");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setStaffList(parsed);

          // Selection maintain karo
          if (parsed.length > 0) {
            if (selectedStaff) {
              const updated = parsed.find(
                (s: Staff) => s.id === selectedStaff.id,
              );
              setSelectedStaff(updated || parsed[0]);
            } else {
              setSelectedStaff(parsed[0]);
            }
          }
        } catch (e) {
          console.warn("Invalid local staff data", e);
        }
      }

      // 2. Backend se latest data leke aao aur localStorage update karo
      const response = await fetch("http://localhost:5000/get_staff_list");
      if (!response.ok) throw new Error("Failed to fetch staff");

      const data = await response.json();

      const mappedData: Staff[] = data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name || "",
        email: item.email || "No Email",
        phone: item.phone || "Not Provided",
        department: item.department || "General",
        position: item.role || "Staff Member",
        joinDate: item.joinDate || item.join_date || "2024-01-01",
        userId: item.id.toString(),
        shiftStart: item.duty_start || "09:00",
        shiftEnd: item.duty_end || "18:00",
        salary: item.salary ? Number(item.salary) : 0,
        presentDays: item.present_days || 0,
        shift: item.shift || "Morning Shift",
      }));

      // LocalStorage mein latest data save kar do
      localStorage.setItem("staff", JSON.stringify(mappedData));

      setStaffList(mappedData);

      // Selection maintain
      if (mappedData.length > 0) {
        if (selectedStaff) {
          const updated = mappedData.find((s) => s.id === selectedStaff.id);
          setSelectedStaff(updated || mappedData[0]);
        } else {
          setSelectedStaff(mappedData[0]);
        }
      }
    } catch (err) {
      console.error("HR Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();

    // Admin/Staff directory se change hone par auto refresh
    const handleStaffUpdate = () => {
      fetchStaff();
    };

    window.addEventListener("staffDataChanged", handleStaffUpdate);

    return () => {
      window.removeEventListener("staffDataChanged", handleStaffUpdate);
    };
  }, []);

  // --- Edit Handlers ---
  const handleEditClick = () => {
    if (selectedStaff) {
      setEditFormData(selectedStaff);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id) {
      alert("No staff selected!");
      return;
    }

    try {
      // ID clean karo agar prefix hai (staff-123 → 123)
      const cleanId = editFormData.id.toString().replace(/^staff-/, "");

      console.log("Sending update request:");
      console.log("URL:", `http://localhost:5000/update_staff/${cleanId}`);
      console.log("Payload:", editFormData);

      const response = await fetch(
        `http://localhost:5000/update_staff/${cleanId}`,
        {
          method: "POST", // ← Yeh change sabse important hai (backend POST accept karta hai)
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editFormData),
        },
      );

      const responseText = await response.text();

      if (response.ok) {
        setIsEditModalOpen(false);
        fetchStaff(); // HR side refresh
        window.dispatchEvent(new Event("staffDataChanged")); // Staff directory ko bhi batao
        alert("Profile Updated Successfully!");
      } else {
        console.log("Backend failed:", response.status, responseText);
        alert(
          `Update failed!\nServer response: ${response.status} - ${responseText || "Unknown error"}`,
        );
      }
    } catch (err) {
      console.error("Update request failed:", err);
      alert("Update failed! Check console or server is running?");
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm),
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900 relative">
      {/* --- Edit Modal Popup --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3">
              <span className="p-2 bg-indigo-50 rounded-xl">📝</span> Edit
              Personnel
            </h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ModalInput
                  label="Full Name"
                  value={editFormData.name}
                  onChange={(v: string) =>
                    setEditFormData({ ...editFormData, name: v })
                  }
                />
                <ModalInput
                  label="Salary"
                  value={editFormData.salary?.toString() || ""}
                  type="number"
                  onChange={(v: string) =>
                    setEditFormData({ ...editFormData, salary: Number(v) })
                  }
                />
                <ModalInput
                  label="Department"
                  value={editFormData.department}
                  onChange={(v: string) =>
                    setEditFormData({ ...editFormData, department: v })
                  }
                />
                <ModalInput
                  label="Position"
                  value={editFormData.position}
                  onChange={(v: string) =>
                    setEditFormData({ ...editFormData, position: v })
                  }
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-white hover:bg-indigo-700 shadow-lg transition-all uppercase text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <span className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              👥
            </span>
            HR Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            Qintellect Technologies Personnel Portal
          </p>
        </div>
        <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all">
          Generate Monthly Report
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-200/60 p-6 shadow-xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-xl text-slate-800">Directory</h2>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              {staffList.length} Staff
            </span>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm outline-none border-2 border-transparent focus:border-indigo-500 transition-all"
            />
            <span className="absolute left-4 top-4 text-xl opacity-40">🔍</span>
          </div>

          <div className="overflow-y-auto flex-grow space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-10 text-center font-bold text-slate-400">
                Loading Records...
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => {
                    setSelectedStaff(staff);
                    setActiveTab("Profile");
                  }}
                  className={`p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedStaff?.id === staff.id
                      ? "bg-slate-900 text-white shadow-2xl scale-[1.02]"
                      : "bg-white border border-slate-100 hover:bg-indigo-50/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedStaff?.id === staff.id ? "bg-indigo-500" : "bg-slate-100"}`}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-none">
                        {staff.name}
                      </p>
                      <p className="text-[10px] mt-1 opacity-60 font-bold uppercase">
                        {staff.department}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl overflow-hidden flex flex-col">
          {selectedStaff ? (
            <div className="p-8 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {selectedStaff.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">
                      {selectedStaff.name}
                    </h2>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-2">
                      {selectedStaff.position} • {selectedStaff.department}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Employee ID
                  </p>
                  <p className="text-lg font-black text-indigo-600">
                    SSG-{selectedStaff.id.padStart(4, "0")}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-8 w-fit border border-slate-200/50">
                {["Profile", "Leave Record", "Performance", "Payroll"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2.5 text-[11px] font-black uppercase rounded-xl transition-all ${
                        activeTab === tab
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-slate-500"
                      }`}
                    >
                      {tab}
                    </button>
                  ),
                )}
              </div>

              {/* Tab Content */}
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === "Profile" &&
                  renderProfileTab(selectedStaff, handleEditClick)}
                {activeTab === "Leave Record" && renderLeaveTab(selectedStaff)}
                {activeTab === "Performance" &&
                  renderPerformanceTab(selectedStaff)}
                {activeTab === "Payroll" && renderPayrollTab(selectedStaff)}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
              <span className="text-6xl">🔍</span>
              <p className="font-black uppercase tracking-widest text-sm">
                Select Personnel to Manage
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components bilkul same rakhe hain ---
const renderProfileTab = (staff: Staff, onEdit: () => void) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
    <InfoBox label="Legal Name" value={staff.name} />
    <InfoBox label="Work Email" value={staff.email} />
    <InfoBox label="Assigned Department" value={staff.department} />
    <InfoBox label="Current Role" value={staff.position} />
    <InfoBox
      label="Shift Hours"
      value={`${staff.shiftStart} - ${staff.shiftEnd}`}
    />
    <InfoBox label="Joining Date" value={staff.joinDate} />
    <button
      onClick={onEdit}
      className="col-span-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all mt-4"
    >
      Edit System Profile
    </button>
  </div>
);

const ModalInput = ({ label, value, type = "text", onChange }: any) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase ml-1">
      {label}
    </p>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
    />
  </div>
);

const renderLeaveTab = (staff: Staff) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        label="Annual Quota"
        value="22 Days"
        color="text-emerald-600"
        bg="bg-emerald-50"
      />
      <StatCard
        label="Used Leaves"
        value="05 Days"
        color="text-amber-600"
        bg="bg-amber-50"
      />
      <StatCard
        label="Balance"
        value="17 Days"
        color="text-indigo-600"
        bg="bg-indigo-50"
      />
    </div>
    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
      <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
        Leave History
      </h4>
      <div className="flex justify-between items-center py-3 border-b border-slate-200/50">
        <span className="text-sm font-bold">Sick Leave (Flu)</span>
        <span className="text-xs font-bold text-slate-500">
          Mar 02 - Mar 03
        </span>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black">
          APPROVED
        </span>
      </div>
    </div>
  </div>
);

const renderPerformanceTab = (staff: Staff) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
    <div className="flex items-center gap-8 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl">
      <div className="text-center">
        <p className="text-[9px] font-black uppercase opacity-60 mb-1">
          KPI Rating
        </p>
        <h3 className="text-4xl font-black text-indigo-400">8.8</h3>
      </div>
      <div className="flex-grow space-y-3">
        {["Efficiency", "Punctuality"].map((skill) => (
          <div key={skill} className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span>{skill}</span>
              <span>92%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500"
                style={{ width: "92%" }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const renderPayrollTab = (staff: Staff) => {
  const salary = Number(staff.salary) || 0;
  const presentDays = staff.presentDays || 0;
  const payout = Math.round((salary / 30) * presentDays);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">
            Gross Pay Breakdown
          </p>
          <div className="flex justify-between py-2 border-b border-slate-200/50 text-sm font-bold">
            <span>Base Salary</span>
            <span>Rs. {salary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 text-sm font-black text-emerald-600 mt-2">
            <span>Current Payout</span>
            <span>Rs. {payout.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-6 bg-indigo-600 rounded-3xl text-white text-center">
          <p className="text-[10px] font-bold uppercase opacity-60 mb-2">
            Attendance Sync
          </p>
          <h3 className="text-3xl font-black">{presentDays} / 30</h3>
        </div>
      </div>
    </div>
  );
};

const InfoBox = ({ label, value }: any) => (
  <div className="group">
    <p className="text-[10px] text-slate-400 mb-2 uppercase font-black tracking-widest ml-1">
      {label}
    </p>
    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-800 font-bold group-hover:bg-white group-hover:border-indigo-100 transition-all">
      {value}
    </div>
  </div>
);

const StatCard = ({ label, value, color, bg }: any) => (
  <div
    className={`p-5 rounded-3xl ${bg} border border-white shadow-sm text-center`}
  >
    <p className={`text-xl font-black ${color} tracking-tight`}>{value}</p>
    <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">
      {label}
    </p>
  </div>
);

export default HRModule;
