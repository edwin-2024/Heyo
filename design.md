# Heyo — Design System Specification

This document details the visual identity, tokens, component library, motion language, and typography for **Heyo** (v1).

---

## 1. Brand Philosophy & Core Identity

Heyo is an Intercom-style customer support platform with real-time live chat, Step 3 intent guardrails, and knowledge-grounded AI support agents.

The visual aesthetic follows a **liquid-metal / liquid-glass** dark mode design language:
- **Zero-flash absolute black canvas (`#000000`)**: The application immediately forces `#000000` background to prevent flash of white (FOUC).
- **Subtle Organic Grain**: Fixed non-blocking SVG turbulence noise overlay (`opacity: 0.035`) layered at `z-index: 100` to give depth to deep blacks.
- **Atmospheric Video Canvas**: Atmospheric looping video behind a dark radial vignette scrim.
- **Frosted Liquid Glass Surfaces**: Gradient borders, backdrop blurs, and metallic reflections on interactive pills and buttons.
- **Editorial Contrast Typography**: Clean modern grotesque sans-serif (`Inter`) contrasted with high-elegance editorial serif italic (`Instrument Serif`).

---

## 2. Color Palette & Surface Tokens

| Token | CSS Value / Variable | Purpose / Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `var(--bg)` / `#000000` | True black base surface for the entire viewport. |
| **Primary Text** | `var(--text)` / `#ffffff` | Primary headings, active labels, brand logo. |
| **Muted Text / Editorial Accent** | `var(--muted)` / `#9a9a9a` | Subheadlines, secondary descriptions, editorial italic highlights. |
| **Stat / Secondary Text** | `var(--stat)` / `#d8d8d8` | Metrics, footer labels, neutral icons. |
| **Primary Border** | `var(--border)` / `rgba(255, 255, 255, 0.16)` | Outer bounds for liquid glass cards and pill containers. |
| **Soft Border** | `var(--border-soft)` / `rgba(255, 255, 255, 0.12)` | Subtle separators and secondary outlines. |

---

## 3. Typography Hierarchy

### Font Families
1. **Primary Interface Font**: `Inter` (sans-serif)
   - Fallbacks: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
   - Loaded via `next/font/google` (`--font-inter`) with `display: swap`.
2. **Editorial Italic Display**: `Instrument Serif` (italic, 400 weight)
   - Fallbacks: `"Times New Roman", Times, serif`
   - Loaded via `next/font/google` (`--font-instrument-serif`).
   - Reserved strictly for designated emphasis words in hero headlines (e.g., *AI agents*).

### Scale & Letter-Spacing
- **H1 Headline**: `var(--h1)` (48px at base desktop, scaling up to 76px–88px on large screens, 34px–36px on mobile), `font-weight: 500`, `letter-spacing: -0.045em`, `line-height: 1.12`.
- **Editorial Emphasis (`em`)**: Instrument Serif Italic, `font-size: 1.08em`, `letter-spacing: -0.03em`, color `#9a9a9a`.
- **Lede / Subhead**: `var(--lede)` (15.5px default), `font-weight: 400`, `line-height: 1.55`, `letter-spacing: -0.015em`, color `#9a9a9a`.
- **Navigation**: `var(--nav)` (14px default), `letter-spacing: -0.01em`.
- **Buttons / Actions**: `var(--btn)` (13.5px default), `font-weight: 500`, `letter-spacing: -0.02em`.
- **Badge**: `var(--badge)` (12.5px default), `letter-spacing: -0.01em`, color `#f2f2f2`.
- **Stats**: `var(--stat-size)` (13.5px default), `letter-spacing: -0.015em`, color `#d8d8d8`.

---

## 4. UI Components (Evolved Shadcn UI)

Heyo builds directly upon **Shadcn UI** primitives (`class-variance-authority` + `@radix-ui/react-slot`) in `src/components/ui/`:

### 1. `Button` (`src/components/ui/button.tsx`)
Standard Radix slot-compatible button enriched with liquid-metal / liquid-glass variants:
- **`variant="solid"`**:
  - High-contrast pure white-to-silver gradient (`linear-gradient(180deg, #ffffff 0%, #e7e7e7 48%, #cfcfcf 100%)`).
  - Inner white inset highlight (`inset 0 1px 0 rgba(255,255,255,0.95)`).
  - Hover: Subtle icy blue cast with an atmospheric outer glow (`0 0 26px rgba(186,208,255,0.4)`).
  - Shimmer pseudo-element sweep on hover (`.btn-shine`).
- **`variant="liquidGhost"`**:
  - Frosted translucent glass (`linear-gradient(135deg, rgba(255,255,255,0.12), rgba(0,0,0,0.5) 46%, rgba(150,170,200,0.1))`).
  - `backdrop-filter: blur(16px)` with soft metallic border (`rgba(198,198,198,0.55)`).
  - Hover glow: `0 0 24px rgba(170,200,255,0.28)`.
