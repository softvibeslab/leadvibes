---
name: Azimuth Noir
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#454558'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#757589'
  outline-variant: '#c5c4db'
  surface-tint: '#343dff'
  primary: '#0001bb'
  on-primary: '#ffffff'
  primary-container: '#0000ff'
  on-primary-container: '#b3b7ff'
  inverse-primary: '#bec2ff'
  secondary: '#006970'
  on-secondary: '#ffffff'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#353535'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c4c4c'
  on-tertiary-container: '#bdbdbd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bec2ff'
  on-primary-fixed: '#00006e'
  on-primary-fixed-variant: '#0000ef'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Outfit
    fontSize: 80px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 8px
  unit-2: 16px
  unit-3: 24px
  unit-4: 32px
  unit-8: 64px
  unit-12: 96px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system establishes a high-end "Neo-Brutalist Premium" aesthetic, blending the raw, architectural precision of Swiss Design with the luxury of modern typography. It targets a sophisticated audience that values clarity, structural integrity, and bold visual statements.

The style is characterized by "Light Luxury": a white-dominant interface that feels spacious and expensive, yet grounded by thin, 1px black borders and aggressive, high-contrast typography. The emotional response is one of absolute authority, precision, and avant-garde professionalism. It avoids soft shadows and gradients in favor of flat, structural depth and raw geometric shapes.

## Colors

The palette is intentionally restricted to maximize visual impact through contrast. 

- **Primary Blue (#0000FF):** A high-saturation, digital blue used for primary actions and structural highlights.
- **Accent Cyan (#00F0FF):** A punchy, luminous cyan used sparingly for focus states, alerts, or secondary interactive highlights.
- **Structural Black (#000000):** Used for all borders, iconography, and primary text to maintain a "printed" feel.
- **Base White (#FFFFFF):** The expansive canvas that provides the "Light Luxury" feel. 

Interaction states should use the primary blue as a solid fill, with text inverting to white. No subtle shades of grey are permitted; if a secondary background is needed, use a 5% tint of the primary blue or a very light cyan.

## Typography

This design system utilizes a high-contrast typographic pairing to reinforce the Swiss-Neo-Brutalist narrative. 

**Outfit** is used for all headings and body copy. Headlines must be set in Extra Bold (800) with tight tracking to create a massive, "poster-like" visual weight. Body text remains clean and legible in Regular (400) weight.

**JetBrains Mono** is used for functional labels, metadata, and navigational elements. This adds a "technical" and "systematic" layer to the luxury aesthetic, ensuring the interface feels like a precise tool. All monospaced labels should be set in uppercase to emphasize the grid-based nature of the layout.

## Layout & Spacing

The layout follows a strict **Swiss-Design grid**—a 12-column modular system where every element is aligned to a rigorous vertical and horizontal rhythm. 

- **Desktop:** 12 columns, 24px gutters, 40px outer margins.
- **Tablet:** 8 columns, 24px gutters, 32px outer margins.
- **Mobile:** 4 columns, 16px gutters, 16px outer margins.

Spacing is strictly derived from a 4px baseline. Components should use generous padding (32px+) to maintain the "luxury" whitespace, while internal element spacing remains tight (8px or 16px) to maintain the brutalist structure. Content should be boxed in 1px black borders, often spanning the full width of the column grid to create a "blueprint" effect.

## Elevation & Depth

This design system rejects traditional shadows and depth. Instead, hierarchy is communicated through **Structural Layering and High-Contrast Fills**.

- **Z-Axis Hierarchy:** Indicated by 1px black borders. Elements "above" others are not elevated by shadows, but by overlapping frames or solid color fills (e.g., a modal is a white box with a 1px black border and a high-contrast Primary Blue "hard shadow" offset by 4px).
- **Hard Shadows:** If depth is required for buttons or cards, use a solid color offset (4px x 4px) in Primary Blue or Black. No blurs are permitted.
- **Tonal Tiers:** Use the Primary Blue fill to highlight the most important active element on the screen, creating a "focal point" through color intensity rather than physical height.

## Shapes

The shape language is sharp and architectural. A consistent **4px corner radius (Soft)** is applied to all components (buttons, inputs, cards) to prevent the UI from feeling dangerously sharp, while maintaining a clear geometric rigor.

All containers must feature a **1px solid black border**. This border is the primary defining characteristic of the system, acting as the "wireframe" of the final design. Rounding should never exceed 4px; pill-shapes are strictly prohibited.

## Components

- **Buttons:** Rectangular with a 4px radius. Primary buttons use a solid Primary Blue fill with White text. Secondary buttons use a White fill with a 1px Black border and Black text. On hover, buttons shift 2px up and left with a 2px Primary Blue "hard shadow" appearing behind them.
- **Inputs:** White background, 1px black border, 4px radius. Use JetBrains Mono for placeholder text. On focus, the border weight remains 1px but the color changes to Primary Blue, or a 2px internal "focus ring" in Cyan is added.
- **Cards:** Simple white boxes with 1px black borders. Card headers should be separated by a 1px horizontal black line. 
- **Chips/Labels:** Use JetBrains Mono, uppercase, with a 1px black border. For active states, use a solid Primary Blue fill.
- **Lists:** Items are separated by 1px horizontal black lines. No icons for list bullets; use geometric squares (4px x 4px) in Primary Blue instead.
- **Navigation:** Top-tier navigation uses large Outfit Bold text. Sub-navigation and utility links use JetBrains Mono.
- **Progress Bars:** Sharp rectangles with 1px black borders. The "fill" should be a solid block of Accent Cyan.