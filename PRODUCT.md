# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Individual users seeking a fast, intuitive personal finance tool to log daily expenses, manage monthly budget thresholds, and gain visual clarity over their spending habits.

## Product Purpose
Provide an accessible personal expense manager that enables users to effortlessly track transactions, set and monitor monthly category budgets, visualize financial trends, and export expense records.

## Positioning
A lightweight, fast, friction-free personal finance tracker emphasizing instant logging, keyboard shortcuts (`N` for new entry, `Esc` to close), clear visual budget thresholds, and standalone privacy without unnecessary account onboarding friction.

## Operating Context
Everyday personal finance tracking on desktop and mobile web browsers. Used in quick bursts (logging a purchase on the go or at end of day) and periodic reviews (checking monthly budget status and viewing spending charts). Supports dark theme (default) and light theme toggling.

## Capabilities and Constraints
- **Authentication**: JWT-based user register, login, profile management, and password updates.
- **Expense Tracking**: Full CRUD with search, category filtering, sorting, pagination, and recurring expense support.
- **Budget Management**: Category-level monthly budget allocations with spend progress indicators and over-budget warnings.
- **Analytics & Export**: Visual breakdown with Chart.js (pie chart by category, bar chart by month, daily trend line chart) and CSV/PDF export.
- **Tech Stack**: Express.js REST API backend, PostgreSQL database, Vanilla HTML/CSS/JavaScript frontend with Chart.js and FontAwesome.

## Brand Commitments
- Dark mode default visual style with sleek modern styling.
- Simple, clear navigation via sidebar and top header.

## Evidence on Hand
- Full working codebase in `source-code/` (backend Express API, PostgreSQL database scripts, Vanilla frontend with CSS tokens and Chart.js).
- Complete project overview and phase execution plans in `doc/`.

## Product Principles
1. **Frictionless Entry**: Minimizing clicks, input steps, and keyboard overhead for logging daily transactions.
2. **Visual Transparency**: Budget health and category spending should be clear at a single glance without clutter.
3. **Responsive Speed**: Fast rendering, client-side filtering/sorting, and instant feedback.
4. **Data Ownership**: Effortless data export (CSV/PDF) and complete user control over financial history.

## Accessibility & Inclusion
Standard web accessibility: semantic HTML markup, keyboard navigation support (shortcuts `N`, `Esc`), clear color contrast in both dark and light modes, aria labels on interactive modals.
