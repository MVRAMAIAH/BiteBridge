/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        spice: {
          50: '#fffbf0',
          100: '#fef3d6',
          200: '#fce3a8',
          300: '#fbcd70',
          400: '#f9ac3c',
          500: '#f78a15',
          600: '#e16b0b',
          700: '#bb4e0c',
          800: '#943c0f',
          900: '#7a3110',
          950: '#431705',
        },
        cardamom: {
          50: '#f2f8f3',
          100: '#e1ede3',
          200: '#c5dbc9',
          300: '#9bbf9f',
          400: '#6c9c73',
          500: '#4c7f53',
          600: '#3a6640',
          700: '#305234',
          800: '#28422c',
          900: '#223826',
        }
      },
    },
  },
  plugins: [],
}
