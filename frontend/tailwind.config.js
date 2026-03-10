/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Fira Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#0F172A', // Slate 900
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#1E3A8A', // Blue 900
          foreground: '#FAFAFA'
        },
        accent: {
          DEFAULT: '#CA8A04', // Yellow 600
        },
        background: '#F8FAFC', // Slate 50
        text: '#020617', // Slate 950
        muted: '#475569', // Slate 600
      },
    },
  },
  plugins: [],
}
