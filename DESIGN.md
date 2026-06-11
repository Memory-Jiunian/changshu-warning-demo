---
version: alpha
name: Duna-design-analysis
description: A high-trust, AI-native compliance SaaS visual language built on calm authority rather than enterprise heaviness. Duna pairs stark near-black typography and CTAs with a warm off-white canvas, soft white product cards, rounded modular UI panels, subtle hairline borders, and painterly landscape illustrations. The system feels like Stripe-adjacent infrastructure design softened by editorial storytelling: serious enough for banks, fintechs, and regulated platforms, but human enough to make business identity and onboarding feel navigable. For mobile and mini-program adaptation, preserve the monochrome authority, large editorial headings, rounded cards, stacked feature modules, soft neutral backgrounds, and occasional green / pastel system accents.
sourceScope:
  primaryPages:
    - https://duna.com/
    - https://duna.com/about
  targetOutput:
    - mobile-first website implementation
    - WeChat / generic mini-program implementation
    - homepage
    - company-about page
  fidelity: "close visual approximation, not pixel-perfect extraction"

colors:
  primary: "#111111"
  primary-hover: "#2a2a2a"
  primary-active: "#000000"
  primary-disabled: "#b8b6af"
  ink: "#151515"
  body: "#3e3d39"
  muted: "#747168"
  muted-soft: "#9d9a91"
  canvas: "#f3f1ec"
  canvas-warm: "#ebe8e1"
  canvas-light: "#faf9f6"
  surface-card: "#ffffff"
  surface-soft: "#f7f6f2"
  surface-frost: "rgba(255,255,255,0.72)"
  hairline: "#dedbd3"
  hairline-soft: "#e9e6de"
  border-strong: "#c8c4ba"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  success: "#18a118"
  success-soft: "#e8f6e6"
  success-ink: "#128012"
  warning: "#d99b28"
  warning-soft: "#fff2d6"
  error: "#b6382e"
  error-soft: "#fae4df"
  info: "#3f74d8"
  info-soft: "#e5edfB"
  pastel-purple: "#9657e6"
  pastel-purple-soft: "#eee3fb"
  pastel-cyan: "#72c8d3"
  pastel-cyan-soft: "#e0f5f7"
  pastel-blue: "#86a7e8"
  pastel-blue-soft: "#e9eefc"
  pastel-peach: "#d6a06f"
  pastel-peach-soft: "#f6eadf"
  pastel-yellow: "#f2d27a"
  pastel-yellow-soft: "#fbf3d8"
  illustration-sky: "#b7dbe2"
  illustration-sun: "#f6c75a"
  illustration-grass: "#9eb655"
  illustration-lake: "#d7e5e7"
  scrim: "#000000"

typography:
  display-hero:
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 72px
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: -3.2px
  display-xl:
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: -2.4px
  display-lg:
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -1.8px
  display-md:
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: -1.2px
  title-xl:
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.72px
  title-lg:
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: -0.48px
  title-md:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.28
    letterSpacing: -0.24px
  title-sm:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.12px
  body-lg:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.1px
  body-md:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  caption:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0
  caption-muted:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  mono-label:
    fontFamily: "'SF Mono', 'Roboto Mono', ui-monospace, Menlo, Consolas, monospace"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0.2px
  eyebrow:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0.02em
  button-md:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.05px
  button-sm:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  metric:
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -2px

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  card: 28px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px
  section-mobile: 56px
  page-x: 24px
  page-x-mobile: 20px

shadow:
  none: "none"
  hairline: "0 0 0 1px rgba(17,17,17,0.08)"
  card-soft: "0 1px 0 rgba(17,17,17,0.03), 0 12px 32px rgba(17,17,17,0.06)"
  floating: "0 18px 48px rgba(17,17,17,0.12)"
  product-glow: "0 24px 80px rgba(17,17,17,0.10)"

