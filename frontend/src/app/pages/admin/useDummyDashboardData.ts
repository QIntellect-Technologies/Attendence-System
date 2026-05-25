// useDummyDashboardData.ts
// Drop-in replacement for the three fetch() calls in Dashboard.tsx loadData()
// Usage: replace the fetch block in loadData() with getDummyData()

export interface Staff {
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

export interface AttendanceRecord {
  id: string;
  staffId: string;
  name: string;
  date: string;
  time?: string;
  inTime?: string;
  outTime?: string;
  status: string;
}

export interface PendingLeave {
  name: string;
  dept: string;
  type: string;
  days: number;
}

// ─── Dummy Staff (12 members, mixed departments) ───────────
export const DUMMY_STAFF: Staff[] = [
  { id: "S001", name: "Imran Khalid",    email: "imran@company.com",    phone: "+92 300 1111111", department: "Engineering",  position: "Lead Engineer",    joinDate: "2021-03-15", userId: "u1", shift: "Morning", shiftStart: "09:00" },
  { id: "S002", name: "Ayesha Siddiqui", email: "ayesha@company.com",   phone: "+92 300 2222222", department: "HR",           position: "HR Manager",       joinDate: "2020-07-01", userId: "u2", shift: "Morning", shiftStart: "09:00" },
  { id: "S003", name: "Bilal Ahmed",     email: "bilal@company.com",    phone: "+92 300 3333333", department: "Engineering",  position: "Backend Dev",      joinDate: "2022-01-10", userId: "u3", shift: "Morning", shiftStart: "09:00" },
  { id: "S004", name: "Sana Malik",      email: "sana@company.com",     phone: "+92 300 4444444", department: "Design",       position: "UI/UX Designer",   joinDate: "2022-05-20", userId: "u4", shift: "Morning", shiftStart: "09:30" },
  { id: "S005", name: "Usman Tariq",     email: "usman@company.com",    phone: "+92 300 5555555", department: "Finance",      position: "Accountant",       joinDate: "2019-11-05", userId: "u5", shift: "Morning", shiftStart: "09:00" },
  { id: "S006", name: "Hira Baig",       email: "hira@company.com",     phone: "+92 300 6666666", department: "Marketing",    position: "Marketing Lead",   joinDate: "2021-08-14", userId: "u6", shift: "Morning", shiftStart: "09:00" },
  { id: "S007", name: "Faisal Rao",      email: "faisal@company.com",   phone: "+92 300 7777777", department: "Engineering",  position: "DevOps Engineer",  joinDate: "2023-02-28", userId: "u7", shift: "Morning", shiftStart: "09:15" },
  { id: "S008", name: "Zara Hussain",    email: "zara@company.com",     phone: "+92 300 8888888", department: "Design",       position: "Graphic Designer", joinDate: "2022-09-01", userId: "u8", shift: "Morning", shiftStart: "09:00" },
  { id: "S009", name: "Kamran Sheikh",   email: "kamran@company.com",   phone: "+92 300 9999999", department: "Finance",      position: "Finance Analyst",  joinDate: "2020-04-17", userId: "u9", shift: "Morning", shiftStart: "09:00" },
  { id: "S010", name: "Nadia Qureshi",   email: "nadia@company.com",    phone: "+92 300 1010101", department: "HR",           position: "Recruiter",        joinDate: "2023-06-12", userId: "u10", shift: "Morning", shiftStart: "09:30" },
  { id: "S011", name: "Tariq Mehmood",   email: "tariq@company.com",    phone: "+92 300 1111112", department: "Marketing",    position: "Content Writer",   joinDate: "2021-12-03", userId: "u11", shift: "Morning", shiftStart: "09:00" },
  { id: "S012", name: "Rabia Farooq",    email: "rabia@company.com",    phone: "+92 300 1212121", department: "Engineering",  position: "QA Engineer",      joinDate: "2022-07-07", userId: "u12", shift: "Morning", shiftStart: "09:00" },
];

// ─── Today's Attendance (9 of 12 present) ─────────────────
export const DUMMY_ATTENDANCE: AttendanceRecord[] = [
  { id: "A001", staffId: "S001", name: "Imran Khalid",    date: "2026-05-23", time: "09:02", inTime: "09:02", outTime: "17:30", status: "present" },
  { id: "A002", staffId: "S002", name: "Ayesha Siddiqui", date: "2026-05-23", time: "08:58", inTime: "08:58", outTime: "17:00", status: "present" },
  { id: "A003", staffId: "S003", name: "Bilal Ahmed",     date: "2026-05-23", time: "09:45", inTime: "09:45", outTime: "17:30", status: "present" },
  { id: "A004", staffId: "S004", name: "Sana Malik",      date: "2026-05-23", time: "10:10", inTime: "10:10", outTime: "17:00", status: "late" },
  { id: "A005", staffId: "S005", name: "Usman Tariq",     date: "2026-05-23", time: "09:00", inTime: "09:00", outTime: "17:30", status: "present" },
  { id: "A006", staffId: "S006", name: "Hira Baig",       date: "2026-05-23", time: "09:05", inTime: "09:05", outTime: "17:00", status: "present" },
  { id: "A007", staffId: "S007", name: "Faisal Rao",      date: "2026-05-23", time: "09:20", inTime: "09:20", outTime: "17:00", status: "present" },
  { id: "A008", staffId: "S008", name: "Zara Hussain",    date: "2026-05-23", time: "09:00", inTime: "09:00", outTime: "14:00", status: "left_early" },
  { id: "A009", staffId: "S009", name: "Kamran Sheikh",   date: "2026-05-23", time: "09:03", inTime: "09:03", outTime: "17:30", status: "present" },
  // S010, S011, S012 are absent today
];

// ─── Pending Leave Requests ────────────────────────────────
export const DUMMY_PENDING_LEAVES: PendingLeave[] = [
  { name: "Nadia Qureshi",  dept: "HR",          type: "Sick Leave",   days: 2 },
  { name: "Tariq Mehmood",  dept: "Marketing",   type: "Annual Leave", days: 5 },
  { name: "Rabia Farooq",   dept: "Engineering", type: "Casual Leave", days: 1 },
  { name: "Sana Malik",     dept: "Design",      type: "Sick Leave",   days: 3 },
];

// ─── getDummyData() — replaces the entire fetch block ─────
// Paste this function into Dashboard.tsx and call it instead of the fetch() calls.
//
//   const loadData = async () => {
//     setIsRefreshing(true);
//     try {
//       const { allStaff, todayAtt, pending } = getDummyData();
//       ... rest of your existing logic unchanged ...
//     }
//   }
//
export function getDummyData() {
  return {
    allStaff: DUMMY_STAFF,
    todayAtt:  DUMMY_ATTENDANCE,
    pending:   DUMMY_PENDING_LEAVES,
  };
}
