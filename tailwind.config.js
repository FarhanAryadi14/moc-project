/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.jsx",
    "./resources/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        restaurant: {
          available: '#10b981', // Hijau
          occupied: '#f59e0b',  // Kuning
          ending: '#ef4444',    // Merah
          served: '#3b82f6',    // Biru
        }
      }
    },
  },
  plugins: [],
};
