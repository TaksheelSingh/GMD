---
name: dashboard-design-system
description: >-
  Master design system, component architecture, UI/UX specification, and structural guidelines for building Taksheel Rawat's custom web dashboards.
  Use this skill whenever creating, refactoring, styling, or auditing dashboard layouts, sidebars, KPI cards, data tables, light/dark mode themes, and footer placement.
---

# Taksheel Rawat's Master Dashboard Design System & Architecture Guide

This document defines the exact, authoritative UI/UX standards, layout mathematics, hover logic, color systems, typography rules, and component architectures required for all dashboard projects.

---

## 1. Core Principles & Minimalism Rules

- **Zero Emojis / Zero AI Slop**: No emojis in navigation links, section headers, buttons, table cells, or status indicators.
- **Ultra-Minimal Wording**: Table status cells show ONLY pulsating dots; action cells show ONLY circular `i` pills. Never put verbose text inside status/action cells.
- **Short KPI Card Titles**: Use single, crisp uppercase titles (`PASS RATE`, `BROKEN REPOS`, `TOTAL RUNS`, `RECOVERY MTTR`, `UNREAD ALERTS`, `ACTIVE REPOS`). No long bullet subtitles.
- **Pitch Black Dark Theme**: Dark mode must use pure true black (`#000000`) for sidebar and workspace background—absolutely zero purple or slate-blue tints (`#0f172a` / `#090d16`).
- **3-Column Synced Grid**: Symmetric, height-matched grid (`2.2fr 1fr 1fr`).
- **Bottom-Anchored Footer**: Dashed separator line sits directly above the copyright tagline, pushed to the very bottom of the workspace.

---

## 2. Color System & Theme Variables (`index.css`)

