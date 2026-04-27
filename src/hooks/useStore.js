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
