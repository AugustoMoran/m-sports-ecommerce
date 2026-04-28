/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15', // main yellow — CTA bg
          500: '#EAB308', // hover
          600: '#CA8A04', // deep golden
          700: '#A16207',
          800: '#854D0E',
          900: '#1C1917', // near-black
        },
        accent: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        pearl: {
          DEFAULT: '#F5F3EE', // body bg
          dark:    '#EAE8E2', // borders / dividers
        },
        ink: {
          DEFAULT: '#0F0F0F', // near-black for text
          soft:    '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
