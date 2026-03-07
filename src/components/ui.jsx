import React from 'react';
import { Loader2 } from 'lucide-react';

export const Card = ({ children, className = '' }) => {
    return (
        <div className={`glass-panel animate-fade-in ${className}`}>
            {children}
        </div>
    );
};

export const Input = ({ icon: Icon, className = '', ...props }) => {
    return (
        <div className="input-wrapper" style={{ position: 'relative', width: '100%' }}>
            {Icon && (
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Icon size={20} />
                </div>
            )}
            <input
                className={`custom-input ${className}`}
                style={{
                    width: '100%',
                    padding: Icon ? '1rem 1rem 1rem 3rem' : '1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'var(--transition)'
                }}
                {...props}
            />
        </div>
    );
};

export const Button = ({ children, isLoading, className = '', ...props }) => {
    return (
        <button
            className={`custom-button ${className}`}
            disabled={isLoading || props.disabled}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '1rem',
                backgroundColor: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading || props.disabled ? 'not-allowed' : 'pointer',
                opacity: isLoading || props.disabled ? 0.7 : 1,
                transition: 'var(--transition)'
            }}
            {...props}
        >
            {isLoading && <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
            {children}
        </button>
    );
};
