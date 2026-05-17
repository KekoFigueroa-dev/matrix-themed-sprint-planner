import React from 'react';

export interface EmptyStateProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    children,
    className = '',
}) => {
    return (
        <div className={['ui-empty-state', className].filter(Boolean).join(' ')}>
            <p className="ui-empty-state__title">{title}</p>
            {description && <p className="ui-empty-state__desc">{description}</p>}
            {children && <div className="ui-empty-state__body">{children}</div>}
        </div>
    );
};

export default EmptyState;
