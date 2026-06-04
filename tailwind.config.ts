import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne','sans-serif'],
        inter: ['Inter','sans-serif'],
      },
      colors: {
        abyss: '#07070E',
        deep: '#0E0E1D',
        vault: '#161628',
        primary: { DEFAULT:'#7C3AED', l:'#A655F7' },
        ocean: { DEFAULT:'#0C4A6E', l:'#0EA5E9' },
        forest: { DEFAULT:'#022C22', l:'#065F46' },
        solar: { DEFAULT:'#78350F', l:'#FCD34D' },
        stellar: '#F0F0FA',
        muted: '#6B6B96',
        violet: '#A78BFA',
      },
    },
  },
  plugins: [],
}
export default config
