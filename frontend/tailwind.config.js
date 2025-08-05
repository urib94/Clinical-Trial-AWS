const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      // Healthcare-focused color palette
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Primary colors (medical blue)
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        // Secondary colors (healthcare teal)
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        
        // Success colors (medical green)
        success: {
          DEFAULT: '#16a34a',
          foreground: '#ffffff',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        
        // Warning colors (medical amber)
        warning: {
          DEFAULT: '#d97706',
          foreground: '#ffffff',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        
        // Error colors (medical red)
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        
        // Neutral colors with high contrast support
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
      },
      
      // Typography with Dynamic Type support
      fontSize: {
        // Base sizes that scale with user preferences
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '0.025em' }],
        '5xl': ['3rem', { lineHeight: '1.2', letterSpacing: '0.025em' }],
        
        // Medical context specific sizes
        'medical-caption': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'medical-body': ['1rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'medical-heading': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.025em', fontWeight: '600' }],
        'medical-title': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.025em', fontWeight: '700' }],
      },
      
      // Font families optimized for readability
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', ...fontFamily.sans],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', ...fontFamily.mono],
        medical: ['Inter', 'ui-sans-serif', 'system-ui', ...fontFamily.sans],
      },
      
      // Spacing system with touch-friendly sizes
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
        '144': '36rem',   // 576px
        
        // Touch-friendly spacing
        'touch-sm': '2.75rem',  // 44px minimum touch target
        'touch-md': '3rem',     // 48px comfortable touch target
        'touch-lg': '3.5rem',   // 56px large touch target
      },
      
      // Border radius for medical UI
      borderRadius: {
        'medical': '0.375rem',      // 6px - standard medical UI
        'medical-lg': '0.75rem',    // 12px - cards and containers
        'medical-xl': '1rem',       // 16px - large containers
      },
      
      // Box shadows for depth and accessibility
      boxShadow: {
        'medical-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medical-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'medical-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        
        // Focus states for accessibility
        'focus-ring': '0 0 0 3px rgba(59, 130, 246, 0.5)',
        'focus-ring-danger': '0 0 0 3px rgba(239, 68, 68, 0.5)',
        'focus-ring-success': '0 0 0 3px rgba(34, 197, 94, 0.5)',
      },
      
      // Animation for reduced motion support
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        
        // Medical context animations
        'progress-fill': 'progressFill 1s ease-out',
        'success-check': 'successCheck 0.6s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        successCheck: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Breakpoints for responsive design
      screens: {
        'xs': '360px',      // Minimum supported mobile width
        'sm': '640px',      // Large phones
        'md': '768px',      // Tablets
        'lg': '1024px',     // Small laptops
        'xl': '1280px',     // Large laptops
        '2xl': '1536px',    // Desktops
        
        // Custom breakpoints for medical UI
        'mobile': '360px',
        'tablet': '768px',
        'desktop': '1024px',
        
        // Print styles
        'print': { 'raw': 'print' },
      },
      
      // Z-index scale for layering
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // Use class-based form styling
    }),
    require('@tailwindcss/typography'),
    
    // Custom plugin for medical UI utilities
    function({ addUtilities, addComponents, theme }) {
      // Accessibility utilities
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        
        '.not-sr-only': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: '0',
          margin: '0',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        
        '.focus-visible-only': {
          '&:not(:focus-visible)': {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0',
          },
        },
        
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
        
        '.touch-target-lg': {
          minHeight: '48px',
          minWidth: '48px',
        },
        
        '.high-contrast': {
          filter: 'contrast(1.5)',
        },
        
        '.reduced-motion': {
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none !important',
            transition: 'none !important',
          },
        },
      });
      
      // Medical component styles
      addComponents({
        '.medical-card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.medical-lg'),
          boxShadow: theme('boxShadow.medical'),
          padding: theme('spacing.6'),
          border: `1px solid ${theme('colors.gray.200')}`,
        },
        
        '.medical-button': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.medical'),
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
          fontWeight: theme('fontWeight.medium'),
          minHeight: '44px',
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          transition: 'all 0.2s ease-in-out',
          
          '&:focus-visible': {
            outline: 'none',
            boxShadow: theme('boxShadow.focus-ring'),
          },
          
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
          
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
        },
        
        '.medical-input': {
          display: 'block',
          width: '100%',
          borderRadius: theme('borderRadius.medical'),
          border: `1px solid ${theme('colors.gray.300')}`,
          backgroundColor: theme('colors.white'),
          padding: theme('spacing.3'),
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
          minHeight: '44px',
          
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: theme('boxShadow.focus-ring'),
          },
          
          '&:invalid': {
            borderColor: theme('colors.destructive.500'),
            boxShadow: theme('boxShadow.focus-ring-danger'),
          },
          
          '&:disabled': {
            backgroundColor: theme('colors.gray.50'),
            color: theme('colors.gray.500'),
            cursor: 'not-allowed',
          },
        },
        
        '.medical-progress': {
          width: '100%',
          height: theme('spacing.2'),
          backgroundColor: theme('colors.gray.200'),
          borderRadius: theme('borderRadius.full'),
          overflow: 'hidden',
          
          '& .progress-fill': {
            height: '100%',
            backgroundColor: theme('colors.primary.500'),
            borderRadius: theme('borderRadius.full'),
            transition: 'width 0.3s ease-out',
            
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
            },
          },
        },
      });
    },
  ],
};