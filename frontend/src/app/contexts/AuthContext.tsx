import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types";
import { getUsers } from "../utils/storage";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Auth initialization error:", e);
          localStorage.removeItem("currentUser");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 1. Force reload storage data before checking
      // Yeh line ensure karegi ke agar storage.ts ne naya data dala hai toh wo mil jaye
      const allUsers = getUsers();

      console.log("Current Users in Storage:", allUsers); // Debugging ke liye

      // 2. Case-insensitive email check
      const foundUser = allUsers.find(
        (u: User) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          String(u.password) === String(password), // String conversion for safety
      );

      if (foundUser) {
        setUser(foundUser);
        setIsAuthenticated(true);

        localStorage.setItem("currentUser", JSON.stringify(foundUser));
        localStorage.setItem("isAuthenticated", "true");

        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, isLoading }}
    >
      {!isLoading ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