```css
:root, .dark {
  --bg-app: #000000;          /* Pure pitch black workspace */
  --bg-sidebar: #000000;      /* Pure pitch black sidebar */
  --bg-card: #0a0a0c;         /* Deep black card background */
  --bg-card-inner: #161618;   /* Sleek dark zinc inner surface */
  --bg-danger-subtle: rgba(255, 69, 58, 0.12);
  --border-color: rgba(255, 255, 255, 0.12);
  --border-hover: rgba(255, 255, 255, 0.25);
  --text-primary: #ffffff;    /* Pure crisp white text */
  --text-secondary: #a1a1aa;  /* Muted zinc text */
  --text-muted: #71717a;      /* Subdued label text */
  --accent-blue: #0a84ff;
  --pill-active-bg: #161618;
  --pill-active-text: #0a84ff;
  --badge-bg: #111113;
  --table-hover: rgba(255, 255, 255, 0.05);
}

.light {
  --bg-app: #f8fafc;
  --bg-sidebar: #ffffff;      /* Pure white sidebar */
  --bg-card: #ffffff;         /* Pure white card background */
  --bg-card-inner: #f1f5f9;   /* Soft slate inner surface */
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

## 3. Sidebar Navigation & Brand Architecture (`Sidebar.tsx`)

### Layout Specifications:
- **Desktop Dimensions**: `width: 240px`, `padding: 24px 18px`, sticky `100vh`.
- **Top Brand Header**: Brand title (e.g., `watcher.`) with the **Sun/Moon Theme Toggle** button placed right beside it.
- **Nav Links**: Text-only pill buttons (`Dashboard`, `In-Site Alerts`). Strictly NO icons, logos, or emojis in menu links.
- **Bottom Status Badge**: Fully rounded (`rounded-full`) user profile card:
  - Circular initials avatar (`TR`)
  - Full Name & Role (`Taksheel Rawat`, `Watcher User`)
  - Blinking live connection dot (`bg-[#30D158] live-dot-blinking`)

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
  cursor: pointer;
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

### Header & Description Sentence:
- Title: `h1` bold tracking-tight text (`Dashboard`).
- Sentence directly below title: *"Real-time leave balances, half-day allocations, and monthly attendance tracking."* (or domain context sentence).
- **CRITICAL DESIGN RULE**: **NO border or line below the sentence** separating it from the KPI cards.

### Flexbox Workspace Container:
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

## 5. 3-Column Synced KPI Grid & Card Lift Logic

### Grid Math:
- **Col 1 (2.2fr)**: Repository Matrix / Data Table Card with inline right-aligned search bar and internal table scrolling (`max-h-[420px]`).
- **Col 2 (1fr)**: Stack of 3 small KPI cards.
- **Col 3 (1fr)**: Stack of 3 small KPI cards.

### Short KPI Card Titles & 0-Data Defaults:
- Card 1: `PASS RATE` (Starts at `0%` when no data exists)
- Card 2: `BROKEN REPOS` (Starts at `0`)
- Card 3: `TOTAL RUNS` (Starts at `0`)
- Card 4: `RECOVERY MTTR` (Starts at `0m` when no data exists)
- Card 5: `UNREAD ALERTS` (Starts at `0`)
- Card 6: `ACTIVE REPOS` (Starts at `0`)

### Card Hover Lift (`.kpi-hover-card`):
```css
.kpi-hover-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 16px 18px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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

- **Bold Headers**: Table column headers must be uppercase, bold mono typography (`font-extrabold text-xs uppercase tracking-wider`).
- **Inline Search Bar**: Placed right-aligned in the card header (beside `4 Repos`).
- **Status Cells**: Render **ONLY a pulsating live dot** (`live-dot-blinking`) with NO text wordings.
  - Green dot (`bg-[#30D158]`) for passed.
  - Red dot (`bg-[#FF453A]`) for failed.
- **Action Cells**: Render **ONLY a circular button with an italic `i`** (no wordings).
  - Red circle (`bg-[#FF453A]`) for Inspect.
  - Green circle (`bg-[#30D158]`) for Logs.
  - Yellow circle (`bg-[#FF9F0A]`) for Inspect Trace.
  - Hover effect: `hover:scale-110`.

```tsx
/* Status Cell Component */
<td className="py-3 px-2 whitespace-nowrap">
  <span className="inline-flex items-center justify-center p-1.5 rounded-full bg-[#30D158]/15 border border-[#30D158]/30" title="Status: Passed">
    <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] live-dot-blinking" />
  </span>
</td>

/* Action Cell Component */
<td className="py-3 px-2 text-right whitespace-nowrap">
  <button className="w-7 h-7 rounded-full bg-[#FF453A] hover:bg-[#E0382F] text-white inline-flex items-center justify-center font-serif italic font-bold text-xs shadow-sm transition-all hover:scale-110 ml-auto" title="Inspect Trace">
    i
  </button>
</td>
```

---

## 7. Bottom-Anchored Footer Layout

The footer must sit anchored at the **very bottom of the workspace** (`mt-auto`), with the dashed top border line rendered **directly above** the copyright tagline.

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

## 8. Comprehensive Audit Checklist for Future Dashboards

- [ ] Left sidebar width is `240px` and text-only (no logos/emojis).
- [ ] Theme toggle button is placed directly beside brand name (`watcher.`).
- [ ] Bottom-left user profile pill is `rounded-full` with blinking live dot.
- [ ] Description sentence below title has NO border line separating it from cards.
- [ ] 3-column synced grid uses `2.2fr 1fr 1fr` ratio with equal height matching.
- [ ] All 6 KPI card titles are short single labels (`PASS RATE`, `BROKEN REPOS`, etc.).
- [ ] All 6 KPI metrics default to `0` / `0%` / `0m` when no database data exists.
- [ ] `.kpi-hover-card` smooth `translateY(-4px)` lift effect is applied to all cards.
- [ ] Table status column displays pulsating live dots only (no wordings).
- [ ] Table action column displays circular `i` pills only (red/green/yellow, no wordings).
- [ ] Dark theme is true pitch black (`#000000`), zero purple/slate-blue tints.
- [ ] Workspace footer is anchored at the bottom (`mt-auto`) with dashed line directly above copyright text.
