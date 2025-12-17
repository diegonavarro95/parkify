/** @type {import('tailwindcss').Config} */
export default {
  // 👇 ESTA LÍNEA ES LA MÁS IMPORTANTE
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ... (tus colores brand y dark que pusimos antes)
        brand: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a' },
        dark: { bg: '#0f172a', card: '#1e293b', text: '#f8fafc' }
      },
      keyframes: {
        'scan-line': {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      },
      animation: {
        'scan': 'scan-line 2.5s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      }
    },
  },
  plugins: [],
}