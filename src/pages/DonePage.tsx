import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Sprint, Todo } from '../types';
import { fetchActiveWorkspaceContext } from '../lib/workspace';
import { fetchDoneTasks, fetchSprints, restoreTask, deleteTask } from '../lib/plannerDb';
import { errorMessageFromUnknown } from '../lib/supabaseErrors';
import { taskStatusLabel } from '../lib/taskLabels';
import { Button, Card, InlineAlert } from '../ui';

const DonePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const ctx = await fetchActiveWorkspaceContext();
            if (!ctx) {
                setError('No workspace found.');
                setTodos([]);
                setSprints([]);
                return;
            }
            const [doneTasks, sprintList] = await Promise.all([
                fetchDoneTasks(ctx.workspaceId),
                fetchSprints(ctx.workspaceId),
            ]);
            setTodos(doneTasks);
            setSprints(sprintList);
        } catch (e) {
            setError(errorMessageFromUnknown(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const sprintNameById = useMemo(() => {
        const map = new Map<string, string>();
        sprints.forEach((s) => map.set(s.id, s.name));
        return map;
    }, [sprints]);

    const grouped = useMemo(() => {
        const bySprint = new Map<string, Todo[]>();
        todos.forEach((t) => {
            const key = t.sprintId || 'none';
            const list = bySprint.get(key) ?? [];
            list.push(t);
            bySprint.set(key, list);
        });
        return bySprint;
    }, [todos]);

    const handleRestore = async (id: string) => {
        setActionError(null);
        try {
            await restoreTask(id);
            setTodos((prev) => prev.filter((t) => t.id !== id));
        } catch (e) {
            setActionError(`Could not restore task: ${errorMessageFromUnknown(e)}`);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`Permanently delete "${title}"?`)) return;
        setActionError(null);
        try {
            await deleteTask(id);
            setTodos((prev) => prev.filter((t) => t.id !== id));
        } catch (e) {
            setActionError(`Could not delete task: ${errorMessageFromUnknown(e)}`);
        }
    };

    if (loading) {
        return (
            <div className="planner-loading">
                <p className="planner-loading__label">Loading done tasks…</p>
            </div>
        );
    }

    return (
        <div className="done-page">
            <div className="done-page__inner">
                <header className="done-page__header">
                    <Link to="/" className="done-page__back">
                        ← Back to planner
                    </Link>
                    <h1 className="done-page__title">Done & archived</h1>
                    <p className="done-page__subtitle">
                        Completed or archived tasks. Restore to send back to the active sprint board.
                    </p>
                </header>

                {error && <InlineAlert variant="error">{error}</InlineAlert>}
                {actionError && <InlineAlert variant="error">{actionError}</InlineAlert>}

                {todos.length === 0 ? (
                    <Card className="done-card">
                        <p className="done-empty">No done or archived tasks yet.</p>
                    </Card>
                ) : (
                    Array.from(grouped.entries()).map(([sprintId, items]) => (
                        <Card key={sprintId} className="done-card">
                            <h2 className="done-card__heading">
                                {sprintNameById.get(sprintId) ?? 'No sprint'}
                            </h2>
                            <ul className="done-list">
                                {items.map((todo) => (
                                    <li key={todo.id} className="done-list__item">
                                        <div className="done-list__body">
                                            <span className="done-list__title">{todo.text}</span>
                                            <div className="done-list__meta">
                                                <span className="code-label">
                                                    {taskStatusLabel(todo.status)}
                                                </span>
                                                {todo.archived && (
                                                    <span className="code-label">archived</span>
                                                )}
                                                {todo.finishedOn && (
                                                    <span className="planner-todo__date">
                                                        Finished {todo.finishedOn}
                                                    </span>
                                                )}
                                            </div>
                                            {todo.blockedReason && (
                                                <p className="done-list__blocked">
                                                    Blocked: {todo.blockedReason}
                                                </p>
                                            )}
                                        </div>
                                        <div className="done-list__actions">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => handleRestore(todo.id)}
                                            >
                                                Restore
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="danger"
                                                onClick={() => handleDelete(todo.id, todo.text)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default DonePage;
