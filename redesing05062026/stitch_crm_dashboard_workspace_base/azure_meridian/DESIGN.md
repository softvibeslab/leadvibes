---
name: Azure Meridian
colors:
  surface: '#f9f9ff'
  surface-dim: '#d2daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8eeff'
  surface-container-high: '#e0e8fd'
  surface-container-highest: '#dbe2f7'
  on-surface: '#141c2b'
  on-surface-variant: '#424752'
  inverse-surface: '#283040'
  inverse-on-surface: '#ecf0ff'
  outline: '#737783'
  outline-variant: '#c3c6d4'
  surface-tint: '#255cb2'
  primary: '#003779'
  on-primary: '#ffffff'
  primary-container: '#0a4da2'
  on-primary-container: '#a6c2ff'
  inverse-primary: '#adc6ff'
  secondary: '#00687b'
  on-secondary: '#ffffff'
  secondary-container: '#00d9ff'
  on-secondary-container: '#005b6c'
  tertiary: '#00431f'
  on-tertiary: '#ffffff'
  tertiary-container: '#005d2d'
  on-tertiary-container: '#62da87'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#aeecff'
  secondary-fixed-dim: '#00d9ff'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5d'
  tertiary-fixed: '#83fba5'
  tertiary-fixed-dim: '#66dd8b'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#f9f9ff'
  on-background: '#141c2b'
  surface-variant: '#dbe2f7'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: '0'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 32px
  margin-mobile: 20px
  margin-desktop: 64px
  section-padding: 120px
---

## Brand & Style
The design system embodies "Luxury Tech meets Caribbean Light"—a synthesis of high-performance SaaS utility and the airy, luminous atmosphere of a premium tropical resort. The target audience consists of high-level professionals who value clarity, speed, and status. 

The aesthetic is **Modern Minimalist with Glassmorphic accents**. It prioritizes extreme whitespace to reduce cognitive load and leverages light-refraction metaphors to create a sense of depth and value. The UI should feel like a high-end physical object: polished, intentional, and weightless.

## Colors
The palette is rooted in the "Caribbean Light" concept, utilizing a base of high-reflectance whites and cool greys to simulate natural daylight. 

- **Primary:** A deep Professional Blue used for core actions and brand presence. 
- **Secondary (Accent):** Vibrant Cyan, reserved exclusively for high-impact focus points like active status indicators or primary call-to-action glows.
- **Surface Strategy:** Surfaces use a high-transparency white (60-80%) with a `backdrop-blur-2xl` (40px+) to maintain legibility while suggesting a glass-like material.
- **Interactive States:** Use subtle HSL shifts rather than heavy overlays to preserve the "light" feel.

## Typography
The typographic system uses a high-contrast pairing to differentiate between "Authority" and "Utility." 

- **Outfit (Headlines):** Set with tight tracking and bold weights to create a strong, geometric anchor for the page. It represents the "Tech" in "Luxury Tech."
- **Plus Jakarta Sans (Body & Labels):** Chosen for its friendly, open apertures. Body text should always feature generous line height (1.6x+) to ensure a relaxed, low-density reading experience.
- **Hierarchy:** Use significant scale jumps between headlines and body text to create a clear vertical rhythm.

## Layout & Spacing
This design system employs a **Fixed Grid** model with extreme whitespace. The goal is to make the interface feel uncrowded, even when displaying complex CRM data.

- **Grid:** A 12-column grid for desktop with wide 32px gutters to prevent information density spikes.
- **Padding:** Internal card and container padding should lean toward the larger side (min 32px) to maintain the "Luxury" feel.
- **Density:** Strictly low-density. Information should be grouped into logical "islands" of content rather than a continuous stream. 
- **Breakpoints:**
  - Desktop: 1440px+ (Center aligned)
  - Tablet: 768px - 1024px (Fluid margins)
  - Mobile: Under 768px (20px margins, stacked cards)

## Elevation & Depth
Depth is created through optical transparency and soft, colored shadows rather than grey tones.

- **Tier 1 (Base):** The background gradient.
- **Tier 2 (Cards/Surfaces):** Pure white at 70% opacity. Apply a 1px solid border at 10% opacity (Primary color tint) to define edges. Use a `40px` backdrop blur.
- **Shadows:** Use "Ambient Glows." Instead of black shadows, use low-opacity Primary or Neutral-blue shadows (e.g., `0px 20px 40px hsla(217, 89%, 36%, 0.08)`).
- **Interactions:** When an element is hovered, the opacity of the glass should increase slightly (+10%), and the shadow should expand and soften.

## Shapes
The shape language is "Organic Geometric." High border radii are used to soften the professional tone, making the software feel approachable and modern.

- **Standard Containers:** 16px radius.
- **Large Cards/Modals:** 24px radius.
- **Inputs & Buttons:** 12px radius to provide a slight contrast to the larger container shapes.
- **Icons:** Use a consistent 2px stroke width with rounded caps and joins to match the typography's soft curves.

## Components
- **Buttons:** Primary buttons use a solid Professional Blue with a subtle Cyan outer glow on hover. Text is always uppercase or semibold Plus Jakarta Sans for clarity.
- **Input Fields:** Semi-transparent glass backgrounds. On focus, the 1px border transitions from HSL 210 20% 90% to the Secondary Cyan.
- **Cards:** The core of the design system. Must have a `backdrop-blur-2xl` and a subtle 1px border. Content inside cards should have a clear hierarchy using Outfit for internal headers.
- **Chips/Badges:** Use "Soft Success" (Emerald) or "Soft Primary" with 10% background opacity and 100% foreground text opacity for a modern, flat-but-deep look.
- **Navigation:** A persistent sidebar or top bar with a 80% blur effect, making it feel like it's floating over the content. Use high-contrast charcoal for icons to ensure accessibility.
- **Lists:** High row height (64px+) with thin, subtle separators. Hover states should trigger a faint white glow rather than a dark grey highlight.