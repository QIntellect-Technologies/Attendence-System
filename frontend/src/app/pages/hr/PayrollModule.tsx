import React, { useState, useEffect } from "react";

const PayrollModule: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);

  // Company Settings
  const [globalBaseSalary, setGlobalBaseSalary] = useState(50000);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("April");
  const [selectedYear, setSelectedYear] = useState("2026");

  const WORKING_DAYS = 22;
  const ALLOWED_LEAVES = 2;

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
  const years = ["2025", "2026", "2027"];

  // Fetch Approved OT Hours
  const getApprovedOTHours = async (staffId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/overtime/approved?staffId=${staffId}`,
      );
      const data = await res.json();
      return data.totalHours || 0;
    } catch (e) {
      return 0;
    }
  };

  // ==================== MAIN FETCH FUNCTION (Improved) ====================
  const fetchStaffData = async () => {
    try {
      setIsLoading(true);

      const staffRes = await fetch("http://localhost:5000/get_staff_list");
      const staffData = await staffRes.json();

      const salaryRes = await fetch(
        "http://localhost:5000/get_salary_structures",
      );
      const salaryData = await salaryRes.json();

      console.log(
        `📊 Total Staff: ${staffData.length} | Total Salary Structures: ${salaryData.length}`,
      );

      const mappedData = await Promise.all(
        staffData.map(async (item: any) => {
          const staffId = String(item.id || "").trim();

          // 🔥 Improved Matching Logic (Multiple ways try karta hai)
          let salaryStructure = salaryData.find(
            (s: any) => String(s.empId || "").trim() === staffId,
          );

          if (!salaryStructure) {
            salaryStructure = salaryData.find(
              (s: any) => String(s.id || "").trim() === staffId,
            );
          }

          if (!salaryStructure) {
            console.warn(
              `❌ No Salary Structure found for Staff ID: ${staffId} | Name: ${item.name}`,
            );
          } else {
            console.log(
              `✅ Structure matched for ${item.name} (ID: ${staffId})`,
            );
          }

          const baseSalary = salaryStructure
            ? Number(salaryStructure.baseSalary)
            : Number(item.salary) || globalBaseSalary;

          const presentDays = Number(item.present_days) || 0;
          const otHours = await getApprovedOTHours(staffId);

          // OT Calculation (Same as SalaryConfig)
          const calculateOTPay = (base: number, hours: number) => {
            if (!base || !hours) return 0;
            const hourlyRate = base / 240;
            return Math.round(hourlyRate * hours * 1.5);
          };

          const totalOTPay = calculateOTPay(baseSalary, otHours);

          // Allowances
          let totalAllowances = 0;
          if (salaryStructure?.allowances?.length) {
            totalAllowances = salaryStructure.allowances.reduce(
              (sum: number, al: any) => {
                const val = Number(al.amount) || 0;
                const amount =
                  al.type === "Percentage %"
                    ? Math.round((baseSalary * val) / 100)
                    : val;
                return sum + amount;
              },
              0,
            );
          }

          // Deductions
          let totalDeductions = 0;
          if (salaryStructure?.deductions?.length) {
            totalDeductions = salaryStructure.deductions.reduce(
              (sum: number, de: any) => {
                const val = Number(de.amount) || 0;
                const amount =
                  de.type === "Percentage %"
                    ? Math.round((baseSalary * val) / 100)
                    : val;
                return sum + amount;
              },
              0,
            );
          }

          // Leave Deduction
          const totalLeaves = WORKING_DAYS - presentDays;
          const extraLeaves =
            totalLeaves > ALLOWED_LEAVES ? totalLeaves - ALLOWED_LEAVES : 0;
          const leaveDeduction = Math.round(
            (baseSalary / WORKING_DAYS) * extraLeaves,
          );

          const finalDeductions = totalDeductions + leaveDeduction;
          const netSalary = Math.round(
            baseSalary + totalAllowances + totalOTPay - finalDeductions,
          );

          return {
            id: staffId,
            name: item.name || "Unknown",
            department: item.department || item.unit || "General",
            baseSalary,
            presentDays,
            otHours,
            totalOTPay,
            deduction: finalDeductions,
            netSalary,
          };
        }),
      );

      setStaffList(mappedData);
    } catch (err) {
      console.error("Payroll data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  useEffect(() => {
    let result = [...staffList];
    if (searchTerm) {
      result = result.filter((staff) =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    setFilteredStaff(result);
  }, [staffList, searchTerm]);

  // ==================== AUTO + INSTANT REFRESH ====================
  useEffect(() => {
    fetchStaffData();

    const interval = setInterval(fetchStaffData, 8000);

    const handleSalaryUpdate = () => {
      console.log(
        "✅ Salary Structure Updated from Config → Refreshing Payroll",
      );
      fetchStaffData();
    };

    window.addEventListener("salaryStructureUpdated", handleSalaryUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("salaryStructureUpdated", handleSalaryUpdate);
    };
  }, []);

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    try {
      const response = await fetch(
        "http://localhost:5000/update_staff_payroll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStaff.id,
            salary: editingStaff.baseSalary,
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
      "ID,Name,Department,Base Salary (PKR),Present Days,OT Hours,OT Pay (PKR),Deductions (PKR),Net Salary (PKR)\n";
    const rows = filteredStaff
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

  const totalPayout = filteredStaff.reduce((sum, s) => sum + s.netSalary, 0);
  const totalOT = filteredStaff.reduce((sum, s) => sum + s.totalOTPay, 0);
  const totalEmployees = filteredStaff.length;

  return (
    <div className="flex-1 p-6 overflow-auto bg-[#0a0f1c] text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Payroll Management
          </h1>
          <p className="text-emerald-400 text-sm flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            LIVE SYNC WITH SALARY CONFIG • PKR
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsGlobalModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"
          >
            ⚙️ Company Rules
          </button>
          <button
            onClick={exportToCSV}
            className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 bg-slate-900 border border-slate-700 rounded-3xl p-6">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500"
            />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 text-sm"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 text-center">
            <p className="text-xs text-slate-400">TOTAL PAYOUT</p>
            <p className="text-2xl font-black mt-1">
              Rs. {totalPayout.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 text-center">
            <p className="text-xs text-slate-400">TOTAL OT</p>
            <p className="text-2xl font-black mt-1 text-indigo-400">
              Rs. {totalOT.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 text-center">
            <p className="text-xs text-slate-400">EMPLOYEES</p>
            <p className="text-2xl font-black mt-1">{totalEmployees}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="font-bold text-xl">
            Payroll Summary - {selectedMonth} {selectedYear}
          </h2>
          {isLoading && (
            <span className="text-amber-400 text-sm animate-pulse">
              Refreshing from Salary Config...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-800 sticky top-0 z-10">
              <tr className="text-xs uppercase font-bold text-slate-400">
                <th className="px-6 py-5 text-left">No</th>
                <th className="px-6 py-5 text-left">Employee</th>
                <th className="px-6 py-5 text-left">Department</th>
                <th className="px-6 py-5 text-right">Base Salary</th>
                <th className="px-6 py-5 text-center">Present</th>
                <th className="px-6 py-5 text-center">OT Hours</th>
                <th className="px-6 py-5 text-right text-indigo-400">OT Pay</th>
                <th className="px-6 py-5 text-right text-rose-400">
                  Deductions
                </th>
                <th className="px-6 py-5 text-right text-emerald-400 font-bold">
                  Net Salary
                </th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-6 py-6">
                        <div className="h-4 bg-slate-700 rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-20 text-center text-slate-400"
                  >
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, idx) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-800/70 transition-colors"
                  >
                    <td className="px-6 py-5 text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-5 font-semibold">{staff.name}</td>
                    <td className="px-6 py-5 text-slate-400">
                      {staff.department}
                    </td>
                    <td className="px-6 py-5 text-right font-mono">
                      Rs. {staff.baseSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center font-mono">
                      {staff.presentDays}/{WORKING_DAYS}
                    </td>
                    <td className="px-6 py-5 text-center font-mono text-indigo-300">
                      {staff.otHours} hrs
                    </td>
                    <td className="px-6 py-5 text-right text-indigo-400 font-semibold">
                      + Rs. {staff.totalOTPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right text-rose-400 font-semibold">
                      - Rs. {staff.deduction.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-emerald-400">
                      Rs. {staff.netSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => {
                          setEditingStaff({ ...staff });
                          setIsStaffModalOpen(true);
                        }}
                        className="text-indigo-400 hover:text-white text-2xl transition-colors"
                      >
                        ⚙️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (Same as before) */}
      {isGlobalModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Company Payroll Rules</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Default Base Salary (PKR)
                </label>
                <input
                  type="number"
                  value={globalBaseSalary}
                  onChange={(e) => setGlobalBaseSalary(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsGlobalModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-800 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsGlobalModalOpen(false)}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-2xl"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {isStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">
              Edit Payroll • {editingStaff.name}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Base Salary (PKR)
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
                  className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-800 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStaff}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-2xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollModule;
