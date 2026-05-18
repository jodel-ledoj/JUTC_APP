/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F1115',
        surface: '#1A1D23',
        border: '#2A2F38',
        primary: '#2F80ED',
        success: '#27AE60',
        warning: '#F2C94C',
        critical: '#EB5757',
        text: '#F5F7FA',
        'text-secondary': '#D1D5DB',
        'text-muted': '#B6BDC9',
      },
    },
  },
  plugins: [],
};
