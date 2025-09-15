'use client'

import { useAuth } from './auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export { useAuth }

/**
 * Hook to require authentication
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

/**
 * Hook to redirect authenticated users
 * Useful for login/register pages
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { user, loading } = useAuth()

  return {
    isAuthenticated: !!user,
    user,
    loading
  }
}

/**
 * Hook for authentication status with redirect protection
 */
export function useAuthGuard() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)
  const isProtectedPage = !['/login', '/register', '/forgot-password', '/reset-password', '/'].includes(pathname)

  useEffect(() => {
    if (!loading) {
      // Redirect authenticated users away from auth pages
      if (user && isAuthPage) {
        router.push('/dashboard')
      }
      // Redirect unauthenticated users to login for protected pages
      else if (!user && isProtectedPage) {
        router.push('/login')
      }
    }
  }, [user, loading, isAuthPage, isProtectedPage, router])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAuthPage,
    isProtectedPage
  }
}