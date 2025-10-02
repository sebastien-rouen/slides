import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  theme: {
    extend: {
      colors: {
        'octo-primary': '#FF6B35',
        'octo-secondary': '#2E3440',
        'octo-accent': '#88C0D0',
        'octo-background': '#ECEFF4',
        'octo-surface': '#FFFFFF',
        'octo-text': '#2E3440',
        'octo-text-light': '#4C566A',
        'octo-text-muted': '#81A1C1',
        'octo-success': '#A3BE8C',
        'octo-warning': '#EBCB8B',
        'octo-error': '#BF616A',
        'octo-border': '#D8DEE9',
        'octo-border-light': '#E5E9F0',
      },
      fontFamily: {
        'sans': ['Outfit', 'sans-serif'],
        'serif': ['Outfit Light', 'serif'],
        'mono': ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'octo': '0 4px 6px -1px rgba(46, 52, 64, 0.1)',
        'octo-lg': '0 10px 15px -3px rgba(46, 52, 64, 0.1)',
      }
    }
  }
})