/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#df005c',
          hover: '#eb2671',
          active: '#b80053',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: '#ff4d4f',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: '#52c41a',
          hover: '#73d13d',
          active: '#389e0d',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#faad14',
          hover: '#ffc53d',
          active: '#d48806',
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#ff4d4f',
          hover: '#ff7875',
          active: '#d9363e',
          foreground: '#ffffff',
        },
        info: {
          DEFAULT: '#1677ff',
          hover: '#4096ff',
          active: '#0958d9',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        xs: '10px',
        sm: '12px',
        base: '13px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        'heading-1': '38px',
        'heading-2': '30px',
        'heading-3': '24px',
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        base: '6px',
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        base: '0 4px 12px rgba(0, 0, 0, 0.1)',
        secondary: '0 2px 8px rgba(0, 0, 0, 0.06)',
        primary: '0 4px 6px -1px rgba(223, 0, 92, 0.3)',
        'primary-hover': '0 6px 8px -1px rgba(223, 0, 92, 0.4)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
