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