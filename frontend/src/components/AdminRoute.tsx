import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

function isAdminRole(role: string | null) {
  return role === "admin" || role === "super_admin";
}

/**
 * Wraps admin UI: requires login and admin (or super_admin) role from the session.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminRole(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
