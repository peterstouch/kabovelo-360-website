/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './src/**/*.{html,js,css}', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0C0B',
        tacticalBlack: '#121513',
        charcoalCard: '#1A1E1B',
        charcoalBorder: '#2E352F',
        armyGreenDark: '#2C3A25',
        armyGreen: '#3B4E32',
        armyGreenMedium: '#4A633D',
        armyGreenBright: '#6E915B',
        armyGreenLight: '#8BAE77',
        greyLight: '#D1D5DB',
        greyMuted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Cinzel"', 'serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 4s infinite alternate',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%': { opacity: '0.3', filter: 'blur(20px)' },
          '100%': { opacity: '0.7', filter: 'blur(35px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
