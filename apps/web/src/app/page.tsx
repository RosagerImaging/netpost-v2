'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useIsAuthenticated } from '../../lib/auth/auth-hooks'
import { Button } from "@netpost/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@netpost/ui";
import { Input } from "@netpost/ui";

export default function Home() {
  const { isAuthenticated, loading } = useIsAuthenticated()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/20 to-accent-50/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            NetPost V2
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-Native Reselling Assistant Platform
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Transform your reselling workflow with intelligent automation, cross-platform management, and data-driven insights.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* UI Components Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
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
                <Button variant="secondary" size="sm">Electronics</Button>
                <Button variant="secondary" size="sm">Clothing</Button>
                <Button variant="secondary" size="sm">Accessories</Button>
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold text-success">$2,847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Listings</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="font-semibold text-info">12.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p className="mb-4">Built with Next.js, Turborepo, and Tailwind CSS</p>
          <div className="flex gap-4 justify-center">
            <Button variant="ghost" size="sm">Documentation</Button>
            <Button variant="ghost" size="sm">GitHub</Button>
            <Button variant="ghost" size="sm">Support</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
