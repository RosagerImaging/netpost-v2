"use client";

import { useState } from "react";
import Link from "next/link";
import { useRedirectIfAuthenticated } from "../../../../lib/auth/auth-hooks";
import { AuthService } from "../../../../lib/auth/auth-utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  FormField,
  Button,
  FormMessage,
} from "@netpost/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validate email
    if (!AuthService.validateEmail(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const result = await AuthService.resetPassword(email);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          "If an account with that email exists, we&apos;ve sent you a password reset link. Please check your email."
        );
      }
    } catch (_) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="from-background via-background/95 to-background/90 flex min-h-screen items-center justify-center bg-gradient-to-br px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-primary-text text-center text-2xl font-semibold tracking-tight">
            Reset your password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              helperText="We'll send a password reset link to this email"
              required
              disabled={isLoading}
            />

            {error && <FormMessage type="error">{error}</FormMessage>}

            {success && <FormMessage type="success">{success}</FormMessage>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending reset link..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="space-y-2 text-center">
            <p className="text-muted-foreground text-sm">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
