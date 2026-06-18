/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#fbf3e4',
        surface: '#fffcf6',
        primary: '#e8643c',
        amber: '#f2a03d',
        ink: '#3a2a24',
        muted: '#a1907f',
        subtle: '#7e7064',
        'category-indoor': '#e8643c',
        'category-outdoor': '#7a9a52',
        'category-sport': '#f2a03d',
        'category-relaxation': '#6f94a8',
        'category-party': '#d1688a',
        'category-culture': '#9b72cf',
        'category-food': '#c98a3a',
        success: '#7a9a52',
        danger: '#c9533a',
      },
      borderRadius: {
        sm: 10,
        md: 14,
        lg: 18,
        xl: 24,
        full: 999,
      },
      fontFamily: {
        display: ['Baloo2_700Bold'],
        'display-extrabold': ['Baloo2_800ExtraBold'],
        body: ['Nunito_400Regular'],
        'body-semibold': ['Nunito_600SemiBold'],
        'body-bold': ['Nunito_700Bold'],
        'body-extrabold': ['Nunito_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
