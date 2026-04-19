"use client";
import useAuthStore from "@/lib/useAuthStore";
import { useEffect } from "react";

export const AuthProvider = ({ children }) => {
  const { checkAuth, loading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return children;
};

export { useAuthStore };
