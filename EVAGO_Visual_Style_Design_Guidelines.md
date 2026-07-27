# EVAGO Visual Style & Design Guidelines

**Role:** Elite UX/UI Designer & Brand Art Director  
**Version:** 1.0  
**Brand Name:** EVAGO  
**Based on:** EVAGO Business Plan — General Conference & Business Travel Audience  
**Voice & Tone:** EVAGO Brand Voice & Tone Guidelines v1.0  
**Constraint:** Must be implementable in a standard no-code website builder within 30 minutes.

---

## Visual Persona & Vibe

EVAGO looks like a **premium, trustworthy business assistant for conference weeks**. The visual identity is clean, bright, and structured — closer to a modern SaaS dashboard or a high-end business-travel app than a niche or crypto-themed tool. The vibe says: *"Your itinerary is organized. You can relax and focus on the event."*

**Key visual traits:**
- **Light-first by default** — white backgrounds, breathable layouts, and high readability for a professional audience.
- **Business-credible** — restrained color, strong typography, and clear hierarchy.
- **Information-forward** — the design serves schedules, routes, QR codes, tickets, and status badges first.
- **Premium through restraint** — achieved through generous spacing, crisp type, and a limited palette rather than effects or illustrations.

---

## Core Color Palette

Use exactly this palette. No additional colors. Every color has a functional or hierarchical role.

| Token | HEX Code | Role | Usage |
|---|---|---|---|
| **Primary Background** | `#FFFFFF` | Page background | 90% of the page. Clean white. |
| **Surface** | `#F8FAFC` | Section backgrounds, subtle panels | Alternates with white to create quiet depth. |
| **Card Background** | `#FFFFFF` | Cards, panels, input fields | White cards on light surface or white background. |
| **Card Border** | `#E2E8F0` | Card borders, dividers, input borders | Subtle 1px borders. |
| **Primary Accent** | `#0284C7` | CTAs, links, active states, key highlights | Confident business blue. |
| **Primary Accent Hover** | `#0369A1` | Button hover, link hover | One step darker for interaction. |
| **Primary Dark** | `#0F172A` | Headings, strong UI elements, footer | Deep navy-black for authority and readability. |
| **Text Primary** | `#0F172A` | Headings, primary labels, prices | Near-black for maximum contrast. |
| **Text Secondary** | `#475569` | Body copy, descriptions, metadata | Medium slate gray for hierarchy. |
| **Text Tertiary** | `#94A3B8` | Captions, timestamps, disabled states | Lowest-priority text. |
| **Success** | `#059669` | Confirmed, ready, pass issued, positive status | Darker green for light-mode visibility. |
| **Success Surface** | `#ECFDF5` | Success badge backgrounds | Light tinted background for status pills. |
| **Alert** | `#D97706` | Delays, warnings, queue updates, attention | Darker amber for light-mode visibility. |
| **Alert Surface** | `#FFFBEB` | Alert badge backgrounds | Light tinted background for status pills. |
| **Premium Purple** | `#7C3AED` | Featured side events, VIP tiers, premium listings | Used sparingly for premium contexts. |

### Color Rules for Non-Designers

1. **Background is always `#FFFFFF` or `#F8FAFC`.** Do not use dark backgrounds.
2. **Cards are always `#FFFFFF` with a 1px `#E2E8F0` border.** This creates instant hierarchy without shadows.
3. **Headings are `#0F172A`.** Body text is `#475569`. Captions are `#94A3B8`.
4. **Primary accent is `#0284C7`.** Use it for CTAs, links, and key highlights only.
5. **Status colors use tinted backgrounds:** green text on light green surface, amber text on light amber surface. Never put bright green text directly on white.
6. **No gradients.** Use flat color only. No blur effects. No glassmorphism.

---

## Typography Pairing

### Headers (H1 / H2)

**Font:** `Space Grotesk`  
**Weight:** 700 (Bold)  
**Style:** Modern, geometric, and confident. Slightly distinctive without being eccentric.

Space Grotesk gives EVAGO a crisp, professional personality that separates it from generic SaaS landing pages while remaining fully readable.

### Body Text

**Font:** `Inter`  
**Weight:** 400 (Regular) / 500 (Medium) / 600 (Semi-bold)  
**Style:** Neutral, highly legible, and professional.

Inter is the standard for clean SaaS interfaces. It handles dense logistics information — times, routes, prices, status messages — with zero friction.

### Type Scale

