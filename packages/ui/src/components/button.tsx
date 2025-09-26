import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 shadow-md",
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 shadow-md",
        glass:
          "glass-button text-foreground hover:text-primary",
        success:
          "bg-success text-success-foreground hover:bg-success/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 shadow-md",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 shadow-md",
        info:
          "bg-info text-info-foreground hover:bg-info/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onKeyDown, onClick, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle space and enter key presses for accessibility
      if (event.key === " " || event.key === "Enter") {
        // Prevent default space behavior (scrolling) for buttons
        if (event.key === " ") {
          event.preventDefault();
        }

        // If there's an onClick handler, call it
        if (onClick && !props.disabled) {
          onClick(event as any); // Cast since KeyboardEvent and MouseEvent are compatible for our use
        }
      }

      // Call the original onKeyDown if provided
      onKeyDown?.(event);
    };

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onKeyDown={asChild ? onKeyDown : handleKeyDown}
        onClick={onClick}
        tabIndex={props.disabled ? -1 : 0}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };