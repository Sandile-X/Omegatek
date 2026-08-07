/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './pages/**/*.html',
    './blog/**/*.html',
    './admin/**/*.html',
    './admin/**/*.php',
    './apps/**/*.html',
    './payfast/**/*.php',
    './js/**/*.js',
    './admin/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b30ce6'
      }
    }
  },
  plugins: []
};
