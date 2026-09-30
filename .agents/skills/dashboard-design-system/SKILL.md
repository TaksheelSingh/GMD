---
name: dashboard-design-system
description: >-
  Comprehensive design system, UI/UX specification, and structural guidelines for building Taksheel Rawat's custom modern web dashboards.
  Use this skill whenever creating, refactoring, or styling dashboard pages, sidebar navigation, KPI cards, tables, light/dark themes, and footer layouts.
---

# Taksheel Rawat's Dashboard Design System & Architecture Guide

This skill defines the signature UI/UX patterns, layout math, animation logic, color systems, and component structures required for all dashboard projects.

---

## 1. Core Principles & Minimalism Rules

- **Zero AI Slop / Zero Emoji Clutter**: No emojis in navigation links, buttons, headers, or table rows.
- **Minimal Text & Icons**: Status indicators use pulsating dots; table action buttons use compact circular `i` pills. Avoid verbose wording inside table cells.
- **Pitch Black Dark Mode**: Dark mode must use pure true black (`#000000`), zero purple/slate-blue hues (`#0f172a`). Light mode uses pure white (`#ffffff`).
- **3-Column Synced Layout**: Symmetric, height-matched 3-column grid (`2.2fr 1fr 1fr`).
- **Bottom-Anchored Footer**: Dashed border line sitting directly above the copyright tagline, pushed to the very bottom of the workspace via flexbox.

---

## 2. Color System & Theme Variables (`index.css`)

```css
:root, .dark {
  --bg-app: #000000;
  --bg-sidebar: #000000;
  --bg-card: #0a0a0c;
  --bg-card-inner: #161618;
  --bg-danger-subtle: rgba(255, 69, 58, 0.12);
  --border-color: rgba(255, 255, 255, 0.12);
  --border-hover: rgba(255, 255, 255, 0.25);
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --accent-blue: #0a84ff;
  --pill-active-bg: #161618;
  --pill-active-text: #0a84ff;
  --badge-bg: #111113;
  --table-hover: rgba(255, 255, 255, 0.05);
}

.light {
  --bg-app: #f8fafc;
  --bg-sidebar: #ffffff;
  --bg-card: #ffffff;
  --bg-card-inner: #f1f5f9;
  --bg-danger-subtle: #fef2f2;
  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --accent-blue: #0284c7;
  --pill-active-bg: #ffffff;
  --pill-active-text: #059669;
  --badge-bg: #f1f5f9;
  --table-hover: #f1f5f9;
}
```

---

## 3. Sidebar Navigation Architecture (`Sidebar.tsx`)

### Specifications:
- **Desktop Dimensions**: `width: 240px`, `padding: 24px 18px`, sticky `100vh`.
- **Top Header**: Brand title (e.g., `watcher.`) with the **Sun/Moon Theme Toggle** button placed right beside it.
- **Navigation Links**: Text-only pill buttons (`Dashboard`, `In-Site Alerts`) with `.sidebar-nav-pill` animation.
- **Bottom Status Badge**: Fully rounded (`rounded-full`) user profile pill:
  - Circular initials avatar (e.g. `TR`)
  - Full Name & Role (`Taksheel Rawat`, `Watcher User`)
  - Pulsating live connection dot (`bg-[#30D158] live-dot-blinking`)

### Nav Pill Hover Animation (`index.css`):
```css
.sidebar-nav-pill {
  width: 100%;
  padding: 10px 20px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  background-color: transparent;
  color: var(--text-secondary);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-nav-pill:not(.active):hover {
  background-color: var(--bg-card-inner);
  border-color: var(--border-hover);
  color: var(--text-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px -2px rgba(0, 0, 0, 0.25);
}

.sidebar-nav-pill.active {
  background-color: var(--bg-card-inner);
  border-color: var(--border-hover);
  color: var(--pill-active-text);
  font-weight: 700;
}
```

---

## 4. Main Workspace & Header Section

### Header & Sentence Placement:
- Title: `h1` bold tracking-tight text (`Dashboard`).
- Sentence directly below title: *"Real-time leave balances, half-day allocations, and monthly attendance tracking."* (or domain context sentence).
- **CRITICAL**: **No border or dividing line** below the sentence separating it from the cards.

### Layout Container:
```css
.main-workspace {
  width: calc(100% - 240px);
  padding: 24px;
  flex: 1 1 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
```

---

## 5. 3-Column Synced KPI Grid & Cards (`.dashboard-3col-kpi-grid`)

### Layout Math:
- **Col 1 (2.2fr)**: Repository / Data Matrix Card with inline search bar in header and internal scrolling (`max-h-[420px]`).
- **Col 2 (1fr)**: Stack of 3 small KPI cards.
- **Col 3 (1fr)**: Stack of 3 small KPI cards.

### Card Hover Effect (`.kpi-hover-card`):
```css
.kpi-hover-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 16px 18px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.2, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.kpi-hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.35);
  border-color: var(--border-hover);
}
```

---

## 6. Table & Matrix Specifications

- **Bold Headers**: Column headers are uppercase, bold mono typography (`font-extrabold text-xs uppercase tracking-wider`).
- **Header Search Bar**: Positioned inline at the right end of the matrix header.
- **Status Column**:
  - Render **ONLY a pulsating dot** (`live-dot-blinking`) with NO text wordings.
  - Green for passed (`bg-[#30D158]`), Red for failed (`bg-[#FF453A]`).
- **Action Column**:
  - Render a **circular button with an italic `i`** (no wordings).
  - Red (`bg-[#FF453A]`) for Inspect, Green (`bg-[#30D158]`) for Logs, Yellow (`bg-[#FF9F0A]`) for Inspect Trace.

```tsx
/* Status Cell */
<span className="inline-flex items-center justify-center p-1.5 rounded-full bg-[#FF453A]/15 border border-[#FF453A]/30">
  <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A] live-dot-blinking" />
</span>

/* Action Cell */
<button className="w-7 h-7 rounded-full bg-[#FF453A] text-white inline-flex items-center justify-center font-serif italic font-bold text-xs shadow-sm transition-all hover:scale-110 ml-auto">
  i
</button>
```

---

## 7. Bottom-Anchored Footer Layout

The footer must sit anchored at the **very bottom of the workspace** (`mt-auto`), with the dashed border line rendered **directly above** the copyright tagline.

```tsx
<footer className="mt-auto pt-4 pb-4 border-t border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)] space-y-1">
  <p className="font-semibold text-[var(--text-primary)]">
    &copy; 2026 Watcher. All pipelines accounted for. Zero broken builds, zero deployment headaches.
  </p>
  <p className="text-[11px] text-[var(--text-muted)]">
    Made by Taksheel Rawat
  </p>
  <p className="text-[11px] text-[var(--text-muted)]">
    Telemetry monitored by Watcher Engine
  </p>
</footer>
```

---

## 8. Verification Checklist for New Dashboards

1. [ ] Check that left panel width is strictly `240px` and text-only.
2. [ ] Verify `watcher.` title has the theme toggle directly beside it.
3. [ ] Ensure bottom-left badge is `rounded-full` with blinking status dot.
4. [ ] Confirm title sentence has no border/line separating it from KPI cards.
5. [ ] Verify 3-column grid (`2.2fr 1fr 1fr`) with `.kpi-hover-card` hover lift.
6. [ ] Confirm status cells show pulsating dots only (no wordings).
7. [ ] Confirm action cells show circular `i` pills (red/green/yellow).
8. [ ] Verify dark mode is true pitch black (`#000000`).
9. [ ] Confirm footer is anchored at the bottom with dashed top border line.
