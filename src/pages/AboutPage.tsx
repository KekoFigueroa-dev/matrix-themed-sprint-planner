import React from 'react';
import { Link } from 'react-router-dom';
import { ABOUT_LINKS } from '../config/aboutLinks';
import { Card } from '../ui';

const AboutPage: React.FC = () => {
    return (
        <div className="about-page">
            <div className="about-page__inner">
                <header className="about-page__header">
                    <Link to="/login" className="about-page__back">
                        ← Back
                    </Link>
                    <h1 className="about-page__title">About this project</h1>
                </header>

                <Card className="about-card">
                    <p className="about-card__lead">
                        Matrix-themed Sprint Planner is a small-team sprint board: workspaces,
                        projects, sprints, and tasks backed by Supabase with row-level security.
                        Built as a portfolio-grade CRA app with a vaporwave / cyberpunk terminal mood
                        and Stripe.dev-style clarity.
                    </p>

                    <h2 className="about-card__heading">Hierarchy</h2>
                    <p className="about-card__body">
                        <strong>Workspace</strong> → <strong>Project</strong> →{' '}
                        <strong>Sprint</strong> → <strong>Task</strong>. Projects group work;
                        sprints time-box iterations; tasks track delivery (statuses and dates in
                        V2.2).
                    </p>

                    <h2 className="about-card__heading">Stack</h2>
                    <ul className="about-card__list">
                        <li>Create React App + TypeScript + React Router</li>
                        <li>Supabase Auth, Postgres, RLS, SQL migrations</li>
                        <li>Vercel (static SPA + env-based Supabase client)</li>
                        <li>
                            Framer Motion, Lucide, shared{' '}
                            <code className="code-label">src/ui</code> primitives
                        </li>
                    </ul>

                    <h2 className="about-card__heading">Links</h2>
                    <ul className="about-card__links">
                        <li>
                            <a href={ABOUT_LINKS.live} target="_blank" rel="noreferrer">
                                Live app
                            </a>
                        </li>
                        <li>
                            <a href={ABOUT_LINKS.repo} target="_blank" rel="noreferrer">
                                Project repository (GitHub)
                            </a>
                        </li>
                        <li>
                            <a href={ABOUT_LINKS.githubProfile} target="_blank" rel="noreferrer">
                                Maintainer GitHub profile
                            </a>
                        </li>
                        <li>
                            <a href={ABOUT_LINKS.linkedIn} target="_blank" rel="noreferrer">
                                Maintainer on LinkedIn
                            </a>
                        </li>
                        <li>
                            <a
                                href={`${ABOUT_LINKS.repo}/blob/main/README.md`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                README (setup & deploy)
                            </a>
                        </li>
                        <li>
                            <a
                                href={`${ABOUT_LINKS.repo}/blob/main/docs/v2.md`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                V2 spec (docs/v2.md)
                            </a>
                        </li>
                        <li>
                            <a
                                href={`${ABOUT_LINKS.repo}/blob/main/docs/scope.md`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Product scope (docs/scope.md)
                            </a>
                        </li>
                    </ul>

                    <p className="about-card__footer">
                        <Link to="/login">Sign in</Link>
                        {' · '}
                        <Link to="/register">Register</Link>
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AboutPage;
