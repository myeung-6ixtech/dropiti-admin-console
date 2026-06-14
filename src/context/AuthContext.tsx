"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { AdminUser } from "@/lib/auth-session";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
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

const PUBLIC_PATH_PREFIXES = ["/signin", "/signup"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Keep a readable profile if a background refresh returns sparse JWT-only data. */
function mergeAdminUser(prev: AdminUser | null, next: AdminUser): AdminUser {
  if (!prev || prev.id !== next.id) return next;

  const prevName = prev.name?.trim() ?? "";
  const nextName = next.name?.trim() ?? "";
  const prevHasReadableName = prevName && prevName !== prev.id && !UUID_RE.test(prevName);
  const nextHasReadableName = nextName && nextName !== next.id && !UUID_RE.test(nextName);

  if (!nextHasReadableName && prevHasReadableName) {
    return {
      ...next,
      name: prev.name,
      email: next.email || prev.email,
      avatar: next.avatar ?? prev.avatar,
    };
  }

  return next;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  const applySession = useCallback((nextUser: AdminUser | null, authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    setUser((prev) => {
      if (!authenticated || !nextUser) return null;
      return mergeAdminUser(prev, nextUser);
    });
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const run = async (): Promise<boolean> => {
      try {
        const response = await fetch("/api/v1/auth/check", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          applySession(data.user, true);
          return true;
        }

        applySession(null, false);
        return false;
      } catch (error) {
        console.error("Auth check failed:", error);
        return false;
      }
    };

    refreshInFlight.current = run().finally(() => {
      refreshInFlight.current = null;
    });

    return refreshInFlight.current;
  }, [applySession]);

  useEffect(() => {
    void (async () => {
      const ok = await refreshSession();
      if (
        !ok &&
        typeof window !== "undefined" &&
        !isPublicPath(window.location.pathname)
      ) {
        window.location.replace("/signin");
      }
      setIsLoading(false);
    })();
  }, [refreshSession]);

  useEffect(() => {
    const onFocus = () => {
      void refreshSession();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        applySession(data.user, true);
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      applySession(null, false);
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes("*")) return true;
    const [category] = permission.split(":");
    if (user.permissions.includes(`${category}:*`)) return true;
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
        refreshSession,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
