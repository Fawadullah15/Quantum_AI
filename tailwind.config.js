/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/admin/**/*.{js,ts,jsx,tsx}',
    './components/admin/**/*.{js,ts,jsx,tsx}',
    './app/quantumbot/**/*.{js,ts,jsx,tsx}',
    './components/bot/**/*.{js,ts,jsx,tsx}',
  ],
  corePlugins: {
    preflight: false,
  },
};
