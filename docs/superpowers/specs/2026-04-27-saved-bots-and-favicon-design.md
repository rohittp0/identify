# Saved Bots List on Home + Favicon Update

**Date:** 2026-04-27
**Status:** Approved (pending implementation)

## Goal

1. Replace the home page's single-token entry experience with a list of previously-connected bots. Users can pick a saved bot to jump straight into its dashboard, add a new one, or forget one.
2. Replace the default Vite favicon with the 🕵️‍♂️ detective emoji to match the README's branding.

## Non-goals

- Adding a test framework.
- Sharing chat history across bots.
- Encrypting tokens at rest. They remain in `localStorage` — the README already states this is the model.
- Sync across browsers/devices.

## Data model

`useStore` becomes a multi-bot store. The localStorage key (`identify_bot_data`) is reused; the value shape changes to:

```js
{
  bots: {
    [username]: {
      token,                 // string
      bot,                   // Telegram getMe result (id, first_name, username, ...)
      chats: { [id]: chat }  // per-bot map (same shape as today's top-level `chats`)
    }
  }
}
```

There is no top-level "active bot" pointer. The Dashboard's URL (`?bot=<username>`) is the single source of truth for which bot a given tab is viewing. Persisting an active pointer would race with the URL on mount and could route polling writes to the wrong bot.

### Hook surface

- `bots` — the object above.
- `getBot(username)` — returns `bots[username]` or `undefined`. Convenience for Dashboard.
- `addBot(token, bot)` — upserts `bots[bot.username]`. On upsert, refreshes `token` and `bot`; preserves existing `chats`. Returns the saved entry.
- `addChats(username, newChats)` — appends only-new chats into `bots[username].chats`. No-op if the username is not present (defensive against forget-then-poll race).
- `forgetBot(username)` — deletes `bots[username]`.

### Migration

On first load, after reading localStorage:

1. If shape is the new shape (has `bots` key), use as-is.
2. If shape is the old shape (`{ token, bot, chats }`) AND `bot` is non-null: produce
   `{ bots: { [bot.username]: { token, bot, chats: chats || {} } } }`
   and write it back.
3. Otherwise initialize `{ bots: {} }`.

The parse is wrapped in `try/catch` — corrupt JSON falls back to step 3. No orphan keys are created. The migration is idempotent.

### Sort order

Saved bots are listed alphabetically by `bot.first_name` using case-insensitive `localeCompare` — matches the Dashboard's chat sort.

## Home page UX

Two states.

### Empty state (no saved bots)

Unchanged from today. The existing card renders: key icon, "Identify" headline, helper copy, password input, "Connect Bot" button. Successful connect → `addBot` → navigate to `/dashboard?bot=<username>`.

### Populated state (≥1 saved bot)

