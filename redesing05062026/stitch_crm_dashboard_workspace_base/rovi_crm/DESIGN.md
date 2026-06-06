---
name: Rovi CRM
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbc9ce'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#859398'
  outline-variant: '#3c494d'
  surface-tint: '#00d9ff'
  primary: '#afecff'
  on-primary: '#003641'
  primary-container: '#00d9ff'
  on-primary-container: '#005b6c'
  inverse-primary: '#00687b'
  secondary: '#b3c5ff'
  on-secondary: '#002b75'
  secondary-container: '#0266ff'
  on-secondary-container: '#f9f7ff'
  tertiary: '#f0dbff'
  on-tertiary: '#490080'
  tertiary-container: '#ddb8ff'
  on-tertiary-container: '#7716c5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#aeecff'
  primary-fixed-dim: '#00d9ff'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5d'
  secondary-fixed: '#dae1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#001849'
  on-secondary-fixed-variant: '#003fa4'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb7ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6900b3'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for the high-end real estate market of the Riviera Maya, blending the precision of a futuristic CRM with the organic luxury of a tropical paradise. It targets high-performing brokers and luxury developers who require a tool that feels as premium as the properties they represent.

The visual style is **Luxury Glassmorphism**. It utilizes deep obsidian surfaces, ultra-refined frosted glass effects, and vibrant neon accents to create a "Neural-Tropical" aesthetic. The interface should evoke a sense of "visual pleasure" through high-fidelity blurs, subtle glow effects, and a spacious, intuitive layout that feels both technologically advanced and welcoming.

## Colors

This design system utilizes a sophisticated dark-mode-first palette. The base background is a deep, atmospheric Navy (HSL 222, 47%, 11%) enhanced with a subtle noise texture to prevent banding in gradients.

- **Primary (Cyan):** Used for high-priority actions, data highlights, and active states.
- **Secondary (Blue):** Supporting brand color for structural elements and steady-state icons.
- **Tertiary (Purple):** Used for "Neural" moments—AI insights, premium features, and status transitions.
- **Glass Surfaces:** Cards and modals use a 5% white opacity layer with a heavy backdrop blur to create depth without losing the background's richness.

## Typography

The typography strategy balances high-impact display faces with exceptionally legible body text. 

**Outfit** is reserved for headlines and large display numbers (prices, property titles). It must always use tight tracking (`-0.02em` to `-0.04em`) to maintain a sleek, architectural feel. 

**Plus Jakarta Sans** handles all functional text and body copy. It is set with a generous line-height (`1.6`) to ensure breathability within the glass containers. For labels and buttons, use a medium or semi-bold weight to ensure contrast against the translucent backgrounds.

## Layout & Spacing

The layout follows a **Fluid Grid** model designed to handle complex CRM data while maintaining luxury aesthetics. 

- **Desktop:** 12-column grid with 24px gutters and 48px outer margins. Content is organized into "Glass Zones" that group related property data.
- **Mobile:** 4-column grid with 16px margins. Elements reflow vertically, but card headers remain sticky for context.
- **Spacing Logic:** We use an 8px base unit. Negative space should be utilized aggressively to prevent the CRM from feeling "crowded." Section headers should have at least 48px of top margin to provide visual breathing room.

## Elevation & Depth

Depth is not communicated through traditional black shadows, but through **Tonal Layering** and **Luminescence**.

1.  **Level 0 (Base):** Deep Navy HSL 222 47% 11%.
2.  **Level 1 (Cards):** 5% white fill, `backdrop-blur-2xl`, and a 1px `white/10` border.
3.  **Level 2 (Hover/Active):** 8% white fill, `backdrop-blur-3xl`, and a primary-colored glow shadow (`rgba(0, 217, 255, 0.2)`).
4.  **Level 3 (Modals/Overlays):** 12% white fill, isolated with a background dim of 40% black.

Borders are essential; they should be thin (1px) and use a semi-transparent white or a subtle gradient to define the edges of glass surfaces against the dark background.

## Shapes

The shape language is sophisticated and modern. Standard UI components (Inputs, Buttons) use a 0.5rem (8px) radius. Larger containers (Property Cards, Dashboard Widgets) use a 1rem (16px) radius to emphasize the "softness" of the luxury experience.

Interactive elements should transition their corner radius slightly on hover (e.g., from `rounded-lg` to `rounded-xl`) to provide tactile feedback in a digital environment.

## Components

### Buttons
- **Primary:** Velocity gradient fill, white text, subtle `shadow-glow-primary`.
- **Secondary:** Transparent fill, 1px `white/20` border, `backdrop-blur-md`.
- **Ghost:** No border, primary color text, subtle background tint on hover.

### Input Fields
Inputs should be treated as "etched" into the glass. Use a `white/5` background, `white/10` border, and `Plus Jakarta Sans` for placeholder text. On focus, the border should animate to the `Primary Cyan` with a 4px outer glow.

### Cards (Property & Contact)
The cornerstone of the CRM. Use the `Glass-dark` specification. Property images within cards should have a subtle inner-shadow to blend into the glass frame. Data points (Price, Status) should use `Outfit` for immediate recognition.

### Chips & Status Indicators
Status tags (e.g., "Available", "Sold", "Under Construction") should use high-saturation backgrounds with low-opacity (20%) and matching solid-colored text to ensure WCAG 2.1 AA compliance while maintaining the neon aesthetic.

### Neural Insights (AI)
Any AI-driven data or suggestions should be framed with the `Neural` gradient (Cyan to Purple) as a 1px border or a subtle corner glow to differentiate machine-learning elements from standard user input.