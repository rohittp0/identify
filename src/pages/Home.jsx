import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight } from 'lucide-react';
import { Card, Input, Button } from '../components/ui';
import { getMe } from '../api/telegram';
import { useStore } from '../hooks/useStore';

const Home = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { setBot } = useStore();

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
            setBot(token.trim(), botMe);
            navigate(`/dashboard?bot=${botMe.username}`);
        } catch (err) {
            setError(err.message || 'Invalid bot token');
        } finally {
            setLoading(false);
        }
    };

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
                        color: 'var(--primary-color)'
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
};

export default Home;