components:
  app-shell:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.surface-frost}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 72px
    padding: "0 32px"
    backdropFilter: "blur(18px)"
  mini-top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
    padding: "0 20px"
  logo-wordmark:
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
  nav-menu-item:
    textColor: "{colors.body}"
    typography: "{typography.nav-link}"
    padding: "8px 10px"
  nav-menu-item-active:
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    backgroundColor: "transparent"
  nav-cta:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
    height: 40px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "14px 22px"
    height: 48px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "13px 22px"
    height: 48px
    border: "1px solid {colors.hairline}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
  announcement-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    padding: "8px 14px"
    border: "1px solid {colors.hairline-soft}"
  hero-section:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-hero}"
    padding: "96px 24px 64px"
  hero-copy:
    textColor: "{colors.body}"
    typography: "{typography.body-lg}"
    maxWidth: 720px
  landscape-hero-image:
    rounded: "{rounded.none}"
    backgroundColor: "transparent"
  metric-card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
    padding: "24px 0"
  metric-label:
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "28px"
    border: "1px solid {colors.hairline-soft}"
  feature-card-muted:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "24px"
  product-module:
    backgroundColor: "{colors.canvas-warm}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.card}"
    padding: "32px"
  product-panel:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "24px"
    border: "1px solid {colors.hairline}"
    shadow: "{shadow.card-soft}"
  product-row:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: "16px 18px"
    border: "1px solid {colors.hairline-soft}"
  product-row-muted:
    backgroundColor: "rgba(255,255,255,0.68)"
    textColor: "{colors.muted}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: "16px 18px"
  icon-tile-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    size: 36px
  icon-tile-purple:
    backgroundColor: "{colors.pastel-purple}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    size: 40px
  icon-tile-cyan:
    backgroundColor: "{colors.pastel-cyan}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    size: 40px
  icon-tile-blue:
    backgroundColor: "{colors.pastel-blue}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    size: 40px
  status-success:
    backgroundColor: "transparent"
    textColor: "{colors.success}"
    typography: "{typography.mono-label}"
  input-shell:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
    height: 56px
    border: "1px solid {colors.hairline}"
  input-shell-focus:
    backgroundColor: "{colors.surface-card}"
    border: "1.5px solid {colors.success}"
    rounded: "{rounded.lg}"
  testimonial-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.xl}"
    padding: "28px"
    border: "1px solid {colors.hairline-soft}"
  quote-copy:
    textColor: "{colors.ink}"
    typography: "{typography.title-lg}"
  person-card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  person-photo:
    rounded: "{rounded.xl}"
    backgroundColor: "{colors.canvas-warm}"
  investor-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: "16px 0"
    borderBottom: "1px solid {colors.hairline-soft}"
  news-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.xl}"
    padding: "20px"
    border: "1px solid {colors.hairline-soft}"
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: "64px 24px 32px"
  footer-link:
    backgroundColor: "transparent"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
  mini-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
    border: "1px solid {colors.hairline-soft}"
  mini-bottom-cta:
    backgroundColor: "{colors.surface-frost}"
    textColor: "{colors.ink}"
    height: 80px
    padding: "12px 20px calc(12px + env(safe-area-inset-bottom))"
    backdropFilter: "blur(18px)"
---

# Duna Design System Analysis

## Overview

Duna's public website presents a compliance and business-identity product as calm infrastructure, not as a dense enterprise dashboard. The design language is built around four tensions:

1. **Regulated seriousness vs. approachable softness** — near-black typography, black CTAs, and concise product claims create authority; warm off-white backgrounds, painterly landscapes, rounded white cards, and pastel product icons keep the experience from feeling cold.
2. **AI-native product vs. non-hype tone** — the site talks about AI, automation, policy engines, audit trails, onboarding conversion, and lifecycle management, but the visual system avoids neon gradients or cyber visuals. It uses calm UI diagrams, modular product panels, and quiet status labels.
3. **Editorial story vs. product proof** — the homepage opens with a large claim and soft landscape imagery, then moves into metrics, trust, product modules, and security proof. The About page shifts toward long-form mission, founder credibility, investors, news, and press.
4. **High-trust SaaS vs. human company** — the product surfaces look precise and structured; the company surfaces use real founder portraits and editorial copy.

