# Saved Bots List on Home + Favicon Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-bot store into a multi-bot store, add a saved-bots list to the home page (with per-row Forget and an Add-bot toggle), split the Dashboard's Logout into Switch / Forget, and replace the default Vite favicon with a 🕵️‍♂️ emoji SVG.

**Architecture:** `useStore` is rewritten with a `{ bots: { [username]: { token, bot, chats } } }` shape. The Dashboard URL (`?bot=<username>`) is the single source of truth for the active bot — there is no persisted "active" pointer. Home renders a list when at least one bot is saved, and falls back to today's empty-state form otherwise.

**Tech Stack:** React 19, Vite 7, React Router 7 (HashRouter), lucide-react icons, vanilla CSS via `index.css`. **No test framework** — the project does not have one and the spec explicitly excludes adding one. Verification is `npm run lint` + `npm run build` + manual smoke in `npm run dev`. Each task lists its expected manual checks.

**Spec:** [`docs/superpowers/specs/2026-04-27-saved-bots-and-favicon-design.md`](../specs/2026-04-27-saved-bots-and-favicon-design.md)

**Working tree:** Plan was authored on `main`. The pre-existing working tree is clean. Tasks commit directly to `main` (small project, single contributor) unless the executing engineer prefers a feature branch.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/hooks/useStore.js` | Rewrite | Multi-bot store with migration + safe parse. New API: `bots`, `getBot`, `addBot`, `addChats(username, newChats)`, `forgetBot`. |
| `src/pages/Dashboard.jsx` | Modify | Read via `getBot(botName)` from URL param. Header Logout → "Switch bot" + "Forget bot". Polling calls `addChats(botName, ...)`. |
| `src/pages/Home.jsx` | Rewrite | Two states: empty-state form (today's UI, but calls `addBot`), and populated state with saved-bots list + collapsible Add-bot section. |
| `index.html` | Modify | Swap favicon `href` to `/favicon.svg`, capitalize `<title>` to `Identify`. |
| `public/favicon.svg` | Create | 64×64 SVG with centered `<text>` rendering 🕵️‍♂️. |
| `public/vite.svg` | Delete | Unused after the favicon swap (verified by grep — no source references). |

No changes to `src/components/ui.jsx`, `src/api/telegram.js`, `src/App.jsx`, `src/main.jsx`, `src/index.css`, `src/App.css`, `src/assets/`.

---

## Task 1: Multi-bot store + Dashboard adaptation

Single task because the `useStore` API change breaks Dashboard's imports — they must move together to keep the build green. Home is briefly adapted in this task too (one-line swap of `setBot` → `addBot`), then expanded in Task 2. After this task, the app behaves exactly like today (single-bot UX) but uses the new internal shape, the new dashboard buttons, and the URL as the source of truth.

**Files:**
- Modify (rewrite): `src/hooks/useStore.js` (full file)
- Modify: `src/pages/Dashboard.jsx` (imports, guard, polling call site, header buttons)
- Modify: `src/pages/Home.jsx` (one-line: `setBot` → `addBot`)

- [ ] **Step 1: Rewrite `src/hooks/useStore.js`**

Replace the entire file with:

```js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'identify_bot_data';

const loadInitial = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bots: {} };
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { bots: {} };
    }
    if (parsed && typeof parsed === 'object' && parsed.bots && typeof parsed.bots === 'object') {
        return { bots: parsed.bots };
    }
    // Legacy single-bot shape: { token, bot, chats }
    if (parsed && parsed.bot && parsed.bot.username && parsed.token) {
        return {
            bots: {
                [parsed.bot.username]: {
                    token: parsed.token,
                    bot: parsed.bot,
                    chats: parsed.chats || {},
                },
            },
        };
    }
    return { bots: {} };
};

