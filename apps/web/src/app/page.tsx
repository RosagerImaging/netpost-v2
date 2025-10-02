"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Menu, Sparkles, Workflow, Layers, Star, BookOpen } from "lucide-react";
import { Button } from "@netpost/ui";
import { StackedAnimatedHeadline } from "../components/ui/stacked-animated-headline";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "../components/ui/sheet";

const navLinks: { label: string; href: string; icon: LucideIcon; description: string }[] = [
  {
    label: "Features",
    href: "#features",
    icon: Sparkles,
    description: "Explore platform capabilities",
  },
  {
    label: "How It Works",
    href: "#how-it-works",
    icon: Workflow,
    description: "Understand our process",
  },
  {
    label: "Pricing",
    href: "#pricing",
    icon: Layers,
    description: "Plans for every seller",
  },
  {
    label: "Testimonials",
    href: "#testimonials",
    icon: Star,
    description: "Stories from top sellers",
  },
  {
    label: "Resources",
    href: "#resources",
    icon: BookOpen,
    description: "Guides, tips & support",
  },
];

// TypeScript declaration for Unicorn Studio
declare global {
  interface Window {
    UnicornStudio: {
      isInitialized: boolean;
      init?: () => void;
    };
  }
}

export default function Home() {
  const sheetTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const hasOpenedRef = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSheetOpen) {
        event.preventDefault();
        setIsSheetOpen(false);
        sheetTriggerRef.current?.focus();
      }
    },
    [isSheetOpen]
  );

  useEffect(() => {
    if (!isSheetOpen) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, isSheetOpen]);

  useEffect(() => {
    if (isSheetOpen) {
      hasOpenedRef.current = true;
      return;
    }

    if (hasOpenedRef.current) {
      sheetTriggerRef.current?.focus();
    }
  }, [isSheetOpen]);

  // Load Unicorn Studio script
  useEffect(() => {
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.31/dist/unicornStudio.umd.js";
      script.onload = function() {
        if (!window.UnicornStudio.isInitialized && window.UnicornStudio.init) {
          window.UnicornStudio.init();
          window.UnicornStudio.isInitialized = true;
        }
      };
      (document.head || document.body).appendChild(script);
    }
  }, []);

  // Allow authenticated users to view homepage
  // Don't block homepage rendering with loading state - it should be accessible to everyone

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
          z-index: 0;
          min-height: clamp(110vh, 118vh, 132vh);
          width: 100%;
          display: flex;
          align-items: flex-end;
          overflow: visible;
          padding-top: clamp(90px, 14vh, 140px);
          padding-bottom: clamp(48px, 12vh, 160px);
        }

        .hero-shell {
          width: 100%;
          display: flex;
          justify-content: flex-start;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: clamp(1.5rem, 2.5vw, 2.75rem);
          width: min(620px, calc(100vw - clamp(3rem, 10vw, 120px)));
          margin-left: clamp(1.25rem, 7vw, 8.5rem);
          margin-bottom: clamp(2.75rem, 11vh, 6.5rem);
        }

        .hero-headline {
          font-family: 'Figtree', sans-serif !important;
          font-weight: 700 !important;
          font-size: clamp(2.6rem, 4.6vw, 5rem) !important;
          line-height: clamp(1.04, 1.4vw, 1.1) !important;
          letter-spacing: clamp(-0.022em, -0.18vw, -0.008em) !important;
          max-width: min(92vw, 48rem);
          word-break: break-word;
          text-wrap: balance;
        }

        .hero-subcopy {
          color: var(--muted-foreground) !important;
          max-width: clamp(22rem, 36vw, 34rem);
          font-size: clamp(1rem, 0.9vw + 0.75rem, 1.35rem);
          line-height: clamp(1.5, 2vw, 1.75);
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: clamp(0.75rem, 2vw, 1.25rem);
        }

        #unicorn-studio {
          position: absolute;
          top: clamp(6%, 16vh, 20%);
          right: clamp(-2%, 6vw, 10%);
          width: clamp(560px, 62vw, 1280px);
          height: clamp(520px, 78vh, 1080px);
          z-index: -1;
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
          color: var(--primary) !important; /* Fallback color */
          display: block !important;
          width: 100% !important;
        }

        .text-gradient-accent {
          background: linear-gradient(135deg, var(--accent), var(--ring)) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: var(--accent) !important;
          display: block !important;
          width: 100% !important;
        }

        /* Ensure animated text is visible */
        .stacked-animated-headline .text-gradient-primary {
          min-height: 1.2em !important;
          line-height: 1 !important;
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

        .btn-stone {
          background: linear-gradient(135deg, oklch(0.45 0.02 45), oklch(0.58 0.035 35)) !important;
          color: var(--foreground) !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          box-shadow: 0 18px 36px -20px rgba(0, 0, 0, 0.65) !important;
        }

        .btn-stone:hover {
          background: linear-gradient(135deg, oklch(0.48 0.025 45), oklch(0.61 0.04 35)) !important;
        }

        .btn-secondary {
          background: linear-gradient(135deg, var(--secondary), var(--accent)) !important;
          color: var(--foreground) !important;
          border: none !important;
        }

        .logo-text-gradient {
          background: linear-gradient(135deg, var(--primary), var(--ring)) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
        }

        @media (max-width: 1024px) {
          .hero-content {
            margin-left: clamp(1.5rem, 6vw, 6rem);
            margin-bottom: clamp(2.5rem, 10vh, 6rem);
          }

          #unicorn-studio {
            top: clamp(8%, 18vh, 24%);
            right: clamp(-4%, 4vw, 8%);
            width: clamp(520px, 70vw, 1100px);
            height: clamp(420px, 60vh, 820px);
          }
        }

        @media (max-width: 768px) {
          .hero-content {
            margin-left: 1.5rem;
            margin-right: 1.5rem;
            width: calc(100% - 3rem);
          }

          .hero-actions {
            justify-content: flex-start;
          }

          #unicorn-studio {
            top: 25%;
            right: -30%;
            width: 120vw;
            height: clamp(380px, 70vh, 680px);
            opacity: 0.6;
          }
        }

        @media (max-width: 480px) {
          .hero-content {
            margin-left: 1.25rem;
            margin-right: 1.25rem;
            margin-bottom: clamp(2rem, 12vh, 4.5rem);
          }

          .hero-actions {
            width: 100%;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="glass fixed top-0 w-full z-50">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 feature-icon-primary rounded-2xl flex items-center justify-center shadow-[0_18px_32px_-20px_rgba(0,0,0,0.65)]">
              <span className="text-white font-semibold text-2xl">N</span>
            </div>
            <span className="font-bold text-xl md:text-2xl logo-text-gradient">
              NetPost
            </span>
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center">
            <ul className="flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a className="opacity-75 transition hover:opacity-100" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Button className="btn-stone px-6 py-2 rounded-lg font-medium" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button className="btn-primary px-6 py-2 rounded-lg font-semibold" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <Button className="btn-stone px-5 py-2 rounded-lg font-medium hidden sm:flex" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <button
                  ref={sheetTriggerRef}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[var(--foreground)] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-xs bg-[var(--background)]">
                <div className="flex items-center justify-between pb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 feature-icon-primary rounded-xl flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">N</span>
                    </div>
                    <span className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                      NetPost
                    </span>
                  </div>
                </div>

                <nav className="flex flex-col gap-4 text-base font-medium" style={{ color: 'var(--foreground)' }}>
                  {navLinks.map(({ href, label, icon: Icon, description }) => (
                    <SheetClose asChild key={href}>
                      <Link
                        className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-white/10 hover:bg-white/5"
                        href={href}
                      >
                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[var(--foreground)] transition group-hover:bg-white/10">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-semibold">{label}</span>
                          <span className="text-sm opacity-70">{description}</span>
                        </span>
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="mt-8 flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button className="btn-stone w-full px-6 py-3 rounded-lg font-medium" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button className="btn-primary w-full px-6 py-3 rounded-lg font-semibold" asChild>
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Unicorn Studio Shader Container */}
        <div id="unicorn-studio">
          <div data-us-project="7f0drgFbmWvRGUypjDmw" style={{width:'1440px', height: '900px'}}></div>
        </div>

        {/* Hero Content */}
        <div className="hero-shell">
          <div className="hero-content">
            <h1 className="hero-headline overflow-hidden">
              <StackedAnimatedHeadline
                lines={["AI DRIVEN", "CROSSLISTING"]}
                gradientLine={0}
                className="hero-headline"
              />
            </h1>

            <p className="hero-subcopy">
              AI-native workflows save you hours every week.<br />
              Less busywork means more listings and more sales.
            </p>

            <div className="hero-actions">
              <Button className="btn-primary px-8 py-3 rounded-xl text-base md:text-lg font-semibold">
                Start Free Trial
              </Button>
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