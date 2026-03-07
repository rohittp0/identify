const BASE_URL = 'https://api.telegram.org/bot';

export const getMe = async (token) => {
    const response = await fetch(`${BASE_URL}${token}/getMe`);
    const data = await response.json();
    if (!data.ok) throw new Error(data.description || 'Invalid token');
    return data.result;
};

export const getUpdates = async (token, offset = 0) => {
    const response = await fetch(`${BASE_URL}${token}/getUpdates?offset=${offset}&timeout=10`);
    const data = await response.json();
    if (!data.ok) throw new Error(data.description || 'Failed to fetch updates');
    return data.result;
};
