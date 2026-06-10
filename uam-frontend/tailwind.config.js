/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        cyber: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          200: "#c7d7fe",
          300: "#a5b8fd",
          400: "#818ef9",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        dark: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          850: "#172033",
          900: "#0f172a",
          950: "#080d18",
        },
      },
      backgroundImage: {
        "cyber-grid": "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.25), transparent)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease",
        "slide-up": "slideUp 0.3s cubic-bezier(.4,0,.2,1)",
        "slide-in-right": "slideInRight 0.3s cubic-bezier(.4,0,.2,1)",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideInRight: { from: { opacity: 0, transform: "translateX(24px)" }, to: { opacity: 1, transform: "translateX(0)" } },
      },
      boxShadow: {
        "cyber": "0 0 0 1px rgba(99,102,241,0.3), 0 4px 20px rgba(99,102,241,0.15)",
        "cyber-lg": "0 0 0 1px rgba(99,102,241,0.4), 0 8px 40px rgba(99,102,241,0.2)",
        "glow-sm": "0 0 12px rgba(99,102,241,0.4)",
        "glow-md": "0 0 24px rgba(99,102,241,0.3)",
      },
    },
  },
  plugins: [],
};
