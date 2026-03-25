import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  DollarSign,
  Trash2,
  Edit2,
  X,
  Printer,
  User,
  Clock,
  Save,
} from "lucide-react";

// --- Types ---
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

interface DesignationTemplate {
  designation: string;
  baseSalary: number;
  allowances: AllowanceItem[];
  deductions: AllowanceItem[];
}

export default function SalaryConfig() {
  // --- States ---
  const [structures, setStructures] = useState<SalaryStructure[]>(() => {
    const savedData = localStorage.getItem("salary_structures");
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 1,
        staffName: "Sheraz Shafique",
        empId: "IT-101",
        designation: "Senior Developer",
        baseSalary: 85000,
        approvedOTHours: 0, // Default 0, fetched from OT requests
        allowances: [
          { id: "a1", name: "House Rent", type: "Fixed Am", amount: 20000 },
        ],
        deductions: [
          { id: "d1", name: "Tax", type: "Percentage %", amount: 10 },
        ],
      },
    ];
  });

  const [templates, setTemplates] = useState<DesignationTemplate[]>(() => {
    const savedTemplates = localStorage.getItem("salary_templates");
    return savedTemplates ? JSON.parse(savedTemplates) : [];
  });

  // --- Logic: Automatic Approved Overtime Fetching ---
  // Ye function check karta hai ke kisi staff ke kitne ghante "Approved" hain
  const fetchApprovedOT = (staffId: string) => {
    try {
      const allRequests = JSON.parse(
        localStorage.getItem("overtimeRequests") || "[]",
      );
      const approvedHours = allRequests
        .filter(
          (req: any) =>
            (req.staffId === staffId || req.empId === staffId) &&
            req.status === "Approved",
        )
        .reduce((sum: number, req: any) => sum + Number(req.hours || 0), 0);
      return approvedHours;
    } catch (e) {
      return 0;
    }
  };

  // Sync OT Hours when component loads or structures change
  useEffect(() => {
    const updatedWithOT = structures.map((s) => ({
      ...s,
      approvedOTHours: fetchApprovedOT(s.empId),
    }));

    // Sirf tab update karein agar data waqai badla ho (infinite loop se bachne ke liye)
    if (JSON.stringify(updatedWithOT) !== JSON.stringify(structures)) {
      setStructures(updatedWithOT);
    }
  }, []);

  // Sync with LocalStorage for Payroll Module
  useEffect(() => {
    localStorage.setItem("salary_structures", JSON.stringify(structures));
    localStorage.setItem("salary_templates", JSON.stringify(templates));
  }, [structures, templates]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [staffName, setStaffName] = useState("");
  const [empId, setEmpId] = useState("");
  const [designation, setDesignation] = useState("");
  const [baseSalary, setBaseSalary] = useState(0);
  const [otHours, setOtHours] = useState(0); // This will be auto-set based on EmpID
  const [allowances, setAllowances] = useState<AllowanceItem[]>([]);
  const [deductions, setDeductions] = useState<AllowanceItem[]>([]);

  // --- Calculations ---
  const calculateValue = (item: AllowanceItem, base: number) =>
    item.type === "Fixed Am" ? item.amount : (base * item.amount) / 100;

  const calculateOTPay = (base: number, hours: number) => {
    if (!base || !hours) return 0;
    const hourlyRate = base / 240; // 30 days * 8 hours
    return Math.round(hourlyRate * hours * 1.5);
  };

  const getSummary = (
    s: Omit<SalaryStructure, "id" | "designation" | "staffName" | "empId">,
  ) => {
    const totalA = (s.allowances || []).reduce(
      (acc, curr) => acc + calculateValue(curr, s.baseSalary || 0),
      0,
    );
    const totalD = (s.deductions || []).reduce(
      (acc, curr) => acc + calculateValue(curr, s.baseSalary || 0),
      0,
    );
    const otPay = calculateOTPay(s.baseSalary, s.approvedOTHours);
    return {
      totalA,
      totalD,
      otPay,
      gross: (s.baseSalary || 0) + totalA + otPay,
      net: (s.baseSalary || 0) + totalA + otPay - totalD,
    };
  };

  const currentTotals = useMemo(
    () =>
      getSummary({
        baseSalary,
        allowances,
        deductions,
        approvedOTHours: otHours,
      }),
    [baseSalary, allowances, deductions, otHours],
  );

  // --- Designation Template Logic ---
  const handleDesignationChange = (val: string) => {
    setDesignation(val);
    const foundTemplate = templates.find(
      (t) => t.designation.toLowerCase() === val.toLowerCase(),
    );
    if (foundTemplate) {
      setBaseSalary(foundTemplate.baseSalary);
      setAllowances(foundTemplate.allowances);
      setDeductions(foundTemplate.deductions);
    }
  };

  const saveCurrentAsTemplate = () => {
    if (!designation) return alert("Please enter a designation first");
    const newTemplate: DesignationTemplate = {
      designation,
      baseSalary,
      allowances,
      deductions,
    };
    setTemplates((prev) => {
      const filtered = prev.filter(
        (t) => t.designation.toLowerCase() !== designation.toLowerCase(),
      );
      return [...filtered, newTemplate];
    });
    alert(`Settings saved for designation: ${designation}`);
  };

  // --- Handlers ---
  const handleOpenAdd = () => {
    setEditingId(null);
    setStaffName("");
    setEmpId("");
    setDesignation("");
    setBaseSalary(0);
    setOtHours(0);
    setAllowances([]);
    setDeductions([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SalaryStructure) => {
    setEditingId(s.id);
    setStaffName(s.staffName);
    setEmpId(s.empId);
    setDesignation(s.designation);
    setBaseSalary(s.baseSalary);
    // Auto fetch latest approved OT when editing
    setOtHours(fetchApprovedOT(s.empId));
    setAllowances([...s.allowances]);
    setDeductions([...s.deductions]);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!staffName.trim() || !designation.trim() || !empId.trim())
      return alert("Enter all details including Employee ID");

    const payload: SalaryStructure = {
      id: editingId || Date.now(),
      staffName,
      empId,
      designation,
      baseSalary,
      approvedOTHours: fetchApprovedOT(empId), // Final check for OT before saving
      allowances,
      deductions,
    };

    setStructures((prev) =>
      editingId
        ? prev.map((s) => (s.id === editingId ? payload : s))
        : [...prev, payload],
    );
    setIsModalOpen(false);
  };

  const formatPKR = (num: number = 0) =>
    `Rs. ${Math.round(num).toLocaleString()}`;

  return (
    <div className="space-y-10 p-2 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden text-left">
        <div>
          <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">
            Staff Payroll Config
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage individual staff & designation templates (OT Auto-Sync On)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer size={16} /> Export Payslips
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-950 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Staff Entry
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        <StatCard
          title="Total Staff"
          value={structures.length}
          subText="Payroll Active"
          icon={User}
          color="blue"
        />
        <StatCard
          title="Total OT Payout"
          value={formatPKR(
            structures.reduce(
              (a, b) => a + calculateOTPay(b.baseSalary, b.approvedOTHours),
              0,
            ),
          )}
          subText="Monthly Approved OT"
          icon={Clock}
          color="emerald"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-left">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="pb-4 pl-4 text-left">Staff Member</th>
              <th className="pb-4 text-left">Basic Salary</th>
              <th className="pb-4 text-left">Overtime (1.5x)</th>
              <th className="pb-4 text-left">Gross Salary</th>
              <th className="pb-4 text-left">Deductions</th>
              <th className="pb-4 text-left">Net Payable</th>
              <th className="pb-4 text-center print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.map((s) => {
              const totals = getSummary(s);
              return (
                <tr
                  key={s.id}
                  className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all"
                >
                  <td className="py-6 pl-4">
                    <div className="font-black text-slate-900 text-sm uppercase">
                      {s.staffName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      {s.empId} | {s.designation}
                    </div>
                  </td>
                  <td className="py-6 font-semibold text-slate-600">
                    {formatPKR(s.baseSalary)}
                  </td>
                  <td className="py-6">
                    <div className="font-bold text-emerald-600">
                      +{formatPKR(totals.otPay)}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {s.approvedOTHours} Hours approved
                    </div>
                  </td>
                  <td className="py-6 font-bold text-slate-900">
                    {formatPKR(totals.gross)}
                  </td>
                  <td className="py-6 font-bold text-rose-500">
                    -{formatPKR(totals.totalD)}
                  </td>
                  <td className="py-6 font-black text-blue-600 text-lg tracking-tighter">
                    {formatPKR(totals.net)}
                  </td>
                  <td className="py-6 print:hidden">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 border rounded-xl hover:bg-white shadow-sm transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setStructures(structures.filter((x) => x.id !== s.id))
                        }
                        className="p-2 border border-rose-50 rounded-xl hover:bg-rose-50 text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 print:hidden">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-[3rem]">
              <div className="text-left">
                <h2 className="font-black text-slate-900 text-2xl uppercase tracking-tighter">
                  Configure Staff Payroll
                </h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 italic">
                  Personalized Staff & Designation Templates
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} className="text-slate-300" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-10 flex-1">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Employee Name
                  </label>
                  <input
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sheraz Shafique"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Employee ID
                  </label>
                  <input
                    value={empId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setEmpId(id);
                      setOtHours(fetchApprovedOT(id)); // Auto check OT when ID is typed
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="IT-101"
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Designation
                  </label>
                  <input
                    list="designation-list"
                    value={designation}
                    onChange={(e) => handleDesignationChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Senior Developer"
                  />
                  <datalist id="designation-list">
                    {templates.map((t) => (
                      <option key={t.designation} value={t.designation} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Base Salary (PKR)
                  </label>
                  <input
                    type="number"
                    value={baseSalary || ""}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-blue-600 text-lg outline-none"
                  />
                </div>
              </div>

              {/* Save Template Button */}
              <button
                onClick={saveCurrentAsTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
              >
                <Save size={14} /> Save as {designation || "New"} Template
              </button>

              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-900 text-sm uppercase tracking-tight">
                      Approved Overtime (Auto)
                    </h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase italic">
                      Fetched from Admin Approvals
                    </p>
                  </div>
                </div>
                <div className="w-24 bg-white border border-emerald-200 rounded-xl p-3 font-black text-center text-emerald-700">
                  {otHours} hrs
                </div>
              </div>

              <DynamicList
                label="Allowances"
                items={allowances}
                setItems={setAllowances}
                base={baseSalary}
                color="emerald"
              />
              <DynamicList
                label="Deductions"
                items={deductions}
                setItems={setDeductions}
                base={baseSalary}
                color="rose"
              />

              <div className="bg-[#0f172a] p-10 rounded-[2.5rem] text-white space-y-4 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <DollarSign size={120} />
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Gross Pay</span>
                  <span className="text-emerald-400">
                    +{formatPKR(currentTotals.gross)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-800">
                  <span>Deductions</span>
                  <span className="text-rose-400">
                    -{formatPKR(currentTotals.totalD)}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">
                      Final Net Payable
                    </p>
                    <h2 className="text-4xl font-black tracking-tighter">
                      {formatPKR(currentTotals.net)}
                    </h2>
                  </div>
                  <div className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    PKR
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 flex gap-4 bg-white rounded-b-[3rem]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-5 border border-slate-200 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 shadow-2xl transition-all"
              >
                Update Staff Payroll Structure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components (Aapka original code) ---
const DynamicList = ({ label, items, setItems, base, color }: any) => {
  const [row, setRow] = useState({
    name: "",
    type: "Fixed Am" as const,
    amount: 0,
  });
  const add = () => {
    if (row.amount <= 0) return alert("Enter amount");
    setItems([
      ...items,
      { ...row, name: row.name.trim() || label, id: Date.now().toString() },
    ]);
    setRow({ name: "", type: "Fixed Am", amount: 0 });
  };
  return (
    <div className="space-y-4 text-left">
      <div className="flex justify-between items-center">
        <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-tight">
          {label}
        </h4>
        <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500">
          {items.length} added
        </span>
      </div>
      {items.map((item: any) => (
        <div
          key={item.id}
          className="p-5 border border-slate-100 rounded-[1.8rem] bg-white shadow-sm flex items-center justify-between group"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-slate-900 text-sm uppercase">
                {item.name}
              </p>
              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                {item.type}
              </span>
            </div>
            <p
              className={`text-[10px] font-bold mt-1 ${color === "emerald" ? "text-emerald-500" : "text-rose-500"}`}
            >
              {item.type === "Percentage %"
                ? `${item.amount}% = Rs. ${Math.round((base * item.amount) / 100).toLocaleString()}`
                : `Rs. ${item.amount.toLocaleString()}`}
            </p>
          </div>
          <button
            onClick={() => setItems(items.filter((i: any) => i.id !== item.id))}
            className="text-slate-300 hover:text-rose-500 p-2"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div className="grid grid-cols-12 gap-2 p-4 bg-slate-50 rounded-[1.8rem] border-2 border-dashed border-slate-200">
        <input
          placeholder="Name"
          className="col-span-5 bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none"
          value={row.name}
          onChange={(e) => setRow({ ...row, name: e.target.value })}
        />
        <select
          className="col-span-4 bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-black uppercase outline-none"
          value={row.type}
          onChange={(e) => setRow({ ...row, type: e.target.value as any })}
        >
          <option value="Fixed Am">Fixed</option>
          <option value="Percentage %">Percent %</option>
        </select>
        <input
          type="number"
          placeholder="Amt"
          className="col-span-3 bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none"
          value={row.amount || ""}
          onChange={(e) => setRow({ ...row, amount: Number(e.target.value) })}
        />
        <button
          onClick={add}
          className="col-span-12 bg-white border border-slate-200 text-slate-900 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all"
        >
          Add Component
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subText, icon: Icon, color }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all text-left">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm ${colors[color]}`}
      >
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-950 mt-1 tracking-tighter">
          {value}
        </p>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{subText}</p>
      </div>
    </div>
  );
};
