import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isPending } = useAuth();

  if (isPending) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
