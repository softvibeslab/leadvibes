# Rovi CRM 2026 Design Evolution

## Identity & Atmosphere
- **Concept**: "Luxury Tech meets Caribbean Warmth"
- **Visuals**: Ultra-modern glassmorphism, fluid gradients, and neon-tech accents.
- **Vibe**: High-fidelity, premium, futuristic, yet human-centric.

## Design Tokens (Tailwind)

### Colors
- **Background**: `bg-[#0B1120]` (HSL 222 47% 11%) with radial overlays.
- **Surface (Glass)**: `bg-white/5 backdrop-blur-3xl border border-white/10`.
- **Primary**: `text-[#1D4ED8]` (Primary Blue) + `shadow-primary/20`.
- **Secondary**: `text-[#8B5CF6]` (Secondary Purple).
- **Accent**: `text-[#00D9FF]` (Vibrant Cyan).
- **Success Glow**: `shadow-[#10B981]/40`.

### Typography
- **Headings**: `font-['Outfit']` - Bold, tracking-[-0.02em].
- **Body**: `font-['Plus Jakarta Sans']` - Line-height 1.6.
- **Mono**: `font-['Source Code Pro']`.

### Spacing & Layout
- **Density**: Low density, high whitespace (4px base).
- **Gaps**: 20-24px between cards.
- **Padding**: 24-32px containers.

## Component Patterns

### Premium Glass Card
```html
<div class="glass-dark border border-white/10 backdrop-blur-3xl bg-gradient-to-br from-white/5 to-transparent shadow-[0_0_20px_rgba(0,217,255,0.1)] hover:shadow-[0_0_40px_rgba(0,217,255,0.2)] transition-all duration-500 rounded-2xl p-6 group">
  <!-- Content -->
</div>
```

### Neon Action Button
```html
<button class="bg-gradient-to-r from-[#1D4ED8] to-[#00D9FF] text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all">
  Explore Deals
</button>
```
