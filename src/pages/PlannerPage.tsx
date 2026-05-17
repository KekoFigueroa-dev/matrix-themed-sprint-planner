import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Todo, Priority, Sprint, isActivePlannerTask } from '../types';
import TodoItem from '../components/TodoItem';
import AddTodoForm from '../components/AddTodoForm';
import { AnimatePresence, motion } from 'framer-motion';
import TeamPanel from '../components/TeamPanel';
import SprintManager from '../components/SprintManager';
import StatsPanel from '../components/StatsPanel';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import { fetchActiveWorkspaceContext, type WorkspaceRole } from '../lib/workspace';
import { errorMessageFromUnknown } from '../lib/supabaseErrors';
import { usePlannerBodyLock } from '../hooks/usePlannerBodyLock';
import {
    archiveDoneTasksForSprint,
    createSprint,
    createTask,
    deleteSprintAndTasks,
    deleteTask,
    fetchSprints,
    fetchTasks,
    updateSprintName,
    updateTask,
    type TaskUpdatePatch,
} from '../lib/plannerDb';
import {
    ensureWorkspaceProfiles,
    fetchWorkspaceProfiles,
    updateWorkspaceDisplayName,
    type WorkspaceProfile,
} from '../lib/teamDb';
import { Badge, Button, Card, InlineAlert } from '../ui';

function currentSprintStorageKey(workspaceId: string): string {
    return `planner:currentSprintId:${workspaceId}`;
}

