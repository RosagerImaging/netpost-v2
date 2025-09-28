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
    <div>
      {/* Navigation */}
      <nav className="glass fixed w-full z-50 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 feature-icon-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="font-bold text-xl text-gradient-primary">NetPost</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:opacity-100 opacity-70 transition text-foreground">Features</a>
            <a href="#how-it-works" className="hover:opacity-100 opacity-70 transition text-foreground">How It Works</a>
            <a href="#pricing" className="hover:opacity-100 opacity-70 transition text-foreground">Pricing</a>
            <a href="#about" className="hover:opacity-100 opacity-70 transition text-foreground">About</a>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button className="btn-primary px-6 py-2 rounded-lg font-semibold" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button className="btn-ghost px-6 py-2 rounded-lg font-medium" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button className="btn-primary px-6 py-2 rounded-lg font-semibold" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Unicorn Studio Shader Container */}
        <div id="unicorn-studio">
          <div data-us-project="7f0drgFbmWvRGUypjDmw" style={{width:'1440px', height: '900px'}}></div>
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `!function(){if(!window.UnicornStudio){window.UnicornStudio={isInitialized:!1};var i=document.createElement("script");i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.31/dist/unicornStudio.umd.js",i.onload=function(){window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)},(document.head || document.body).appendChild(i)}}();`
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="container mx-auto px-6 w-full">
            {/* Main Heading - Stacked Text */}
            <div className="mb-8 md:mb-16">
              <h1 className="text-5xl md:text-8xl font-bold leading-none tracking-tight">
                <div className="text-gradient-primary">AI NATIVE</div>
                <div className="text-gradient-primary glow">CROSSLISTING</div>
              </h1>
            </div>

            {/* Center aligned content container */}
            <div className="max-w-2xl mx-auto text-center">

              <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto text-muted-foreground">
                Transform your reselling workflow with intelligent automation. List once, sell everywhere with NetPost's AI-native platform.
              </p>

              <div className="flex justify-center mb-16">
                <Button className="btn-primary px-10 py-4 rounded-xl text-lg font-semibold flex items-center transform transition-transform hover:scale-105">
                  <span>Start Free Trial</span>
                  <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </div>

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
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Grow your multichannel e-commerce business
            </h2>
            <p className="text-lg max-w-2xl mx-auto opacity-80 text-muted-foreground">
              Powered by cutting-edge AI technology to maximize your selling potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-14 h-14 feature-icon-primary rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">
                Bulk list on 15+ marketplaces
              </h3>
              <p className="mb-4 opacity-80 text-muted-foreground">
                Complete one form – list everywhere. Our AI automatically optimizes your listings for each platform's requirements.
              </p>
              <a href="#" className="flex items-center font-medium transition text-primary">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-14 h-14 feature-icon-secondary rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">
                AI-Powered Optimization
              </h3>
              <p className="mb-4 opacity-80 text-muted-foreground">
                Generate compelling listings from just an image. Get optimal pricing suggestions based on millions of data points.
              </p>
              <a href="#" className="flex items-center font-medium transition text-secondary">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-14 h-14 feature-icon-accent rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">
                Unified Dashboard
              </h3>
              <p className="mb-4 opacity-80 text-muted-foreground">
                Manage all your listings from one convenient interface. Track performance, handle orders, and sync inventory seamlessly.
              </p>
              <a href="#" className="flex items-center font-medium transition text-accent">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              How NetPost Works
            </h2>
            <p className="text-lg max-w-2xl mx-auto opacity-80 text-muted-foreground">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-primary/15 border-2 border-primary">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Snap or Import</h3>
              <p className="opacity-80 text-muted-foreground">
                Take a photo of your item or import existing listings from other platforms
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-secondary/15 border-2 border-secondary">
                <span className="text-3xl font-bold text-secondary">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">AI Enhancement</h3>
              <p className="opacity-80 text-muted-foreground">
                Our AI generates optimized titles, descriptions, and suggests pricing
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-accent/15 border-2 border-accent">
                <span className="text-3xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Cross-List</h3>
              <p className="opacity-80 text-muted-foreground">
                With one click, your item is listed across all selected marketplaces
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}