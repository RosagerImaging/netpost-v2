"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Search,
  Settings,
  UserCircle,
  Menu,
  X,
  ChevronLeft,
  ShoppingCart,
  BarChart3,
  Bell,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Navigation, Button, Input, Badge } from "@netpost/ui";
import { cn } from "@netpost/ui";
import { FocusScope } from "@radix-ui/react-focus-scope";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    email: string;
    name?: string;
    subscription?: {
      tier: string;
      status: string;
    };
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("success");
  const [lastSyncedAt, setLastSyncedAt] = useState(() => Date.now());
  const [timeTicker, setTimeTicker] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setTimeTicker(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const relativeSyncLabel = useMemo(() => {
    const diffMs = Math.max(0, timeTicker - lastSyncedAt);
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes <= 0) {
      return "Last sync: just now";
    }

    if (diffMinutes === 1) {
      return "Last sync: 1 minute ago";
    }

    if (diffMinutes < 60) {
      return `Last sync: ${diffMinutes} minutes ago`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    return `Last sync: ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }, [timeTicker, lastSyncedAt]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!globalSearch.trim()) {
      return;
    }

    const query = globalSearch.trim();
    router.push(`/search?query=${encodeURIComponent(query)}`);
    setGlobalSearch("");
  };

  const handleManualSync = async () => {
    if (syncStatus === "syncing") {
      return;
    }

    setSyncStatus("syncing");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = Date.now();
      setLastSyncedAt(timestamp);
      setTimeTicker(timestamp);
      setSyncStatus("success");
    } catch (error) {
      console.error("Failed to sync dashboard state", error);
      setSyncStatus("error");
    }
  };

  const syncStatusLabel = syncStatus === "syncing"
    ? "Syncing..."
    : syncStatus === "error"
      ? "Sync failed"
      : "In sync";
  const isSyncing = syncStatus === "syncing";

  // Navigation items configuration
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      testId: "nav-dashboard"
    },
    {
      name: "Sourcing",
      href: "/sourcing",
      icon: Search,
      testId: "nav-sourcing"
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
      testId: "nav-inventory"
    },
    {
      name: "Listings",
      href: "/listings",
      icon: ShoppingCart,
      testId: "nav-listings"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      testId: "nav-analytics"
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      testId: "nav-settings"
    },
  ];

  const handleNavigation = (item: { href: string }) => {
    router.push(item.href);
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    // Handle sign out logic here
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo and App Name */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Package className="h-7 w-7" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }} />
          {!isSidebarCollapsed && (
            <span className="text-xl font-semibold tracking-tight text-gradient-primary">
              NetPost
            </span>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav
        className="flex-1 space-y-1 px-4 py-4 overflow-y-auto"
        aria-label="Main navigation"
        role="navigation"
      >
        <Navigation
          items={navItems}
          currentPath={pathname}
          collapsed={isSidebarCollapsed}
          onItemClick={handleNavigation}
        />
      </nav>

      {/* User Account Section */}
      <div className="mt-auto border-t border-white/10 p-4">
        {/* Subscription Status */}
        {user?.subscription && !isSidebarCollapsed && (
          <div className="mb-3 p-2 rounded-md" style={{ backgroundColor: 'oklch(0.7161 0.0091 56.2590 / 0.1)' }}>
            <div className="text-xs" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }}>Subscription</div>
            <div className="text-sm font-medium" style={{ color: 'oklch(0.9816 0.0017 247.8390)' }} data-testid="subscription-tier">
              {user.subscription.tier} Plan
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className={cn(
          "group flex items-center rounded-md p-2 text-sm font-medium hover:bg-white/5 transition-colors",
          isSidebarCollapsed ? "justify-center" : ""
        )}>
          <UserCircle className="h-8 w-8 text-secondary-text" />
          {!isSidebarCollapsed && user && (
            <div className="ml-3 flex-1">
              <p className="text-primary-text font-semibold">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="text-xs text-secondary-text">{user.email}</p>
            </div>
          )}
          {!isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <div className="absolute top-1/2 -right-3 hidden -translate-y-1/2 transform lg:block">
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="text-secondary-text flex h-6 w-6 items-center justify-center rounded-full bg-black/90 border border-white/20 hover:bg-primary-500 hover:text-white transition-colors"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isSidebarCollapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.1738_0.0026_67.6532)] via-[oklch(0.2161_0.0061_56.0434)] to-[oklch(0.1738_0.0026_67.6532)]" style={{ fontFamily: 'Figtree, ui-sans-serif, system-ui, sans-serif' }}>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Mobile Header */}
      <header
        className="glass-card sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 px-4 lg:hidden"
        role="banner"
      >
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Package className="h-6 w-6" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }} />
          <span className="text-lg font-semibold text-gradient-primary">NetPost</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={cn(
          "fixed inset-0 z-40 h-full w-full transform bg-black/60 backdrop-blur-sm lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-300 ease-in-out"
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
        role="dialog"
        aria-modal={isMobileMenuOpen}
      >
        <FocusScope asChild loop trapped>
          <aside
            id="mobile-navigation"
            className="glass-card fixed top-0 left-0 h-full w-72 max-w-[80vw] border-r border-white/10"
            onClick={(e) => e.stopPropagation()}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <h2 id="mobile-navigation-title" className="sr-only">
              Mobile navigation
            </h2>
            {sidebarContent}
          </aside>
        </FocusScope>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "glass-card relative hidden h-screen border-r border-white/10 transition-all duration-300 ease-in-out lg:block",
            isSidebarCollapsed ? "w-20" : "w-72"
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 overflow-hidden"
          role="main"
        >
          <div className="sticky top-0 z-20 hidden items-center gap-6 border-b border-white/10 bg-black/30 px-8 py-4 backdrop-blur lg:flex">
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              aria-label="Global search"
              className="flex flex-1 items-center gap-3"
            >
              <Input
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Search inventory, listings, automations..."
                className="glass-input"
                aria-label="Search NetPost"
              />
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  Operations
                </span>
                <span className="text-sm text-muted-foreground" role="status" aria-live="polite">
                  {relativeSyncLabel}
                </span>
              </div>
              <Badge variant="secondary" className="uppercase tracking-[0.3em] text-[10px]">
                Platform: eBay ✅
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-2"
                aria-live="polite"
                aria-label="Sync platform data"
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                {syncStatusLabel}
              </Button>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}