import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#07080c',
          50: '#f4efe6',
          100: '#e8e0d4',
          200: '#c9bfb0',
          300: '#9a9084',
          400: '#6b6560',
          500: '#4a4540',
          600: '#2e2b28',
          700: '#1c1a22',
          800: '#12141c',
          900: '#0a0b10',
          950: '#07080c',
        },
        copper: {
          DEFAULT: '#e8953a',
          light: '#f0a84a',
          dim: 'rgba(232, 149, 58, 0.15)',
        },
        parchment: '#f4efe6',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 40px -8px var(--accent-glow)',
        card: '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 48px -28px rgba(0,0,0,0.55)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.08) inset, 0 32px 64px -24px rgba(0,0,0,0.6), 0 0 0 1px var(--border-strong)',
      },
    },
  },
  plugins: [],
}
export default config
