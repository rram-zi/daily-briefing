# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Notion-connected daily task manager deployed on Vercel. It consists of a single-page frontend and a serverless API proxy.

## Architecture

```
public/index.html   ← entire frontend: all CSS, HTML, and JS in one file
api/notion.js       ← Vercel serverless function that proxies Notion API calls
public/emoji/       ← Tossface SVG emoji files (u<codepoint>.svg naming)
vercel.json         ← rewrites /api/notion/:path+ → /api/notion?path=
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
- `editingId` — Notion page ID being edited (null for new task)
- `editingRecurringId` — matched recurring template ID when editing a task by title

### Priority Mapping
UI uses `'일반'`/`'긴급'`. Notion DB stores `'보통'`/`'긴급'`/`'낮음'`.
- `toNotionPriority(p)` maps outbound: `일반 → 보통`, `긴급 → 긴급`
- `parsePage()` maps inbound: `보통/낮음 → 일반`, `긴급 → �급`

### Notion Property Names
Korean property names expected in the DB: `이름`, `우선순위`, `상태`, `마감일`, `카테고리`, `메모`, `순서`, `완료일`. English aliases are tried as fallbacks in `parsePage()`.

### Emoji/Icons
All icons are Tossface SVGs from `public/emoji/`. Never use font-based emoji — TossFaceFontMac.ttf is present but causes number rendering issues when applied globally. Use `<img class="t-emoji" src="/emoji/u<codepoint>.svg" alt="...">` inline. `.t-emoji { vertical-align: -0.25em }` aligns icons with surrounding text.

### Sidebar Layout
`.shell` uses `display: grid; grid-template-columns: auto 1fr`. Sidebar collapse animates via `min-width`/`width` transition on `.sidebar`. Desktop: toggle button in sidebar header + fixed circular button at bottom-left when collapsed. Mobile (≤680px): sidebar is `position: fixed` drawer, shown via `.mobile-open` class + overlay.

### Checkbox Visibility Rule
Checkboxes only appear in the "오늘의 할 일" list (today section). The main task list never shows checkboxes. `taskItemHTML(t, isToday, showCheckbox)` — always pass `showCheckbox=false` for the main list.

### Task Sorting (main list)
Urgent + overdue tasks sort to the top, done tasks sort to the bottom. Done tasks are never sortable to the top regardless of priority.

## Deployment

Push to `master` → Vercel deploys automatically (connected via `.vercel/project.json`).

To test locally without Vercel CLI, open `public/index.html` directly — but Notion API calls will fail due to CORS without the proxy. Install Vercel CLI (`npm i -g vercel`) and run `vercel dev` for local proxy support.
