---
name: Personal Expense Manager
description: Precision Financial Ledger & Command Dashboard System
colors:
  bg-base: "#0b0e14"
  bg-surface: "#141824"
  bg-card: "#141824"
  bg-hover: "#1e2436"
  bg-input: "#1a2030"
  border: "rgba(255, 255, 255, 0.08)"
  border-focus: "#6366f1"
  text-primary: "#f1f5f9"
  text-secondary: "#94a3b8"
  text-muted: "#8690b0"
  accent: "#6366f1"
  accent-light: "rgba(99, 102, 241, 0.14)"
  accent-hover: "#4f46e5"
  accent-light-stop: "#818cf8"
  info-light-stop: "#38bdf8"
  warning-light-stop: "#fbbf24"
  success-light-stop: "#34d399"
  success: "#10b981"
  success-light: "rgba(16, 185, 129, 0.12)"
  warning: "#f59e0b"
  warning-light: "rgba(245, 158, 11, 0.12)"
  danger: "#f43f5e"
  danger-light: "rgba(244, 63, 94, 0.12)"
  info: "#0284c7"
  info-light: "rgba(2, 132, 199, 0.12)"
  overlay: "rgba(0, 0, 0, 0.65)"
typography:
  display-xl:
    fontFamily: "Outfit, sans-serif"
    fontSize: "40px"
    fontWeight: 700
  display-lg:
    fontFamily: "Outfit, sans-serif"
    fontSize: "36px"
    fontWeight: 700
  display-md:
    fontFamily: "Outfit, sans-serif"
    fontSize: "32px"
    fontWeight: 700
  display-stat:
    fontFamily: "Outfit, sans-serif"
    fontSize: "28px"
    fontWeight: 700
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 700
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "22px"
    fontWeight: 700
  title-lg:
    fontFamily: "Outfit, sans-serif"
    fontSize: "20px"
    fontWeight: 700
  title-sub:
    fontFamily: "Outfit, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  title-brand:
    fontFamily: "Outfit, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  title-card:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  small:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  caption:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 500
  micro:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "10px"
    fontWeight: 600
rounded:
  micro: "4px"
  badge: "6px"
  sm: "8px"
  dot: "9px"
  icon: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "99px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-ghost:
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: Personal Expense Manager

## Overview

**Creative North Star: "The Precision Financial Command Ledger"**

Personal Expense Manager is a high-density, low-friction financial command interface designed for individuals tracking daily personal spending and category budget targets. The aesthetic rejects generic template tropes, decorative glows, and spring/bounce easings in favor of an obsidian slate ground, crisp micro-borders, and rock-solid numerical alignment.

The visual language balances modern fintech precision with operational calm: high-contrast typography, restrained signal colors (emerald for savings/income, rose for expenses/alerts, indigo for primary commands), and hardware-accelerated micro-interactions across all application pages (Dashboard, Analytics, Budget, Add Expense, Transaction List, Profile, and Auth).

**Key Characteristics:**
- Deep obsidian dark theme baseline (`#0b0e14`) paired with a cool porcelain light mode (`#f8fafc`).
- Dual typographic hierarchy: `'Outfit'` display typography paired with `'DM Sans'` for body text.
- Standardized tabular figures (`tabular-nums`) across all financial tables, metrics, and budget progress indicators.
- Reflow-free GPU progress bar scale transitions (`transform: scaleX()`).
- Strict WCAG AA contrast compliance (minimum 4.5:1 ratio for body and muted text).

## Colors

The color system relies on an obsidian ground with structured neutral steps and strict semantic signal accents.

### Primary
- **Command Indigo** (`#6366f1`): Used sparingly for primary CTA buttons, active navigation indicators, and key focus outlines.

### Secondary
- **Financial Emerald** (`#10b981`): Represents positive financial status, under-budget categories, and successful actions.

### Tertiary
- **Alert Rose** (`#f43f5e`): Represents expense totals, over-budget warnings, and destructive actions.
- **Warning Amber** (`#f59e0b`): Signals categories approaching 80% budget thresholds.

### Neutral
- **Obsidian Ground** (`#0b0e14`): Dark mode root background surface.
- **Elevated Card Surface** (`#141824`): Card container and panel background.
- **Input Surface** (`#1a2030`): Input fields, select dropdowns, and button ghost backgrounds.
- **Crisp Border** (`rgba(255, 255, 255, 0.08)`): Subtle micro-borders defining panel bounds.
- **Text Primary** (`#f1f5f9`): High-contrast primary headings and table data.
- **Text Secondary** (`#94a3b8`): Subtitles, helper text, and secondary details.
- **Text Muted** (`#8690b0`): Captions, uppercase field labels, and metadata (contrast ratio 4.6:1).

### Named Rules
**The Rarity of Accent Rule.** Primary accent color (`#6366f1`) is applied to ≤10% of any view. Its restraint guarantees instant visual hierarchy for primary actions.

## Typography

