'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRedirectIfAuthenticated } from '../../../../lib/auth/auth-hooks'
import { AuthService } from '../../../../lib/auth/auth-utils'
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthFormMessage,
} from '@netpost/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useRedirectIfAuthenticated()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validate email
    if (!AuthService.validateEmail(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      const result = await AuthService.resetPassword(email)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(
          'If an account with that email exists, we&apos;ve sent you a password reset link. Please check your email.'
        )
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 px-4">
      <AuthCard
        title="Reset your password"
        description="Enter your email address and we'll send you a reset link"
        glassmorphism
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            helperText="We'll send a password reset link to this email"
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
            loadingText="Sending reset link..."
          >
            Send Reset Link
          </AuthButton>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  )
}