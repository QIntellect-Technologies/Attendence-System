export type UserRole =
  | "admin"
  | "hr" // ← Yeh add kiya gaya hai
  | "staff"
  | "manager"
  | "developer"
  | "hr_executive"
  | "ceo"
  | "product_lead"
  | "strategic_advisor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  staffId?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  userId: string;
  shiftStart: string;
  shiftEnd: string;
  shift?: string;
  role?: string;
  image?: string;
  salary?: number;
  presentDays?: number;
}

export interface OvertimeRequest {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  hours: number;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
  task: string;
  reason?: string;
  rejectionNote?: string;
  regularEnd?: string;
  overtimeEnd?: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  name: string;
  date: string;
  time: string;
  status:
    | "PRESENT"
    | "ABSENT"
    | "LATE"
    | "COMPLETED"
    | "left_early"
    | "Early Left";
  createdAt: string;
  outTime?: string;
  workDuration?: string;
  checkOutStatus?: "ON_TIME" | "EARLY" | "OVERTIME" | "MISSING";
}
