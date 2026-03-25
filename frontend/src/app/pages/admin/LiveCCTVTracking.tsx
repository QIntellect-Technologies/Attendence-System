import React, { useState, useEffect } from "react";
import {
  Camera,
  Users,
  UserCheck,
  ShieldCheck,
  MapPin,
  Search,
  Clock,
  Activity,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:5000";

// --- TypeScript Interfaces ---
interface Employee {
  id: string;
  name: string;
  location: string;
  building: string;
  pose: string;
  lastSeen: string;
  status: string;
  duty: string;
  lastUpdate?: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: "blue" | "emerald" | "purple";
}

interface CameraBoxProps {
  name: string;
  count: number;
}

export default function LiveCCTVTracking() {
  const [searchTerm, setSearchTerm] = useState("");

  // --- Authorized Employees Database ---
  const [trackedEmployees, setTrackedEmployees] = useState<Employee[]>([
    {
      id: "EMP001",
      name: "Sheraz Shafique",
      location: "Main Entrance",
      building: "Building A",
      pose: "None",
      lastSeen: "Waiting...",
      status: "Idle",
      duty: "On Duty",
    },
    {
      id: "EMP002",
      name: "John Smith",
      location: "Main Corridor",
      building: "Building A - Floor 1",
      pose: "None",
      lastSeen: "Waiting...",
      status: "Idle",
      duty: "On Duty",
    },
    {
      id: "EMP003",
      name: "Sarah Johnson",
      location: "Exit Door",
      building: "Building A - Exit",
      pose: "None",
      lastSeen: "Waiting...",
      status: "Idle",
      duty: "On Duty",
    },
    {
      id: "EMP004",
      name: "Michael Chen",
      location: "Room 101",
      building: "Building A - Room 101",
      pose: "None",
      lastSeen: "Waiting...",
      status: "Idle",
      duty: "On Duty",
    },
    {
      id: "EMP005",
      name: "Emma Wilson",
      location: "Room 102",
      building: "Building A - Room 102",
      pose: "None",
      lastSeen: "Waiting...",
      status: "Idle",
      duty: "On Duty",
    },
    {
      id: "EMP006",
      name: "David Lee",
      location: "Reception",
      building: "Building A - Entrance",
      pose: "None",
      lastSeen: "Waiting...",
      status: "Idle",
      duty: "On Duty",
    },
  ]);

  // --- Backend Sync Logic ---
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get_detected_name`);
        const data = await res.json();

        const currentTime = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        setTrackedEmployees((prevEmployees) =>
          prevEmployees.map((emp) => {
            // Strict Matching: Only update if name exists in our authorized list
            if (
              data &&
              data.name &&
              data.name.toLowerCase() === emp.name.toLowerCase()
            ) {
              return {
                ...emp,
                location: data.location || emp.location,
                pose: data.pose || "Detected",
                lastSeen: currentTime,
                status: "Active",
                lastUpdate: Date.now(),
              };
            }

            // Auto-Idle Logic (10 seconds)
            if (
              emp.status === "Active" &&
              Date.now() - (emp.lastUpdate || 0) > 10000
            ) {
              return { ...emp, status: "Idle", pose: "None" };
            }

            return emp;
          }),
        );
      } catch (e) {
        console.log("Waiting for Python API...");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredEmployees = trackedEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans text-left">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Live CCTV Tracking
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
            Authorized Personnel Surveillance
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase">
            System Online
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Feeds"
          value="06"
          sub="Cameras Online"
          icon={Camera}
          color="emerald"
        />
        <StatCard
          title="Active Now"
          value={trackedEmployees.filter((e) => e.status === "Active").length}
          sub="Persons Detected"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Registered"
          value={trackedEmployees.length}
          sub="Authorized Only"
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="System Link"
          value="Stable"
          sub="API Connected"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      {/* Camera Grid Section (Now showing all 6) */}
      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-1">
          Camera Infrastructure
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CameraBox
            name="Main Entrance"
            count={
              trackedEmployees.filter(
                (e) => e.location === "Main Entrance" && e.status === "Active",
              ).length
            }
          />
          <CameraBox
            name="Main Corridor"
            count={
              trackedEmployees.filter(
                (e) => e.location === "Main Corridor" && e.status === "Active",
              ).length
            }
          />
          <CameraBox
            name="Exit Door"
            count={
              trackedEmployees.filter(
                (e) => e.location === "Exit Door" && e.status === "Active",
              ).length
            }
          />
          <CameraBox
            name="Room 101"
            count={
              trackedEmployees.filter(
                (e) => e.location === "Room 101" && e.status === "Active",
              ).length
            }
          />
          <CameraBox
            name="Room 102"
            count={
              trackedEmployees.filter(
                (e) => e.location === "Room 102" && e.status === "Active",
              ).length
            }
          />
          <CameraBox
            name="Reception"
            count={
              trackedEmployees.filter(
                (e) => e.location === "Reception" && e.status === "Active",
              ).length
            }
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-tight">
              Movement Logs
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Real-time identification
            </p>
          </div>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search Authorized ID..."
              className="bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-6 text-xs font-bold outline-none focus:ring-2 ring-blue-500/10 w-64 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-6">Employee Info</th>
                <th className="px-8 py-6">Location</th>
                <th className="px-8 py-6">Pose</th>
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors">
                      {emp.name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {emp.id}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase">
                          {emp.location}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          {emp.building}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${emp.status === "Active" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-400"}`}
                    >
                      {emp.pose}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[10px] font-black text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-300" />{" "}
                      {emp.lastSeen}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${emp.status === "Active" ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-300"}`}
                      ></span>
                      <span
                        className={`text-[10px] font-black uppercase ${emp.status === "Active" ? "text-emerald-600" : "text-slate-400"}`}
                      >
                        {emp.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter">
                      {emp.duty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-blue-600 rounded-3xl p-6 flex items-center justify-between text-white shadow-xl shadow-blue-200">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest">
              Surveillance Endpoint
            </p>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
              Active Connection: {API_BASE_URL}/get_detected_name
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Corrected Helper Components (No TS Errors) ---
function StatCard({ title, value, sub, icon: Icon, color }: StatCardProps) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-6">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[color]}`}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">
          {value}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase">{sub}</p>
      </div>
    </div>
  );
}

function CameraBox({ name, count }: CameraBoxProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-blue-500/30 transition-all cursor-pointer group shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-50 group-hover:bg-blue-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
          <Camera size={18} />
        </div>
        <div>
          <p className="text-xs font-black text-slate-800 uppercase leading-tight">
            {name}
          </p>
          <p className="text-[10px] font-black text-blue-600 mt-1 uppercase">
            {count} Detected
          </p>
        </div>
      </div>
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
    </div>
  );
}
