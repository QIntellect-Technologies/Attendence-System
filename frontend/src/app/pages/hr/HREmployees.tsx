import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  saveUsers,
  getUsers,
} from "../../utils/storage";
import { Staff, User } from "../../types";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Users as UsersIcon,
  Filter,
  Lock,
  Clock,
  Briefcase,
  UploadCloud,
  Copy,
  Check,
} from "lucide-react";

export default function HREmployees() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    joinDate: "",
    password: "staff123",
    shift: "Morning",
    shiftStart: "09:00",
    shiftEnd: "18:00",
  });

  useEffect(() => {
    loadStaff();
  }, []);

  // ====================== Load Staff ======================
  const loadStaff = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_staff_list");
      if (res.ok) {
        const backendData = await res.json();
        const mappedStaff: Staff[] = backendData.map((item: any) => ({
          id: item.id ? `staff-${item.id}` : `staff-${Date.now()}`,
          name: item.name || "",
          email: item.email || "",
          phone: item.phone || "",
          department: item.department || "GENERAL",
          position: item.role || item.position || "STAFF",
          joinDate: item.join_date || new Date().toISOString().split("T")[0],
          shift: item.shift || "Morning",
          shiftStart: item.duty_start || "09:00",
          shiftEnd: item.duty_end || "18:00",
          userId: item.userId || `user-${item.id || Date.now()}`,
        }));
        setStaff(mappedStaff);
        localStorage.setItem("staff", JSON.stringify(mappedStaff));
        return;
      }
    } catch {
      console.warn("Backend fetch failed, falling back to local");
    }
    setStaff(getStaff() || []);
  };

  // ====================== Shift Helper ======================
  // ====================== Shift Helper (Fixed) ======================
