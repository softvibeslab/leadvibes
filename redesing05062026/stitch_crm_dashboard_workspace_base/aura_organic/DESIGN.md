---
name: Aura Organic
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#434844'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#737873'
  outline-variant: '#c3c8c2'
  surface-tint: '#536257'
  primary: '#536257'
  on-primary: '#ffffff'
  primary-container: '#8a9a8e'
  on-primary-container: '#243229'
  inverse-primary: '#bacbbe'
  secondary: '#7d562d'
  on-secondary: '#ffffff'
  secondary-container: '#ffca98'
  on-secondary-container: '#7a532a'
  tertiary: '#5c6145'
  on-tertiary: '#ffffff'
  tertiary-container: '#959979'
  on-tertiary-container: '#2d3119'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e7d9'
  primary-fixed-dim: '#bacbbe'
  on-primary-fixed: '#111e16'
  on-primary-fixed-variant: '#3b4a40'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#f0bd8b'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#623f18'
  tertiary-fixed: '#e1e6c2'
  tertiary-fixed-dim: '#c5c9a7'
  on-tertiary-fixed: '#1a1d07'
  on-tertiary-fixed-variant: '#45492f'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '300'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  title-md:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '300'
    lineHeight: 30px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '300'
    lineHeight: 26px
  label-sm:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
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
  container-padding: 64px
  gutter: 32px
  section-gap: 128px
  element-gap: 24px
---

## Brand & Style
The brand personality is ethereal, calm, and sophisticated, targeting high-end lifestyle, wellness, or curated boutique experiences. The goal is to evoke a sense of "digital breathing room" through **Organic Minimalism**.

The aesthetic combines **Minimalism** with **Glassmorphism** and **Tactile** influences. It avoids the coldness of traditional tech minimalism by using warm whites, soft-focus background blurs, and fluid, non-geometric shapes. The UI should feel like high-quality matte paper or polished stone—smooth, premium, and inherently quiet.

## Colors
This design system utilizes a palette of organic, earth-derived tones to reinforce the "Light Luxury" narrative.

- **Primary (Sage):** A desaturated, sophisticated green used for primary actions and brand presence.
- **Secondary (Clay):** A warm, earthy accent for highlights or call-to-action secondary states.
- **Neutral (Warm White):** The foundation of the system, used for large surfaces to create a luminous, airy feel.
- **Tertiary (Moss/Cream):** Used for subtle background variations or status indicators.

Backgrounds should primarily use `#FDFDFD`. Text should avoid pure black, opting instead for a deep charcoal (#2D3436) to maintain softness.

## Typography
The typography relies exclusively on **Outfit**, leveraging its geometric yet friendly construction. To maintain the luxury feel, emphasize **Light (300)** and **Regular (400)** weights. 

Medium (500) is reserved for small labels and functional navigation elements. Line heights are intentionally generous to support the extra-low density layout. Tracking is tightened slightly for large headlines to create a bespoke, editorial look, while small labels are tracked out for legibility and "breathing room."

## Layout & Spacing
The layout philosophy is **extra-low density**, prioritizing whitespace as a core design element rather than a byproduct. 

- **Grid:** A 12-column fluid grid with wide gutters (32px) and significant side margins (64px+) on desktop.
- **Rhythm:** Utilize a vertical rhythm based on 8px increments, but lean toward larger multiples (24, 48, 64) to ensure the interface never feels "cramped."
- **Mobile:** Margins reduce to 24px, and sections should have a minimum vertical gap of 48px to maintain the airy aesthetic.
- **Reflow:** Content should center-align on ultra-wide screens with a maximum content width of 1440px to preserve the intended visual balance.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Glassmorphism** rather than traditional heavy shadows.

- **Surfaces:** Use subtle background blurs (16px to 32px) on floating headers and overlays to create a "frosted sage" or "soft clay" effect.
- **Shadows:** When necessary, use "Ambient Shadows"—extremely diffused, low-opacity (#000000 at 3-5% alpha) with a large spread. This mimics soft, natural light hitting a matte surface.
- **Interaction:** Upon hover, elements should not "pop" up but rather subtly shift in background tint or gain a soft, luminous inner glow.

## Shapes
The shape language is fluid and organic. Avoid sharp corners entirely to maintain the "Organic Minimalism" theme.

- **Standard Radius:** 0.5rem (8px) for small interactive elements like checkboxes.
- **Large Radius:** 1rem (16px) for cards and input fields.
- **Extra Large Radius:** 1.5rem (24px) for containers and modal sheets.
- **Fluidity:** Use "Squircle" shapes where possible for a more natural, premium curve than standard geometric rounding.

## Components
Consistent styling instructions for the design system's core components:

- **Buttons:** Large padding (16px 32px), pill-shaped or `rounded-xl`. Primary buttons use the Sage (#8A9A8E) background with white text. Secondary buttons use a transparent background with a 1px Sage or Clay border.
- **Inputs:** Minimalist approach. Only a bottom border (1px, light clay) or a very soft tinted background (#F5F5F5). Focus states involve a subtle expansion of the bottom border.
- **Cards:** No borders. Use either a very slight tonal shift from the background or a soft ambient shadow. Internal padding should be generous (32px+).
- **Chips:** Small, pill-shaped elements with low-contrast backgrounds (Sage at 10% opacity) and Sage text.
- **Transitions:** All interactions must be "Silk-smooth." Use `cubic-bezier(0.23, 1, 0.32, 1)` (Ease Out Quint) for all transforms and opacity shifts with a duration of 400ms-600ms.
- **Lists:** High vertical spacing between items. Use subtle dividers (0.5px, 10% opacity) or no dividers at all, relying on whitespace for separation.