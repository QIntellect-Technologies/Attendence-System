import React, { createContext, useContext, useState, useEffect } from 'react';
import { Staff, AttendanceRecord, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  currentUser: Staff | null;
  staffList: Staff[];
  attendanceRecords: AttendanceRecord[];
  login: (email: string, role: UserRole) => boolean;
  logout: () => void;
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (staff: Staff) => void;
  removeStaff: (id: string) => void;
  markAttendance: (type: 'in' | 'out', photo: string) => void;
  getStaffAttendance: (staffId: string) => AttendanceRecord[];
  getTodayAttendance: () => AttendanceRecord[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_STAFF: Staff[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@company.com',
    phone: '123-456-7890',
    department: 'Management',
    role: 'admin',
    joinDate: '2023-01-01',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@company.com',
    phone: '987-654-3210',
    department: 'Engineering',
    role: 'staff',
    joinDate: '2023-03-15',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@company.com',
    phone: '555-123-4567',
    department: 'HR',
    role: 'staff',
    joinDate: '2023-06-10',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '4',
    name: 'Robert Johnson',
    email: 'robert@company.com',
    phone: '444-987-6543',
    department: 'Sales',
    role: 'staff',
    joinDate: '2024-01-20',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200'
  }
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'a1',
    staffId: '2',
    date: new Date().toISOString().split('T')[0],
    inTime: new Date(new Date().setHours(9, 0)).toISOString(),
    outTime: null,
    status: 'present',
  },
   {
    id: 'a2',
    staffId: '3',
    date: new Date().toISOString().split('T')[0],
    inTime: new Date(new Date().setHours(8, 45)).toISOString(),
    outTime: new Date(new Date().setHours(17, 30)).toISOString(),
    status: 'present',
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);

  const login = (email: string, role: UserRole) => {
    const user = staffList.find(s => s.email === email && s.role === role);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addStaff = (staff: Omit<Staff, 'id'>) => {
    const newStaff = { ...staff, id: uuidv4() };
    setStaffList([...staffList, newStaff]);
  };

  const updateStaff = (staff: Staff) => {
    setStaffList(staffList.map(s => s.id === staff.id ? staff : s));
  };

  const removeStaff = (id: string) => {
    setStaffList(staffList.filter(s => s.id !== id));
  };

  const markAttendance = (type: 'in' | 'out', photo: string) => {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = attendanceRecords.find(r => r.staffId === currentUser.id && r.date === today);

    if (type === 'in') {
      if (existingRecord) return; // Already marked in
      const newRecord: AttendanceRecord = {
        id: uuidv4(),
        staffId: currentUser.id,
        date: today,
        inTime: new Date().toISOString(),
        outTime: null,
        status: 'present',
        inPhoto: photo
      };
      setAttendanceRecords([...attendanceRecords, newRecord]);
    } else {
      if (!existingRecord) return; // Haven't marked in yet
      const updatedRecord = {
        ...existingRecord,
        outTime: new Date().toISOString(),
        outPhoto: photo
      };
      setAttendanceRecords(attendanceRecords.map(r => r.id === existingRecord.id ? updatedRecord : r));
    }
  };

  const getStaffAttendance = (staffId: string) => {
    return attendanceRecords.filter(r => r.staffId === staffId);
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceRecords.filter(r => r.date === today);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      staffList,
      attendanceRecords,
      login,
      logout,
      addStaff,
      updateStaff,
      removeStaff,
      markAttendance,
      getStaffAttendance,
      getTodayAttendance
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
