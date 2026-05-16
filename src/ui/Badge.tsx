import React from 'react';

export type BadgeRole = 'admin' | 'member';

export interface BadgeProps {
    role: BadgeRole;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({ role, className = '' }) => {
    return (
        <span className={['ui-badge', `ui-badge--${role}`, className].filter(Boolean).join(' ')}>
            {role}
        </span>
    );
};

export default Badge;
