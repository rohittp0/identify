import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Copy, CheckCircle2, MessageSquare, Hash } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useStore } from '../hooks/useStore';
import { getUpdates } from '../api/telegram';

const POLLING_INTERVAL = 3000;

const Dashboard = () => {
    const [searchParams] = useSearchParams();
    const botName = searchParams.get('bot');
    const navigate = useNavigate();
    const { token, bot, chats, addChats, clear } = useStore();

    const [isPolling, setIsPolling] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdateId, setLastUpdateId] = useState(0);
    const [copiedId, setCopiedId] = useState(null);

    // If URL doesn't match stored bot or token is missing, redirect home
    if (!token || !bot || bot.username !== botName) {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        let timeoutId;
        let isActive = true;

        const poll = async () => {
            if (!isPolling) return;
            try {
                const updates = await getUpdates(token, lastUpdateId + 1);

                if (isActive && updates.length > 0) {
                    const newLastUpdateId = Math.max(...updates.map(u => u.update_id));
                    setLastUpdateId(newLastUpdateId);

                    const newChats = [];
                    for (const update of updates) {
                        // Find chat either in message or my_chat_member
                        const chat = update.message?.chat || update.my_chat_member?.chat || update.channel_post?.chat;
                        if (chat) {
                            newChats.push({
                                id: chat.id,
                                name: chat.title || chat.first_name || chat.username || 'Unknown Chat',
                                type: chat.type,
                            });
                        }
                    }
                    if (newChats.length > 0) {
                        addChats(newChats);
                    }
                }
                setError('');
            } catch (err) {
                if (isActive) setError('Polling failed... retrying.');
            } finally {
                if (isActive && isPolling) {
                    timeoutId = setTimeout(poll, POLLING_INTERVAL);
                }
            }
        };

        poll();

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, [token, lastUpdateId, isPolling, addChats]);

    const handleLogout = () => {
        clear();
        navigate('/');
    };

    const copyToClipboard = (id) => {
        navigator.clipboard.writeText(id.toString());
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const sortedChats = useMemo(() => {
        return Object.values(chats).sort((a, b) => a.name.localeCompare(b.name));
    }, [chats]);

    return (
        <div className="container" style={{ maxWidth: '1000px', paddingTop: '4rem', paddingBottom: '4rem' }}>

            {/* Header Section */}
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.25rem'
                    }}>
                        {bot.first_name?.[0] || 'B'}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>{bot.first_name}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>@{bot.username}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                        onClick={() => setIsPolling(!isPolling)}
                        style={{
                            backgroundColor: isPolling ? 'rgba(59, 130, 246, 0.2)' : 'var(--surface-color)',
                            color: isPolling ? 'var(--primary-color)' : 'var(--text-main)',
                            width: 'auto'
                        }}
                    >
                        <RefreshCw size={18} className={isPolling ? "animate-spin" : ""} style={isPolling ? { animation: 'spin 2s linear infinite' } : {}} />
                        {isPolling ? 'Polling Active' : 'Polling Paused'}
                    </Button>
                    <Button onClick={handleLogout} style={{ width: 'auto', backgroundColor: '#ef4444' }}>
                        <LogOut size={18} /> Logout
                    </Button>
                </div>
            </div>

            {error && (
                <div className="animate-fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                    {error}
                </div>
            )}

            {/* Main Table Card */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '500', margin: 0 }}>Connected Chats ({sortedChats.length})</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        List of chats where the bot is currently added.
                    </p>
                </div>

                {sortedChats.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No chats found yet. Add the bot to a group or send it a message!</p>
                        {isPolling && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} /> Listening for updates...</p>}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-color-hover)' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-muted)', borderBottom: '1px solid var(--surface-border)' }}>Chat Name</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-muted)', borderBottom: '1px solid var(--surface-border)' }}>Type</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-muted)', borderBottom: '1px solid var(--surface-border)', width: '200px' }}>Chat ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedChats.map((chat) => (
                                    <tr key={chat.id} className="animate-fade-in" style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background-color 0.2s' }}>
                                        <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'var(--surface-color)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                                            }}>
                                                {chat.type === 'private' ? <MessageSquare size={16} /> : <Hash size={16} />}
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{chat.name}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                            {chat.type}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <button
                                                onClick={() => copyToClipboard(chat.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    background: 'var(--surface-color)',
                                                    border: '1px solid var(--surface-border)',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: copiedId === chat.id ? '#10b981' : 'var(--text-main)',
                                                    cursor: 'pointer',
                                                    transition: 'var(--transition)',
                                                    width: '100%',
                                                    justifyContent: 'space-between'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-color-hover)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-color)'}
                                                title="Click to copy Chat ID"
                                            >
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{chat.id}</span>
                                                {copiedId === chat.id ? <CheckCircle2 size={16} /> : <Copy size={16} style={{ opacity: 0.5 }} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Dashboard;
