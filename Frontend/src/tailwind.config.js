/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // analiza todos los archivos en /src con estas extensiones
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primaryBlue: '#2563eb',      // azul personalizado para botones y destacados
        primaryBeige: '#f5f5dc',     // beige suave para fondos
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
