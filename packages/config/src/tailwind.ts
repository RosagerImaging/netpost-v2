import type { Config } from "tailwindcss";

export const netpostTailwindConfig: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // NetPost Brand Colors
        primary: {
          50: "oklch(0.9161 0.0091 56.2590)",
          100: "oklch(0.8661 0.0091 56.2590)",
          200: "oklch(0.8161 0.0091 56.2590)",
          300: "oklch(0.7661 0.0091 56.2590)",
          400: "oklch(0.7411 0.0091 56.2590)",
          500: "oklch(0.7161 0.0091 56.2590)", // Primary Teal
          600: "oklch(0.6661 0.0091 56.2590)",
          700: "oklch(0.6161 0.0091 56.2590)",
          800: "oklch(0.5661 0.0091 56.2590)",
          900: "oklch(0.5166 0.0931 181.0803)",
        },
        accent: {
          50: "oklch(0.8755 0.0400 176.3952)",
          100: "oklch(0.7755 0.0500 176.3952)",
          200: "oklch(0.6755 0.0600 176.3952)",
          300: "oklch(0.5755 0.0650 176.3952)",
          400: "oklch(0.4755 0.0700 176.3952)",
          500: "oklch(0.3755 0.0700 176.3952)", // Secondary Stone
          600: "oklch(0.3545 0.0650 176.3952)",
          700: "oklch(0.3345 0.0600 176.3952)",
          800: "oklch(0.3145 0.0580 176.3952)",
          900: "oklch(0.3045 0.0567 176.3966)",
        },
        // Dark theme backgrounds and surfaces
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "background-dark": "oklch(0.1738 0.0026 67.6532)",
        "card-surface": "oklch(0.2161 0.0061 56.0434)",
        "accent-bg": "oklch(0.3045 0.0567 176.3966)",
        "ring-focus": "oklch(0.5166 0.0931 181.0803)",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Semantic colors
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(142, 76%, 36%)",
          foreground: "hsl(355, 7%, 97%)",
        },
        warning: {
          DEFAULT: "hsl(48, 96%, 53%)",
          foreground: "hsl(26, 83%, 14%)",
        },
        info: {
          DEFAULT: "hsl(204, 94%, 44%)",
          foreground: "hsl(0, 0%, 98%)",
        },
      },
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        // Typography scale based on front-end spec
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      spacing: {
        // 8-point grid system
        "18": "4.5rem", // 72px
        "22": "5.5rem", // 88px
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};