- **`variant="liquidPill"`**:
  - Pill navigation items with dark metal gradient (`linear-gradient(105deg, #050505 0%, #2a2a2a 48%, #4a4a4a 100%)`).
  - Dynamic sheen traversal on hover (`.nav-pill-shine`).

### 2. `Badge` (`src/components/ui/badge.tsx`)
- **`variant="liquidBadge"`**:
  - Pill badge with linear graphite gradient (`linear-gradient(90deg, #7d7d7d 0%, #2a2a2a 52%, #0a0a0a 100%)`).
  - Paired with an illuminated sparkle icon and subtle drop shadow.

---

## 5. Motion & Orchestration

The design system incorporates cubic-bezier entrance motion with zero-flash fallback:

### Easing Function
`cubic-bezier(0.16, 1, 0.3, 1)` (ultra-smooth decelerating spring-like curve).

### Choreography Timings
| Phase / Element | Target Class | Delay (`--d`) | Duration | Keyframe |
| :--- | :--- | :--- | :--- | :--- |
| Brand Logo | `.appear--scale` | `0.08s` | 1.05s | `in-scale` (`0.84 -> 1.0`) |
| Nav Benefits | `.appear--scale` | `0.16s` | 1.05s | `in-scale` |
| Nav Guardrails | `.appear--soft` | `0.28s` | 1.05s | `in-soft` (`translateY(14px) -> 0`) |
| Nav Architecture | `.appear--scale` | `0.40s` | 1.05s | `in-scale` |
| Nav Pricing | `.appear--soft` | `0.52s` | 1.05s | `in-soft` |
| Header Action CTA | `.appear--scale` | `0.34s` | 1.05s | `in-scale` |
| Hero Feature Badge | `.appear--pop` | `0.22s` | 1.05s | `in-pop` (`0.9 -> 1.03 -> 1.0`) |
| Badge Sparkle Star | `.badge-star` | `0.28s` | 0.90s | `in-star` (`scale(0.2) rot(-50deg) -> rot(8deg) -> 0deg`) |
| Headline Line 1 | `.appear--mask` | `0.42s` | 1.05s | `in-mask` (`translateY(40%) -> 0`) |
| Headline Line 2 | `.appear--mask` | `0.62s` | 1.05s | `in-mask` (`translateY(40%) -> 0`) |
| Editorial Serif Highlight | `.hero-serif-em` | `0.72s` | 1.20s | `in-em` (`blur(4px) -> blur(0)`) |
| Lede Paragraph | `.appear--soft` | `0.82s` | 1.25s | `in-soft` |
| Primary CTA | `.appear--btn` | `0.96s` | 1.05s | `in-btn` (`translateY(18px) scale(0.94) -> 1`) |
| Secondary CTA | `.appear--side` | `1.10s` | 1.05s | `in-side` (`translateX(22px) -> 0`) |
| Stat 1 (Support Queries) | `.appear--stat` | `1.12s` | 1.05s | `in-stat` (`translateY(20px) -> 0`) |
| Stat 2 (Latency Deflection)| `.appear--stat` | `1.28s` | 1.05s | `in-stat` |
| Stat 3 (Teams Onboarded)| `.appear--stat` | `1.44s` | 1.05s | `in-stat` |

### Resilience & Accessibility
- **CSS Default Resting State**: Resting opacity is `1`. Elements never stay blank if scripts are disabled or animations fail.
- **Post-animation State**: `.is-in` class unlocks CSS transformations after `animationend`.
- **Double rAF Fallback**: If browser background tab throttling prevents animations from running, all `.appear` elements immediately transition to `.is-in`.
- **`prefers-reduced-motion: reduce`**: Transitions and animations are disabled, immediately rendering all content at final rest state.

---

## 6. Viewport Adaptability & Layout Rules

1. **Desktop Viewports (≥901px)**:
   - Fixed single-viewport framing (`html, body { height: 100%; overflow: hidden }`).
   - Page container layout: `grid-template-rows: auto 1fr auto; height: 100vh / 100dvh`.
   - Hero copy is **bottom-aligned** (`align-items: flex-end`) with bottom padding controlled by `--hero-gap`.
2. **Mobile & Tablet Devices (≤900px)**:
   - Fluid scroll unlocked (`html, body { height: auto; overflow-y: auto }`).
   - Header shifts to `grid-template-columns: 1fr auto auto`.
   - Full-screen glass drawer navigation activated with backdrop blur (`24px blur`) and hamburger toggle.
   - Stats footer reformats to a vertical column with safe-area bottom inset padding.
