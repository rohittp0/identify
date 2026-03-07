import { useState, useEffect } from 'react';

const STORAGE_KEY = 'identify_bot_data';

export const useStore = () => {
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : { token: null, bot: null, chats: {} };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const setBot = (token, bot) => {
        setData((prev) => ({ ...prev, token, bot }));
    };

    const addChats = (newChats) => {
        setData((prev) => {
            const updatedChats = { ...prev.chats };
            let changed = false;
            newChats.forEach((chat) => {
                if (!updatedChats[chat.id]) {
                    updatedChats[chat.id] = chat;
                    changed = true;
                }
            });
            return changed ? { ...prev, chats: updatedChats } : prev;
        });
    };

    const clear = () => {
        setData({ token: null, bot: null, chats: {} });
    };

    return { ...data, setBot, addChats, clear };
};