const PlannerPage: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
    const [plannerLoading, setPlannerLoading] = useState(true);
    const [plannerError, setPlannerError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [memberAwaitingSprint, setMemberAwaitingSprint] = useState(false);

    const isAdmin = workspaceRole === 'admin';

    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [teamProfiles, setTeamProfiles] = useState<WorkspaceProfile[]>([]);
    const [currentSprintId, setCurrentSprintId] = useState<string | null>(null);

    useEffect(() => {
        getSupabase()
            .auth.getSession()
            .then(({ data: { session: s } }) => setSession(s));
    }, []);

    const loadPlanner = useCallback(async () => {
        setPlannerLoading(true);
        setPlannerError(null);
        try {
            const ctx = await fetchActiveWorkspaceContext();
            if (!ctx) {
                setPlannerError('No workspace found. Sign out and sign in again to bootstrap your workspace.');
                setWorkspaceId(null);
                setWorkspaceRole(null);
                setSprints([]);
                setTodos([]);
                setTeamProfiles([]);
                setCurrentSprintId(null);
                setMemberAwaitingSprint(false);
                return;
            }
            setWorkspaceId(ctx.workspaceId);
            setWorkspaceRole(ctx.role);

            let loadedSprints = await fetchSprints(ctx.workspaceId);
            if (loadedSprints.length === 0) {
                if (ctx.role === 'admin') {
                    const first = await createSprint(ctx.workspaceId, 'Sprint 1');
                    loadedSprints = [first];
                    setMemberAwaitingSprint(false);
                } else {
                    setMemberAwaitingSprint(true);
                }
            } else {
                setMemberAwaitingSprint(false);
            }

            await ensureWorkspaceProfiles(ctx.workspaceId);
            const [loadedTodos, loadedProfiles] = await Promise.all([
                fetchTasks(ctx.workspaceId),
                fetchWorkspaceProfiles(ctx.workspaceId),
            ]);
            setSprints(loadedSprints);
            setTodos(loadedTodos);
            setTeamProfiles(loadedProfiles);

            const savedId = localStorage.getItem(currentSprintStorageKey(ctx.workspaceId));
            const validSaved =
                savedId && loadedSprints.some((s) => s.id === savedId) ? savedId : null;
            setCurrentSprintId(validSaved ?? loadedSprints[0]?.id ?? null);
        } catch (e) {
            const msg = errorMessageFromUnknown(e);
            setPlannerError(msg);
            console.error('loadPlanner:', e);
        } finally {
            setPlannerLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPlanner();
    }, [loadPlanner]);

    useEffect(() => {
        if (!workspaceId || !currentSprintId) return;
        localStorage.setItem(currentSprintStorageKey(workspaceId), currentSprintId);
    }, [workspaceId, currentSprintId]);

    const reportMutationError = (label: string, e: unknown) => {
        const msg = errorMessageFromUnknown(e);
        console.error(label, e);
        setActionError(`${label}: ${msg}`);
    };

    const addSprint = async (name: string) => {
        if (!workspaceId || !isAdmin) return;
        setActionError(null);
        try {
            const created = await createSprint(workspaceId, name);
            setSprints((prev) => [...prev, created]);
            setCurrentSprintId(created.id);
        } catch (e) {
            reportMutationError('Could not create sprint', e);
        }
    };

    const renameSprint = async (id: string, newName: string) => {
        if (!isAdmin) return;
        setActionError(null);
        try {
            await updateSprintName(id, newName);
            setSprints((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)));
        } catch (e) {
            reportMutationError('Could not rename sprint', e);
        }
    };

    const deleteSprint = async (id: string) => {
        if (!workspaceId || !isAdmin) return;
        setActionError(null);
        if (sprints.length <= 1) {
            alert('Cannot delete the last sprint.');
            return;
        }
        try {
            await deleteSprintAndTasks(id, workspaceId);
            const remaining = sprints.filter((s) => s.id !== id);
            setSprints(remaining);
            setTodos((prev) => prev.filter((t) => t.sprintId !== id));
            if (currentSprintId === id) {
                setCurrentSprintId(remaining[0]?.id ?? null);
            }
        } catch (e) {
            reportMutationError('Could not delete sprint', e);
        }
    };

    const addTodo = async (
        text: string,
        priority: Priority,
        assigneeUserId?: string,
        expectedDeliveryOn?: string | null
    ) => {
        if (!workspaceId || !currentSprintId) return;
        setActionError(null);
        try {
            const created = await createTask(
                workspaceId,
                currentSprintId,
                text,
                priority,
                assigneeUserId,
                expectedDeliveryOn
            );
            setTodos((prev) => [created, ...prev]);
        } catch (e) {
            reportMutationError('Could not add task', e);
        }
    };

    const handleTaskUpdate = async (id: string, patch: TaskUpdatePatch) => {
        setActionError(null);
        try {
            const updated = await updateTask(id, patch);
            setTodos((prev) => {
                if (!isActivePlannerTask(updated)) {
                    return prev.filter((t) => t.id !== id);
                }
                return prev.map((t) => (t.id === id ? updated : t));
            });
        } catch (e) {
            reportMutationError('Could not update task', e);
        }
    };

    const handleArchiveCompleted = async () => {
        if (!workspaceId || !currentSprintId) return;
        setActionError(null);
        try {
            const count = await archiveDoneTasksForSprint(currentSprintId, workspaceId);
            if (count > 0) {
                setTodos((prev) =>
                    prev.filter(
                        (t) =>
                            !(
                                t.sprintId === currentSprintId &&
                                t.status === 'done' &&
                                !t.archived
                            )
                    )
                );
            }
        } catch (e) {
            reportMutationError('Could not archive completed tasks', e);
        }
    };

    const deleteTodoHandler = async (id: string) => {
        try {
            await deleteTask(id);
            setTodos((prev) => prev.filter((t) => t.id !== id));
        } catch (e) {
            reportMutationError('Could not delete task', e);
        }
    };

    const saveDisplayName = async (userId: string, displayName: string) => {
        if (!workspaceId) return;
        setActionError(null);
        try {
            await updateWorkspaceDisplayName(workspaceId, userId, displayName);
            setTeamProfiles((prev) =>
                prev.map((p) =>
                    p.userId === userId ? { ...p, displayName } : p
                )
            );
        } catch (e) {
            reportMutationError('Could not update display name', e);
            throw e;
        }
    };

    const filteredTodos = todos.filter(
        (todo) => todo.sprintId === currentSprintId && isActivePlannerTask(todo)
    );

    const showPlannerLayout = !plannerLoading;
    usePlannerBodyLock(showPlannerLayout);

    const handleSignOut = async () => {
        await getSupabase().auth.signOut();
    };

    if (plannerLoading) {
        return (
            <motion.div className="planner-loading" role="status" aria-live="polite">
                <div className="planner-skeleton" aria-hidden />
                <div className="planner-skeleton" style={{ width: '200px' }} aria-hidden />
                <p className="planner-loading__label">Loading planner…</p>
            </motion.div>
        );
    }

    return (
        <div className="planner-page">
            {plannerError && (
                <div className="planner-banner">
                    <InlineAlert variant="error">
                        <strong>Planner:</strong> {plannerError}
                    </InlineAlert>
                    <Button type="button" variant="secondary" onClick={() => loadPlanner()}>
                        Retry
                    </Button>
                </div>
            )}
            <aside className="planner-sidebar">
                <Card className="planner-card">
                    <TeamPanel
                        profiles={teamProfiles}
                        currentUserId={session?.user?.id ?? null}
                        workspaceRole={workspaceRole}
                        onSaveDisplayName={saveDisplayName}
                    />
                </Card>
            </aside>
            <main className="planner-main">
                <header className="planner-main__header">
                    <div className="planner-topbar">
                        <span className="planner-topbar__email">{session?.user?.email ?? ''}</span>
                        {workspaceRole && <Badge role={workspaceRole} />}
                        <Link to="/invites" className="planner-link">
                            Invites
                        </Link>
                        <Link to="/done" className="planner-link">
                            Done
                        </Link>
                        <Link to="/about" className="planner-link">
                            About
                        </Link>
                        <Button type="button" variant="ghost" onClick={handleSignOut}>
                            Sign out
                        </Button>
                    </div>
                    <h1 className="planner-title">Sprint planner</h1>
                    {actionError && (
                        <InlineAlert variant="error">{actionError}</InlineAlert>
                    )}
                    {memberAwaitingSprint && (
                        <InlineAlert variant="info">
                            No sprints in this workspace yet. Ask a workspace admin to create one.
                        </InlineAlert>
                    )}
                    <Card className="planner-card planner-sprint">
                        <h2 className="planner-card__heading">Sprint</h2>
                        <SprintManager
                            sprints={sprints}
                            currentSprintId={currentSprintId}
                            canManageSprints={isAdmin}
                            onSprintChange={setCurrentSprintId}
                            onAddSprint={addSprint}
                            onRenameSprint={renameSprint}
                            onDeleteSprint={deleteSprint}
                        />
                    </Card>
                </header>
                <div className="planner-main__body">
                    <Card className="planner-card">
                        <div className="planner-task-toolbar">
                            <h2 className="planner-card__heading">Add task</h2>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={!currentSprintId}
                                onClick={() => void handleArchiveCompleted()}
                            >
                                Archive completed
                            </Button>
                        </div>
                        <AddTodoForm
                            addTodo={addTodo}
                            profiles={teamProfiles}
                            disabled={!currentSprintId}
                        />
                    </Card>
                    <ul className="planner-todo-list">
                        <AnimatePresence mode="popLayout">
                            {filteredTodos.length > 0 ? (
                                filteredTodos.map((todo) => (
                                    <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        onUpdate={handleTaskUpdate}
                                        onDelete={deleteTodoHandler}
                                        profiles={teamProfiles}
                                    />
                                ))
                            ) : (
                                <motion.li
                                    key="empty"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="planner-empty"
                                >
                                    {sprints.length > 0
                                        ? 'This sprint is empty. Add a task above.'
                                        : isAdmin
                                          ? 'Create a sprint to get started.'
                                          : 'Waiting for an admin to create a sprint.'}
                                </motion.li>
                            )}
                        </AnimatePresence>
                    </ul>
                </div>
            </main>
            <footer className="planner-stats">
                <Card className="planner-card">
                    <StatsPanel todos={filteredTodos} />
                </Card>
            </footer>
        </div>
    );
};

export default PlannerPage;
