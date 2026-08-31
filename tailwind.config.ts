import type { Config } from "tailwindcss";

// Enables `bg-surface-container/40`-style opacity modifiers on CSS-variable
// colors. Tailwind can only do this automatically for literal hex/rgb values
// in the config, not for `var(--x)` references — so each variable is stored
// as an "R G B" channel triplet and wrapped with rgb(var(--x) / alpha) here.
function withOpacity(variableName: string) {
  return ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue !== undefined ? `rgb(var(${variableName}) / ${opacityValue})` : `rgb(var(${variableName}))`;
}

const colorTokens = {
  // legacy nested tokens — kept so every page built before the redesign
  // (bg-primary, bg-primary-soft, dark:bg-primary-dark, etc.) keeps working.
  // Values refreshed to match the "Academic Emerald" reference palette.
  primary: {
    DEFAULT: "#2d7a4d",
    hover: "#215c39",
    soft: "#dff5e6",
    dark: "#8ad7a2",
    darkHover: "#a5f4bc",
    darkSoft: "#17301f",
  },
  // new tokens (see globals.css) — auto-adapt to light/dark with no
  // `dark:` prefix, and support opacity modifiers via withOpacity().
  background: withOpacity("--background"),
  "on-background": withOpacity("--on-background"),
  surface: withOpacity("--surface"),
  "surface-dim": withOpacity("--surface-dim"),
  "surface-bright": withOpacity("--surface-bright"),
  "surface-container-lowest": withOpacity("--surface-container-lowest"),
  "surface-container-low": withOpacity("--surface-container-low"),
  "surface-container": withOpacity("--surface-container"),
  "surface-container-high": withOpacity("--surface-container-high"),
  "surface-container-highest": withOpacity("--surface-container-highest"),
  "on-surface": withOpacity("--on-surface"),
  "on-surface-variant": withOpacity("--on-surface-variant"),
  outline: withOpacity("--outline"),
  "outline-variant": withOpacity("--outline-variant"),
  secondary: withOpacity("--secondary"),
  "secondary-container": withOpacity("--secondary-container"),
  "on-secondary-container": withOpacity("--on-secondary-container"),
  tertiary: withOpacity("--tertiary"),
  "tertiary-container": withOpacity("--tertiary-container"),
  "on-tertiary-container": withOpacity("--on-tertiary-container"),
  error: withOpacity("--error"),
  "error-container": withOpacity("--error-container"),
  "on-error-container": withOpacity("--on-error-container"),
} as const;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: colorTokens as any,
      fontFamily: {
        display: ["'Libre Caslon Text'", "Georgia", "serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
