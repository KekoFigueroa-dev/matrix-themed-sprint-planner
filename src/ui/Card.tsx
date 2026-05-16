import React from 'react';

export interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
    return (
        <article className={['ui-card', className].filter(Boolean).join(' ')}>
            {title && <h1 className="ui-card__title">{title}</h1>}
            {children}
        </article>
    );
};

export default Card;
