# -*- coding: utf-8 -*-

PART1 = """/* ============================================================
   FLEXER EYEWEAR - Luxury Atelier White & Gold Design System
   Restrained Luxury Palette: Warm Alabaster, Pure Ivory, Champagne Gold, Deep Obsidian
   Typography: Cormorant Garamond (Editorial Serif) + Inter & Space Grotesk
   ============================================================ */

:root {
  /* Surface & Background Hierarchy (White & Gold Luxury) */
  --bg-main: #fcfbf9;
  --bg-surface: #ffffff;
  --bg-surface-raised: #f7f4ec;
  --bg-surface-alt: #f1ebd9;
  --bg-card: #ffffff;
  --bg-card-hover: #ffffff;
  --bg-stone: #ece6d8;

  /* High-Contrast Grounding (Deep Charcoal/Obsidian) */
  --bg-dark: #0e0f12;
  --bg-dark-surface: #18191d;
  --bg-dark-surface-raised: #222329;

  /* Typography Colors */
  --text-main: #141416;
  --text-muted: #5f5b53;
  --text-subtle: #8f8a7e;
  --text-dark: #121315;
  --text-white: #ffffff;
  --text-muted-on-dark: #b5b0a5;
  --text-subtle-on-dark: #7d786d;

  /* Royal Champagne Gold Accent System */
  --accent-gold: #c5a059;
  --accent-gold-hover: #d7b166;
  --accent-gold-dark: #9e7930;
  --accent-gold-light: #eed59f;
  --accent-gold-subtle: rgba(197, 160, 89, 0.08);
  --accent-gold-border: rgba(197, 160, 89, 0.35);
  --accent-gold-glow: rgba(197, 160, 89, 0.22);
  --accent-gold-gradient: linear-gradient(135deg, #dfbc77 0%, #c5a059 50%, #ad863c 100%);
  --gold-hairline: linear-gradient(90deg, transparent 0%, rgba(197, 160, 89, 0.5) 50%, transparent 100%);

  /* Borders & Dividers */
  --border-subtle: rgba(20, 20, 22, 0.08);
  --border-medium: rgba(20, 20, 22, 0.14);
  --border-strong: rgba(20, 20, 22, 0.24);
  --border-gold: rgba(197, 160, 89, 0.38);
  --border-light-on-dark: rgba(255, 255, 255, 0.08);
  --border-medium-on-dark: rgba(255, 255, 255, 0.15);

  /* Curated Range Accent Tones */
  --tier-budget: #2e7a5c;
  --tier-premium: #c5a059;
  --tier-branded: #734e94;

  /* Editorial Shadows */
  --shadow-sm: 0 2px 8px rgba(20, 20, 22, 0.03);
  --shadow-md: 0 8px 24px rgba(20, 20, 22, 0.06), 0 2px 6px rgba(197, 160, 89, 0.05);
  --shadow-card: 0 10px 30px rgba(20, 20, 22, 0.05), 0 1px 3px rgba(20, 20, 22, 0.03);
  --shadow-hover: 0 20px 48px rgba(20, 20, 22, 0.09), 0 0 24px rgba(197, 160, 89, 0.18);
  --shadow-gold: 0 10px 32px rgba(197, 160, 89, 0.32);

  /* Fonts */
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Space Grotesk', monospace, sans-serif;

  /* Layout */
  --max-w-content: 1320px;
  --max-w-narrow: 840px;
  --header-height: 76px;
  --announcement-height: 38px;
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Easing Curves */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-fast: 160ms var(--ease-out);
  --transition-smooth: 280ms var(--ease-smooth);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-main);
  color: var(--text-main);
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

::selection {
  background: var(--accent-gold-subtle);
  color: var(--accent-gold-dark);
}

a {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
}

img, video {
  display: block;
  max-width: 100%;
  height: auto;
}

ul, ol {
  list-style: none;
}

/* Custom Luxury Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-surface-raised);
}
::-webkit-scrollbar-thumb {
  background: var(--accent-gold-border);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-gold);
}

.container {
  width: 100%;
  max-width: var(--max-w-content);
  margin-left: auto;
  margin-right: auto;
  padding-left: 28px;
  padding-right: 28px;
}

.container-narrow {
  max-width: var(--max-w-narrow);
}

/* Typography Hierarchy */
.section-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent-gold-dark);
  margin-bottom: 12px;
}

.section-eyebrow::before {
  content: '';
  width: 20px;
  height: 1.5px;
  background-color: var(--accent-gold);
}

.section-title {
  font-family: var(--font-serif);
  font-size: clamp(2.2rem, 4.2vw, 3.4rem);
  font-weight: 300;
  letter-spacing: -0.01em;
  line-height: 1.12;
  text-transform: uppercase;
  color: var(--text-main);
}

.section-title strong {
  font-weight: 600;
  color: var(--accent-gold-dark);
}

.section-subtitle {
  font-size: 0.98rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 14px auto 0;
  line-height: 1.6;
}

/* ============================================================
   KEYFRAME ANIMATIONS & CREATIVE EFFECTS
   ============================================================ */
@keyframes goldGleam {
  0% { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(200%) rotate(25deg); }
}

@keyframes marqueeScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes floatBadge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.85; }
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(14px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(16px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Scroll Reveal Classes */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s var(--ease-smooth), transform 0.75s var(--ease-smooth);
  will-change: opacity, transform;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.reveal-delay-1 { transition-delay: 0.14s; }
.reveal-delay-2 { transition-delay: 0.28s; }
.reveal-delay-3 { transition-delay: 0.42s; }

/* Subtle Gold Hairline Divider */
.gold-hairline {
  height: 1px;
  width: 100%;
  background: var(--gold-hairline);
  margin: 40px 0;
}
"""