For Codex / Cursor implementation, treat this as a **mobile-first B2B SaaS landing system** with: warm neutral canvas, large tight headings, full-width stacked sections, black pill CTAs, soft white cards, product UI mockups inside rounded panels, sparse pastel accents, and strong vertical rhythm.

## Source Page Content Model

### Homepage

The homepage structure should be interpreted as:

1. **Global navigation** — Product / Customers / Company / Resources with a right-side "Schedule a demo" CTA.
2. **Hero** — announcement pill, large headline around business onboarding / compliance, short explanatory paragraph, primary CTA.
3. **Trust logo strip** — "Built for businesses where compliance matters" repeated as a credibility band.
4. **Metrics section** — large numeric proof such as faster onboarding, conversion increase, and analyst efficiency.
5. **Value proposition cards** — drive revenue, future-proof compliance, reduce costs.
6. **Customer proof** — quote card with customer logo or portrait area.
7. **AI section** — AI agents for compliance and output multiplication.
8. **Product sections** — Onboard, Decide, Lifecycle, Data Platform, each with a headline, description, Explore link, product UI images, and feature bullets.
9. **Security section** — safe and secure / trust foundation.
10. **News and footer** — resource links and site map.

### Company / About Page

The About page structure should be interpreted as:

1. **Hero mission essay** — identity as an unsolved internet problem; business identity as code, not only compliance.
2. **Company section** — founder cards with portrait, name, role, previous experience.
3. **Credibility strip** — companies previously built by the team.
4. **Investors section** — names and roles laid out as a dense editorial list.
5. **News section** — linked news rows/cards.
6. **Press section** — media resource CTA.
7. **Footer** — sitemap with product, platform, industries, customers, company, resources.

## Colors

### Core Palette

