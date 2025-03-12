/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: '#F15A29', // Innovera orange (was #E6007E)
          'primary-dark': '#D94315', // Darker shade for hover states
          secondary: '#1A1F2E', // Dark blue/gray for text
          background: {
            light: '#FFFFFF',
            secondary: '#F8F9FA'
          },
          text: {
            primary: '#1A1F2E',
            secondary: '#6C757D',
            light: '#FFFFFF'
          },
          border: {
            light: '#E9ECEF',
            medium: '#CCCCCC', // Darker border color (was #DEE2E6)
            dark: '#BBBBBB'    // Even darker border for emphasis
          }
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
        },
        borderRadius: {
          'lg': '0.5rem',
          'md': '0.375rem', 
        },
        boxShadow: {
          'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'md': '0 4px 6px rgba(0, 0, 0, 0.1)', // Enhanced shadow
          'card': '0 4px 6px rgba(0, 0, 0, 0.1)', // Enhanced shadow
          'elevated': '0 6px 8px rgba(0, 0, 0, 0.12)' // Even stronger shadow for emphasis
        },
        borderWidth: {
          DEFAULT: '1px',
          '0': '0',
          '2': '2px',
          '3': '3px',
          '4': '4px',
        },
        keyframes: {
          bounce: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-5px)' }
          },
          pulse: {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 }
          },
          spin: {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        },
        animation: {
          bounce: 'bounce 1s ease-in-out infinite',
          pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          spin: 'spin 1s linear infinite'
        }
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
  }