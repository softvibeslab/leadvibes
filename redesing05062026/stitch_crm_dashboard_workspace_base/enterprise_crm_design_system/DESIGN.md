---
name: Enterprise CRM Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001a42'
  on-tertiary-container: '#3980f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-desktop: 40px
  max-width: 1440px
---

## Brand & Style

The design system is engineered for high-performance enterprise environments where data clarity and user focus are paramount. It follows a **Corporate Modern** aesthetic, prioritizing structural integrity and functional elegance over decorative elements. 

The brand personality is authoritative yet unobtrusive—acting as a silent partner that empowers users to manage complex relationships and high-volume data without cognitive overload. The emotional response should be one of confidence, reliability, and precision. By utilizing a "Content-First" philosophy, the UI recedes into the background, allowing the user's data to take center stage through generous whitespace and a sophisticated, cool-toned palette.

## Colors

The color strategy for this design system is built on a foundation of "Slate and Sapphire." 

- **Primary (#0F172A):** A deep, nocturnal blue used for global navigation, primary headings, and high-impact interactions. It conveys stability and institutional trust.
- **Secondary (#334155):** A muted slate blue-gray used for sub-navigation, icons, and secondary text. It provides necessary contrast without the harshness of pure black.
- **Tertiary (#3B82F6):** A vibrant action blue reserved specifically for interactive elements, progress indicators, and primary call-to-actions.
- **Neutral (#F8FAFC):** A crisp, cool-white base that ensures the interface feels airy and organized.

Surface colors utilize a tiered grayscale (Slate 50 to Slate 900) to define information hierarchy and separate functional zones like sidebars, utility bars, and the main workspace.

## Typography

This design system utilizes **Inter** exclusively to ensure maximum legibility across high-density data tables and complex dashboards. Inter’s tall x-height and neutral character make it ideal for an enterprise CRM where clarity is the highest priority.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to maintain a professional, "tight" appearance on large displays.
- **Body Text:** The standard size is set to 14px (`body-md`) for optimal balance between information density and readability. 16px is reserved for long-form notes or descriptions.
- **Labels:** Small caps and increased letter-spacing are applied to labels to distinguish metadata from user-generated content.
- **Scale:** The type system follows a strict mathematical ratio to ensure vertical rhythm, ensuring that even the most complex forms remain scannable.

## Layout & Spacing

The layout is governed by a **12-column fixed grid** on desktop, centered within the viewport to maintain focus. The spacing system is built on a **4px baseline grid**, ensuring all components align perfectly across the horizontal and vertical axes.

- **Desktop (1280px+):** A 12-column grid with 24px gutters and 40px external margins. Sidebars are fixed at 240px or 280px to maximize the main workspace.
- **Tablet (768px - 1279px):** Content transitions to a fluid 8-column grid. The sidebar may collapse into a rail or drawer.
- **Mobile (Under 768px):** A fluid 4-column grid with 16px margins.

We employ "Logical Padding": consistent internal component padding (typically 12px or 16px) to create a sense of order. Dense views (like data grids) may reduce this to 8px to increase visible data points per screen.

## Elevation & Depth

To maintain a clean, "flat-plus" professional look, this design system uses **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surface Levels:** 
  - Level 0 (Background): Slate 50.
  - Level 1 (Cards/Worksheets): White with a 1px border of Slate 200.
  - Level 2 (Modals/Popovers): White with a subtle, highly-diffused 15% opacity shadow (offset 0, 10, 15) and a Slate 300 border.
- **Depth Cues:** Depth is primarily communicated through color shifts. For example, a sidebar might be a slightly darker neutral than the main content area to suggest it sits "underneath" the workspace.
- **Interactive States:** Hover states should utilize subtle background color shifts (e.g., White to Slate 50) rather than lifting the element, maintaining the "flat" professional aesthetic.

## Shapes

The shape language is **Soft (Level 1)**, utilizing a 4px (0.25rem) base radius. This subtle rounding softens the clinical nature of enterprise software without losing the "structured" and "efficient" feel required for a CRM.

- **Standard Radius:** 4px for buttons, input fields, and small cards.
- **Large Radius:** 8px (rounded-lg) for main container modules or modals.
- **Contextual Exceptions:** Data table rows remain sharp (0px) to ensure a clean vertical alignment of text and data columns.

## Components

- **Buttons:** Primary buttons use the Tertiary blue with white text. Secondary buttons use a white background with a Slate 200 border. Transitions should be an immediate 150ms ease-in-out.
- **Input Fields:** Fields utilize a 1px border in Slate 300, shifting to Tertiary blue on focus. Error states use a distinct "Alert Red" (#EF4444) for the border and helper text.
- **Data Tables:** The heart of the CRM. Headers should have a Slate 100 background with `label-md` typography. Rows use alternating subtle tints or a 1px bottom border to guide the eye.
- **Chips/Badges:** Used for status (e.g., "Lead," "Closed," "Pending"). These should use "Pill" shapes with low-saturation background colors and high-saturation text for readability (e.g., soft green background with dark green text).
- **Cards:** Used for dashboard widgets. They must have a consistent padding of 24px (`lg`) and use the Level 1 surface treatment (white background + Slate 200 border).
- **Navigation:** A vertical primary navigation bar on the left uses the Primary (#0F172A) background with active states indicated by a left-edge blue accent line.