export const useStore = () => {
    const [data, setData] = useState(loadInitial);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const getBot = (username) => data.bots[username];

    const addBot = (token, bot) => {
        setData((prev) => {
            const existing = prev.bots[bot.username];
            return {
                bots: {
                    ...prev.bots,
                    [bot.username]: {
                        token,
                        bot,
                        chats: existing?.chats || {},
                    },
                },
            };
        });
    };

    const addChats = (username, newChats) => {
        setData((prev) => {
            const entry = prev.bots[username];
            if (!entry) return prev;
            const existing = entry.chats || {};
            const updated = { ...existing };
            let changed = false;
            for (const chat of newChats) {
                if (!updated[chat.id]) {
                    updated[chat.id] = chat;
                    changed = true;
                }
            }
            if (!changed) return prev;
            return {
                ...prev,
                bots: { ...prev.bots, [username]: { ...entry, chats: updated } },
            };
        });
    };

    const forgetBot = (username) => {
        setData((prev) => {
            if (!prev.bots[username]) return prev;
            const next = { ...prev.bots };
            delete next[username];
            return { ...prev, bots: next };
        });
    };

    return { bots: data.bots, getBot, addBot, addChats, forgetBot };
};
```

- [ ] **Step 2: Modify `src/pages/Home.jsx` — only the imports and submit handler**

Find the destructure of `useStore`:

```js
const { setBot } = useStore();
```

Replace with:

```js
const { addBot } = useStore();
```

In `handleSubmit`, find:

```js
setBot(token.trim(), botMe);
```

Replace with:

```js
addBot(token.trim(), botMe);
```

No other changes to Home in this task. The empty-state UI is unchanged in behavior: this task lets the existing single-bot home flow keep working under the new store.

- [ ] **Step 3: Modify `src/pages/Dashboard.jsx` — imports**

Top of file currently:

```js
import { LogOut, RefreshCw, Copy, CheckCircle2, MessageSquare, Hash } from 'lucide-react';
```

Replace with:

```js
import { ArrowLeftRight, Trash2, RefreshCw, Copy, CheckCircle2, MessageSquare, Hash } from 'lucide-react';
```

Currently:

```js
const { token, bot, chats, addChats, clear } = useStore();
```

Replace with:

```js
const { getBot, addChats, forgetBot } = useStore();
const entry = getBot(botName);
```

Then immediately below, replace the existing guard:

```js
if (!token || !bot || bot.username !== botName) {
    return <Navigate to="/" replace />;
}
```

with:

```js
if (!entry) {
    return <Navigate to="/" replace />;
}
const { token, bot, chats } = entry;
```

- [ ] **Step 4: Modify `src/pages/Dashboard.jsx` — polling effect**

Inside the `poll` function, find:

```js
if (newChats.length > 0) {
    addChats(newChats);
}
```

Replace with:

```js
if (newChats.length > 0) {
    addChats(botName, newChats);
}
```

Then update the `useEffect` dependency array. Currently:

```js
}, [token, lastUpdateId, isPolling, addChats]);
```

Replace with:

```js
}, [token, lastUpdateId, isPolling, addChats, botName]);
```

- [ ] **Step 5: Modify `src/pages/Dashboard.jsx` — handler split**

Find:

```js
const handleLogout = () => {
    clear();
    navigate('/');
};
```

Replace with:

```js
const handleSwitch = () => {
    navigate('/');
};

const handleForget = () => {
    if (!window.confirm(`Forget @${bot.username}? This removes its saved chats.`)) return;
    forgetBot(bot.username);
    navigate('/');
};
```

- [ ] **Step 6: Modify `src/pages/Dashboard.jsx` — header buttons JSX**

Find the existing block:

```jsx
<Button onClick={handleLogout} style={{ width: 'auto', backgroundColor: '#ef4444' }}>
    <LogOut size={18} /> Logout
</Button>
```

Replace with:

```jsx
<Button onClick={handleSwitch} style={{ width: 'auto', backgroundColor: 'var(--surface-color)', color: 'var(--text-main)' }}>
    <ArrowLeftRight size={18} /> Switch bot
</Button>
<Button onClick={handleForget} style={{ width: 'auto', backgroundColor: '#ef4444' }}>
    <Trash2 size={18} /> Forget bot
</Button>
```

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: exits 0, no errors. (Watch for unused-import warnings — `LogOut` is removed; `Navigate` is still used.)

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: exits 0, "✓ built in …".

- [ ] **Step 9: Manual smoke test**

Run: `npm run dev`. In a clean browser profile (or after `localStorage.clear()` in DevTools):

1. Home renders the empty-state card unchanged.
2. Connect a real bot token → lands on `/dashboard?bot=<username>` and starts polling.
3. Send a message to the bot → chat appears in the table.
4. Click **Switch bot** (the new button on the left) → returns to home. Verify in DevTools `Application > Local Storage` that the bot is still saved under `identify_bot_data` in the new shape: `{ "bots": { "<username>": { token, bot, chats } } }`.
5. Manually navigate back to `/dashboard?bot=<username>` (URL bar) → dashboard re-renders with the same chats from storage.
6. Click **Forget bot** → confirm prompt → returns home, localStorage `bots` is empty.
7. Migration smoke: in DevTools, set `localStorage.identify_bot_data` to the legacy shape — `{"token":"FAKE","bot":{"id":1,"first_name":"X","username":"xbot"},"chats":{}}` — reload. Verify the storage value becomes the new `{ "bots": { "xbot": { ... } } }` shape after the next state update (e.g. visit any page once).

- [ ] **Step 10: Commit**

```bash
git add src/hooks/useStore.js src/pages/Dashboard.jsx src/pages/Home.jsx
git commit -m "refactor: multi-bot useStore with URL as active source

