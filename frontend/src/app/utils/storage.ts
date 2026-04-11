import { User, Staff, AttendanceRecord, OvertimeRequest } from "../types";

// Version update taake purana incomplete data clear ho jaye aur naye fields apply hon
const DATA_VERSION = "v16_hr_role_added";

// --- Base Getters & Setters ---
export const getUsers = (): User[] =>
  JSON.parse(localStorage.getItem("users") || "[]");
export const saveUsers = (users: User[]) =>
  localStorage.setItem("users", JSON.stringify(users));

export const getStaff = (): Staff[] =>
  JSON.parse(localStorage.getItem("staff") || "[]");
export const saveStaff = (staff: Staff[]) =>
  localStorage.setItem("staff", JSON.stringify(staff));

export const getAttendance = (): AttendanceRecord[] =>
  JSON.parse(localStorage.getItem("attendance") || "[]");
export const saveAttendance = (att: AttendanceRecord[]) =>
  localStorage.setItem("attendance", JSON.stringify(att));

// --- Leave & Overtime Storage Logic ---
export const getLeaveRequests = (): any[] =>
  JSON.parse(localStorage.getItem("leave_requests") || "[]");

export const saveLeaveRequests = (requests: any[]) =>
  localStorage.setItem("leave_requests", JSON.stringify(requests));

export const getOvertimeRequests = (): OvertimeRequest[] =>
  JSON.parse(localStorage.getItem("overtime_requests") || "[]");

export const saveOvertimeRequests = (requests: OvertimeRequest[]) =>
  localStorage.setItem("overtime_requests", JSON.stringify(requests));

// --- Leave & Overtime Actions ---
export const addLeaveRequest = (req: any) => {
  const all = getLeaveRequests();
  all.push(req);
  saveLeaveRequests(all);
};

export const updateLeaveStatus = (
  id: string,
  status: "Approved" | "Rejected",
) => {
  const all = getLeaveRequests();
  const index = all.findIndex((r) => r.id === id);
  if (index !== -1) {
    all[index].status = status;
    saveLeaveRequests(all);
  }
};

export const addOvertimeRequest = (req: OvertimeRequest) => {
  const all = getOvertimeRequests();
  all.push(req);
  saveOvertimeRequests(all);
};

export const updateOvertimeStatus = (
  id: string,
  status: "Approved" | "Rejected",
) => {
  const all = getOvertimeRequests();
  const index = all.findIndex((r) => r.id === id);
  if (index !== -1) {
    all[index].status = status;
    saveOvertimeRequests(all);
  }
};

// --- Work Duration & Overtime Logic ---
const calculateWorkStats = (
  inTime: string,
  outTime: string,
  shiftEnd: string,
) => {
  const start = new Date(`2024-01-01 ${inTime}`);
  const end = new Date(`2024-01-01 ${outTime}`);
  const sEnd = new Date(`2024-01-01 ${shiftEnd}`);

  const diffMs = end.getTime() - start.getTime();
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);

  const duration = `${hrs}h ${mins}m`;
  let status: "EARLY" | "ON_TIME" | "OVERTIME" = "ON_TIME";

  if (end < sEnd) status = "EARLY";
  else if (end > sEnd) status = "OVERTIME";

  return { duration, status };
};

// --- CRUD Functions (Staff Management) ---
export const addStaff = (staff: Staff, user: User) => {
  let finalShift = staff.shift || "Morning";
  let finalStart = staff.shiftStart || "09:00";
  let finalEnd = staff.shiftEnd || "18:00";

  if (finalShift.includes("Morning")) {
    finalShift = "Morning";
    finalStart = "09:00";
    finalEnd = "18:00";
  } else if (finalShift.includes("Evening")) {
    finalShift = "Evening";
    finalStart = "14:00";
    finalEnd = "22:00";
  } else if (finalShift.includes("Night")) {
    finalShift = "Night";
    finalStart = "22:00";
    finalEnd = "06:00";
  }

  const newStaff = {
    ...staff,
    shift: finalShift,
    shiftStart: finalStart,
    shiftEnd: finalEnd,
  };

  const allStaff = getStaff();
  allStaff.push(newStaff);
  saveStaff(allStaff);

  const allUsers = getUsers();
  allUsers.push(user);
  saveUsers(allUsers);
};

export const updateStaff = (id: string, updatedStaff: Partial<Staff>) => {
  const staff = getStaff();
  const index = staff.findIndex((s) => s.id === id);
  if (index !== -1) {
    const oldStaff = staff[index];
    let finalShift = updatedStaff.shift || oldStaff.shift || "Morning";
    let finalStart = updatedStaff.shiftStart || oldStaff.shiftStart || "09:00";
    let finalEnd = updatedStaff.shiftEnd || oldStaff.shiftEnd || "18:00";

    if (finalShift.includes("Morning")) {
      finalShift = "Morning";
      finalStart = "09:00";
      finalEnd = "18:00";
    } else if (finalShift.includes("Evening")) {
      finalShift = "Evening";
      finalStart = "14:00";
      finalEnd = "22:00";
    } else if (finalShift.includes("Night")) {
      finalShift = "Night";
      finalStart = "22:00";
      finalEnd = "06:00";
    }

    staff[index] = {
      ...oldStaff,
      ...updatedStaff,
      shift: finalShift,
      shiftStart: finalStart,
      shiftEnd: finalEnd,
    } as Staff;
    saveStaff(staff);
  }
};

