"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useIsAuthenticated } from "../../lib/auth/auth-hooks";
import { Button } from "@netpost/ui";

export default function Home() {
  const { isAuthenticated, loading } = useIsAuthenticated();
  const router = useRouter();

  // Allow authenticated users to view homepage

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <style jsx global>{`
        :root {
          --background: oklch(0.1448 0 0);
          --foreground: oklch(0.9851 0 0);
          --card: oklch(0.1831 0 0);
          --card-foreground: oklch(0.9851 0 0);
          --popover: oklch(0.1831 0 0);
          --popover-foreground: oklch(0.9851 0 0);
          --primary: oklch(0.5161 0.0791 234.7598);
          --primary-foreground: oklch(0.9851 0 0);
          --secondary: oklch(0.9476 0.0190 192.8095);
          --secondary-foreground: oklch(0.3755 0.0700 176.3952);
          --muted: oklch(0.3755 0.0700 176.3952);
          --muted-foreground: oklch(0.7039 0.0189 175.6460);
          --accent: oklch(0.8708 0.0470 189.6325);
          --accent-foreground: oklch(0.3755 0.0700 176.3952);
          --destructive: oklch(0.5830 0.2387 28.4765);
          --destructive-foreground: oklch(0.9851 0 0);
          --border: oklch(0.3755 0.0700 176.3952);
          --input: oklch(0.2615 0.0350 176.3952);
          --ring: oklch(0.5166 0.0931 181.0803);
        }

        body {
          background: var(--background) !important;
          color: var(--foreground) !important;
          font-family: 'Figtree', sans-serif !important;
        }

        .gradient-bg {
          background: linear-gradient(135deg,
              var(--background) 0%,
              oklch(0.2 0.01 60) 50%,
              var(--background) 100%) !important;
        }

        .hero-section {
          position: relative;
          min-height: 100vh;
        }

        #unicorn-studio {
          position: absolute;
          top: 10%;
          right: 5%;
          width: 1440px;
          height: 900px;
          z-index: 1;
          pointer-events: none;
          box-sizing: border-box;
          mix-blend-mode: screen;
        }

        #unicorn-studio > div {
          width: 100% !important;
          height: 100% !important;
          position: absolute;
          top: 0;
          left: 0;
          box-sizing: border-box;
          mix-blend-mode: screen;
        }

        #unicorn-studio canvas {
          background: transparent !important;
          mix-blend-mode: screen;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          padding-top: 120px;
          padding-left: 5%;
          max-width: 50%;
        }

        .glass {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: all 0.15s ease-in-out !important;
        }

        .glass:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }

        .text-gradient-primary {
          background: linear-gradient(135deg, var(--primary), var(--ring)) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        .glow {
          text-shadow: 0 0 20px oklch(0.5166 0.0931 181.0803 / 0.5) !important;
        }

        .feature-icon-primary {
          background: linear-gradient(135deg, var(--primary), var(--ring)) !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--ring)) !important;
          color: var(--primary-foreground) !important;
          border: none !important;
        }

        .btn-ghost {
          background: transparent !important;
          color: var(--foreground) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
      `}</style>

      {/* Navigation */}
      <nav className="glass fixed w-full z-50 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 feature-icon-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="font-bold text-xl" style={{color: 'var(--foreground)'}}>NetPost</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:opacity-100 opacity-70 transition" style={{color: 'var(--foreground)'}}>Features</a>
            <a href="#how-it-works" className="hover:opacity-100 opacity-70 transition" style={{color: 'var(--foreground)'}}>How It Works</a>
            <a href="#pricing" className="hover:opacity-100 opacity-70 transition" style={{color: 'var(--foreground)'}}>Pricing</a>
            <a href="#about" className="hover:opacity-100 opacity-70 transition" style={{color: 'var(--foreground)'}}>About</a>
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
          <h1 className="text-6xl md:text-8xl font-bold leading-none tracking-tight mb-8">
            <div className="text-gradient-primary">AI NATIVE</div>
            <div className="text-gradient-primary glow">CROSSLISTING</div>
          </h1>

          <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl" style={{color: 'var(--muted-foreground)'}}>
            Transform your reselling workflow with intelligent automation. List once, sell everywhere with NetPost's AI-native platform.
          </p>

          <div className="mb-16">
            <Button className="btn-primary px-10 py-4 rounded-xl text-lg font-semibold">
              Start Free Trial →
            </Button>
          </div>

          <div className="flex items-center space-x-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-primary">15+</p>
              <p className="text-sm opacity-70">Marketplaces</p>
            </div>
            <div className="h-8 w-px bg-gray-600"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-primary">Optimized</p>
              <p className="text-sm opacity-70">Auto Listing</p>
            </div>
            <div className="h-8 w-px bg-gray-600"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-primary">AI Powered</p>
              <p className="text-sm opacity-70">Customer Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{color: 'var(--foreground)'}}>
              Grow your multichannel e-commerce business
            </h2>
            <p className="text-lg max-w-2xl mx-auto opacity-80" style={{color: 'var(--muted-foreground)'}}>
              Powered by cutting-edge AI technology to maximize your selling potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass p-8 rounded-2xl">
              <div className="w-14 h-14 feature-icon-primary rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{color: 'var(--foreground)'}}>
                Bulk list on 15+ marketplaces
              </h3>
              <p className="mb-4 opacity-80" style={{color: 'var(--muted-foreground)'}}>
                Complete one form – list everywhere. Our AI automatically optimizes your listings for each platform's requirements.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass p-8 rounded-2xl">
              <div className="w-14 h-14 feature-icon-primary rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{color: 'var(--foreground)'}}>
                AI-Powered Optimization
              </h3>
              <p className="mb-4 opacity-80" style={{color: 'var(--muted-foreground)'}}>
                Generate compelling listings from just an image. Get optimal pricing suggestions based on millions of data points.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass p-8 rounded-2xl">
              <div className="w-14 h-14 feature-icon-primary rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{color: 'var(--foreground)'}}>
                Unified Dashboard
              </h3>
              <p className="mb-4 opacity-80" style={{color: 'var(--muted-foreground)'}}>
                Manage all your listings from one convenient interface. Track performance, handle orders, and sync inventory seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{color: 'var(--foreground)'}}>
              How NetPost Works
            </h2>
            <p className="text-lg max-w-2xl mx-auto opacity-80" style={{color: 'var(--muted-foreground)'}}>
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-primary/15 border-2 border-primary">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{color: 'var(--foreground)'}}>Snap or Import</h3>
              <p className="opacity-80" style={{color: 'var(--muted-foreground)'}}>
                Take a photo of your item or import existing listings from other platforms
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-primary/15 border-2 border-primary">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{color: 'var(--foreground)'}}>AI Enhancement</h3>
              <p className="opacity-80" style={{color: 'var(--muted-foreground)'}}>
                Our AI generates optimized titles, descriptions, and suggests pricing
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-primary/15 border-2 border-primary">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{color: 'var(--foreground)'}}>Cross-List</h3>
              <p className="opacity-80" style={{color: 'var(--muted-foreground)'}}>
                With one click, your item is listed across all selected marketplaces
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}