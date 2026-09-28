/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac9ff',
          300: '#8ca6ff',
          400: '#5c7aff',
          500: '#3b54f6',
          600: '#253be8',
          700: '#1d2cc4',
          800: '#1a259d',
          900: '#1b247c',
          950: '#101548',
        },
      },
    },
  },
  plugins: [],
}
