# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Notion-connected daily task manager deployed on Vercel. It consists of a single-page frontend and a serverless API proxy.

## Architecture

```
public/index.html       ← entire frontend: all CSS, HTML, and JS in one file
api/notion.js           ← Vercel serverless function that proxies Notion API calls
api/cron-notify.js      ← Vercel cron: deadline push notification at 23:50 KST (14:50 UTC)
api/cron-morning.js     ← Vercel cron: morning push notification at 09:00 KST (00:00 UTC)
api/push-subscribe.js   ← manages Web Push subscriptions in Vercel Blob
public/emoji/           ← Tossface SVG emoji files (u<codepoint>.svg naming)
vercel.json             ← rewrites /api/notion/:path+ → /api/notion?path=, cron schedules
```

**No build step.** Changes to `public/index.html` are live after `git push` → Vercel deploys automatically.

## Key Design Decisions

### API Proxy
`api/notion.js` is an ESM serverless function. The frontend sends `X-Notion-Token` header; the proxy passes it to Notion's API. Credentials are never bundled in the frontend — they come from `localStorage` (user-entered) and are forwarded per-request.

### State Management
All state lives in global JS variables and `localStorage` (no framework):
- `tasks[]` — Notion pages parsed by `parsePage()`
- `todayIds[]` + `todayConfirmed` — today's selected tasks, keyed by date in `localStorage`
- `recurringTasks[]` — recurring templates in `localStorage` as `recurring_tasks`
- `carryOverIds` — global `Set` of task IDs carried over from previous day (not completed)
- `editingId` — Notion page ID being edited (null for new task)
- `editingRecurringId` — matched recurring template ID when editing a task by title

### Priority Mapping
UI uses `'일반'`/`'긴급'`. Notion DB stores `'보통'`/`'긴급'`/`'낮음'`.
- `toNotionPriority(p)` maps outbound: `일반 → 보통`, `긴급 → 긴급`
- `parsePage()` maps inbound: `보통/낮음 → 일반`, `긴급 → 긴급`

### Notion Property Names
Korean property names expected in the DB: `이름`, `우선순위`, `상태`, `마감일`, `카테고리`, `메모`, `순서`, `완료일`. English aliases are tried as fallbacks in `parsePage()`.

### Emoji/Icons
All icons are Tossface SVGs from `public/emoji/`. Never use font-based emoji — TossFaceFontMac.ttf is present but causes number rendering issues when applied globally. Use `<img class="t-emoji" src="/emoji/u<codepoint>.svg" alt="...">` inline. `.t-emoji { vertical-align: -0.25em }` aligns icons with surrounding text.

### Sidebar Layout
`.shell` uses `display: grid; grid-template-columns: auto 1fr`. Sidebar collapse animates via `min-width`/`width` transition on `.sidebar`. Desktop: toggle button in sidebar header + fixed circular button at bottom-left when collapsed. Mobile (≤680px): sidebar is `position: fixed` drawer, shown via `.mobile-open` class + overlay.

### Checkbox Visibility Rule
Checkboxes only appear in the "오늘의 할 일" list (today section). The main task list never shows checkboxes. `taskItemHTML(t, isToday, showCheckbox)` — always pass `showCheckbox=false` for the main list.

### Edit Button Visibility Rule
Edit buttons are hidden in the "오늘의 할 일" list, visible only in the main task list. `taskItemHTML` conditionally renders `<div class="task-actions">` only when `isToday` is false.

### Task Sorting (main list)
Urgent + overdue tasks sort to the top, done tasks sort to the bottom. Done tasks are never sortable to the top regardless of priority.

### 오늘의 할 일 — Single Card Layout
The today section renders as one unified card (`.today-card`) instead of individual cards:
- Outer card: `background: var(--surface)`, `border-radius: 14px`, `padding: 8px`, `gap: 4px`
- Inner rows: `border-radius: 10px`, no border/shadow, transparent background
- Hover: subtle grey background on row
- Completed tasks (`.task-done-row`) sort to the top of the list

