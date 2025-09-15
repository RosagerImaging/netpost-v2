'use client'

import { useAuth } from '../../../../lib/auth/auth-hooks'
import { AuthButton } from '@netpost/ui'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect will be handled by auth state change
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">NetPost V2</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
            )}
            <AuthButton
              variant="outline"
              onClick={handleSignOut}
            >
              Sign Out
            </AuthButton>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome to your NetPost V2 AI-Native Reselling Assistant
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Item Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload photos to get AI-powered pricing and listing suggestions
              </p>
              <AuthButton className="w-full" disabled>
                Coming Soon
              </AuthButton>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Cross-Platform Posting</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Post to multiple platforms with one click
              </p>
              <AuthButton className="w-full" disabled>
                Coming Soon
              </AuthButton>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track your performance across all platforms
              </p>
              <AuthButton className="w-full" disabled>
                Coming Soon
              </AuthButton>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Inventory Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Keep track of your items and their status
              </p>
              <AuthButton className="w-full" disabled>
                Coming Soon
              </AuthButton>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get personalized recommendations and insights
              </p>
              <AuthButton className="w-full" disabled>
                Coming Soon
              </AuthButton>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your account and platform connections
              </p>
              <AuthButton className="w-full" disabled>
                Coming Soon
              </AuthButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}