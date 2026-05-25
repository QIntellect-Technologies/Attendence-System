// AuthContext.jsx — full file, replace yours
import { createContext, useState, useCallback } from "react";

const AuthContext = createContext(undefined);

const DUMMY_USERS = [
  {
    id: 1,
    name: "Admin",
    email: "admin@company.com",
    password: "admin123",
    role: "admin",
    department: "IT",
    phone: "",
  },
  {
    id: 2,
    name: "HR",
    email: "hr@company.com",
    password: "hr123",
    role: "hr",
    department: "HR",
    phone: "",
  },
  {
    id: 3,
    name: "Elon",
    email: "e@co.com",
    password: "123",
    role: "staff",
    department: "Ops",
    phone: "",
  },
  {
    id: 4,
    name: "Qaisar",
    email: "q@co.com",
    password: "123",
    role: "staff",
    department: "Ops",
    phone: "",
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("currentUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("currentUser");
  });

  const login = useCallback(async (email, password) => {
    const match = DUMMY_USERS.find(
      (u) => u.email === email && u.password === password,
    );

    if (match) {
      const { password: _password, ...loggedInUser } = match;
      setUser(loggedInUser);
      setIsAuthenticated(true);
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
      localStorage.setItem("isAuthenticated", "true");
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
