import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
    error?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    hint,
    error,
    id,
    className = '',
    disabled,
    ...rest
}) => {
    const inputId = id ?? `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
        <div className="ui-field">
            <label className="ui-field__label" htmlFor={inputId}>
                {label}
            </label>
            <input
                id={inputId}
                className={['ui-input', error ? 'ui-input--error' : '', className].filter(Boolean).join(' ')}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
                {...rest}
            />
            {hint && !error && (
                <p className="ui-field__hint" id={hintId}>
                    {hint}
                </p>
            )}
            {error && (
                <p className="ui-field__error" id={errorId} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
