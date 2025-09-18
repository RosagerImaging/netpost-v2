"use client";

import { useAuth } from "../../../../lib/auth/auth-hooks";
import { Button } from "@netpost/ui";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect will be handled by auth state change
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="from-background via-background/95 to-background/90 min-h-screen bg-gradient-to-br">
      <header className="border-border/40 bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-primary text-2xl font-bold">NetPost V2</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-muted-foreground text-sm">
                Welcome, {user.email}
              </span>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome to your NetPost V2 AI-Native Reselling Assistant
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card/50 border-border/40 rounded-lg border p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-lg font-semibold">Item Analysis</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Upload photos to get AI-powered pricing and listing suggestions
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="bg-card/50 border-border/40 rounded-lg border p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-lg font-semibold">
                Cross-Platform Posting
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Post to multiple platforms with one click
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="bg-card/50 border-border/40 rounded-lg border p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-lg font-semibold">Analytics</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Track your performance across all platforms
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="bg-card/50 border-border/40 rounded-lg border p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-lg font-semibold">
                Inventory Management
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Keep track of your items and their status
              </p>
              <Button
                className="w-full"
                onClick={() => window.location.href = '/inventory'}
              >
                View Inventory
              </Button>
            </div>

            <div className="bg-card/50 border-border/40 rounded-lg border p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-lg font-semibold">AI Assistant</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Get personalized recommendations and insights
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="bg-card/50 border-border/40 rounded-lg border p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-lg font-semibold">Settings</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Configure your account and platform connections
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