Rewrite useStore to a { bots: { [username]: { token, bot, chats } } }
shape, with migration from the legacy single-bot layout. Dashboard
reads the active bot via getBot(botName) using the URL ?bot= param,
and polling calls addChats(botName, newChats). Logout splits into
Switch bot (no state change) and Forget bot (removes the entry).

Home temporarily uses addBot in place of setBot; the saved-bots list
UI lands in the next commit."
```

---

## Task 2: Home — saved-bots list + Add-bot toggle

**Files:**
- Modify (rewrite): `src/pages/Home.jsx`

- [ ] **Step 1: Rewrite `src/pages/Home.jsx`**

Replace the entire file with:

```jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Card, Input, Button } from '../components/ui';
import { getMe } from '../api/telegram';
import { useStore } from '../hooks/useStore';

const Home = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { bots, addBot, forgetBot } = useStore();

    const sortedBots = useMemo(
        () =>
            Object.values(bots)
                .map((entry) => entry.bot)
                .sort((a, b) => (a.first_name || '').localeCompare(b.first_name || '', undefined, { sensitivity: 'base' })),
        [bots],
    );
    const hasBots = sortedBots.length > 0;
    const [showAdd, setShowAdd] = useState(!hasBots);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token.trim()) {
            setError('Please enter a bot token');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const botMe = await getMe(token.trim());
            addBot(token.trim(), botMe);
            navigate(`/dashboard?bot=${botMe.username}`);
        } catch (err) {
            setError(err.message || 'Invalid bot token');
        } finally {
            setLoading(false);
        }
    };

    const handleForget = (e, username) => {
        e.stopPropagation();
        if (!window.confirm(`Forget @${username}?`)) return;
        forgetBot(username);
    };

    const handlePick = (username) => {
        navigate(`/dashboard?bot=${username}`);
    };

    if (!hasBots) {
        // Empty state — original layout, unchanged.
        return (
            <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
                <Card style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-color)',
                            border: '1px solid var(--surface-border)',
                            marginBottom: '1rem',
                            color: 'var(--primary-color)',
                        }}>
                            <KeyRound size={32} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Identify</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Enter your Telegram bot token to discover added chats.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <Input
                                icon={KeyRound}
                                type="password"
                                placeholder="123456789:ABCdefGhI..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>
                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'left' }}>
                                {error}
                            </div>
                        )}
                        <Button type="submit" isLoading={loading}>
                            Connect Bot <ArrowRight size={18} />
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }

    // Populated state — list-first layout.
    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
            <Card style={{ maxWidth: '480px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Your bots</h1>
                    <button
                        type="button"
                        onClick={() => setShowAdd((v) => !v)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                        }}
                    >
                        <Plus size={16} /> Add bot
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sortedBots.map((b) => (
                        <div
                            key={b.username}
                            role="button"
                            tabIndex={0}
                            onClick={() => handlePick(b.username)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handlePick(b.username);
                                }
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-color-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-color)')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                background: 'var(--surface-color)',
                                border: '1px solid var(--surface-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'var(--transition)',
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--primary-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                            }}>
                                {b.first_name?.[0] || 'B'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {b.first_name}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    @{b.username}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => handleForget(e, b.username)}
                                aria-label={`Forget @${b.username}`}
                                title={`Forget @${b.username}`}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'inline-flex',
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {showAdd && (
                    <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--surface-border)' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <Input
                                icon={KeyRound}
                                type="password"
                                placeholder="123456789:ABCdefGhI..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>
                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}
                        <Button type="submit" isLoading={loading}>
                            Connect Bot <ArrowRight size={18} />
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default Home;
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exits 0, no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`. With at least one bot already saved (carry over from Task 1, or connect one fresh):

1. Home renders "Your bots" with a row per saved bot, alphabetical by `first_name`.
2. Hover over a row — background lightens to `--surface-color-hover`.
3. Click a row (not the trash icon) — navigates to that bot's dashboard.
4. Back on home, click the trash icon on a row — confirm prompt — bot disappears from list and from `localStorage.identify_bot_data`.
5. Click "+ Add bot" — token form expands. Enter another valid token → bot is added → land on dashboard. Return to home → both bots are listed.
6. Forget every bot → home automatically reverts to the empty-state layout (single-card, key-icon).
7. Tab to a row using keyboard → press Enter → navigates to the dashboard. (Accessibility check.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: saved bots list on home page

Home now renders a 'Your bots' list when one or more bots are saved,
with per-row Forget and a collapsible Add-bot section. Empty state
falls back to the original single-token form."
```