export const deleteStaff = (id: string) => {
  const staff = getStaff();
  const member = staff.find((s) => s.id === id);
  if (member) {
    saveStaff(staff.filter((s) => s.id !== id));
    saveUsers(getUsers().filter((u) => u.id !== member.userId));
  }
};

// --- Helper Functions ---
export const getStaffById = (id: string): Staff | undefined => {
  const staff = getStaff();
  return staff.find((s) => s.id === id || s.userId === id);
};

export const getTodayAttendance = (staffId?: string) => {
  const today = new Date().toISOString().split("T")[0];
  const all = getAttendance();
  return staffId
    ? all.find((a) => a.staffId === staffId && a.date === today)
    : all.filter((a) => a.date === today);
};

// --- Attendance Marking Logic ---
export const autoMarkFaceAttendance = (inputName: string) => {
  const staff = getStaff();
  const staffMember = staff.find(
    (s) => s.name.toLowerCase().trim() === inputName.toLowerCase().trim(),
  );

  if (!staffMember) return "Not Found";

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const allAtt = getAttendance();
  const existingIdx = allAtt.findIndex(
    (a) => a.staffId === staffMember.id && a.date === today,
  );

  if (existingIdx === -1) {
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      staffId: staffMember.id,
      staffName: staffMember.name,
      name: staffMember.name,
      date: today,
      time: now,
      status: "PRESENT",
      createdAt: new Date().toISOString(),
    };
    saveAttendance([...allAtt, newRecord]);
    return "Check-in Marked";
  }

  const record = allAtt[existingIdx];
  if (!record.outTime) {
    const stats = calculateWorkStats(
      record.time || "09:00",
      now,
      staffMember.shiftEnd || "18:00",
    );

    allAtt[existingIdx] = {
      ...record,
      outTime: now,
      workDuration: stats.duration,
      checkOutStatus: stats.status,
    };
    saveAttendance(allAtt);
    return `Check-out: ${stats.status}`;
  }

  return "Already Completed";
};

// --- Initial Data Loader ---
const initializeDefaultData = () => {
  const currentVersion = localStorage.getItem("app_data_version");
  const users = getUsers();

  if (users.length === 0 || currentVersion !== DATA_VERSION) {
    const defaultStaff: Staff[] = [
      {
        id: "staff-elon",
        name: "Elon Musk",
        email: "e@co.com",
        phone: "555-01",
        department: "Innovation",
        position: "CEO",
        joinDate: "2024-01-01",
        userId: "user-elon",
        shift: "Morning",
        shiftStart: "09:00",
        shiftEnd: "18:00",
      },
      {
        id: "staff-mark",
        name: "Mark Zuckerberg",
        email: "m@co.com",
        phone: "555-02",
        department: "Product",
        position: "CEO",
        joinDate: "2024-01-01",
        userId: "user-mark",
        shift: "Evening",
        shiftStart: "14:00",
        shiftEnd: "22:00",
      },
      {
        id: "staff-bill",
        name: "Bill Gates",
        email: "b@co.com",
        phone: "555-03",
        department: "Strategy",
        position: "Founder",
        joinDate: "2024-01-01",
        userId: "user-bill",
        shift: "Night",
        shiftStart: "22:00",
        shiftEnd: "06:00",
      },
      {
        id: "staff-qaisar",
        name: "Qaisar Shaheen",
        email: "q@co.com",
        phone: "0300-123",
        department: "Management",
        position: "Manager",
        joinDate: "2024-01-10",
        userId: "user-qaisar",
        shift: "Morning",
        shiftStart: "08:00",
        shiftEnd: "16:00",
      },
      {
        id: "staff-sheraz",
        name: "Sheraz Shafique",
        email: "sheraz@co.com",
        phone: "0300-456",
        department: "Finance",
        position: "Accounts Manager",
        joinDate: "2024-02-01",
        userId: "user-sheraz",
        shift: "Evening",
        shiftStart: "14:00",
        shiftEnd: "22:00",
      },
    ];

    const defaultUsers: User[] = [
      {
        id: "admin-1",
        name: "Admin",
        email: "admin@company.com",
        password: "123",
        role: "admin",
      },
      // HR User Added
      {
        id: "hr-1",
        name: "Hooria HR",
        email: "hr@company.com",
        password: "hr123",
        role: "hr",
      },
      ...defaultStaff.map((s) => ({
        id: s.userId!,
        name: s.name,
        email: s.email,
        password: "123",
        role: "staff" as any,
        staffId: s.id,
      })),
    ];

    saveUsers(defaultUsers);
    saveStaff(defaultStaff);
    localStorage.setItem("app_data_version", DATA_VERSION);
  }
};

initializeDefaultData();
