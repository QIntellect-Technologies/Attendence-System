import React, { useState, useEffect } from "react";

const PayrollModule: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal & Editing States ---
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Payroll Configuration States
  const [globalBaseSalary, setGlobalBaseSalary] = useState(50000);
  const [otRatePerHour, setOtRatePerHour] = useState(500);

  // --- Specific Allowances State ---
  const [medicalAllowance, setMedicalAllowance] = useState(0);
  const [conveyanceAllowance, setConveyanceAllowance] = useState(0);
  const [otherAllowance, setOtherAllowance] = useState(0);

  // --- Specific Deductions State ---
  const [groupInsurance, setGroupInsurance] = useState(0);
  const [incomeTax, setIncomeTax] = useState(0);
  const [otherDeduction, setOtherDeduction] = useState(0);

  // --- Filters State ---
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [selectedYear, setSelectedYear] = useState("2026");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = ["2024", "2025", "2026", "2027"];

  const ALLOWED_LEAVES = 2;
  const WORKING_DAYS = 22;

  // --- Logic: Fetch Approved Overtime ---
  const getApprovedOTHours = (staffId: string) => {
    try {
      const allRequests = JSON.parse(
        localStorage.getItem("overtimeRequests") || "[]",
      );
      return allRequests
        .filter(
          (req: any) => req.staffId === staffId && req.status === "Approved",
        )
        .reduce((sum: number, req: any) => sum + Number(req.hours || 0), 0);
    } catch (e) {
      return 0;
    }
  };

  const calculateDepartmentStats = () => {
    const stats: { [key: string]: number } = {};
    staffList.forEach((staff) => {
      const dept = staff.department || "Unassigned";
      stats[dept] = (stats[dept] || 0) + (staff.netSalary || 0);
    });
    return Object.entries(stats).map(([name, total]) => ({ name, total }));
  };

  const deptWiseData = calculateDepartmentStats();
  const maxSalary = Math.max(...deptWiseData.map((d) => d.total), 1);

  // --- FETCH & CALCULATION LOGIC ---
  const fetchStaffData = async () => {
    try {
      const response = await fetch("http://localhost:5000/get_staff_list");
      const apiData = await response.json();
      const savedStructures = JSON.parse(
        localStorage.getItem("salary_structures") || "[]",
      );

      const mappedData = apiData.map((item: any) => {
        const staffId = item.id.toString();
        const config = savedStructures.find((s: any) => s.empId === staffId);
        const baseSalary = config
          ? Number(config.baseSalary)
          : Number(item.salary) || globalBaseSalary;
        const presentDays = item.present_days || 0;
        const otHours = getApprovedOTHours(staffId);
        const totalOTPay = otHours * otRatePerHour;

        let totalAllowances = 0;
        if (config && config.allowances) {
          totalAllowances = config.allowances.reduce((sum: number, al: any) => {
            const val = Number(al.amount || 0);
            return (
              sum + (al.type === "Percentage" ? (baseSalary * val) / 100 : val)
            );
          }, 0);
        } else {
          totalAllowances =
            Number(medicalAllowance) +
            Number(conveyanceAllowance) +
            Number(otherAllowance);
        }

        let configDeductions = 0;
        if (config && config.deductions) {
          configDeductions = config.deductions.reduce(
            (sum: number, de: any) => {
              const val = Number(de.amount || 0);
              return (
                sum +
                (de.type === "Percentage" ? (baseSalary * val) / 100 : val)
              );
            },
            0,
          );
        } else {
          configDeductions =
            Number(groupInsurance) + Number(incomeTax) + Number(otherDeduction);
        }

        const totalLeaves = WORKING_DAYS - presentDays;
        const extraLeaves =
          totalLeaves > ALLOWED_LEAVES ? totalLeaves - ALLOWED_LEAVES : 0;
        const leaveDeduction = Math.round(
          (baseSalary / WORKING_DAYS) * extraLeaves,
        );
        const finalTotalDeductions = leaveDeduction + configDeductions;
        const netSalary = Math.round(
          baseSalary + totalAllowances + totalOTPay - finalTotalDeductions,
        );

        return {
          id: staffId,
          name: item.name,
          department: item.department || item.unit || "General",
          baseSalary,
          presentDays,
          otHours,
          totalOTPay,
          deduction: finalTotalDeductions,
          netSalary,
        };
      });
      setStaffList(mappedData);
      setIsLoading(false);
    } catch (err) {
      console.error("Data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 5000);
    return () => clearInterval(interval);
  }, [
    medicalAllowance,
    conveyanceAllowance,
    otherAllowance,
    groupInsurance,
    incomeTax,
    otherDeduction,
    globalBaseSalary,
    otRatePerHour,
  ]);

  const handleUpdateStaff = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/update_staff_payroll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStaff.id,
            salary: editingStaff.baseSalary,
            department: editingStaff.department,
          }),
        },
      );
      if (response.ok) {
        setIsStaffModalOpen(false);
        fetchStaffData();
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const exportToCSV = () => {
    const headers =
      "ID,Name,Department,Base Salary (PKR),Present,OT Hours,OT Pay (PKR),Deductions,Net Salary\n";
    const rows = staffList
      .map(
        (s) =>
          `${s.id},${s.name},${s.department},${s.baseSalary},${s.presentDays},${s.otHours},${s.totalOTPay},${s.deduction},${s.netSalary}`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payroll_Report_${selectedMonth}_${selectedYear}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] p-6 font-sans overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            Payroll Management
          </h1>
          <p className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
            LIVE DATABASE SYNC ACTIVE (PKR)
          </p>
        </div>
        <button
          onClick={() => setIsGlobalModalOpen(true)}
          className="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          ⚙️ Company Payroll Rules
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Pay-out"
          value={`Rs. ${staffList.reduce((a, c) => a + c.netSalary, 0).toLocaleString()}`}
          icon="💰"
          color="text-emerald-500"
        />
        <StatCard
          label="Total OT Paid"
          value={`Rs. ${staffList.reduce((a, c) => a + (c.totalOTPay || 0), 0).toLocaleString()}`}
          icon="⚡"
          color="text-indigo-500"
        />
        <StatCard
          label="Employees"
          value={staffList.length}
          icon="👥"
          color="text-blue-500"
        />
        <StatCard
          label="Status"
          value="Pending"
          icon="⏳"
          color="text-amber-500"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-6 py-5">No</th>
              <th className="px-6 py-5">Name</th>
              <th className="px-6 py-5">Base Salary</th>
              <th className="px-6 py-5 text-center">OT Hours</th>
              <th className="px-6 py-5 text-indigo-500">OT Pay</th>
              <th className="px-6 py-5 text-rose-500">Deductions</th>
              <th className="px-6 py-5 text-indigo-600">Net Salary</th>
              <th className="px-6 py-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staffList.map((staff, idx) => (
              <tr
                key={staff.id}
                className="hover:bg-slate-50/50 transition-all"
              >
                <td className="px-6 py-4 text-[10px] font-bold text-slate-300">
                  {idx + 1}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-900">
                  {staff.name}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                  Rs. {staff.baseSalary.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">
                  {staff.otHours} hrs
                </td>
                <td className="px-6 py-4 text-xs font-black text-indigo-500">
                  +Rs. {staff.totalOTPay.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-xs font-black text-rose-500">
                  -Rs. {staff.deduction.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-xs font-black text-indigo-600">
                  Rs. {staff.netSalary.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      setEditingStaff(staff);
                      setIsStaffModalOpen(true);
                    }}
                    className="hover:scale-125 transition-transform"
                  >
                    ⚙️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALS (UI code as requested previously) */}
      {isGlobalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl text-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
              Company Rules
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-left">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-2">
                  Default Base Salary
                </label>
                <input
                  type="number"
                  value={globalBaseSalary}
                  onChange={(e) => setGlobalBaseSalary(Number(e.target.value))}
                  className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none"
                />
              </div>
              <div className="text-left">
                <label className="text-[10px] font-black uppercase text-indigo-500 block mb-2">
                  OT Rate (Hour)
                </label>
                <input
                  type="number"
                  value={otRatePerHour}
                  onChange={(e) => setOtRatePerHour(Number(e.target.value))}
                  className="w-full bg-indigo-50 p-4 rounded-2xl text-xs font-bold outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => setIsGlobalModalOpen(false)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {isStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
              Edit: {editingStaff.name}
            </h2>
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black uppercase text-slate-500">
                Personalized Base Salary
              </label>
              <input
                type="number"
                value={editingStaff.baseSalary}
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    baseSalary: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none"
                placeholder="Base Salary"
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStaff}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section - FIXED ATTENDANCE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
            Attendance Summary
          </h3>
          {/* Scrollable Container added for long lists */}
          <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {staffList.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                  <span className="text-slate-700">{s.name}</span>
                  <span className="text-slate-400">
                    {s.presentDays}/{WORKING_DAYS} Days
                  </span>
                </div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(s.presentDays / WORKING_DAYS) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dept Wise Summary (Same as before) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
            Salary Distribution (By Dept)
          </h3>
          <div className="space-y-6">
            {deptWiseData.map((dept) => (
              <div key={dept.name} className="flex items-center gap-4">
                <span className="text-[9px] font-black w-24 uppercase text-slate-500 truncate">
                  {dept.name}
                </span>
                <div className="flex-1 bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${(dept.total / maxSalary) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-black text-slate-800 w-24 text-right">
                  Rs. {dept.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span className={`p-2 rounded-xl bg-slate-50 ${color}`}>{icon}</span>
    </div>
    <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
  </div>
);

export default PayrollModule;
