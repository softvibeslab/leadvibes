---
name: Luminous Ether
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3c494d'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6c797e'
  outline-variant: '#bbc9ce'
  surface-tint: '#00687b'
  primary: '#00687b'
  on-primary: '#ffffff'
  primary-container: '#00d9ff'
  on-primary-container: '#005b6c'
  inverse-primary: '#00d9ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#7d5800'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffbb2a'
  on-tertiary-container: '#6e4d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aeecff'
  primary-fixed-dim: '#00d9ff'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5d'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdea9'
  tertiary-fixed-dim: '#febb29'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4100'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The design system is centered on "Light Luxury," a philosophy that marries premium editorial aesthetics with cutting-edge digital effects. It targets high-end creative tools, luxury fintech, or avant-garde lifestyle platforms. The interface should feel ethereal, expansive, and highly tactile despite its digital nature.

The style is defined by **Glassmorphism Depth**. This is achieved through multi-layered translucent surfaces that interact with vibrant light sources. The emotional response should be one of "digital serenity"—a sense of organized, high-tech elegance that feels both breathable and expensive. Key characteristics include extreme backdrop blurs, subtle inner glows, and a meticulous use of white space to balance the vibrant accent colors.

## Colors

This design system utilizes a high-clarity palette built on a foundation of pure white.
- **Primary (Cyan):** Used for interactive focus, primary actions, and "active" light glows.
- **Secondary (Violet):** Used for depth accents, high-value status indicators, and complex gradients.
- **Background:** The canvas is pure white, broken only by soft, large-scale radial mesh gradients using 5% opacity versions of the primary and secondary colors to create a sense of environmental lighting.
- **Glass Logic:** Surfaces are not solid. They use white with 60% opacity as a base, requiring a `backdrop-filter: blur(24px)` to maintain legibility and luxury appeal.

## Typography

Typography is used to anchor the ethereal glass elements. 
- **Headlines:** Plus Jakarta Sans provides a friendly yet sophisticated geometric structure. Tight letter spacing on larger displays creates a "custom-font" luxury feel.
- **Body:** Inter ensures maximum readability across layered surfaces, providing a systematic and neutral contrast to the expressive headlines.
- **Technical Labels:** JetBrains Mono is used for micro-copy, tags, and data points to introduce a "precision instrument" aesthetic, grounding the soft glass effects with technical clarity.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid**. On desktop, content is contained within a 1280px max-width 12-column grid to maintain editorial control. On mobile, it transitions to a fluid 4-column layout.

Spacing is generous. To maintain the "luxury" feel, the design system utilizes "Airy Margins"—desktop layouts should feature at least 64px of outer padding. Elements are grouped using an 8px base grid, but top-level sections should use "Major Steps" (80px, 120px, 160px) to ensure the UI never feels cluttered. The glass panels should have inner padding of at least 32px to allow the background blur effect to "breathe" around the content.

## Elevation & Depth

Depth is not communicated through traditional black shadows, but through **Tonal Refraction and Luminous Borders**.

1.  **Glass Layers:** Use `backdrop-filter: blur(20px) saturate(180%)`. Surfaces should have a 1px inner border (stroke) with a linear gradient: `top-left: rgba(255,255,255,0.8)` to `bottom-right: rgba(255,255,255,0.2)`.
2.  **Luminous Shadows:** Instead of gray shadows, use highly diffused color glows. A floating card might have a `box-shadow` of `0 20px 40px rgba(0, 217, 255, 0.15)`.
3.  **Z-Axis Hierarchy:**
    - **Level 0 (Base):** White with mesh gradients.
    - **Level 1 (Cards):** Glassmorphism surfaces.
    - **Level 2 (Modals/Popovers):** Higher blur (40px) and a subtle 1px solid white border to distinguish from Level 1.

## Shapes

The design system uses "Organic Geometric" shapes. 
- **Standard Elements:** Buttons and inputs use a 0.5rem (8px) radius to maintain a clean, professional edge.
- **Containers:** Large glass panels and cards use "rounded-xl" (1.5rem/24px) to soften the overall interface and make the glass sheets feel like polished physical objects.
- **Interactive Indicators:** Small pills and status chips should use full "rounded-pill" styling to contrast against the more structured container shapes.

## Components

- **Glass Buttons:** Primary buttons use a vibrant Cyan-to-Violet horizontal gradient with a subtle white inner glow (1px) at the top. Text should be white with a slight drop shadow for legibility. Secondary buttons are glass-filled with a 1px white border.
- **Inputs:** Fields are semi-transparent (white at 40% opacity). On focus, the border glows Cyan and the backdrop blur increases.
- **Glass Cards:** Always feature a 1px "light-leak" border (gradient from top-left white to bottom-right transparent).
- **Glass Chips:** Small, fully rounded elements with a 10% Cyan or Violet background tint and a backdrop blur of 8px.
- **Depth Controls:** Sliders and switches should use the Primary Cyan for the "active" track, appearing as if the light is contained within a glass tube.
- **Background Mesh:** A custom component that renders 3-4 large, slowly animating SVG blobs behind the main content area to provide the necessary color for the glass refraction.