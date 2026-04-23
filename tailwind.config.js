/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'sans-serif'] },
      colors: {
        bg: { DEFAULT: '#0f0f11', 2: '#18181c', 3: '#222228', 4: '#2c2c34' },
        accent: { DEFAULT: '#7c6af7', dark: '#5d4de6' },
        border: { DEFAULT: 'rgba(255,255,255,0.07)', 2: 'rgba(255,255,255,0.14)' },
      }
    }
  },
  plugins: []
}
