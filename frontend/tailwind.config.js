/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)'
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)'
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)'
        },
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)'
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)'
        },
        success: {
          DEFAULT: 'var(--color-success)',
          foreground: 'var(--color-success-foreground)'
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          foreground: 'var(--color-warning-foreground)'
        },
        error: {
          DEFAULT: 'var(--color-error)',
          foreground: 'var(--color-error-foreground)'
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)'
        },
        /* Brand palette - Los Olivos */
        brand: {
          'dark-green': '#234b50',   /* Pantone 4188 C */
          'teal': '#1a7472',         /* Pantone 7477 C */
          'light-blue': '#477a7b',   /* Pantone 551 C */
          'mauve': '#8b3a5a',        /* Pantone 2343 C */
          'purple': '#7a4f8c',       /* Pantone 661 C */
          'lavender': '#9b7faa',     /* Pantone 667 C */
          'lilac': '#b8a0c8',        /* Pantone 521 C */
          'gradient-1a': '#234b50',
          'gradient-1b': '#182e39',
          'gradient-2a': '#477a7b',
          'gradient-2b': '#274149',
          'gradient-3a': '#a7c9d2',  /* #A7C9D2 */
          'gradient-3b': '#5f9793',
          'gradient-4a': '#a9adb9',
          'gradient-4b': '#5b132c',
          'gradient-5a': '#b771bf',
          'gradient-5b': '#712b48',
          'gradient-6a': '#77b8b8',
          'gradient-6b': '#240e36',
          'gradient-7a': '#a1b3b5',
          'gradient-7b': '#3e2285',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        heading: ['Comfortaa', 'cursive'],
        body: ['Hind Vadodara', 'sans-serif'],
        caption: ['Raleway', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        comfortaa: ['Comfortaa', 'cursive'],
        hind: ['Hind Vadodara', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
      },
      spacing: {
        '6': '0.375rem',
        '12': '0.75rem',
        '18': '1.125rem',
        '24': '1.5rem',
        '36': '2.25rem',
        '48': '3rem',
        '72': '4.5rem',
        '96': '6rem',
        '144': '9rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        'smooth': '250ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        'gradient': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in': 'slide-in 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'float-slow': 'float 20s ease-in-out infinite',
        'float-slower': 'float 25s ease-in-out infinite',
        'float-medium': 'float 18s ease-in-out infinite',
        'gradient-slow': 'gradient 15s ease infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}