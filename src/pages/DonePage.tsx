import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Sprint, Todo } from '../types';
import { fetchActiveWorkspaceContext } from '../lib/workspace';
import {
    archiveDoneTasksForProject,
    fetchDoneTasks,
    fetchSprints,
    restoreTask,
    deleteTask,
} from '../lib/plannerDb';
import { fetchProjects } from '../lib/projectsDb';
import { errorMessageFromUnknown } from '../lib/supabaseErrors';
import { taskStatusLabel } from '../lib/taskLabels';
import { Button, Card, EmptyState, InlineAlert } from '../ui';
import { formatMutationError } from '../lib/supabaseErrors';

const SHOW_ARCHIVED_KEY = 'done:showArchived';

function currentProjectStorageKey(workspaceId: string): string {
    return `planner:currentProjectId:${workspaceId}`;
}

function readShowArchivedPreference(): boolean {
    try {
        return localStorage.getItem(SHOW_ARCHIVED_KEY) === 'true';
    } catch {
        return false;
    }
}

const DonePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionInfo, setActionInfo] = useState<string | null>(null);
    const [archiving, setArchiving] = useState(false);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(readShowArchivedPreference);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const ctx = await fetchActiveWorkspaceContext();
            if (!ctx) {
                setError('No workspace found.');
                setWorkspaceId(null);
                setTodos([]);
                setSprints([]);
                return;
            }
            setWorkspaceId(ctx.workspaceId);
            const [doneTasks, sprintList, projectList] = await Promise.all([
                fetchDoneTasks(ctx.workspaceId),
                fetchSprints(ctx.workspaceId),
                fetchProjects(ctx.workspaceId),
            ]);
            const savedProjectId = localStorage.getItem(
                currentProjectStorageKey(ctx.workspaceId)
            );
            const activeProject =
                projectList.find((p) => p.id === savedProjectId) ?? projectList[0] ?? null;
            setCurrentProjectId(activeProject?.id ?? null);
            setCurrentProjectName(activeProject?.name ?? null);
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

    useEffect(() => {
        try {
            localStorage.setItem(SHOW_ARCHIVED_KEY, String(showArchived));
        } catch {
            /* ignore */
        }
    }, [showArchived]);

    const sprintProjectById = useMemo(() => {
        const map = new Map<string, string | null>();
        sprints.forEach((s) => map.set(s.id, s.projectId));
        return map;
    }, [sprints]);

    const projectScopedTodos = useMemo(() => {
        if (!currentProjectId) return todos;
        return todos.filter((t) => sprintProjectById.get(t.sprintId) === currentProjectId);
    }, [todos, currentProjectId, sprintProjectById]);

    const visibleTodos = useMemo(
        () =>
            showArchived
                ? projectScopedTodos
                : projectScopedTodos.filter((t) => !t.archived),
        [projectScopedTodos, showArchived]
    );

    const unarchivedDoneCount = useMemo(
        () => projectScopedTodos.filter((t) => t.status === 'done' && !t.archived).length,
        [projectScopedTodos]
    );

    const sprintNameById = useMemo(() => {
        const map = new Map<string, string>();
        sprints.forEach((s) => map.set(s.id, s.name));
        return map;
    }, [sprints]);

    const grouped = useMemo(() => {
        const bySprint = new Map<string, Todo[]>();
        visibleTodos.forEach((t) => {
            const key = t.sprintId || 'none';
            const list = bySprint.get(key) ?? [];
            list.push(t);
            bySprint.set(key, list);
        });
        return bySprint;
    }, [visibleTodos]);

    const handleRestore = async (id: string) => {
        setActionError(null);
        setActionInfo(null);
        try {
            await restoreTask(id);
            setTodos((prev) => prev.filter((t) => t.id !== id));
        } catch (e) {
            setActionError(formatMutationError('Could not restore task', e));
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`Permanently delete "${title}"?`)) return;
        setActionError(null);
        setActionInfo(null);
        try {
            await deleteTask(id);
            setTodos((prev) => prev.filter((t) => t.id !== id));
        } catch (e) {
            setActionError(formatMutationError('Could not delete task', e));
        }
    };

    const handleArchiveAll = async () => {
        if (!workspaceId || !currentProjectId || unarchivedDoneCount === 0) return;
        setActionError(null);
        setActionInfo(null);
        setArchiving(true);
        try {
            const count = await archiveDoneTasksForProject(workspaceId, currentProjectId);
            if (count === 0) {
                setActionInfo('No completed tasks to archive.');
            } else {
                setTodos((prev) =>
                    prev.map((t) => {
                        if (
                            t.status === 'done' &&
                            !t.archived &&
                            sprintProjectById.get(t.sprintId) === currentProjectId
                        ) {
                            return { ...t, archived: true };
                        }
                        return t;
                    })
                );
                setActionInfo(
                    `Archived ${count} completed task${count === 1 ? '' : 's'}. Turn on “Show archived” to see them.`
                );
            }
        } catch (e) {
            setActionError(formatMutationError('Could not archive tasks', e));
        } finally {
            setArchiving(false);
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
                        {currentProjectName
                            ? `Showing done tasks for project “${currentProjectName}” (same as planner). `
                            : ''}
                        Marking a task <strong>Done</strong> removes it from the sprint board. Use{' '}
                        <strong>Archive completed</strong> below to hide finished tasks from this
                        list. Restore sends a task back to the board as Todo.
                    </p>
                </header>

                <DoneToolbar
                    showArchived={showArchived}
                    onShowArchivedChange={setShowArchived}
                    unarchivedDoneCount={unarchivedDoneCount}
                    archiving={archiving}
                    onArchiveAll={() => void handleArchiveAll()}
                />

                {error && <InlineAlert variant="error">{error}</InlineAlert>}
                {actionError && <InlineAlert variant="error">{actionError}</InlineAlert>}
                {actionInfo && <InlineAlert variant="info">{actionInfo}</InlineAlert>}

                {visibleTodos.length === 0 ? (
                    <Card className="done-card">
                        <EmptyState
                            title={
                                projectScopedTodos.length === 0
                                    ? 'Nothing in Done yet'
                                    : 'All archived'
                            }
                            description={
                                projectScopedTodos.length === 0
                                    ? 'Tasks you mark Done on the planner appear here. Restore sends them back as Todo.'
                                    : 'Turn on “Show archived” above to see hidden completed tasks.'
                            }
                        />
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
                                            <DoneTaskMeta todo={todo} />
                                            {todo.blockedReason && (
                                                <p className="done-list__blocked">
                                                    Blocked: {todo.blockedReason}
                                                </p>
                                            )}
                                        </div>
                                        <DoneTaskActions
                                            onRestore={() => void handleRestore(todo.id)}
                                            onDelete={() => void handleDelete(todo.id, todo.text)}
                                        />
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

function DoneToolbar(props: {
    showArchived: boolean;
    onShowArchivedChange: (value: boolean) => void;
    unarchivedDoneCount: number;
    archiving: boolean;
    onArchiveAll: () => void;
}) {
    const { showArchived, onShowArchivedChange, unarchivedDoneCount, archiving, onArchiveAll } =
        props;
    return (
        <div className="done-toolbar">
            <label className="done-toolbar__toggle">
                <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => onShowArchivedChange(e.target.checked)}
                />
                <span>Show archived</span>
            </label>
            <Button
                type="button"
                variant="secondary"
                loading={archiving}
                disabled={unarchivedDoneCount === 0}
                onClick={onArchiveAll}
            >
                Archive completed ({unarchivedDoneCount})
            </Button>
        </div>
    );
}

function DoneTaskMeta({ todo }: { todo: Todo }) {
    return (
        <div className="done-list__meta">
            <span className="code-label">{taskStatusLabel(todo.status)}</span>
            {todo.archived && <span className="code-label">archived</span>}
            {todo.finishedOn && (
                <span className="planner-todo__date">Finished {todo.finishedOn}</span>
            )}
        </div>
    );
}

function DoneTaskActions(props: { onRestore: () => void; onDelete: () => void }) {
    return (
        <div className="done-list__actions">
            <Button type="button" variant="secondary" onClick={props.onRestore}>
                Restore
            </Button>
            <Button type="button" variant="danger" onClick={props.onDelete}>
                Delete
            </Button>
        </div>
    );
}

export default DonePage;
