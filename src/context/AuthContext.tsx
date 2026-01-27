"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string | null; // Normalized to role ID (e.g., "super_admin", "viewer")
  permissions?: string[];
  avatar?: string;
  lastLogin?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        // Normalize role to string (use role ID for consistency with existing code)
        const normalizedUser = {
          ...data.user,
          role: typeof data.user.role === 'string' 
            ? data.user.role 
            : data.user.role?.id || data.user.role?.name || null
        };
        setUser(normalizedUser);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        // Only redirect if we're not already on a public route
        // Use window.location to avoid React render issues
        if (typeof window !== 'undefined' && 
            !window.location.pathname.startsWith('/signin') &&
            !window.location.pathname.startsWith('/signup')) {
          window.location.href = "/signin";
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      // Only redirect if we're not already on a public route
      // Use window.location to avoid React render issues
      if (typeof window !== 'undefined' && 
          !window.location.pathname.startsWith('/signin') &&
          !window.location.pathname.startsWith('/signup')) {
        window.location.href = "/signin";
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        // Normalize role to string (use role ID for consistency with existing code)
        const normalizedUser = {
          ...data.user,
          role: typeof data.user.role === 'string' 
            ? data.user.role 
            : data.user.role?.id || data.user.role?.name || null
        };
        setUser(normalizedUser);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      // Use window.location for navigation to avoid React render issues
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    }
  };

  // Helper function to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    // Check for wildcard permission (super_admin)
    if (user.permissions.includes('*')) return true;
    // Check for specific permission
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 