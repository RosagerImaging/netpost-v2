'use client'

import { ReactNode } from 'react'
import { useRequireAuth } from './auth-hooks'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const { user, loading } = useRequireAuth(redirectTo)

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      )
    )
  }

  if (!user) {
    return null // Redirect is handled by useRequireAuth hook
  }

  return <>{children}</>
}

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: ReactNode
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/login',
  fallback
}: AuthGuardProps) {
  if (requireAuth) {
    return (
      <ProtectedRoute redirectTo={redirectTo} fallback={fallback}>
        {children}
      </ProtectedRoute>
    )
  }

  return <>{children}</>
}