| Element | Font | Size | Weight | Line Height | Color |
|---|---|---|---|---|---|
| **H1** | Space Grotesk | 48px / 3rem | 700 | 1.1 | `#0F172A` |
| **H2** | Space Grotesk | 32px / 2rem | 700 | 1.2 | `#0F172A` |
| **H3** | Space Grotesk | 24px / 1.5rem | 700 | 1.25 | `#0F172A` |
| **Body Large** | Inter | 18px / 1.125rem | 400 | 1.6 | `#475569` |
| **Body** | Inter | 16px / 1rem | 400 | 1.5 | `#475569` |
| **Caption / Label** | Inter | 12px / 0.75rem | 600 | 1.4 | `#94A3B8` |
| **Button** | Inter | 14px / 0.875rem | 600 | 1 | `#FFFFFF` on accent, or `#0F172A` on surface |
| **Price / Number** | Space Grotesk | 20px / 1.25rem | 700 | 1.2 | `#0F172A` |

### Type Rules

1. **Use all caps only for tiny labels and status badges** (e.g., "CONFIRMED", "LIVE", "DELAYED"). Never use all caps for headings or body text.
2. **One font per job.** Space Grotesk for headings. Inter for everything else.
3. **Line length:** keep body text to 65 characters per line maximum. In no-code builders, this means 600-700px wide containers.

---

## Logo Treatment

**Wordmark:** EVAGO  
**Logo font:** Space Grotesk, 700 (Bold)  
**Logo color:** `#0F172A` on light backgrounds, `#FFFFFF` on dark/accent backgrounds.

### Simple Logo Lockups

1. **Primary Logo:**
   - Text: `EVAGO`
   - Font: Space Grotesk Bold
   - Color: `#0F172A`
   - Optional: a small square dot or checkmark in `#0284C7` after the "O" to symbolize a completed/confirmed itinerary.

2. **Logo with Tagline:**
   - Text: `EVAGO`
   - Tagline: `Conference travel, organized.`
   - Tagline font: Inter 500, 12px, color `#94A3B8`

### Logo Rules

- Do not use gradients in the logo.
- Do not stretch, rotate, or distort the wordmark.
- Do not use the logo inside decorative shapes.
- Minimum clear space around the logo: equal to the height of the "E".

---

## Imagery & Iconography Direction

### Photography

**Use clean, bright, professional photography only.**

- **Hero images:** Modern conference venues, business networking sessions, attendees arriving at venues, keynote stages, professional meetups, clean airport terminals, modern coaches, train interiors.
- **Product screenshots:** Clean EVAGO app screens showing the Travel Pass, route timeline, QR code, and status badges — shown on white or light gray device frames.
- **Transit imagery:** Bright, real photographs of airport transfers, intercity trains, ferries, coaches, business travelers with luggage, and clean terminal spaces.

**Treatment:**
- Bright, clean, and well-lit.
- Slightly desaturated to avoid oversaturated stock-photo feel.
- Avoid overly warm tones. Keep images cool and neutral to align with the blue palette.
- Apply a **10-15% light overlay** on any image behind text to ensure readability, if needed.
- No dark overlays. No cinematic night shots. No gritty or underground photography.

### What to Avoid in Imagery

- Neon cityscapes, blockchain visuals, or crypto-themed graphics.
- Dark basement or underground event photography.
- Overly staged stock photos of generic business people shaking hands.
- 3D isometric illustrations of people and charts.
- AI-generated visuals.
- Leisure travel or vacation imagery.

### Iconography

**Icon set:** `Lucide` (or Feather, if Lucide is unavailable).  
**Style:** Outline only. 2px stroke for light-mode visibility.  
**Size:** 16px for inline text, 20px for UI controls, 24px for feature blocks.

**Core icon vocabulary:**
- `map-pin` — location, venue
- `route` — transit, corridor, multi-leg journey
- `calendar` — side events, schedule
- `ticket` — pass, bookings
- `wallet` — EVAGO Travel Pass, payments
- `shield-check` — privacy, security, vetted drivers
- `users` — group travel, shared vehicles
- `bus`, `ship`, `train` — transit modes
- `alert-circle` — delays, alerts
- `check-circle` — confirmed, ready
- `qr-code` — pass verification
- `clock` — times, schedules, updates

**Icon rule:** Use icons to clarify function, not to decorate. Icons should be the same color as the text they accompany or the primary accent color.

---

## UI Elements & Geometry

### Geometry & Spacing

| Element | Value |
|---|---|
| **Base unit** | 16px |
| **Card border radius** | 8px |
| **Large panel / hero card radius** | 12px |
| **Button border radius** | 6px |
| **Input border radius** | 8px |
| **Avatar / small badge radius** | 999px (full round) |
| **Section vertical spacing** | 80px desktop / 48px mobile |
| **Card internal padding** | 24px |
| **Card gap between cards** | 16px |
| **Border width** | 1px solid `#E2E8F0` |