**Display Font:** Outfit (fallback: sans-serif)  
**Body Font:** DM Sans (fallback: system-ui, sans-serif)  
**Numerical Alignment:** `font-variant-numeric: tabular-nums lining-nums;`

**Character:** Clean, structural, and readable. Outfit provides strong geometric display headers, while DM Sans delivers comfortable, highly legible body copy.

### Hierarchy
- **Display-XL** (700 weight, 40px): Logo icon badge size.
- **Display-LG** (700 weight, 36px): Import drop zone icons.
- **Display-MD** (700 weight, 32px): Insight card icons.
- **Display-Stat** (700 weight, 28px): Profile avatar & stat icon size.
- **Display** (700 weight, 24px): Auth brand & section title headers.
- **Headline** (700 weight, 22px): Top header title.
- **Title-LG** (700 weight, 20px): Auth & card titles.
- **Subhead** (700 weight, 18px): Modal dialog headers.
- **Title-Brand** (700 weight, 17px): Sidebar logo text.
- **Title-Card** (600 weight, 16px): Card action buttons & logout icon.
- **Title** (600 weight, 15px): Card headers.
- **Body** (400 weight, 14px): Standard text and table cells.
- **Small** (500 weight, 13px): Input text, select values, button text.
- **Label** (600 weight, 12px, uppercase): Table headers and upper labels.
- **Caption** (500 weight, 11px): Timestamps, sub-meta details.
- **Micro** (600 weight, 10px): Badges and micro-tags.

### Named Rules
**The Tabular Numerals Rule.** All monetary figures, percentage indicators, and tabular table cells must enforce `font-variant-numeric: tabular-nums lining-nums` to prevent horizontal width shifting when numbers update.

## Layout

The layout uses a 2-column fixed sidebar + main content grid on desktop viewports (≥768px).

- **Sidebar Width:** Fixed 250px.
- **Content Padding:** 28px 32px on desktop; 20px 16px on mobile viewports.
- **Dashboard Grid:** 2-column equal grid for summary cards and recent activity.
- **Responsive Behavior:** Below 768px, sidebar transitions off-screen with smooth transform toggle, and grid columns stack single-column.

## Elevation & Depth

Surfaces are elevated using subtle 1px micro-borders (`rgba(255, 255, 255, 0.08)`) and multi-layered soft shadows rather than heavy drop shadows or glows.

### Shadow Vocabulary
- **Card Shadow** (`0 1px 3px rgba(0,0,0,0.3)`): Default card surface elevation at rest.
- **Hover Elevation** (`0 4px 12px rgba(0,0,0,0.4)`): Card hover elevation.
- **Modal Overlay Elevation** (`0 16px 40px rgba(0,0,0,0.5)`): Popups and active modal overlays.

### Named Rules
**The Border-Over-Shadow Rule.** Depth is established primarily via crisp 1px borders and distinct surface background tokens (`#0b0e14` vs `#141824`). Shadows serve state responses (hover, focus), not container decoration.

## Shapes

- **Card Radius:** 16px (`var(--radius-lg)`).
- **Modal Radius:** 20px (`var(--radius-xl)`).
- **Button & Input Radius:** 8px–12px (`var(--radius-sm)` to `var(--radius-md)`).
- **Badge Radius:** Full pill 99px (`border-radius: 99px`).

## Components

### Buttons
- **Shape:** 12px radius (`var(--radius-md)`), minimum height 44px for touch accessibility.
- **Primary:** Solid `#6366f1` background, white text, subtle 4px shadow.
- **Ghost:** Input background (`#1a2030`), secondary text (`#94a3b8`), subtle border.
- **Hover/Focus:** Smooth exponential deceleration transition (`cubic-bezier(0.16, 1, 0.3, 1)`), 2px focus outline.

### Cards / Containers
- **Corner Style:** 16px radius.
- **Background:** `#141824` (Dark mode) / `#ffffff` (Light mode).
- **Border:** 1px solid `rgba(255, 255, 255, 0.08)`.

### Inputs & Selects
- **Style:** Input background (`#1a2030`), min height 44px, 1px border.
- **Focus:** `#6366f1` border focus ring with `box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15)`.

### Navigation
- **Sidebar Links:** Min height 44px, active state pill background (`rgba(99, 102, 241, 0.14)`), accent text color.

## Do's and Don'ts

### Do:
- **Do** use `font-variant-numeric: tabular-nums` for all financial figures across all pages.
- **Do** ensure all interactive controls have min height of 44px for touch compliance.
- **Do** use `transform: scaleX()` for progress bar animations.
- **Do** maintain a minimum contrast ratio of 4.5:1 for body and muted text.

### Don't:
- **Don't** use thick 4px left-side accent borders on cards (`side-tab border`).
- **Don't** use bounce or elastic cubic-bezier animation curves.
- **Don't** animate CSS `width` directly on progress bars.
- **Don't** use raw em-dashes `—` as decorative text dividers in body copy.
