'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRedirectIfAuthenticated } from '../../../../lib/auth/auth-hooks'
import { AuthService } from '../../../../lib/auth/auth-utils'
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthFormMessage,
} from '@netpost/ui'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasValidToken, setHasValidToken] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if already authenticated
  useRedirectIfAuthenticated()

  useEffect(() => {
    // Check if we have the necessary URL parameters for password reset
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
      setHasValidToken(true)
    } else {
      setError('Invalid or expired reset link. Please request a new one.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validate password
    const passwordValidation = AuthService.validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Password is invalid')
      setIsLoading(false)
      return
    }

    // Check password match
    if (!AuthService.validatePasswordMatch(password, confirmPassword)) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const result = await AuthService.updatePassword(password)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Password updated successfully! Redirecting to login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 px-4">
        <AuthCard
          title="Invalid Reset Link"
          description="This password reset link is invalid or has expired"
          glassmorphism
        >
          <AuthFormMessage type="error">
            {error || 'This password reset link is invalid or has expired.'}
          </AuthFormMessage>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Request a new reset link
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </AuthCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 px-4">
      <AuthCard
        title="Set new password"
        description="Enter your new password below"
        glassmorphism
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your new password"
            helperText="Must be at least 6 characters long"
            required
            disabled={isLoading}
          />

          <AuthInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            required
            disabled={isLoading}
          />

          {error && (
            <AuthFormMessage type="error">
              {error}
            </AuthFormMessage>
          )}

          {success && (
            <AuthFormMessage type="success">
              {success}
            </AuthFormMessage>
          )}

          <AuthButton
            type="submit"
            className="w-full"
            loading={isLoading}
            loadingText="Updating password..."
          >
            Update Password
          </AuthButton>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  )
}