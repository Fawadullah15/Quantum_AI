
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/admin/**/*.{js,ts,jsx,tsx}',
    './components/admin/**/*.{js,ts,jsx,tsx}'
  ],
  corePlugins: {
    preflight: false,
  }
}

