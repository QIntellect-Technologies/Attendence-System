import React, { useState, useEffect } from "react";
// Local Staff interface matching backend response
interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  photo?: string;
  userId: string;
  shift?: string;
  shiftStart?: string;
}

// Backend returns extra fields (name, time) not in the base type
interface AttendanceRecord {
  id: string;
  staffId: string;
  name: string;
  date: string;
  time?: string;
  inTime?: string;
  outTime?: string;
  status: string;
}
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  RefreshCcw,
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getDummyData } from "./useDummyDashboardData";
// ─── Types ────────────────────────────────────────────────
interface PendingLeave {
  name: string;
  dept: string;
  type: string;
  days: number;
}

// ─── Palette (matches Schola reference) ───────────────────
const TEAL = "#0D9488";
const NAVY = "#164E63";
const LIGHT_TEAL = "#CCFBF1";
const BLUE = "#1a699f";
const LIGHT_BLUE = "#E0F2FE";
const SLATE = "#64748B";
const BORDER = "#E2E8F0";
const CARD_BG = "#FFFFFF";
const PAGE_BG = "#F0F4F8";

// ─── Calendar helper ──────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
const MONTH_NAMES = [
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
const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

// ─── Mini Calendar ────────────────────────────────────────
function MiniCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: 14, fontWeight: 700, color: TEAL }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex gap-1">
          <button
            onClick={prev}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={15} color={SLATE} />
          </button>
          <button
            onClick={next}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={15} color={SLATE} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div
            key={i}
            className="text-center"
            style={{
              fontSize: 11,
              color: "#94A3B8",
              fontWeight: 500,
              paddingBottom: 6,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((d) => {
          const isToday = isCurrentMonth && d === today;
          return (
            <div
              key={d}
              className="flex items-center justify-center rounded-full cursor-pointer transition-colors mx-auto"
              style={{
                width: 30,
                height: 30,
                fontSize: 12,
                fontWeight: isToday ? 700 : 400,
                background: isToday ? TEAL : "transparent",
                color: isToday
                  ? "TEAL"
                  : d === today - 1 || d === today + 1
                    ? "#0F172A"
                    : SLATE,
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      className="flex items-center justify-between p-5 rounded-2xl"
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 12,
            color: SLATE,
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "TEAL",
            lineHeight: 1,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </p>
        {sub && (
          <p
            style={{
              fontSize: 11,
              color: "#22C55E",
              marginTop: 6,
              fontWeight: 500,
            }}
          >
            {sub}
          </p>
        )}
      </div>
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 48, height: 48, background: iconBg }}
      >
        <Icon size={22} color={iconColor} />
      </div>
    </div>
  );
}

// ─── Leave Request Row ────────────────────────────────────
function LeaveRow({
  name,
  dept,
  type,
  days,
  onAction,
}: {
  name: string;
  dept: string;
  type: string;
  days: number;
  onAction: (name: string, action: "approved" | "rejected") => void;
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: "linear-gradient(135deg,#0D9488,#0EA5E9)",
            fontSize: 14,
          }}
        >
          {name.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
            {name}
          </p>
          <p style={{ fontSize: 11, color: SLATE }}>
            {dept} · {type} · {days}d
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction(name, "approved")}
          className="flex items-center justify-center rounded-lg transition-colors hover:bg-emerald-500 hover:text-white"
          style={{
            width: 32,
            height: 32,
            background: "#F0FDF4",
            color: "#16A34A",
            border: "1px solid #BBF7D0",
          }}
        >
          <CheckCircle size={16} />
        </button>
        <button
          onClick={() => onAction(name, "rejected")}
          className="flex items-center justify-center rounded-lg transition-colors hover:bg-rose-500 hover:text-white"
          style={{
            width: 32,
            height: 32,
            background: "#FFF1F2",
            color: "#E11D48",
            border: "1px solid #FECDD3",
          }}
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg"
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        fontSize: 12,
      }}
    >
      <p style={{ color: SLATE, marginBottom: 2 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
          {p.name?.toLowerCase().includes("rate") ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

// ─── CCTV Row ─────────────────────────────────────────────
function CctvRow({
  location,
  time,
  status,
}: {
  location: string;
  time: string;
  status: "Normal" | "Alert" | "Offline";
}) {
  const cfg = {
    Normal: { dot: "#22C55E", bg: "#F0FDF4", text: "#16A34A", label: "Normal" },
    Alert: { dot: "#EF4444", bg: "#FFF1F2", text: "#E11D48", label: "Alert" },
    Offline: {
      dot: "#94A3B8",
      bg: "#F8FAFC",
      text: "#64748B",
      label: "Offline",
    },
  }[status];

  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="rounded-full"
          style={{ width: 8, height: 8, background: cfg.dot, flexShrink: 0 }}
        />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
            {location}
          </p>
          <p style={{ fontSize: 11, color: SLATE }}>{time}</p>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1"
        style={{
          fontSize: 11,
          fontWeight: 600,
          background: cfg.bg,
          color: cfg.text,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────
export default function AdminDashboard() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    avgAttendance: 0,
    lateToday: 0,
    earlyLeft: 0,
  });

  // Chart data states
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    window.addEventListener("staffDataChanged", loadData);
    return () => {
      clearInterval(interval);
      window.removeEventListener("staffDataChanged", loadData);
    };
  }, []);

  // const loadData = async () => {
  //   setIsRefreshing(true);
  //   try {
  //     const [staffRes, attRes, leavesRes] = await Promise.all([
  //       fetch("http://127.0.0.1:5000/get_staff_list"),
  //       fetch("http://127.0.0.1:5000/get_attendance_today"),
  //       fetch("http://127.0.0.1:5000/get_pending_leaves"),
  //     ]);

  //     const allStaff: Staff[] = await staffRes.json();
  //     const todayAtt: AttendanceRecord[] = await attRes.json();
  //     const pending: PendingLeave[] = leavesRes.ok
  //       ? await leavesRes.json()
  //       : [];

  //     const presentCount = todayAtt.length;
  //     const total = allStaff.length;
  //     let lateCount = 0;
  //     let earlyCount = 0;

  //     todayAtt.forEach((rec) => {
  //       const member = allStaff.find((s) => s.name === rec.name);
  //       if (member) {
  //         if (rec.time && member.shiftStart && rec.time > member.shiftStart)
  //           lateCount++;
  //         if (rec.status === "left_early" || rec.status === "Early Left")
  //           earlyCount++;
  //       }
  //     });

  //     const avg = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  //     setStaff(allStaff);
  //     setAttendance(todayAtt);
  //     setPendingLeaves(pending);
  //     setStats({
  //       totalStaff: total,
  //       presentToday: presentCount,
  //       absentToday: Math.max(0, total - presentCount),
  //       avgAttendance: avg,
  //       lateToday: lateCount,
  //       earlyLeft: earlyCount,
  //     });

  //     // ── Performance chart (bar, multi-series like Schola) ──
  //     const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  //     setPerformanceData(
  //       months.map((m) => ({
  //         month: m,
  //         "On Time": Math.floor(Math.random() * 30 + 55),
  //         Late: Math.floor(Math.random() * 20 + 10),
  //         Absent: Math.floor(Math.random() * 15 + 5),
  //       })),
  //     );

  //     // ── Earnings area chart ──
  //     const earMonths = [
  //       "Jan",
  //       "Feb",
  //       "Mar",
  //       "Apr",
  //       "May",
  //       "Jun",
  //       "Jul",
  //       "Aug",
  //       "Sep",
  //       "Oct",
  //       "Nov",
  //       "Dec",
  //     ];
  //     setEarningsData(
  //       earMonths.map((m) => ({
  //         month: m,
  //         Payroll: Math.floor(Math.random() * 150000 + 300000),
  //         Overtime: Math.floor(Math.random() * 30000 + 20000),
  //       })),
  //     );

  //     // ── Weekly attendance column chart ──
  //     setWeeklyAttendance([
  //       { day: "Mon", count: Math.floor(Math.random() * 10 + total * 0.8) },
  //       { day: "Tue", count: Math.floor(Math.random() * 10 + total * 0.75) },
  //       { day: "Wed", count: Math.floor(Math.random() * 10 + total * 0.85) },
  //       { day: "Thu", count: presentCount },
  //       { day: "Fri", count: Math.floor(Math.random() * 10 + total * 0.7) },
  //     ]);

  //     // ── Donut chart (present vs absent) ──
  //     setGenderData([
  //       { name: "Present", value: presentCount || 1 },
  //       { name: "Absent", value: Math.max(0, total - presentCount) || 0 },
  //       { name: "Late", value: lateCount || 0 },
  //     ]);
  //   } catch (err) {
  //     console.error("Dashboard load error:", err);
  //   } finally {
  //     setTimeout(() => setIsRefreshing(false), 400);
  //   }
  // };
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      // ── swap the three fetch() calls for dummy data ──
      const { allStaff, todayAtt, pending } = getDummyData();

      // ── everything below is identical to your original code ──
      const presentCount = todayAtt.length;
      const total = allStaff.length;
      let lateCount = 0;
      let earlyCount = 0;

      todayAtt.forEach((rec) => {
        const member = allStaff.find((s) => s.name === rec.name);
        if (member) {
          if (rec.time && member.shiftStart && rec.time > member.shiftStart)
            lateCount++;
          if (rec.status === "left_early" || rec.status === "Early Left")
            earlyCount++;
        }
      });

      const avg = total > 0 ? Math.round((presentCount / total) * 100) : 0;

      setStaff(allStaff);
      setAttendance(todayAtt);
      setPendingLeaves(pending);
      setStats({
        totalStaff: total,
        presentToday: presentCount,
        absentToday: Math.max(0, total - presentCount),
        avgAttendance: avg,
        lateToday: lateCount,
        earlyLeft: earlyCount,
      });

      // ── Performance chart ──
      const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      setPerformanceData(
        months.map((m) => ({
          month: m,
          "On Time": Math.floor(Math.random() * 30 + 55),
          Late: Math.floor(Math.random() * 20 + 10),
          Absent: Math.floor(Math.random() * 15 + 5),
        })),
      );

      // ── Payroll area chart ──
      const earMonths = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      setEarningsData(
        earMonths.map((m) => ({
          month: m,
          Payroll: Math.floor(Math.random() * 150000 + 300000),
          Overtime: Math.floor(Math.random() * 30000 + 20000),
        })),
      );

      // ── Weekly attendance ──
      setWeeklyAttendance([
        { day: "Mon", count: Math.floor(Math.random() * 3 + total * 0.8) },
        { day: "Tue", count: Math.floor(Math.random() * 3 + total * 0.75) },
        { day: "Wed", count: Math.floor(Math.random() * 3 + total * 0.85) },
        { day: "Thu", count: presentCount }, // today = real count
        { day: "Fri", count: Math.floor(Math.random() * 3 + total * 0.7) },
      ]);

      // ── Donut ──
      setGenderData([
        { name: "Present", value: presentCount || 1 },
        { name: "Absent", value: Math.max(0, total - presentCount) },
        { name: "Late", value: lateCount || 0 },
      ]);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };
  const handleLeaveAction = async (
    staffName: string,
    action: "approved" | "rejected",
  ) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/update_leave_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: staffName, status: action }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Donut colors
  const DONUT_COLORS = [TEAL, "#E2E8F0", "#F59E0B"];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Top refresh row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.4px",
            }}
          >
            Attendance Overview
          </h2>
          <p style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:shadow-md"
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            fontSize: 12,
            color: SLATE,
            fontWeight: 500,
          }}
        >
          <RefreshCcw
            size={14}
            className={isRefreshing ? "animate-spin" : ""}
            color={TEAL}
          />
          Refresh
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Staff"
          value={stats.totalStaff}
          sub={`Active employees`}
          icon={Users}
          iconBg={BLUE}
          iconColor="WHITE"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          sub={`${stats.avgAttendance}% attendance`}
          icon={UserCheck}
          iconBg={LIGHT_TEAL}
          iconColor={BLUE}
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          icon={UserX}
          iconBg={BLUE}
          iconColor="WHITE"
        />
        <StatCard
          title="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          sub={`${stats.lateToday} late arrivals`}
          icon={TrendingUp}
          iconBg={LIGHT_TEAL}
          iconColor={BLUE}
        />
      </div>

      {/* ── ROW 2: Charts + Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Performance Bar Chart — 2 cols */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: "#EFF9F8", border: `1px solid #CCFBF1` }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-heading)",
                }}
              >
                Attendance Performance
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-light)",
                  marginTop: 2,
                }}
              >
                Monthly breakdown
              </p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-slate-50">
              <MoreHorizontal size={16} color={SLATE} />
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4">
            {[
              { label: "On Time", color: TEAL },
              { label: "Late", color: "#0EA5E9" },
              { label: "Absent", color: "#CBD5E1" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div
                  className="rounded-sm"
                  style={{ width: 10, height: 10, background: l.color }}
                />
                <span style={{ fontSize: 11, color: SLATE }}>{l.label}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} barCategoryGap="30%" barGap={3}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: SLATE }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: SLATE }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "#F8FAFC" }}
                />
                <Bar
                  dataKey="On Time"
                  fill={TEAL}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
                <Bar
                  dataKey="Late"
                  fill={BLUE}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
                <Bar
                  dataKey="Absent"
                  fill="#CBD5E1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini Calendar — 1 col */}
        <div
          className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <MiniCalendar />

          {/* Events below calendar */}
          <div
            style={{
              marginTop: 20,
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 16,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                Upcoming
              </p>
              <button style={{ fontSize: 11, color: TEAL, fontWeight: 500 }}>
                View all
              </button>
            </div>
            {[
              { title: "Payroll Processing", date: "Tomorrow", color: TEAL },
              { title: "HR Review Meeting", date: "In 3 days", color: BLUE },
              { title: "Leave Deadline", date: "This week", color: "#F59E0B" },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div
                  className="rounded-lg flex-shrink-0"
                  style={{ width: 4, height: 36, background: ev.color }}
                />
                <div>
                  <p
                    style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}
                  >
                    {ev.title}
                  </p>
                  <p style={{ fontSize: 10, color: SLATE }}>{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: Earnings area + Weekly attendance columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Earnings / Payroll Area Chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                Payroll Trends
              </h3>
              <p style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>
                Annual overview
              </p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-slate-50">
              <MoreHorizontal size={16} color={SLATE} />
            </button>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="gPayroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOvertime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: SLATE }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: SLATE }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Payroll"
                  stroke={TEAL}
                  strokeWidth={2.5}
                  fill="url(#gPayroll)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Overtime"
                  stroke={BLUE}
                  strokeWidth={2}
                  fill="url(#gOvertime)"
                  dot={false}
                  strokeDasharray="4 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-3">
            {[
              { label: "Payroll", color: TEAL, dash: false },
              { label: "Overtime", color: BLUE, dash: true },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div
                  style={{
                    width: 18,
                    height: 2,
                    borderRadius: 2,
                    background: l.dash ? "transparent" : l.color,
                    borderTop: l.dash ? `2px dashed ${l.color}` : undefined,
                  }}
                />
                <span style={{ fontSize: 11, color: SLATE }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Attendance Column Chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                Weekly Attendance
              </h3>
              <p style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>
                This week · daily count
              </p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-slate-50">
              <MoreHorizontal size={16} color={SLATE} />
            </button>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: SLATE }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: SLATE }}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "#F8FAFC" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {weeklyAttendance.map((entry, index) => {
                    const isToday = index === 3;
                    return (
                      <Cell key={index} fill={isToday ? NAVY : LIGHT_TEAL} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Donut + Leave Requests + CCTV ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
              Today's Status
            </h3>
            <button className="p-1.5 rounded-lg hover:bg-slate-50">
              <MoreHorizontal size={16} color={SLATE} />
            </button>
          </div>

          <div style={{ height: 180, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {genderData.map((_, index) => (
                    <Cell key={index} fill={DONUT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1,
                }}
              >
                {stats.presentToday}
              </p>
              <p style={{ fontSize: 10, color: SLATE, marginTop: 2 }}>
                Present
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-4">
            {genderData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: DONUT_COLORS[i] }}
                  />
                  <span style={{ fontSize: 12, color: SLATE }}>{d.name}</span>
                </div>
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}
                >
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests */}
        <div
          className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
              Pending Leaves
            </h3>
            <span
              className="rounded-full px-2.5 py-1"
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: "#FFFBEB",
                color: "#D97706",
              }}
            >
              {pendingLeaves.length} pending
            </span>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((req, i) => (
                <LeaveRow
                  key={i}
                  name={req.name}
                  dept={req.dept}
                  type={req.type}
                  days={req.days}
                  onAction={handleLeaveAction}
                />
              ))
            ) : (
              <div
                className="flex flex-col items-center justify-center py-10"
                style={{ color: SLATE }}
              >
                <CheckCircle size={28} color="#CBD5E1" />
                <p style={{ fontSize: 12, marginTop: 8 }}>
                  No pending requests
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CCTV Status */}
        <div
          className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
              CCTV Status
            </h3>
            <ShieldAlert size={16} color={TEAL} />
          </div>

          <div className="mb-5">
            <CctvRow
              location="Main Lobby Entrance"
              time="Just Now"
              status="Normal"
            />
            <CctvRow location="Server Room Door" time="2m ago" status="Alert" />
            <CctvRow
              location="Parking Zone B"
              time="Offline"
              status="Offline"
            />
            <CctvRow location="Reception Desk" time="1m ago" status="Normal" />
          </div>

          {/* Recent real-time log */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#0F172A",
                marginBottom: 10,
              }}
            >
              Live Log
            </p>
            <div
              className="space-y-2 overflow-y-auto"
              style={{ maxHeight: 120 }}
            >
              {attendance.length > 0 ? (
                [...attendance]
                  .reverse()
                  .slice(0, 4)
                  .map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                      style={{ fontSize: 12 }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
                          style={{
                            width: 26,
                            height: 26,
                            background: TEAL,
                            fontSize: 11,
                          }}
                        >
                          {rec.name?.charAt(0)}
                        </div>
                        <span style={{ color: "#0F172A", fontWeight: 500 }}>
                          {rec.name}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        style={{ color: SLATE }}
                      >
                        <Clock size={11} />
                        <span>{rec.time}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <p style={{ fontSize: 11, color: SLATE }}>
                  No records yet today
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
