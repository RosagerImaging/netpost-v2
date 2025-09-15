"use client";

import { ReactNode } from "react";
import { useRequireAuth } from "./auth-hooks";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useRequireAuth(redirectTo);

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
        </div>
      )
    );
  }

  if (!user) {
    return null; // Redirect is handled by useRequireAuth hook
  }

  return <>{children}</>;
}

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/login",
  fallback,
}: AuthGuardProps) {
  if (requireAuth) {
    return (
      <ProtectedRoute redirectTo={redirectTo} fallback={fallback}>
        {children}
      </ProtectedRoute>
    );
  }

  return <>{children}</>;
}
