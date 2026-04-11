import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Save, X, Printer } from "lucide-react";

interface AllowanceItem {
  id: string;
  name: string;
  type: "Fixed Am" | "Percentage %";
  amount: number;
}

interface SalaryStructure {
  id: number;
  staffName: string;
  empId: string;
  designation: string;
  baseSalary: number;
  allowances: AllowanceItem[];
  deductions: AllowanceItem[];
  approvedOTHours: number;
}

export default function SalaryConfig() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form States
  const [staffName, setStaffName] = useState("");
  const [empId, setEmpId] = useState("");
  const [designation, setDesignation] = useState("");
  const [baseSalary, setBaseSalary] = useState(0);
  const [otHours, setOtHours] = useState(0);
  const [allowances, setAllowances] = useState<AllowanceItem[]>([]);
  const [deductions, setDeductions] = useState<AllowanceItem[]>([]);

  const [newAllowance, setNewAllowance] = useState<AllowanceItem>({
    id: "",
    name: "",
    type: "Fixed Am",
    amount: 0,
  });
  const [newDeduction, setNewDeduction] = useState<AllowanceItem>({
    id: "",
    name: "",
    type: "Fixed Am",
    amount: 0,
  });

  const WORKING_DAYS = 22;

  // Fetch All Salary Structures
  const fetchSalaryStructures = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5000/get_salary_structures");
      const data = await res.json();
      setStructures(data || []);
    } catch (err) {
      console.error("Failed to fetch salary structures:", err);
      setStructures([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStructures();
  }, []);

  // Fetch Approved OT
  const fetchApprovedOT = async (staffId: string) => {
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

  // Calculations
  const calculateValue = (item: AllowanceItem, base: number) =>
    item.type === "Fixed Am"
      ? item.amount
      : Math.round((base * item.amount) / 100);

  const calculateOTPay = (base: number, hours: number) => {
    if (!base || !hours) return 0;
    const hourlyRate = base / 240; // 30 days * 8 hrs
    return Math.round(hourlyRate * hours * 1.5);
  };

  const getSummary = (
    base: number,
    alls: AllowanceItem[],
    deds: AllowanceItem[],
    otHrs: number,
  ) => {
    const totalA = alls.reduce(
      (acc, curr) => acc + calculateValue(curr, base),
      0,
    );
    const totalD = deds.reduce(
      (acc, curr) => acc + calculateValue(curr, base),
      0,
    );
    const otPay = calculateOTPay(base, otHrs);

    return {
      totalA,
      totalD,
      otPay,
      gross: base + totalA + otPay,
      net: base + totalA + otPay - totalD,
    };
  };

  const currentTotals = useMemo(
    () => getSummary(baseSalary, allowances, deductions, otHours),
    [baseSalary, allowances, deductions, otHours],
  );

  const formatPKR = (num: number = 0) =>
    `Rs. ${Math.round(num).toLocaleString()}`;

  // Add Allowance
  const addAllowance = () => {
    if (!newAllowance.name || newAllowance.amount <= 0) return;
    setAllowances([
      ...allowances,
      { ...newAllowance, id: Date.now().toString() },
    ]);
    setNewAllowance({ id: "", name: "", type: "Fixed Am", amount: 0 });
  };

  // Add Deduction
  const addDeduction = () => {
    if (!newDeduction.name || newDeduction.amount <= 0) return;
    setDeductions([
      ...deductions,
      { ...newDeduction, id: Date.now().toString() },
    ]);
    setNewDeduction({ id: "", name: "", type: "Fixed Am", amount: 0 });
  };

  // Remove Items
  const removeAllowance = (id: string) =>
    setAllowances(allowances.filter((a) => a.id !== id));
  const removeDeduction = (id: string) =>
    setDeductions(deductions.filter((d) => d.id !== id));

  // Save / Update
  const handleSave = async () => {
    if (!staffName || !empId || !designation || baseSalary <= 0) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      id: editingId,
      staffName,
      empId,
      designation,
      baseSalary,
      allowances,
      deductions,
    };

    try {
      const url = editingId
        ? "http://localhost:5000/update_salary_structure"
        : "http://localhost:5000/add_salary_structure";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(editingId ? "Updated successfully!" : "Added successfully!");
        setIsModalOpen(false);
        fetchSalaryStructures();
        resetForm();

        // 🔥 Yeh line add ki hai - Payroll ko turant update karne ke liye
        window.dispatchEvent(new Event("salaryStructureUpdated"));
      } else {
        alert("Failed to save");
      }
    } catch (err) {
      console.error("Save failed", err);
      alert("Server error. Check backend.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setStaffName("");
    setEmpId("");
    setDesignation("");
    setBaseSalary(0);
    setOtHours(0);
    setAllowances([]);
    setDeductions([]);
  };

  const handleOpenEdit = async (s: SalaryStructure) => {
    setEditingId(s.id);
    setStaffName(s.staffName);
    setEmpId(s.empId);
    setDesignation(s.designation);
    setBaseSalary(s.baseSalary);
    setAllowances(s.allowances || []);
    setDeductions(s.deductions || []);

    const ot = await fetchApprovedOT(s.empId);
    setOtHours(ot);

    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this salary structure?")) return;
    try {
      await fetch(`http://localhost:5000/delete_salary_structure/${id}`, {
        method: "DELETE",
      });
      fetchSalaryStructures();

      // 🔥 Yeh line add ki hai - Payroll ko turant update karne ke liye
      window.dispatchEvent(new Event("salaryStructureUpdated"));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="p-6 bg-[#0a0f1c] text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Salary Configuration
            </h1>
            <p className="text-slate-400 mt-1">
              Manage staff salary structures, allowances & deductions
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold"
            >
              <Printer size={18} /> Print
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl font-bold"
            >
              <Plus size={18} /> Add New Structure
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">All Staff Salary Structures</h2>
            {isLoading && (
              <span className="text-amber-400 animate-pulse">
                Loading from backend...
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-6 py-5 text-left">Staff</th>
                  <th className="px-6 py-5 text-right">Base Salary</th>
                  <th className="px-6 py-5 text-center">OT Hours</th>
                  <th className="px-6 py-5 text-right">OT Pay</th>
                  <th className="px-6 py-5 text-right">Gross</th>
                  <th className="px-6 py-5 text-right text-rose-400">
                    Deductions
                  </th>
                  <th className="px-6 py-5 text-right text-emerald-400 font-bold">
                    Net Salary
                  </th>
                  <th className="px-6 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {structures.map((s) => {
                  const totals = getSummary(
                    s.baseSalary,
                    s.allowances,
                    s.deductions,
                    s.approvedOTHours || 0,
                  );
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold">{s.staffName}</div>
                        <div className="text-xs text-slate-400">
                          {s.empId} • {s.designation}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-mono">
                        {formatPKR(s.baseSalary)}
                      </td>
                      <td className="px-6 py-5 text-center text-indigo-300">
                        {s.approvedOTHours || 0} hrs
                      </td>
                      <td className="px-6 py-5 text-right text-indigo-400">
                        + {formatPKR(totals.otPay)}
                      </td>
                      <td className="px-6 py-5 text-right font-bold">
                        {formatPKR(totals.gross)}
                      </td>
                      <td className="px-6 py-5 text-right text-rose-400">
                        - {formatPKR(totals.totalD)}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-emerald-400">
                        {formatPKR(totals.net)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="text-indigo-400 hover:text-white"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-rose-400 hover:text-rose-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {structures.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-20 text-slate-400"
                    >
                      No salary structures found. Click "Add New Structure"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== FULL MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingId
                  ? "Edit Salary Structure"
                  : "Add New Salary Structure"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500"
                    placeholder="Ahmed Khan"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500"
                    placeholder="EMP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Base Salary (PKR)
                  </label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Allowances */}
              <div>
                <h3 className="font-semibold mb-3 text-emerald-400">
                  Allowances
                </h3>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Allowance Name"
                    value={newAllowance.name}
                    onChange={(e) =>
                      setNewAllowance({ ...newAllowance, name: e.target.value })
                    }
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3"
                  />
                  <select
                    value={newAllowance.type}
                    onChange={(e) =>
                      setNewAllowance({
                        ...newAllowance,
                        type: e.target.value as "Fixed Am" | "Percentage %",
                      })
                    }
                    className="bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3"
                  >
                    <option value="Fixed Am">Fixed</option>
                    <option value="Percentage %">Percentage %</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newAllowance.amount}
                    onChange={(e) =>
                      setNewAllowance({
                        ...newAllowance,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-32 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3"
                  />
                  <button
                    onClick={addAllowance}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 rounded-2xl font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {allowances.map((al) => (
                    <div
                      key={al.id}
                      className="flex justify-between items-center bg-slate-800 px-5 py-3 rounded-2xl"
                    >
                      <span>
                        {al.name} ({al.type})
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono">
                          {formatPKR(calculateValue(al, baseSalary))}
                        </span>
                        <button
                          onClick={() => removeAllowance(al.id)}
                          className="text-rose-400 hover:text-rose-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold mb-3 text-rose-400">Deductions</h3>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Deduction Name"
                    value={newDeduction.name}
                    onChange={(e) =>
                      setNewDeduction({ ...newDeduction, name: e.target.value })
                    }
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3"
                  />
                  <select
                    value={newDeduction.type}
                    onChange={(e) =>
                      setNewDeduction({
                        ...newDeduction,
                        type: e.target.value as "Fixed Am" | "Percentage %",
                      })
                    }
                    className="bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3"
                  >
                    <option value="Fixed Am">Fixed</option>
                    <option value="Percentage %">Percentage %</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newDeduction.amount}
                    onChange={(e) =>
                      setNewDeduction({
                        ...newDeduction,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-32 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3"
                  />
                  <button
                    onClick={addDeduction}
                    className="bg-rose-600 hover:bg-rose-700 px-6 rounded-2xl font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {deductions.map((de) => (
                    <div
                      key={de.id}
                      className="flex justify-between items-center bg-slate-800 px-5 py-3 rounded-2xl"
                    >
                      <span>
                        {de.name} ({de.type})
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono">
                          {formatPKR(calculateValue(de, baseSalary))}
                        </span>
                        <button
                          onClick={() => removeDeduction(de.id)}
                          className="text-rose-400 hover:text-rose-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
                <h3 className="font-bold mb-4">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div>
                    Base Salary:{" "}
                    <span className="font-bold">{formatPKR(baseSalary)}</span>
                  </div>
                  <div>
                    Total Allowances:{" "}
                    <span className="text-emerald-400 font-bold">
                      {formatPKR(currentTotals.totalA)}
                    </span>
                  </div>
                  <div>
                    Total Deductions:{" "}
                    <span className="text-rose-400 font-bold">
                      {formatPKR(currentTotals.totalD)}
                    </span>
                  </div>
                  <div>
                    OT Pay:{" "}
                    <span className="text-indigo-400 font-bold">
                      {formatPKR(currentTotals.otPay)}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-4 pt-4 border-t border-slate-700 text-lg">
                    <strong>Net Salary: {formatPKR(currentTotals.net)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-700 flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-800 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <Save size={20} />{" "}
                {editingId ? "Update Structure" : "Save Structure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
