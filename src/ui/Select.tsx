import React from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    hint?: string;
    error?: string;
    options: SelectOption[];
}

const Select: React.FC<SelectProps> = ({
    label,
    hint,
    error,
    options,
    id,
    className = '',
    disabled,
    ...rest
}) => {
    const selectId = id ?? `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
        <div className="ui-field">
            <label className="ui-field__label" htmlFor={selectId}>
                {label}
            </label>
            <select
                id={selectId}
                className={['ui-select', error ? 'ui-input--error' : '', className].filter(Boolean).join(' ')}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
                {...rest}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
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

export default Select;
