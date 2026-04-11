import React, { createContext, useContext, useState, ReactNode } from "react";

interface OvertimeRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  date: string;
  regularEndTime: string;
  overtimeEndTime: string;
  hours: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedDate: string;
  department?: string;
}

const OvertimeContext = createContext<any>(null);

export const OvertimeProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<OvertimeRequest[]>([
    {
      id: "OT-001",
      employeeName: "Qaisar Shaheen",
      employeeId: "EMP-045",
      date: "2026-03-07",
      regularEndTime: "18:00",
      overtimeEndTime: "20:00",
      hours: 2,
      reason: "Project deadline urgent kaam tha",
      status: "pending",
      appliedDate: "2026-03-07",
      department: "Development",
    },
  ]);

  const addNewRequest = (newRequest: OvertimeRequest) => {
    setRequests((prev) => [newRequest, ...prev]);
  };

  const approveRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "approved" } : req)),
    );
  };

  const rejectRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "rejected" } : req)),
    );
  };

  return (
    <OvertimeContext.Provider
      value={{
        requests,
        addNewRequest,
        approveRequest,
        rejectRequest,
      }}
    >
      {children}
    </OvertimeContext.Provider>
  );
};

export const useOvertime = () => useContext(OvertimeContext);