- **Primary / Ink** (`{colors.primary}` / `{colors.ink}` — #111111 / #151515): Use near-black as the brand's real "color." It carries nav, headings, CTAs, icon tiles, and the most important interface decisions. Avoid saturated blue or purple as the main brand color.
- **Body** (`{colors.body}` — #3e3d39): Main paragraph color. It should feel softer than the heading color but still readable on the warm canvas.
- **Muted** (`{colors.muted}` — #747168): Use for secondary labels, captions, metadata, investor roles, feature descriptions, and footer links.
- **Canvas** (`{colors.canvas}` — #f3f1ec): Main page background. It is warm, slightly grey-beige, never pure white as the page floor.
- **Canvas Warm** (`{colors.canvas-warm}` — #ebe8e1): Use for large product module backgrounds, visual mockup stages, and muted section bands.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Cards, floating UI panels, dropdowns, product rows, founder info surfaces.
- **Hairline** (`{colors.hairline}` — #dedbd3): Borders, separators, input outlines, card strokes.

### Accent Palette

Duna does not behave like a single-accent marketing brand. It uses black as the authority layer and small accents as system signals.

- **Success Green** (`{colors.success}` — #18a118): Autofill, completed checks, positive status, conversion-oriented proof. Use sparingly and always near functional UI.
- **Pastel Purple / Cyan / Blue / Peach / Yellow**: Use only in icon tiles, module illustrations, and tiny status decorations. Do not let these colors become page-level backgrounds.
- **Illustration Colors**: Sky, sun, grass, lake tokens are for painterly hero / transitional images. In a mini-program, these can be simplified into soft abstract image blocks or gradients.

### Color Usage Ratio

A faithful Duna-like page should feel approximately:

- 60% warm canvas / soft neutral background
- 25% white cards and product panels
- 10% near-black typography and CTA blocks
- 5% green / pastel system accents

## Typography

### Font Family

The public site appears to use a modern grotesk / product sans style. For implementation, use:

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

For mini-program Chinese fallback, use:

```css
font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
```

Do not use a decorative display font. The personality comes from scale, spacing, and contrast — not from unusual letterforms.

### Typographic Character

- **Headlines are large, tight, and calm.** Use 56–72px on desktop, 40–48px on mobile, 64–96rpx in mini-program. Letter spacing should be negative for big English headings.
- **Weights are controlled.** Headings usually sit around 600. Avoid 800/900 unless creating a metric number.
- **Body copy is readable and editorial.** Paragraphs should use 16–20px with generous line-height.
- **Labels can feel technical.** Use mono labels for system statuses such as `Autofilled`, `Risk level`, `KYB`, or `AML`.

### Mobile Type Scale

| Token | Mobile px | Mini-program rpx | Use |
|---|---:|---:|---|
| `{typography.display-hero}` | 44–48px | 88–96rpx | Homepage hero headline |
| `{typography.display-lg}` | 34–38px | 68–76rpx | Section headings |
| `{typography.title-lg}` | 24px | 48rpx | Product module titles |
| `{typography.title-md}` | 20px | 40rpx | Card titles / founder names |
| `{typography.body-md}` | 16px | 32rpx | Body text |
| `{typography.body-sm}` | 14px | 28rpx | Supporting text |
| `{typography.caption}` | 13px | 26rpx | Labels, roles, tags |

## Layout

### Grid & Container

- **Desktop max width:** 1180–1240px centered.
- **Tablet width:** 720–960px; reduce multi-column modules to two columns.
- **Mobile width:** full viewport, with 20px horizontal padding.
- **Mini-program width:** assume 750rpx design width, with 40rpx page padding.

### Section Rhythm

Desktop sections can be generous, but for the requested output the system should be mobile-first:

- Mobile hero top padding: 88–112px including nav.
- Mobile section vertical padding: 56px.
- Mini-program section vertical padding: 96–112rpx.
- Card gaps: 16px / 32rpx.
- Product module internal padding: 24px / 48rpx.

### Mobile Page Composition

On mobile, stack everything. Do not attempt to reproduce desktop split layouts too aggressively.

Recommended homepage mobile order:

1. Sticky / fixed top nav
2. Announcement pill
3. Hero headline
4. Hero paragraph
5. Primary CTA
6. Landscape image / soft visual plate
7. Logo strip as horizontal scroll
8. Metric cards stacked or 3-card horizontal scroll
9. Value proposition cards stacked
10. Testimonial card
11. Product modules stacked: Onboard / Decide / Lifecycle / Data platform
12. Security card
13. News horizontal scroll
14. Footer accordion

Recommended About page mobile order:

1. Top nav
2. Mission headline
3. Mission paragraphs
4. Founder cards stacked
5. "Previously built" logo strip
6. Investors list grouped into compact rows
7. News cards
8. Press CTA
9. Footer accordion

## Shape Language

Duna's shape system is soft but not childish:

- Use **pill CTAs** for the strongest actions.
- Use **24–32px card radii** for large editorial and product cards.
- Use **12–16px radii** for input shells and smaller product rows.
- Use **8px icon tile radii** for compact system icons.
- Avoid sharp enterprise rectangles.
- Avoid overly bubbly consumer app curves beyond the primary CTA and pills.

## Elevation

Elevation should be restrained.

- Most surfaces are flat with a 1px warm hairline border.
- Product panels may use a soft shadow, but keep it diffuse and low-opacity.
- Floating UI mockups may use a larger blur shadow to feel layered.
- Do not build a Material Design elevation ladder.
- On mini-program, use border + background more often than heavy shadow for performance and clarity.

## Components

### Global Navigation

**`top-nav`** — Desktop / web navigation. Warm translucent or solid surface, 72px height, wordmark left, nav groups centered/left, black pill CTA right.

**`mini-top-nav`** — Mobile / mini-program nav. 64px height, logo left, menu icon or compact CTA right. Keep it quiet; the hero headline should dominate.

**Behavior:** On mobile, hide complex dropdowns behind a full-screen drawer or simple action sheet. Do not show hover menus.

### Buttons

**`button-primary`** — Black pill with white text. This is the main Duna CTA style. Use for "Schedule a demo", "Get started", "Explore", and bottom sticky CTA.

**`button-secondary`** — White pill with hairline border and black text. Use for alternate actions such as "Read more", "View news", "Download media resources".

**`button-text`** — Plain text button. Use sparingly for inline Explore links inside product modules.

Mini-program note: Buttons should be minimum 88rpx tall. Use `border-radius: 999rpx`.

### Announcement Pill

**`announcement-pill`** — A small rounded capsule above hero headings. Use white or slightly frosted fill, hairline border, and compact 13px/26rpx text. It should look like a quiet credibility item, not a promotional banner.

### Hero

**`hero-section`** — Large centered or left-aligned editorial block on warm canvas. The Duna-style hero is not a typical SaaS split-screen with a dashboard screenshot only; it blends a bold claim with a soft illustrated landscape or atmospheric visual.

Rules:

- Use one strong headline, not multiple competing lines.
- Keep paragraph max width around 680–720px desktop; full width on mobile.
- CTA sits under paragraph with 16–24px gap.
- Visual image can sit below the text on mobile.

### Landscape / Illustration Plate

**`landscape-hero-image`** — Painterly landscape or abstract warm-sky visual. It provides emotion and memorability. For mini-program adaptation, use a static image, CSS gradient, or simplified soft illustration. Avoid complex canvas animations.

Visual keywords: soft sky, sunlit horizon, grass/lake tones, gentle haze, low contrast.

### Metrics

**`metric-card`** — Large number with small muted label. On desktop, metrics can sit in a row; on mobile, use either stacked cards or horizontal scroll.

Implementation:

- Number: 44–56px / 88–112rpx, weight 600.
- Label: 14px / 28rpx muted.
- Use minimal borders; numbers themselves carry the hierarchy.

### Feature Cards

**`feature-card`** — White rounded card for value propositions. Use for "Drive revenue", "Future-proof compliance", "Reduce costs" style blocks.

Rules:

- Title first, then 2–3 lines of copy.
- Optional small icon tile.
- Avoid too many accent colors.
- On mobile, cards stack 1-up.

### Product Modules

**`product-module`** — A full-width rounded section for product families such as Onboard, Decide, Lifecycle, and Data Platform. Each module contains a text block, product UI mockup, and feature bullets.

Recommended mobile structure:

1. Eyebrow: product name
2. Title
3. Short description
4. Product UI panel / visual mockup
5. Feature list
6. Explore link or CTA

Do not use a dense grid on mobile. Keep one module per scroll chunk.

### Product UI Panel

**`product-panel`** — White card that represents the product interface. Use rounded corners, hairline border, and soft shadow. It can contain:

- Search input with green focus border
- Task rows
- Checkmarks
- Status labels
- Stacked module rows
- Small icon tiles
- Arrows or flow connectors

This is the most important component for matching Duna's product visuals. The UI mockups should look like simplified diagrams, not full working dashboard screens.

### Product Rows

**`product-row`** — White row with icon, label, and optional status. Use for modules like Business details, Representatives, Ownership, UBO, Bank account, Identity verification.

**`product-row-muted`** — Same row but lower opacity / muted text to show background layers or inactive modules.

### Status Labels

**`status-success`** — Green mono label, used for autofill / completed / verified states. Pair with a lightning icon, checkmark, or small success dot.

Use status labels sparingly. They are a signal of automation, not decoration.

### Inputs

**`input-shell`** — White rounded input with warm hairline border. For Duna-style search / onboarding patterns, a focused input can use success green border rather than default blue.

Input text should be large and confident; labels can be mono or small sans.

### Testimonial

**`testimonial-card`** — White or warm card with large quote text, customer name, role, and logo/portrait. It should be visually quieter than product modules but more human than feature cards.

### Founder / Person Cards

**`person-card`** — About page component. Use a large portrait with rounded corners, name, role, and a short credential paragraph. Keep portraits warm and natural. Do not over-style with badges unless needed.

Mobile layout:

- Portrait full width
- Name + role below
- Credential copy below
- 24px/48rpx gap between founders

### Investors List

**`investor-item`** — Dense editorial list item: name + role. The About page has many investors; avoid cardifying every name on mobile. Use clean rows separated by hairlines.

### News Cards

**`news-card`** — Compact card for article title, category, and reading time. On mobile, use horizontal scroll or stacked list.

### Footer

**`footer`** — Large sitemap. On desktop, multi-column. On mobile and mini-program, use accordion groups:

- Product
- Platform
- Industries
- Customers
- Company
- Resources

Keep legal links small and muted.

## Page Templates

### Homepage Template

```text
Page
└─ TopNav
└─ HeroSection
   ├─ AnnouncementPill
   ├─ DisplayHero
   ├─ BodyCopy
   ├─ PrimaryCTA
   └─ LandscapeHeroImage
└─ LogoTrustStrip
└─ MetricsSection
   ├─ MetricCard x3
└─ ValueSection
   ├─ FeatureCard: Drive revenue
   ├─ FeatureCard: Future-proof compliance
   └─ FeatureCard: Reduce costs
└─ TestimonialCard
└─ AISection
└─ ProductModule: Onboard
└─ ProductModule: Decide
└─ ProductModule: Lifecycle
└─ ProductModule: Data Platform
└─ SecuritySection
└─ NewsSection
└─ Footer
```

### About Page Template

```text
Page
└─ TopNav
└─ AboutHero
   ├─ DisplayHero / DisplayXL
   └─ Mission paragraphs
└─ CompanySection
   ├─ FounderCard x2
└─ PreviousCompaniesStrip
└─ InvestorsSection
   ├─ InvestorItem list
└─ NewsSection
└─ PressCTA
└─ Footer
```

## Responsive Behavior

| Name | Width | Key Changes |
|---|---:|---|
| Mini-program / Small Mobile | < 390px | 40rpx page padding, single-column layout, CTA full-width or bottom sticky, product mockups simplified, footer accordion. |
| Mobile | 390–743px | 20px page padding, hero text 44–48px, stacked cards, horizontal scroll for logos/news/metrics where useful. |
| Tablet | 744–1023px | 2-column feature cards, product modules can show text above visual or side-by-side if enough space. |
| Desktop | 1024–1439px | Full nav, larger hero, 3-column metrics, multi-column footer, product modules can use text+visual split layout. |
| Wide | ≥1440px | Content max width around 1240px; do not let text lines become too long. |

### Touch Targets

- Primary CTA: minimum 48px / 96rpx height.
- Nav tap item: minimum 44px / 88rpx height.
- Product row: minimum 56px / 112rpx height.
- Accordion row: minimum 52px / 104rpx height.
- Small icons must sit inside at least 36px / 72rpx tap or visual boxes.

### Collapsing Strategy

- Desktop nav dropdowns become a mobile drawer.
- Product visuals become simplified stacked diagrams.
- Large metrics stack or become a horizontal `scroll-view`.
- Investor grids become list rows.
- Footer columns become accordion groups.
- Avoid hover-only meaning; every state must be tap-visible.

## Mini-program Adaptation Notes

### Design Width

Use 750rpx as the baseline. Recommended mappings:

```css
page {
  background: #f3f1ec;
  color: #151515;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.container {
  padding-left: 40rpx;
  padding-right: 40rpx;
}

.section {
  padding-top: 96rpx;
  padding-bottom: 96rpx;
}

.card {
  background: #ffffff;
  border: 1px solid #e9e6de;
  border-radius: 48rpx;
  padding: 48rpx;
}

.primary-button {
  height: 96rpx;
  border-radius: 999rpx;
  background: #111111;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
}
```

### WeChat / Mini-program Component Mapping

| Web Concept | Mini-program Equivalent |
|---|---|
| `section` | `view` with `.section` class |
| `button-primary` | `button` with custom reset style |
| product carousel | `scroll-view scroll-x` or `swiper` |
| logo strip | `scroll-view scroll-x` |
| founder image | `image mode="aspectFill"` |
| footer accordion | custom `view` rows with expand state |
| hover state | tap / active state only |
| backdrop blur | use solid warm surface if blur support is unstable |

### Mini-program UX Rules

- Prefer vertical flow over complex landing-page compositions.
- Keep all cards full-width.
- Avoid tiny desktop-style nav links.
- Keep primary CTA sticky only when the page has a clear conversion goal.
- If this is just a portfolio / demo mini-program, let the CTA open a fake demo form or contact card.
- Use image compression aggressively; painterly hero assets can be large.

## Implementation Notes for Codex / Cursor

### General Rules

1. Build mobile-first.
2. Do not import a heavy design library unless requested.
3. Use the token names from this file as CSS variables, Tailwind theme extensions, or WXSS utility classes.
4. Do not make the page pure white; the page floor should stay warm off-white.
5. Use black pill CTAs instead of blue/purple SaaS buttons.
6. Keep product mockups simplified and diagrammatic.
7. Use no more than one bright accent color per card.
8. Preserve large spacing between major sections.
9. On mobile, stack product modules; do not force desktop grids.
10. Add `Known Gaps` assumptions as comments if generating code.

### Suggested CSS Variables

```css
:root {
  --color-primary: #111111;
  --color-ink: #151515;
  --color-body: #3e3d39;
  --color-muted: #747168;
  --color-canvas: #f3f1ec;
  --color-canvas-warm: #ebe8e1;
  --color-card: #ffffff;
  --color-hairline: #dedbd3;
  --color-hairline-soft: #e9e6de;
  --color-success: #18a118;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-card: 28px;
  --radius-full: 9999px;
  --shadow-card-soft: 0 1px 0 rgba(17,17,17,0.03), 0 12px 32px rgba(17,17,17,0.06);
}
```

### Suggested Mini-program WXSS Tokens

```css
page {
  background: #f3f1ec;
  color: #151515;
}

.duna-page {
  min-height: 100vh;
  background: #f3f1ec;
}

.duna-container {
  padding-left: 40rpx;
  padding-right: 40rpx;
}

.duna-section {
  padding-top: 96rpx;
  padding-bottom: 96rpx;
}

.duna-hero-title {
  font-size: 88rpx;
  line-height: 0.98;
  font-weight: 600;
  letter-spacing: -3rpx;
  color: #151515;
}

.duna-section-title {
  font-size: 68rpx;
  line-height: 1.08;
  font-weight: 600;
  letter-spacing: -2rpx;
  color: #151515;
}

.duna-body {
  font-size: 32rpx;
  line-height: 1.55;
  color: #3e3d39;
}

.duna-card {
  background: #ffffff;
  border: 1px solid #e9e6de;
  border-radius: 48rpx;
  padding: 48rpx;
}

.duna-product-module {
  background: #ebe8e1;
  border-radius: 56rpx;
  padding: 48rpx;
}

.duna-primary-btn {
  height: 96rpx;
  border-radius: 999rpx;
  background: #111111;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Accessibility

- Keep black text on warm canvas; contrast is strong enough if using the provided tokens.
- Muted text should not drop below `{colors.muted}` on canvas.
- Do not place small text over painterly illustrations.
- CTAs should have clear labels, not just icons.
- For mini-program, avoid 24rpx body text; 28–32rpx is safer.
- Ensure focus / selected states are not only color-based; add checkmarks, borders, or labels.

## Known Gaps

- **Exact font extraction is not confirmed.** The recommended Inter/system stack is a close implementation substitute.
- **Exact CSS tokens are approximated.** This file is based on publicly visible page structure, content, and visual assets rather than direct design-token export.
- **Animation behavior is not fully captured.** If recreating the website, add subtle fade/slide-up section reveals; do not overdo motion in mini-program.
- **Dropdown / hover states are under-specified.** For mobile and mini-program, replace hover with tap states and drawers.
- **Logo assets and customer logos are not bundled.** Use placeholder logo rows or user-provided assets.
- **Product screenshots are represented as simplified mockups.** For a portfolio or demo, diagrammatic cards are enough; do not fake a full compliance product unless required.
- **Dark mode is not specified.** Keep the implementation light-mode only unless explicitly asked.
