"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validate inputs
    if (!AuthService.validateEmail(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || "Password is invalid");
      setIsLoading(false);
      return;
    }

    if (!AuthService.validatePasswordMatch(password, confirmPassword)) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the terms of service and privacy policy");
      setIsLoading(false);
      return;
    }

    try {
      const result = await AuthService.signUp(email, password);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          "Account created successfully! Please check your email for a verification link."
        );
        // Don't redirect immediately, let user see the success message
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!acceptedTerms) {
      setError("You must accept the terms of service and privacy policy");
      setIsLoading(false);
      return;
    }

    try {
      const result = await AuthService.signInWithGoogle();

      if (result.error) {
        setError(result.error);
      }
      // OAuth redirect will be handled by Supabase
    } catch (error) {
      console.error('Google sign up error:', error);
      setError("An unexpected error occurred with Google sign up.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="from-background via-background/95 to-background/90 flex min-h-screen items-center justify-center bg-gradient-to-br px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-primary-text text-center text-2xl font-semibold tracking-tight">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Get started with NetPost V2 today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              data-testid="email"
            />

            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              helperText="Must be at least 6 characters long"
              required
              disabled={isLoading}
              data-testid="password"
            />

            <FormField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
              data-testid="confirm-password"
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="text-primary focus:ring-primary rounded border-gray-300"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="text-muted-foreground text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {error && <FormMessage type="error">{error}</FormMessage>}

            {success && <FormMessage type="success">{success}</FormMessage>}

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="signup-button">
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
