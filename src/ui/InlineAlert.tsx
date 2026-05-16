import React from 'react';

export type InlineAlertVariant = 'error' | 'warning' | 'info';

export interface InlineAlertProps {
    variant?: InlineAlertVariant;
    children: React.ReactNode;
    className?: string;
}

const InlineAlert: React.FC<InlineAlertProps> = ({
    variant = 'error',
    children,
    className = '',
}) => {
    return (
        <div
            className={['ui-alert', `ui-alert--${variant}`, className].filter(Boolean).join(' ')}
            role={variant === 'error' ? 'alert' : 'status'}
        >
            <p className="ui-alert__message">{children}</p>
        </div>
    );
};

export default InlineAlert;
