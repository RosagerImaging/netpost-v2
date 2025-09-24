"use client";

// Test Vercel deployment fix - no ignore command, should deploy
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useIsAuthenticated } from "../../lib/auth/auth-hooks";
import { Button } from "@netpost/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@netpost/ui";
import { Input } from "@netpost/ui";

export default function Home() {
  const { isAuthenticated, loading } = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }
  return (
    <div className="from-background via-primary-50/20 to-accent-50/20 min-h-screen bg-gradient-to-br">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="from-primary-600 to-accent-600 mb-6 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            NetPost V2
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-3xl text-xl md:text-2xl">
            AI-Native Reselling Assistant Platform
          </p>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg">
            Transform your reselling workflow with intelligent automation,
            cross-platform management, and data-driven insights.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="px-8 text-lg" asChild data-testid="get-started-button">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 text-lg"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* UI Components Showcase */}
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Smart Inventory</CardTitle>
              <CardDescription>
                AI-powered item categorization and pricing suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input placeholder="Search your inventory..." className="mb-4" />
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  Electronics
                </Button>
                <Button variant="secondary" size="sm">
                  Clothing
                </Button>
                <Button variant="secondary" size="sm">
                  Accessories
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Cross-Platform Listing</CardTitle>
              <CardDescription>
                List on multiple platforms with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Poshmark</span>
                  <Button size="sm">Post</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mercari</span>
                  <Button size="sm">Post</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Depop</span>
                  <Button size="sm">Post</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Track performance across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total Revenue
                  </span>
                  <span className="text-success font-semibold">$2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Active Listings
                  </span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Conversion Rate
                  </span>
                  <span className="text-info font-semibold">12.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-muted-foreground text-center">
          <p className="mb-4">
            Built with Next.js, Turborepo, and Tailwind CSS
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="ghost" size="sm">
              Documentation
            </Button>
            <Button variant="ghost" size="sm">
              GitHub
            </Button>
            <Button variant="ghost" size="sm">
              Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