**Rule:** No complex shapes. No angled sections. No custom SVG decorations. Straight rectangles with subtle rounded corners only.

### Buttons

**Primary Button**
- Background: `#0284C7`
- Text: `#FFFFFF`
- Border radius: 6px
- Padding: 12px 24px
- Font: Inter, 14px, weight 600
- Hover: background `#0369A1`
- No shadow. No gradient.

**Secondary Button**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Text: `#0F172A`
- Hover: background `#F8FAFC`

**Ghost Button**
- Text only: `#0284C7`
- Hover: underline
- Use for inline links and low-priority actions.

### Cards

**Standard Card**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Border radius: 8px
- Padding: 24px

**Status Card Variants**
- Success: add left border 3px `#059669`
- Alert: add left border 3px `#D97706`
- Premium: add left border 3px `#7C3AED`

**Rule:** Use the colored left border to indicate status. Do not change the entire card background to green or amber.

### Inputs

- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Border radius: 8px
- Text: `#0F172A`
- Placeholder: `#94A3B8`
- Focus border: `#0284C7`
- Padding: 12px 16px

### Badges / Pills

- Background: `#F1F5F9`
- Text: `#475569`
- Border radius: 999px
- Padding: 4px 12px
- Font: Inter, 12px, weight 600

**Status badge variants:**
- Confirmed: background `#ECFDF5`, text `#059669`, border 1px `#A7F3D0`
- Delayed: background `#FFFBEB`, text `#D97706`, border 1px `#FCD34D`
- Live: background `#F0F9FF`, text `#0284C7`, border 1px `#BAE6FD`

### Layout Grid

- **Container max-width:** 1200px centered.
- **Columns:** 12-column grid.
- **Gutter:** 24px.
- **Mobile:** single column. Cards stack vertically.
- **Rule:** No asymmetrical layouts. No broken grids. No overlapping sections. Simple stacking.

### Navigation Bar

- Background: `#FFFFFF`
- Border bottom: 1px solid `#E2E8F0`
- Height: 72px
- Logo: Space Grotesk, weight 700, `#0F172A`
- Nav links: Inter 14px, weight 500, `#475569`
- Active link: `#0284C7`
- Sticky on scroll.

### Hero Section

- Background: `#FFFFFF` or `#F8FAFC`
- H1: 48px Space Grotesk, `#0F172A`
- Subheadline: 18px Inter, `#475569`, max-width 640px
- Primary CTA: solid `#0284C7` button
- Optional: clean product screenshot or professional event/travel image on the right
- No gradient overlays. No dark backgrounds.

### No-Code Implementation Checklist

To implement this in Webflow, Framer, Carrd, or similar in under 30 minutes:

1. **Set global background to `#FFFFFF`.** Use `#F8FAFC` only for alternating section backgrounds.
2. **Import Google Fonts:** Space Grotesk (700) and Inter (400, 500, 600).
3. **Set heading font to Space Grotesk**, body font to Inter.
4. **Create a color palette** with the exact HEX codes above.
5. **Build three reusable card styles:** standard white card, success left-border card, alert left-border card.
6. **Create one primary button style** and one secondary button style.
7. **Use Lucide icons** (or Feather) at 2px stroke, 20px size for feature blocks.
8. **Add the EVAGO logo** as plain text using Space Grotesk Bold.
9. **Add one hero image** with a 10-15% light overlay if text is placed directly on it.
10. **Do not add:** gradients, animations, heavy shadows, glassmorphism, 3D elements, custom illustrations, or more than the colors listed.

---

## Quick Visual Reference Summary

| Decision | The Rule |
|---|---|
| Brand name | EVAGO in Space Grotesk Bold |
| Background | `#FFFFFF` or `#F8FAFC` always |
| Cards | `#FFFFFF` with 1px `#E2E8F0` border |
| Primary CTA | `#0284C7` with `#FFFFFF` text |
| Headings | Space Grotesk 700, `#0F172A` |
| Body | Inter 400/500, `#475569` |
| Success | `#059669` on `#ECFDF5` surface |
| Alerts | `#D97706` on `#FFFBEB` surface |
| Premium | `#7C3AED` for featured/premium contexts only |
| Imagery | Clean, bright, professional conference + transit photography |
| Icons | Lucide outline, 2px stroke, neutral or accent color |
| Geometry | Rectangles, 8px radius, no gradients, no shadows |

**Final constraint reminder:** If a design element requires more than a color change, a font change, and a border-radius setting, it is too complex for this guideline. Keep it flat, keep it clean, keep it business-credible.
