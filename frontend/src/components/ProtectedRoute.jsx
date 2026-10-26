"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If user is not authenticated at all, redirect to the portal login
    if (!user) {
      router.push(requiredRole === "lender" ? "/login/lender" : "/login/borrower");
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070910]">
        <div className="w-8 h-8 border-2 border-[#168BFF]/20 border-t-[#168BFF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  return children;
}