A `Card` of `maxWidth: 480px` titled **"Your bots"** replaces the empty-state card. (Today's empty card is 400px; 480px gives the rows breathing room without becoming a wide-screen layout.)

- **Header row:** title "Your bots" on the left; on the right, an **"+ Add bot"** action — rendered as a borderless text button (not the primary `Button` component, which is full-width and bold) using `var(--text-muted)` color, ~`0.875rem` font-size. Toggles the add-bot section.
- **Saved bots list** (alphabetical). Each row:
  - Initial-circle avatar — `var(--primary-color)` background, white text, first letter of `first_name`. Same style as Dashboard header.
  - `first_name` (primary text), `@username` (muted, smaller) on the next line.
  - Trash icon (`Trash2` from lucide-react) on the right. Click → `window.confirm("Forget @<username>?")` → on confirm, `forgetBot(username)`. Trash click does not propagate to the row click.
  - Clicking the row anywhere else → `navigate('/dashboard?bot=' + username)`.
  - Hover state: row background flips from `var(--surface-color)` to `var(--surface-color-hover)`, matching the Dashboard table row hover.
- **Add-bot section** — collapsed by default. When "+ Add bot" is clicked, expands to reveal the same `Input` (password, key icon) + `Button` ("Connect Bot") pair as today, with the same submit flow. On success, the section collapses again automatically (the new bot now appears in the list).

No new design tokens or CSS variables. Re-uses `Card`, `Input`, `Button` from `components/ui.jsx`.

## Dashboard changes

### Header buttons

Replace today's single "Logout" button with two:

- **"Switch bot"** — `ArrowLeftRight` icon, neutral surface (`var(--surface-color)`), regular text color. Calls `navigate('/')`. Saved entry is preserved (no state mutation needed — there's no active pointer to clear).
- **"Forget bot"** — `Trash2` icon, red (`#ef4444` background, white text — same as today's Logout). Confirms via `window.confirm("Forget @<username>? This removes its saved chats.")`; on confirm, `forgetBot(bot.username)`, then `navigate('/')`.

The "Polling Active / Polling Paused" toggle is unchanged.

### Routing / guard

Dashboard reads `?bot=<username>` from search params. Behavior:

1. On render: look up `getBot(username)`. If absent → `<Navigate to="/" replace />`.
2. If present, pull `token`, `bot`, `chats` directly from that entry.

The polling effect's shape is unchanged. It now calls `addChats(username, newChats)` with the URL-scoped username. No active-pointer state is involved, so there is no race between mount and the first poll.

## Favicon

- New file: `public/favicon.svg` — a 64×64 SVG with a single centered `<text>` element rendering 🕵️‍♂️. The browser renders the user's OS emoji font; this is intentional and acceptable.
- `index.html` changes:
  - `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` (was `/vite.svg`).
  - `<title>Identify</title>` (was `identify`).
- Delete `public/vite.svg` — unused after this change. Verified by grep before deletion.

## Components affected

- `src/hooks/useStore.js` — full rewrite for multi-bot shape and migration.
- `src/pages/Home.jsx` — empty-state vs populated-state split, plus the saved-bots list rendering and "+ Add bot" toggle. Hooks: `bots`, `addBot`, `forgetBot`.
- `src/pages/Dashboard.jsx` — swap header buttons, update guard to read via `getBot(username)`, replace `clear()` with `forgetBot(bot.username)` + `navigate('/')`. Polling calls `addChats(username, ...)`.
- `src/components/ui.jsx` — no changes expected. If a new lightweight row component is needed, it can live as a local component inside `Home.jsx` rather than expanding the shared UI module.
- `index.html` — favicon link + title.
- `public/favicon.svg` — new file.
- `public/vite.svg` — deleted.

## Edge cases

- **Re-adding a saved bot:** `addBot` merges. Token and metadata refresh; chats are preserved.
- **Forgetting a bot from one tab while its dashboard is open in another tab:** the dashboard's `getBot(username)` returns `undefined` on the next render and redirects home. The poll-in-flight `addChats` call is a no-op because the username is gone.
- **Empty `first_name`:** Telegram bots always have a first name, but the avatar falls back to "B" (matching today's Dashboard fallback).
- **Unknown username in URL:** redirect home (existing behavior, just sourced differently).
- **localStorage read failure / parse error:** treat as "initialize empty" — same posture as today's `JSON.parse(saved)` (which would throw and crash). The new code wraps the parse in a try/catch and falls back to empty state. (Small bonus robustness improvement, in scope.)

## Testing & verification

No test framework is added. Verification:

- `npm run lint` clean.
- `npm run build` clean.
- Manual smoke in `npm run dev`:
  1. Fresh localStorage → home shows empty-state form → connect a bot → lands on dashboard → polling discovers chats.
  2. With saved bots → home renders list → click a row → dashboard renders that bot's chats from storage.
  3. Switch bot → returns home, list intact. Reconnecting the same bot does not duplicate (existing chats preserved).
  4. Forget from home list AND from dashboard — entry disappears, chats gone, redirect home.
- Migration check: pre-seed `localStorage` with `{ token: "...", bot: { username, first_name, ... }, chats: { ... } }`, reload, verify it folds into the new shape and the bot still works.
