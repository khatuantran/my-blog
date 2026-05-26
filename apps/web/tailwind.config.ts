import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // dark-only theme; class on <html>
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1100px',
      '2xl': '1280px',
      // v2 sub-breakpoints (M11.7) — max-width tier cho design v2 5-step compress.
      'mx-980': { max: '980px' },
      'mx-760': { max: '760px' },
      'mx-640': { max: '640px' },
      'mx-480': { max: '480px' },
      'mx-420': { max: '420px' },
    },
    extend: {
      colors: {
        // Background layers
        bg: '#0A0E1A',
        surf: '#11151F',
        elev: '#1A1F2E',
        over: '#232936',
        // Borders
        b1: '#1F2A3A',
        b2: '#2A3548',
        b3: '#3D4A63',
        // Text
        tp: '#E6EDF3',
        ts: '#A0AEC0',
        tm: '#8B96AA',
        td: '#566176',
        // 8 accents
        cyan: '#00FFE5',
        mag: '#FF6E96',
        pur: '#BB9AF7',
        grn: '#9ECE6A',
        yel: '#E0AF68',
        ora: '#FF9E64',
        red: '#F7768E',
        blu: '#7DCFFF',
      },
      fontFamily: {
        brand: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // mono variants (JetBrains Mono)
        'mono-tiny': ['8px', { lineHeight: '1.3' }],
        'mono-xs': ['9px', { lineHeight: '1.3' }],
        'mono-sm': ['11px', { lineHeight: '1.4' }],
        mono: ['12px', { lineHeight: '1.5' }],
        'mono-md': ['13px', { lineHeight: '1.5' }],
        'mono-lg': ['14px', { lineHeight: '1.6' }],
        // Inter base body/caption
        small: ['13px', { lineHeight: '1.5' }],
        body: ['15px', { lineHeight: '1.65' }],
        // Inter input variant (T-360 v2.1)
        'input-hero': ['18px', { lineHeight: '1.4' }],
        // Heading scale (Space Grotesk for h1/h2 + display, Inter for h3)
        h3: ['14px', { lineHeight: '1.4', fontWeight: '600' }],
        h2: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        h1: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'h1-hero': ['26px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['24px', { lineHeight: '1', fontWeight: '700' }],
        display: ['28px', { lineHeight: '1', fontWeight: '700' }],
        'display-glyph': ['40px', { lineHeight: '1', fontWeight: '700' }],
      },
      letterSpacing: {
        // T-360 — DESIGN_SYSTEM Typography section labels + table headers
        'wide-1': '0.05em',
        'wide-2': '0.06em',
        'wide-3': '0.08em',
      },
      lineHeight: {
        // T-360 — DESIGN_SYSTEM micro typography (bio / sidebar / mini sparkline)
        'relaxed-1': '1.75',
        'relaxed-2': '1.8',
        'relaxed-3': '1.9',
      },
      zIndex: {
        // T-360 — DESIGN_SYSTEM Z-index scale L147 (synced với :root vars in globals.css)
        base: 'var(--z-base)',
        popover: 'var(--z-popover)',
        'popover-2': 'var(--z-popover-2)',
        subbar: 'var(--z-subbar)',
        topbar: 'var(--z-topbar)',
        dropdown: 'var(--z-dropdown)',
        modal: 'var(--z-modal)',
        'modal-stacked': 'var(--z-modal-stacked)',
        lightbox: 'var(--z-lightbox)',
        'dev-tweaks': 'var(--z-dev-tweaks)',
      },
      spacing: {
        '1.5': '6px',
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,.05)',
        md: '0 4px 12px rgba(0,0,0,.08)',
        lg: '0 12px 32px rgba(0,0,0,.4)',
        // T-360 Shadow recipes — DESIGN_SYSTEM L163
        // Cyan glow scale (4 tiers per spec)
        'glow-cyan-xs': '0 0 7px rgba(0, 255, 229, 0.5)',
        'glow-cyan-sm': '0 0 12px rgba(0, 255, 229, 0.18)',
        'glow-cyan-md': '0 0 22px rgba(0, 255, 229, 0.12)',
        'glow-cyan-lg': '0 0 45px rgba(0, 255, 229, 0.12), 0 4px 24px rgba(0, 0, 0, 0.3)',
        // Backward-compat (pre-T-360 callsites)
        'glow-cyan-xl': '0 0 40px rgba(0,255,229,.22), 0 8px 32px rgba(0,0,0,.4)',
        // Per-color glow-md — ReactionPicker hover, mood badge, tag color hover
        'glow-mag-md': '0 0 12px rgba(255, 110, 150, 0.5)',
        'glow-pur-md': '0 0 12px rgba(187, 154, 247, 0.5)',
        'glow-grn-md': '0 0 12px rgba(158, 206, 106, 0.5)',
        'glow-yel-md': '0 0 12px rgba(224, 175, 104, 0.5)',
        'glow-ora-md': '0 0 12px rgba(255, 158, 100, 0.5)',
        'glow-red-md': '0 0 12px rgba(247, 118, 142, 0.5)',
        'glow-blu-md': '0 0 12px rgba(125, 207, 255, 0.5)',
        // Drop shadow scale
        'drop-sm': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'drop-md': '0 12px 40px rgba(0, 0, 0, 0.55)',
        'drop-lg': '0 20px 56px rgba(0, 0, 0, 0.7)',
        'drop-xl': '-20px 0 60px rgba(0, 0, 0, 0.8)',
        // Compound modal recipe (glow-cyan-lg + drop-lg)
        stack:
          '0 0 45px rgba(0, 255, 229, 0.12), 0 4px 24px rgba(0, 0, 0, 0.3), 0 20px 56px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        glitch: 'glitch 8s infinite',
        'pulse-status': 'pulse-status 2s ease-in-out infinite',
        blink: 'blink 530ms step-start infinite',
        shake: 'shake 400ms ease',
        'scan-card': 'scan-card 4s linear infinite',
        'border-rotate': 'borderRotate 8s linear infinite',
        'live-dot': 'liveDot 1.5s ease-in-out infinite',
        'slide-in': 'slideIn 250ms ease',
        'slide-down': 'slideDown 200ms ease',
        'cursor-blink': 'cursorBlink 1s steps(2) infinite',
        // fade-up split 5 variants (T-361 — DESIGN_SYSTEM Motion table)
        'fade-up-xs': 'fade-up 120ms ease', // picker, dropdown small
        'fade-up-sm': 'fade-up 150ms ease', // default modal
        'fade-up': 'fade-up 200ms ease', // DeleteConfirm (was 300ms generic)
        'fade-up-md': 'fade-up 250ms ease', // drawer
        'fade-up-lg': 'fade-up 350ms ease', // Login card
      },
      keyframes: {
        glitch: {
          '0%, 87%, 100%': { textShadow: 'none', transform: 'none' },
          '88%': {
            textShadow: '2px 0 #FF6E96, -2px 0 #00FFE5',
            transform: 'skewX(-2deg) translateX(-2px)',
          },
          '90%': {
            textShadow: '-2px 0 #BB9AF7, 2px 0 #FF9E64',
            transform: 'skewX(1deg) translateX(1px)',
          },
          '92%': { textShadow: 'none', transform: 'none' },
        },
        'scan-card': {
          '0%': { top: '-100%' },
          '100%': { top: '200%' },
        },
        'pulse-status': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 6px #50FA7B)' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 2px #50FA7B)' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '50.01%, 100%': { opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        borderRotate: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        liveDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
