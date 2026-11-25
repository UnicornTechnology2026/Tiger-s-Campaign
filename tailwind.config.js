/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff1f5',
          100: '#ffe0ea',
          400: '#ff6b9a',
          500: '#ff2e63',
          600: '#e01450',
          700: '#b90d40',
        },
        ink: { 900: '#1a0b2e', 800: '#2a1250', 700: '#3d1d73' },
      },
      boxShadow: {
        glow: '0 0 40px rgba(255, 196, 0, 0.45)',
        card: '0 20px 50px -12px rgba(26, 11, 46, 0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bulb: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        pop: 'pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shimmer: 'shimmer 3s linear infinite',
        bulb: 'bulb 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
