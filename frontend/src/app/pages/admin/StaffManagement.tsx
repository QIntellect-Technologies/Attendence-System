import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Mail,
  Smartphone,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  UploadCloud,
} from "lucide-react";

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    joinDate: "",
    password: "",
    shift: "Morning",
    shiftStart: "09:00",
    shiftEnd: "18:00",
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_staff_list", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const backendData = await res.json();

        const mappedStaff: Staff[] = backendData.map((item: any) => ({
          id: item.id
            ? `staff-${item.id}`
            : `staff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
        console.log(`Loaded ${mappedStaff.length} from backend`);
        return;
      }
    } catch (backendErr) {
      console.warn("Backend fetch failed, falling back to local", backendErr);
    }

    try {
      const allStaff = getStaff();
      setStaff(allStaff);
      console.log(`Loaded ${allStaff.length} from local (fallback)`);
    } catch (localErr) {
      console.error("Local load failed:", localErr);
      setStaff([]);
    }
  };

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

          const [name, email, phone, department, position, shiftType] =
            columns.map((c) => c.trim());

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
          const newStaffId = `staff-${cleanId}`;
          const newUserId = `user-${cleanId}`;

          const bulkStaffData = {
            name,
            email,
            phone: phone || "",
            department,
            role: position,
            duty_start: start,
            duty_end: end,
            shift: shiftType || "Morning",
            password: "staff123",
          };

          try {
            await fetch("http://127.0.0.1:5000/add_staff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...bulkStaffData, id: cleanId }),
            });
          } catch (err) {
            console.error("Bulk backend fail:", err);
          }

          const newUser: User = {
            id: newUserId,
            name,
            email,
            password: "staff123",
            role: "staff",
            staffId: newStaffId,
          };
          const newStaff: Staff = {
            id: newStaffId,
            name,
            email,
            phone: phone || "",
            department,
            position,
            joinDate: new Date().toISOString().split("T")[0],
            shift: shiftType || "Morning",
            shiftStart: start,
            shiftEnd: end,
            userId: newUserId,
          };
          addStaff(newStaff, newUser);
        }

        await loadStaff();
        alert("Bulk Data Processed Successfully!");
        window.dispatchEvent(new Event("staffDataChanged"));
      } catch (err) {
        setError("Error processing CSV file.");
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Optimistic update – pehle local change dikhao, modal jaldi band karo
    if (editingStaff) {
      updateStaff(editingStaff.id, {
        ...formData,
        phone: formData.phone || editingStaff.phone || "",
      });

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

      setShowModal(false);
      window.dispatchEvent(new Event("staffDataChanged"));
    }

    try {
      if (editingStaff) {
        const cleanId = editingStaff.id.replace(/^staff-/, "");

        const updatePayload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "",
          department: formData.department,
          role: formData.position,
          duty_start: formData.shiftStart,
          duty_end: formData.shiftEnd,
        };

        const res = await fetch(
          `http://127.0.0.1:5000/update_staff/${cleanId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Backend failed: ${res.status} - ${errText}`);
        }

        // Background mein fresh data le aao
        await loadStaff();
      } else {
        const cleanId = Date.now().toString();
        const newStaffId = `staff-${cleanId}`;
        const newUserId = `user-${cleanId}`;

        const addPayload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "",
          department: formData.department,
          role: formData.position,
          duty_start: formData.shiftStart,
          duty_end: formData.shiftEnd,
          id: cleanId,
        };

        const res = await fetch("http://127.0.0.1:5000/add_staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addPayload),
        });

        if (!res.ok) throw new Error("Add failed");

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

        await loadStaff();
      }
    } catch (err: any) {
      console.error("Backend sync failed:", err);
      setError("Changes saved locally. Backend sync failed – check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete ${name} permanently?`)) {
      deleteStaff(id);
      try {
        const cleanId = id.replace(/^staff-/, "");
        await fetch(`http://127.0.0.1:5000/delete_staff/${cleanId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Backend delete failed:", err);
      }
      await loadStaff();
      window.dispatchEvent(new Event("staffDataChanged"));
    }
  };

  return (
    <div className="p-4 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -mr-64 -mt-64" />
      </div>

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-6">
          <div className="bg-slate-900 p-5 rounded-[2rem] shadow-2xl rotate-3 flex-shrink-0">
            <UsersIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Staff <span className="text-blue-600">Directory</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">
                Secure Personnel Management
              </p>
            </div>
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
            className="group bg-white border-2 border-slate-900 text-slate-900 px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" /> Bulk Import
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="group relative bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-400 hover:bg-blue-600 hover:scale-105 transition-all overflow-hidden"
          >
            <Plus className="w-4 h-4" /> Add New Staff
          </button>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-colors">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Active Force
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900">
                {staff.length}
              </p>
              <span className="text-[10px] font-bold text-emerald-500">
                Live
              </span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-colors">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Departments
            </p>
            <p className="text-4xl font-black text-slate-900">
              {Math.max(0, departmentsList.length - 1)}
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white/80 backdrop-blur-md p-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="FILTER BY NAME, POSITION OR EMAIL ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/50 border-none rounded-[1.8rem] py-5 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 transition-all outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="relative md:w-72">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-100/50 border-none rounded-[1.8rem] py-5 pl-14 pr-10 text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer"
            >
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Employee Profile
                </th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Unit/Dept
                </th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Operational Shift
                </th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="group hover:bg-blue-50/30 transition-all duration-300"
                >
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center text-white font-black text-xl uppercase shadow-lg group-hover:scale-110 transition-transform duration-500">
                          {member.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight text-base leading-none">
                          {member.name}
                        </p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {member.position}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 lowercase mt-1">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="px-5 py-2 bg-white text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                      {member.department}
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 tracking-tight">
                          {member.shiftStart} — {member.shiftEnd}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">
                          {member.shift} Schedule
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={() => handleOpenModal(member)}
                        className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:scale-110"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.1)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                    {editingStaff ? "Update Profile" : "Personnel Onboarding"}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                    System Security ID:{" "}
                    {editingStaff ? editingStaff.id : "NEW_ENTRY"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-4 bg-white border border-slate-200 rounded-2xl hover:text-rose-500 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mx-10 mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-black uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <UsersIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      required
                      className="w-full pl-16 p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 text-sm font-black transition-all"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="email"
                      required
                      className="w-full pl-16 p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white text-sm font-black"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      className="w-full pl-16 p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white text-sm font-black"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white text-sm font-black uppercase"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white text-sm font-black"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2 bg-blue-50/50 p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-6 border border-blue-100/50">
                  <div className="md:col-span-3">
                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Duty Schedule Configuration
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">
                      Assigned Shift
                    </label>
                    <select
                      className="w-full p-4 bg-white border-none rounded-2xl shadow-sm text-xs font-black italic"
                      value={formData.shift}
                      onChange={(e) => handleShiftChange(e.target.value)}
                    >
                      <option value="Morning">Morning (09-06)</option>
                      <option value="Evening">Evening (02-10)</option>
                      <option value="Night">Night (10-06)</option>
                      <option value="Custom">Custom Range</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">
                      Shift Start
                    </label>
                    <input
                      type="time"
                      className="w-full p-4 bg-white border-none rounded-2xl shadow-sm text-xs font-black"
                      value={formData.shiftStart}
                      onChange={(e) =>
                        setFormData({ ...formData, shiftStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">
                      Shift End
                    </label>
                    <input
                      type="time"
                      className="w-full p-4 bg-white border-none rounded-2xl shadow-sm text-xs font-black"
                      value={formData.shiftEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, shiftEnd: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                    System Authentication Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      className="w-full pl-16 p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white text-sm font-black"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 mt-6 flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    UPDATING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {editingStaff
                      ? "Authorize System Update"
                      : "Finalize Official Registration"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