// ====================== Shift Helper (Fixed & Improved) ======================
const handleShiftChange = (shiftType: string) => {
  let start = "09:00";
  let end = "18:00";

  if (shiftType === "Evening") {
    start = "14:00";
    end = "22:00";
  } else if (shiftType === "Night") {
    start = "22:00";
    end = "06:00";
  }

  setFormData((prev) => ({
    ...prev,
    shift: shiftType,
    shiftStart: start,
    shiftEnd: end,
  }));
};
  // ====================== Bulk Upload ======================
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").slice(1);
        for (const row of rows) {
          const columns = row.split(",");
          if (columns.length < 5) continue;
          const [
            name,
            email,
            phone,
            department,
            position,
            shiftType = "Morning",
          ] = columns.map((c) => c.trim());

          let start = "09:00",
            end = "18:00";
          if (shiftType === "Evening") {
            start = "14:00";
            end = "22:00";
          } else if (shiftType === "Night") {
            start = "22:00";
            end = "06:00";
          }

          const cleanId =
            Date.now().toString() + Math.random().toString(36).substr(2, 5);

          try {
            await fetch("http://127.0.0.1:5000/add_staff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                email,
                phone,
                department,
                role: position,
                duty_start: start,
                duty_end: end,
                password: "staff123",
                id: cleanId,
              }),
            });
          } catch {
            console.error("Bulk backend fail");
          }

          const newUser: User = {
            id: `user-${cleanId}`,
            name,
            email,
            password: "staff123",
            role: "staff",
            staffId: `staff-${cleanId}`,
          };

          const newStaff: Staff = {
            id: `staff-${cleanId}`,
            name,
            email,
            phone: phone || "",
            department,
            position,
            joinDate: new Date().toISOString().split("T")[0],
            shift: shiftType,
            shiftStart: start,
            shiftEnd: end,
            userId: `user-${cleanId}`,
          };

          addStaff(newStaff, newUser);
        }
        await loadStaff();
        alert("Bulk Data Processed Successfully!");
        window.dispatchEvent(new Event("staffDataChanged"));
      } catch {
        setError("Error processing CSV file.");
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // ====================== Filters ======================
  const departmentsList = useMemo(() => {
    const deps = staff.map((s) => s.department).filter(Boolean);
    return ["All Departments", ...Array.from(new Set(deps))];
  }, [staff]);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        selectedDepartment === "All Departments" ||
        s.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [staff, searchQuery, selectedDepartment]);

  // ====================== Open Modal ======================
  const handleOpenModal = (staffMember?: Staff) => {
    setError(null);
    if (staffMember) {
      setEditingStaff(staffMember);
      const users = getUsers();
      const currentUser = users.find((u) => u.id === staffMember.userId);
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone || "",
        department: staffMember.department,
        position: staffMember.position,
        joinDate: staffMember.joinDate,
        password: currentUser?.password || "staff123",
        shift: staffMember.shift || "Morning",
        shiftStart: staffMember.shiftStart || "09:00",
        shiftEnd: staffMember.shiftEnd || "18:00",
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        joinDate: new Date().toISOString().split("T")[0],
        password: "staff123",
        shift: "Morning",
        shiftStart: "09:00",
        shiftEnd: "18:00",
      });
    }
    setShowModal(true);
  };

  // ====================== Submit ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingStaff) {
        updateStaff(editingStaff.id, { ...formData });
        const users = getUsers();
        const userIndex = users.findIndex((u) => u.id === editingStaff.userId);
        if (userIndex !== -1) {
          users[userIndex] = {
            ...users[userIndex],
            name: formData.name,
            email: formData.email,
            password: formData.password || users[userIndex].password,
          };
          saveUsers(users);
        }
        const cleanId = editingStaff.id.replace(/^staff-/, "");
        await fetch(`http://127.0.0.1:5000/update_staff/${cleanId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || "",
            department: formData.department,
            role: formData.position,
            duty_start: formData.shiftStart,
            duty_end: formData.shiftEnd,
            password: formData.password,
          }),
        });
        setShowModal(false);
        await loadStaff();
        window.dispatchEvent(new Event("staffDataChanged"));
      } else {
        if (!formData.name || !formData.email) {
          setError("Name aur Email zaroori hain!");
          setIsSubmitting(false);
          return;
        }
        const cleanId = Date.now().toString();
        const newStaffId = `staff-${cleanId}`;
        const newUserId = `user-${cleanId}`;

        await fetch("http://127.0.0.1:5000/add_staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || "",
            department: formData.department,
            role: formData.position,
            duty_start: formData.shiftStart,
            duty_end: formData.shiftEnd,
            password: formData.password || "staff123",
            id: cleanId,
          }),
        });

        const newUser: User = {
          id: newUserId,
          name: formData.name,
          email: formData.email,
          password: formData.password || "staff123",
          role: "staff",
          staffId: newStaffId,
        };
        const newStaff: Staff = {
          id: newStaffId,
          ...formData,
          userId: newUserId,
        };
        addStaff(newStaff, newUser);

        setNewCredentials({
          name: formData.name,
          email: formData.email,
          password: formData.password || "staff123",
        });
        setShowModal(false);
        setShowCredentialsModal(true);
        await loadStaff();
        window.dispatchEvent(new Event("staffDataChanged"));
      }
    } catch (err: any) {
      console.error("Backend sync failed:", err);
      setError("Changes saved locally. Backend sync failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================== Delete ======================
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name} permanently?`)) return;
    deleteStaff(id);
    try {
      const cleanId = id.replace(/^staff-/, "");
      await fetch(`http://127.0.0.1:5000/delete_staff/${cleanId}`, {
        method: "DELETE",
      });
    } catch {
      console.error("Backend delete failed");
    }
    await loadStaff();
    window.dispatchEvent(new Event("staffDataChanged"));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white font-sans p-8">
      {/* Title & Buttons */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-4 rounded-3xl">
            <UsersIcon className="w-9 h-9 text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">
              STAFF DIRECTORY
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              HR PERSONNEL MANAGEMENT
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleBulkUpload}
            className="hidden"
            accept=".csv"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-8 py-4 rounded-3xl font-semibold text-sm transition-all"
          >
            <UploadCloud className="w-5 h-5" /> BULK IMPORT
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-3 bg-violet-600 hover:bg-violet-500 px-8 py-4 rounded-3xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/30"
          >
            <Plus className="w-5 h-5" /> ADD NEW STAFF
          </button>
        </div>
      </div>

      {/* Stats + Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
        <div className="md:col-span-3 bg-[#1e2937] rounded-3xl p-8 border border-slate-700">
          <p className="text-xs font-black tracking-widest text-slate-400">
            ACTIVE FORCE
          </p>
          <div className="flex items-baseline gap-3 mt-4">
            <p className="text-6xl font-black text-white">{staff.length}</p>
            <span className="text-emerald-400 text-sm font-bold">Live</span>
          </div>
        </div>
        <div className="md:col-span-3 bg-[#1e2937] rounded-3xl p-8 border border-slate-700">
          <p className="text-xs font-black tracking-widest text-slate-400">
            DEPARTMENTS
          </p>
          <p className="text-6xl font-black text-white mt-4">
            {Math.max(0, departmentsList.length - 1)}
          </p>
        </div>

        <div className="md:col-span-6 bg-[#1e2937] rounded-3xl p-3 border border-slate-700 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="FILTER BY NAME, POSITION OR EMAIL ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-3xl py-4 pl-16 pr-6 text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-500"
            />
          </div>
          <div className="w-72 relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-3xl py-4 pl-16 pr-12 text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
            >
              {departmentsList.map((dept) => (
                <option key={dept} value={dept} className="bg-[#1e2937]">
                  {dept.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table - Updated with Better Alignment */}
      <div className="bg-[#1e2937] rounded-3xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-10 py-8 text-xs font-black tracking-widest text-slate-400 w-[45%]">
                EMPLOYEE PROFILE
              </th>
              <th className="text-left px-10 py-8 text-xs font-black tracking-widest text-slate-400 w-[20%]">
                UNIT/DEPT
              </th>
              <th className="text-left px-10 py-8 text-xs font-black tracking-widest text-slate-400 w-[20%]">
                OPERATIONAL SHIFT
              </th>
              <th className="text-right px-10 py-8 text-xs font-black tracking-widest text-slate-400 w-[15%]">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-20 text-slate-400">
                  No staff found.
                </td>
              </tr>
            ) : (
              filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-slate-800/50 transition-all group"
                >
                  {/* Employee Profile */}
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{member.name}</p>
                        <p className="text-sm text-slate-400">{member.email}</p>
                        <p className="text-xs text-violet-400 mt-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {member.position}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-10 py-7">
                    <span className="px-6 py-2 bg-slate-800 text-slate-300 rounded-full text-xs font-medium border border-slate-600">
                      {member.department}
                    </span>
                  </td>

                  {/* Operational Shift - Yeh important hai */}
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-800 rounded-2xl">
                        <Clock className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.shiftStart} — {member.shiftEnd}
                        </p>
                        <p className="text-xs text-slate-400">
                          {member.shift} Schedule
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleOpenModal(member)}
                        className="p-4 bg-slate-800 hover:bg-violet-600 rounded-2xl transition-all"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="p-4 bg-slate-800 hover:bg-rose-600 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2937] rounded-3xl w-full max-w-2xl border border-slate-600 overflow-hidden">
            <div className="p-8 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-violet-600 p-4 rounded-2xl">
                  <UsersIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">
                    {editingStaff ? "Update Staff" : "Add New Staff"}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Personnel Information
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-slate-700 rounded-2xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="p-4 bg-rose-900/30 border border-rose-700 text-rose-400 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-2">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">
                    PHONE
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">
                    DEPARTMENT
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">
                    POSITION / DESIGNATION
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-2">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl pl-14 py-4 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-700">
                <p className="text-violet-400 text-sm font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> SHIFT CONFIGURATION
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">
                      SHIFT TYPE
                    </label>
                    <select
                      value={formData.shift}
                      onChange={(e) => handleShiftChange(e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">
                      START TIME
                    </label>
                    <input
                      type="time"
                      value={formData.shiftStart}
                      onChange={(e) =>
                        setFormData({ ...formData, shiftStart: e.target.value })
                      }
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">
                      END TIME
                    </label>
                    <input
                      type="time"
                      value={formData.shiftEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, shiftEnd: e.target.value })
                      }
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl px-6 py-4"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-violet-600 hover:bg-violet-500 py-6 rounded-3xl font-bold text-lg transition-all disabled:opacity-70"
              >
                {isSubmitting
                  ? "Processing..."
                  : editingStaff
                    ? "UPDATE STAFF"
                    : "ADD STAFF"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && newCredentials && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="bg-[#1e2937] rounded-3xl p-10 w-full max-w-md border border-slate-600">
            <div className="text-center">
              <div className="text-6xl mb-6">✅</div>
              <h3 className="text-2xl font-black">Staff Added Successfully!</h3>
              <p className="text-slate-400 mt-2">
                Share these credentials with the staff member
              </p>
            </div>

            <div className="mt-10 space-y-6">
              <div>
                <p className="text-xs text-slate-400 mb-1">NAME</p>
                <p className="font-semibold text-lg">{newCredentials.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">EMAIL</p>
                <div className="flex justify-between bg-slate-900 p-4 rounded-2xl">
                  <p>{newCredentials.email}</p>
                  <button
                    onClick={() => copyToClipboard(newCredentials.email)}
                    className="text-violet-400"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">PASSWORD</p>
                <div className="flex justify-between bg-slate-900 p-4 rounded-2xl font-mono">
                  <p>{newCredentials.password}</p>
                  <button
                    onClick={() => copyToClipboard(newCredentials.password)}
                    className="text-violet-400"
                  >
                    {copied ? (
                      <Check size={20} className="text-emerald-400" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCredentialsModal(false);
                setNewCredentials(null);
              }}
              className="mt-10 w-full bg-violet-600 hover:bg-violet-500 py-5 rounded-3xl font-bold"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
