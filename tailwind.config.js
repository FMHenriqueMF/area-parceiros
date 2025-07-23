// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#004aad',
        'brand-yellow': '#ffde59',
        'accent-amber': '#f59e0b',
        'go-green': '#4ade80', // Verde vibrante (Tailwind Green 400)
                'status-orange': '#f97316', // Laranja vibrante (Tailwind Orange 500)

      }
    },
  },
  plugins: [require('@tailwindcss/line-clamp'),],
}