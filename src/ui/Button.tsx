import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'cta';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    loading?: boolean;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    loading = false,
    fullWidth = false,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
}) => {
    const classes = [
        'ui-btn',
        `ui-btn--${variant}`,
        fullWidth ? 'ui-btn--full' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled || loading}
            aria-disabled={disabled || loading || undefined}
            aria-busy={loading || undefined}
            {...rest}
        >
            {loading && <span className="ui-btn__spinner" aria-hidden />}
            {children}
        </button>
    );
};

export default Button;
