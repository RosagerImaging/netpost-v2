import * as React from "react";
import { cn } from "../lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  testId?: string;
}

interface NavigationProps {
  items: NavigationItem[];
  currentPath?: string;
  className?: string;
  collapsed?: boolean;
  onItemClick?: (item: NavigationItem) => void;
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ items, currentPath, className, collapsed = false, onItemClick }, ref) => {
    return (
      <nav ref={ref} className={cn("space-y-1", className)}>
        {items.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== "/" && currentPath?.startsWith(item.href));

          return (
            <button
              key={item.href}
              data-testid={item.testId}
              onClick={() => onItemClick?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onItemClick?.(item);
                }
              }}
              className={cn(
                "group text-secondary-text relative flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out hover:text-primary-500 w-full text-left",
                isActive && "text-primary-500 bg-primary-500/10",
                collapsed ? "justify-center" : ""
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? item.name : undefined}
              role="link"
            >
              {/* Glow effect for active/hover states */}
              <span
                className={cn(
                  "absolute inset-0 rounded-md bg-primary-500/10 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100",
                  isActive && "opacity-100"
                )}
              />

              {item.icon && (
                <item.icon
                  className={cn("h-5 w-5 relative z-10", !collapsed && "mr-3")}
                />
              )}

              {!collapsed && (
                <span className="relative z-10 flex-1">{item.name}</span>
              )}

              {/* Badge */}
              {!collapsed && item.badge && (
                <span className="relative z-10 ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-500 rounded-full">
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed sidebar */}
              {collapsed && (
                <span className="text-primary-text absolute left-full ml-4 hidden -translate-y-1/2 rounded-md bg-gray-800 px-2 py-1 text-xs font-medium group-hover:block whitespace-nowrap z-20">
                  {item.name}
                  {item.badge && ` (${item.badge})`}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    );
  }
);

Navigation.displayName = "Navigation";

export { Navigation, type NavigationItem };