// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Vamos adicionar nossa paleta de cores aqui
      colors: {
        'brand-blue': '#004aad', // O azul da sua logo
        'brand-yellow': '#ffde59', // O amarelo da sua logo
        'accent-amber': '#f59e0b', // Um tom de âmbar mais sóbrio para detalhes
      }
    },
  },
  plugins: [],
}