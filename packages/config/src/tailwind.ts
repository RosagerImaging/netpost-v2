import type { Config } from "tailwindcss";

export const netpostTailwindConfig: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // NetPost V2 Brand Colors
        primary: {
          50: "#e6f8ff",
          100: "#b3efff",
          200: "#80e6ff",
          300: "#4dddff",
          400: "#1ad4ff",
          500: "#00BFFF", // DeepSkyBlue - Primary
          600: "#0099cc",
          700: "#007399",
          800: "#004d66",
          900: "#002633",
        },
        accent: {
          50: "#fffdf0",
          100: "#fffad1",
          200: "#fff7a3",
          300: "#fff374",
          400: "#fff046",
          500: "#FFD700", // Gold - Accent
          600: "#ccac00",
          700: "#998100",
          800: "#665600",
          900: "#332b00",
        },
        // Dark theme backgrounds and surfaces
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        sans: ["Inter", "ui-sans-serif", "system-ui"],
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