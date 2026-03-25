import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";

// --- Types & Interfaces ---
interface AttendanceData {
  date: string;
  present: number;
  absent: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  color: "emerald" | "blue" | "purple" | "orange";
  icon: React.ElementType;
}

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  percent: string;
}

interface LegendItemProps {
  label: string;
  color: string;
}

// Staff ka structure (Jo Staff Directory se match karta hai)
interface StaffMember {
  id: string;
  name: string;
  status: "Present" | "Absent" | "On Leave";
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<string>("Attendance Trend");
  const [timeRange, setTimeRange] = useState<number>(30);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // --- 1. REAL STAFF DATA (Staff Directory Se Link) ---
  // Note: Yahan aapka context ya API se aaya hua staff data hona chahiye
  const [staffMembers] = useState<StaffMember[]>([
    { id: "1", name: "Elon Musk", status: "Absent" },
    { id: "2", name: "Mark Zuckerberg", status: "Present" },
    { id: "3", name: "Bill Gates", status: "Present" },
    // ... Baki staff members yahan add honge
  ]);

  // --- 2. AUTOMATIC STATS CALCULATION ---
  const currentStats = useMemo(() => {
    const total = staffMembers.length;
    const present = staffMembers.filter((s) => s.status === "Present").length;
    const absent = staffMembers.filter((s) => s.status === "Absent").length;
    const leave = staffMembers.filter((s) => s.status === "On Leave").length;

    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

    return {
      total,
      present,
      absent,
      leave,
      rate: `${rate}%`,
    };
  }, [staffMembers]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      // Simulation: Historical data fetch kar rahe hain
      const mockHistory: AttendanceData[] = [
        { date: "Mar 1", present: 28, absent: 5 },
        { date: "Mar 2", present: 30, absent: 3 },
        { date: "Mar 3", present: 33, absent: 0 },
        {
          date: "Mar 4",
          present: currentStats.present,
          absent: currentStats.absent,
        },
        { date: "Mar 5", present: 31, absent: 2 },
      ];
      setAttendanceData(mockHistory);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [timeRange, currentStats.present]);

  const handleExport = () => {
    if (attendanceData.length === 0) return;
    const headers = ["Date,Present,Absent"];
    const rows = attendanceData.map(
      (item) => `${item.date},${item.present},${item.absent}`,
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${timeRange}_Days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMainChart = () => {
    switch (activeTab) {
      case "Department Analytics":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "IT", score: 95 },
                { name: "HR", score: 82 },
                { name: "Sales", score: 75 },
                { name: "Admin", score: 88 },
                { name: "Ops", score: 92 },
              ]}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: "12px", border: "none" }}
              />
              <Bar
                dataKey="score"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "Weekly Comparison":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { day: "Mon", current: 85, previous: 70 },
                { day: "Tue", current: 90, previous: 75 },
                { day: "Wed", current: 88, previous: 80 },
                { day: "Thu", current: 95, previous: 82 },
                { day: "Fri", current: 82, previous: 78 },
              ]}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none" }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.05}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none" }}
              />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorPresent)"
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="#ef4444"
                strokeWidth={3}
                fill="url(#colorAbsent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="p-6 bg-[#fcfdfe] min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">
            Reports & Analytics{" "}
            {loading && (
              <span className="text-xs lowercase text-blue-500 ml-2">
                (Updating...)
              </span>
            )}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center bg-white border border-slate-100 rounded-xl shadow-sm px-3">
            <Calendar size={14} className="text-slate-400 mr-2" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="bg-transparent py-2 outline-none text-[10px] font-black text-slate-600 uppercase cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Avg Attendance"
          value={currentStats.rate}
          sub={`Last ${timeRange} days`}
          color="emerald"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Present"
          value={currentStats.present}
          sub="Live Sync"
          color="blue"
          icon={Users}
        />
        <StatCard
          title="Avg Work Hours"
          value="34h"
          sub="Per employee"
          color="purple"
          icon={Clock}
        />
        <StatCard
          title="Leave Days"
          value={currentStats.leave}
          sub="Pending req"
          color="orange"
          icon={AlertCircle}
        />
      </div>

      <div className="flex items-center gap-2 mb-6 bg-slate-100/50 p-1 w-fit rounded-xl border border-slate-100">
        {["Attendance Trend", "Department Analytics", "Weekly Comparison"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight">
                {activeTab}
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                Visualizing results for {activeTab.toLowerCase()}
              </p>
            </div>
            {activeTab === "Attendance Trend" && (
              <div className="flex gap-4">
                <LegendItem label="Present" color="#10b981" />
                <LegendItem label="Absent" color="#ef4444" />
              </div>
            )}
          </div>
          <div className="h-[350px] w-full">{renderMainChart()}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight mb-1">
              Attendance Rate Trend
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mb-8">
              Daily attendance percentage
            </p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={attendanceData.map((d) => ({
                    date: d.date,
                    rate: (d.present / (d.present + d.absent)) * 100,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#3b82f6", stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight mb-1">
              Status Distribution
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mb-8">
              Overall status breakdown
            </p>
            <div className="space-y-6">
              <ProgressBar
                label="Present"
                value={(currentStats.present / currentStats.total) * 100}
                color="bg-emerald-500"
                percent={currentStats.rate}
              />
              <ProgressBar
                label="Absent"
                value={(currentStats.absent / currentStats.total) * 100}
                color="bg-red-500"
                percent={`${((currentStats.absent / currentStats.total) * 100).toFixed(1)}%`}
              />
              <ProgressBar
                label="On Leave"
                value={(currentStats.leave / currentStats.total) * 100}
                color="bg-orange-400"
                percent={`${((currentStats.leave / currentStats.total) * 100).toFixed(1)}%`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components with Fixed TypeScript Binding Errors ---
function StatCard({ title, value, sub, color, icon: Icon }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
    blue: "text-blue-500 bg-blue-50 border-blue-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100",
    orange: "text-orange-500 bg-orange-50 border-orange-100",
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${colorClasses[color]}`}
      >
        <Icon size={18} />
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {title}
      </p>
      <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
        {value}
      </h2>
      <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
        {sub}
      </p>
    </div>
  );
}

function ProgressBar({ label, value, color, percent }: ProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-slate-700 uppercase">
          {label}
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase">
          {percent}
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

function LegendItem({ label, color }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      ></div>
      <span className="text-[9px] font-black text-slate-400 uppercase">
        {label}
      </span>
    </div>
  );
}
