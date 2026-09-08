
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        q: {
          void: 'var(--q-void)',
          bg: 'var(--q-bg)',
          'bg-2': 'var(--q-bg-2)',
          surface: 'var(--q-surface)',
          'surface-2': 'var(--q-surface-2)',
          violet: 'var(--q-violet)',
          'violet-deep': 'var(--q-violet-deep)',
          'violet-soft': 'var(--q-violet-soft)',
          silver: 'var(--q-silver)',
          white: 'var(--q-white)',
          text: 'var(--q-text)',
          muted: 'var(--q-muted)',
          subtle: 'var(--q-subtle)',
          border: 'var(--q-border)',
          'border-soft': 'var(--q-border-soft)',
          success: 'var(--q-success)',
          warning: 'var(--q-warning)',
          error: 'var(--q-error)',
          focus: 'var(--q-focus)',
        }
      },
      borderRadius: {
        'q-feature': 'var(--q-radius-feature)',
        'q-card': 'var(--q-radius-card)',
        'q-input': 'var(--q-radius-input)',
        'q-pill': 'var(--q-radius-pill)',
      },
      transitionTimingFunction: {
        'q-standard': 'var(--q-ease-standard)',
      },
      transitionDuration: {
        'q-fast': 'var(--q-motion-fast)',
        'q-base': 'var(--q-motion-base)',
        'q-slow': 'var(--q-motion-slow)',
      }
    }
  },
  corePlugins: {
    preflight: false,
  }
}

