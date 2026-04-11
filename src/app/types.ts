export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'staff' | 'admin';
  avatar?: string;
  joinDate: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string; // ISO string YYYY-MM-DD
  inTime: string | null; // ISO string
  outTime: string | null; // ISO string
  status: 'present' | 'absent' | 'leave';
  inPhoto?: string;
  outPhoto?: string;
}

export type UserRole = 'admin' | 'staff';
