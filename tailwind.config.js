/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: '#7BAE8B',
        'sage-light': '#EAF3EE',
        'sage-mid': '#C0DBC9',
        'sage-dark': '#3A6B4A',
        blush: '#E8C5B8',
        'blush-light': '#FDF4F0',
        'blush-dark': '#8B5E52',
        sky: '#B8CDE8',
        'sky-light': '#EBF2FA',
        'sky-dark': '#3A6090',
        warm: '#E8D5B8',
        'warm-light': '#FDF7EE',
        'warm-dark': '#8B6030',
        ink: '#1F2A22',
        muted: '#5C6D63',
        hint: '#94A39A',
        surface: '#FFFFFF',
        bg: '#F7F8F6',
        border: '#E4E8E5',
      },
    },
  },
  plugins: [],
};