### Carryover Detection
Tasks not completed from the previous day are marked with a 💫 icon. Dual detection strategy:
1. Notion `오늘날짜` field === yesterday
2. `localStorage('today_tasks')` from yesterday still lists the task ID

Carryover IDs are persisted in `localStorage('carryover_ids', { date, ids })` so they survive page reload (Notion field gets updated to today on load). `carryOverIds` is a global `Set`.

### 오늘의 할 일 선택 모달 — 할 일 추천
When opening the today selection modal, tasks are split into two sections:
- **할 일 추천**: tasks due today (`t.dueDate === todayKey()`), carryover tasks (`carryOverIds.has(t.id)`), urgent tasks (`t.priority === '긴급'`)
- **나머지**: all other incomplete tasks

If no recommended tasks exist, the full list renders without section labels.
Always use `todayKey()` (local timezone) not `new Date().toISOString().slice(0,10)` (UTC) for date comparison.

### Push Notifications
Two independent notification types, each with its own Vercel Blob subscription list:
- **마감 알림** (`push-subscriptions.json`): cron at 23:50 KST, notifies incomplete today tasks
- **모닝 알림** (`push-subscriptions-morning.json`): cron at 09:00 KST, daily morning prompt

`/api/push-subscribe?type=morning|deadline` — `type` query param selects which list.
Frontend toggle state persisted in `localStorage('push_morning')` / `localStorage('push_deadline')`.
`sub.unsubscribe()` only called when both types are toggled off simultaneously.
Toggles live in the settings dropdown → 알림 modal (two rows, independent).

### Dark Mode
Three modes: 시스템 / 라이트 / 다크. Persisted in `localStorage('theme')`.
- Applied immediately via inline `<script>` before CSS loads (prevents flash)
- `document.documentElement` gets `data-theme="dark"|"light"` attribute
- Dark palette = inverted grey scale from the existing token set:
  - `--grey50` ↔ `--grey900`, `--grey100` ↔ `--grey800`, etc.
  - `--grey850: #262e3a` added as midpoint between grey900/grey800 (used as `--surface` in dark)
  - `--surface: #262e3a`, `--bg: #191f28`, `--border: #333d4b` in dark mode
  - `--blue50`/`--blue100` overridden to dark values (`#162038`/`#1a2d52`) to avoid bright nav highlights
- Briefing card (`background: var(--grey800)`): in dark mode overridden to `#ffffff` with dark text
- Theme selector rendered as a segment control in the settings dropdown

### Background Color — Desktop vs Mobile
- Desktop: `.main` uses `var(--bg)` (grey) — both task list and history views
- Mobile (≤680px): `.main { background: var(--surface) }` — white, set via media query override
- History view previously forced `var(--surface)` via JS on mode switch — removed; now inherits from `.main`

### Date Utilities
Always use `localDateStr()` / `todayKey()` for date strings — these use `getFullYear/Month/Date()` for local timezone. Never use `toISOString().slice(0,10)` which returns UTC and will be wrong for KST users between midnight and 09:00.

### Calendar (완료 기록)
- Desktop: `grid-auto-rows: minmax(96px, auto)` then JS measures max row height and sets uniform `grid-auto-rows` inline
- Mobile: `grid-auto-rows: 80px`, chips truncated with `text-overflow: ellipsis`
- `.cal-day` needs `min-width: 0` and `min-height: 0` to prevent chip content overriding grid track sizes

### Sidebar Layout
`.shell` uses `display: grid; grid-template-columns: auto 1fr`. Sidebar collapse animates via `min-width`/`width` transition on `.sidebar`. Desktop: toggle button in sidebar header + fixed circular button at bottom-left when collapsed. Mobile (≤680px): sidebar is `position: fixed` drawer, shown via `.mobile-open` class + overlay.

## Deployment

Push to `master` → Vercel deploys automatically (connected via `.vercel/project.json`).

To test locally without Vercel CLI, open `public/index.html` directly — but Notion API calls will fail due to CORS without the proxy. Install Vercel CLI (`npm i -g vercel`) and run `vercel dev` for local proxy support.
