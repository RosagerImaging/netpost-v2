"use client";

// Testing final deployment after monorepo package build fixes
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
import { AnimatedHeadline } from "../components/ui/animated-headline";
import { StackedAnimatedHeadline } from "../components/ui/stacked-animated-headline";

export default function Home() {
  const { isAuthenticated, loading } = useIsAuthenticated();
  const router = useRouter();

  // Removed automatic redirect - allow authenticated users to view homepage

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.1738_0.0026_67.6532)] via-[oklch(0.2161_0.0061_56.0434)] to-[oklch(0.1738_0.0026_67.6532)]" style={{ fontFamily: 'Figtree, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-8 md:mb-16">
            <StackedAnimatedHeadline
              lines={["AI NATIVE", "CROSSLISTING"]}
              gradientLine={1}
              className="text-5xl md:text-8xl font-bold text-gradient-primary"
            />
          </div>
          <p className="mx-auto mb-8 max-w-3xl text-xl md:text-2xl" style={{ color: 'oklch(0.9816 0.0017 247.8390)' }}>
            AI-Native Reselling Assistant Platform
          </p>
          <p className="mx-auto mb-12 max-w-2xl text-lg" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }}>
            Transform your reselling workflow with intelligent automation,
            cross-platform management, and data-driven insights.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {isAuthenticated ? (
              <Button size="lg" className="px-8 text-lg" asChild data-testid="go-to-dashboard-button">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="px-8 text-lg" asChild data-testid="get-started-button">
                  <Link href="/register">Start Free Trial</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 text-lg"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>

          {/* Metrics Section */}
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-primary">15+</p>
              <p className="text-sm opacity-70">Marketplaces</p>
            </div>
            <div className="h-8 w-px bg-gray-600"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-secondary">Optimized</p>
              <p className="text-sm opacity-70">Auto Listing</p>
            </div>
            <div className="h-8 w-px bg-gray-600"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-primary">AI Powered</p>
              <p className="text-sm opacity-70">Customer Response</p>
            </div>
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

        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="from-primary-600 to-accent-600 mb-4 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Trusted by thousands of resellers worldwide
            </p>
          </div>

          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            {/* First row - scrolls right */}
            <div className="flex animate-marquee gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="glass flex-shrink-0 w-80 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                      {String.fromCharCode(64 + i)}
                    </div>
                    <div>
                      <div className="font-semibold">User {i}</div>
                      <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                        Poshmark • Mercari • Depop
                      </div>
                    </div>
                    <div className="ml-auto flex text-yellow-400">
                      {"★".repeat(5)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "NetPost has completely transformed my reselling business. The AI-powered features save me hours every day!"
                  </p>
                </div>
              ))}
            </div>

            {/* Second row - scrolls left */}
            <div className="flex animate-marquee-reverse gap-4">
              {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((i) => (
                <div key={i} className="glass flex-shrink-0 w-80 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {String.fromCharCode(64 + (i - 10))}
                    </div>
                    <div>
                      <div className="font-semibold">Seller {i - 10}</div>
                      <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                        eBay • Facebook • Vinted
                      </div>
                    </div>
                    <div className="ml-auto flex text-yellow-400">
                      {"★".repeat(5)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Cross-platform posting is a game changer. I can list everywhere with just one click!"
                  </p>
                </div>
              ))}
            </div>

            {/* Fade effects */}
            <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r"></div>
            <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l"></div>
          </div>
        </div>

        {/* Footer */}
        <footer className="glass mt-16 rounded-lg p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">NetPost</h3>
              <p className="text-muted-foreground text-sm">
                AI-Native Reselling Assistant Platform for modern entrepreneurs.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Product</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="/api" className="hover:text-foreground transition-colors">API</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Resources</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/support" className="hover:text-foreground transition-colors">Support</Link></li>
                <li><Link href="/community" className="hover:text-foreground transition-colors">Community</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Company</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-border mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
            <p className="text-muted-foreground text-sm">
              © 2024 NetPost. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://github.com" target="_blank">GitHub</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://twitter.com" target="_blank">Twitter</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://linkedin.com" target="_blank">LinkedIn</Link>
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