---

## Task 3: Favicon swap

**Files:**
- Create: `public/favicon.svg`
- Modify: `index.html` (favicon `<link>` and `<title>`)
- Delete: `public/vite.svg`

- [ ] **Step 1: Create `public/favicon.svg`**

Write this exact content to the new file:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <text x="50%" y="50%" font-size="56" text-anchor="middle" dominant-baseline="central">🕵️‍♂️</text>
</svg>
```

- [ ] **Step 2: Update `index.html`**

Find:

```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

Replace with:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

Find:

```html
<title>identify</title>
```

Replace with:

```html
<title>Identify</title>
```

- [ ] **Step 3: Verify `public/vite.svg` is unused, then delete**

Run: `grep -rn "vite.svg" .` (from project root, ignoring `node_modules` and `dist`).

Expected: zero matches in `src/`, `index.html`, `public/`. (Matches inside `node_modules/` or `dist/` are pre-existing build artifacts — ignore.)

If clean, delete:

```bash
rm public/vite.svg
```

If grep finds any unexpected reference, stop and surface it — do not delete.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exits 0. Confirm `dist/favicon.svg` is in the output and `dist/vite.svg` is not.

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`. In a fresh tab (or after a hard refresh, Cmd-Shift-R):

1. Browser tab title reads "Identify" (capital I).
2. Browser tab favicon shows the 🕵️‍♂️ emoji (rendered using your OS emoji font — exact look varies by platform; just confirm it is the detective emoji and not the Vite logo).
3. Visit `http://localhost:5173/vite.svg` — expect 404. Visit `http://localhost:5173/favicon.svg` — expect the SVG.

- [ ] **Step 7: Commit**

```bash
git add public/favicon.svg index.html
git rm public/vite.svg
git commit -m "chore: replace vite favicon with detective emoji

Swap public/vite.svg for public/favicon.svg (a 64x64 SVG rendering the
🕵️‍♂️ emoji). Capitalize <title> to 'Identify'."
```

---

## Self-review

**Spec coverage:**
- Data model — Task 1, Step 1.
- Hook surface (`bots`, `getBot`, `addBot`, `addChats(username, newChats)`, `forgetBot`) — Task 1, Step 1.
- Migration (legacy single-bot → multi) — Task 1, Step 1 (`loadInitial`).
- Sort by `first_name` (case-insensitive) — Task 2, Step 1 (`sortedBots` memo, `localeCompare` with `sensitivity: 'base'`).
- Home empty state — Task 2, Step 1 (`if (!hasBots)` branch).
- Home populated state (`maxWidth: 480px` card, "+ Add bot" toggle, alphabetical rows, trash icon, hover tokens) — Task 2, Step 1.
- Dashboard guard via `getBot(botName)` — Task 1, Step 3.
- Dashboard polling `addChats(botName, newChats)` — Task 1, Step 4.
- Dashboard "Switch bot" + "Forget bot" buttons — Task 1, Steps 5–6.
- Favicon SVG, `index.html` link + title, `vite.svg` deletion — Task 3.

**Placeholder scan:** No TBDs, no "implement later", no "similar to Task N", no vague "handle errors". Every code-changing step has the literal code.

**Type / signature consistency:**
- `addBot(token, bot)` signature is the same in Task 1 (Home one-liner) and Task 2 (rewritten Home).
- `addChats(username, newChats)` is consistent between `useStore` definition (Task 1, Step 1), Dashboard call site (Task 1, Step 4), and the spec.
- `forgetBot(username)` is consistent in `useStore`, Dashboard `handleForget`, and Home `handleForget`.
- `getBot(username)` is only consumed by Dashboard.
- Lucide icons referenced (`ArrowLeftRight`, `Trash2`, `Plus`, `KeyRound`, `ArrowRight`, `RefreshCw`, `Copy`, `CheckCircle2`, `MessageSquare`, `Hash`) all exist in `lucide-react@^0.577`.
