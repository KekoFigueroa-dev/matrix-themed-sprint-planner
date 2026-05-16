import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Todo, Priority, TeamMember, Sprint } from '../types';
import TodoItem from '../components/TodoItem';
import AddTodoForm from '../components/AddTodoForm';
import { AnimatePresence, motion } from 'framer-motion';
import TeamPanel from '../components/TeamPanel';
import SprintManager from '../components/SprintManager';
import StatsPanel from '../components/StatsPanel';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import { fetchActiveWorkspaceId } from '../lib/workspace';
import {
    clearAssigneeFromTasks,
    createSprint,
    createTask,
    deleteSprintAndTasks,
    deleteTask,
    fetchSprints,
    fetchTasks,
    updateSprintName,
    updateTaskStatus,
} from '../lib/plannerDb';

function currentSprintStorageKey(workspaceId: string): string {
    return `planner:currentSprintId:${workspaceId}`;
}

const PlannerPage: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [plannerLoading, setPlannerLoading] = useState(true);
    const [plannerError, setPlannerError] = useState<string | null>(null);

    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [currentSprintId, setCurrentSprintId] = useState<string | null>(null);
    const [teamStorageReady, setTeamStorageReady] = useState(false);

    useEffect(() => {
        getSupabase()
            .auth.getSession()
            .then(({ data: { session: s } }) => setSession(s));
    }, []);

    useEffect(() => {
        const savedMembers = localStorage.getItem('teamMembers');
        setTeamMembers(savedMembers ? JSON.parse(savedMembers) : []);
        setTeamStorageReady(true);
    }, []);

    useEffect(() => {
        if (!teamStorageReady) return;
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    }, [teamMembers, teamStorageReady]);

    const loadPlanner = useCallback(async () => {
        setPlannerLoading(true);
        setPlannerError(null);
        try {
            const wsId = await fetchActiveWorkspaceId();
            if (!wsId) {
                setPlannerError('No workspace found. Sign out and sign in again to bootstrap your workspace.');
                setWorkspaceId(null);
                setSprints([]);
                setTodos([]);
                setCurrentSprintId(null);
                return;
            }
            setWorkspaceId(wsId);

            let loadedSprints = await fetchSprints(wsId);
            if (loadedSprints.length === 0) {
                const first = await createSprint(wsId, 'Sprint 1');
                loadedSprints = [first];
            }

            const loadedTodos = await fetchTasks(wsId);
            setSprints(loadedSprints);
            setTodos(loadedTodos);

            const savedId = localStorage.getItem(currentSprintStorageKey(wsId));
            const validSaved =
                savedId && loadedSprints.some((s) => s.id === savedId) ? savedId : null;
            setCurrentSprintId(validSaved ?? loadedSprints[0]?.id ?? null);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load planner data.';
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
        const msg = e instanceof Error ? e.message : String(e);
        console.error(label, e);
        alert(`${label}: ${msg}`);
    };

    const addSprint = async (name: string) => {
        if (!workspaceId) return;
        try {
            const created = await createSprint(workspaceId, name);
            setSprints((prev) => [...prev, created]);
            setCurrentSprintId(created.id);
        } catch (e) {
            reportMutationError('Could not create sprint', e);
        }
    };

    const renameSprint = async (id: string, newName: string) => {
        try {
            await updateSprintName(id, newName);
            setSprints((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)));
        } catch (e) {
            reportMutationError('Could not rename sprint', e);
        }
    };

    const deleteSprint = async (id: string) => {
        if (!workspaceId) return;
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

    const addTodo = async (text: string, priority: Priority, assigneeId?: number) => {
        if (!workspaceId || !currentSprintId) return;
        try {
            const created = await createTask(
                workspaceId,
                currentSprintId,
                text,
                priority,
                assigneeId
            );
            setTodos((prev) => [created, ...prev]);
        } catch (e) {
            reportMutationError('Could not add task', e);
        }
    };

    const toggleTodo = async (id: string) => {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        const nextCompleted = !todo.completed;
        try {
            await updateTaskStatus(id, nextCompleted);
            setTodos((prev) =>
                prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
            );
        } catch (e) {
            reportMutationError('Could not update task', e);
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

    const addTeamMember = (name: string, role: string) => {
        const newMember: TeamMember = { id: Date.now(), name, role };
        setTeamMembers([...teamMembers, newMember]);
    };

    const editTeamMember = (id: number, name: string, role: string) => {
        setTeamMembers(
            teamMembers.map((member) =>
                member.id === id ? { ...member, name, role } : member
            )
        );
    };

    const deleteTeamMember = async (id: number) => {
        setTeamMembers(teamMembers.filter((member) => member.id !== id));
        setTodos((prev) =>
            prev.map((todo) =>
                todo.assigneeId === id ? { ...todo, assigneeId: undefined } : todo
            )
        );
        if (workspaceId) {
            try {
                await clearAssigneeFromTasks(workspaceId, id);
            } catch (e) {
                reportMutationError('Could not clear assignee on tasks', e);
            }
        }
    };

    const filteredTodos = todos.filter((todo) => todo.sprintId === currentSprintId);

    const handleSignOut = async () => {
        await getSupabase().auth.signOut();
    };

    if (plannerLoading) {
        return (
            <div className="auth-page">
                <p className="auth-info">Loading planner…</p>
            </div>
        );
    }

    return (
        <div className="sprint-planner-layout">
            {plannerError && (
                <div className="bootstrap-error-banner" role="alert">
                    <span>
                        <strong>Planner:</strong> {plannerError}
                    </span>
                    <button type="button" className="bootstrap-error-retry" onClick={() => loadPlanner()}>
                        Retry
                    </button>
                </div>
            )}
            <TeamPanel
                teamMembers={teamMembers}
                addTeamMember={addTeamMember}
                editTeamMember={editTeamMember}
                deleteTeamMember={deleteTeamMember}
            />
            <main className="main-content-wrapper">
                <header className="main-header">
                    <div className="session-bar">
                        <span className="session-email">{session?.user?.email ?? ''}</span>
                        <Link to="/invites" className="nav-link-invites">
                            Invites
                        </Link>
                        <button type="button" className="sign-out-button" onClick={handleSignOut}>
                            Sign out
                        </button>
                    </div>
                    <h1>Sprint Planner</h1>
                    <SprintManager
                        sprints={sprints}
                        currentSprintId={currentSprintId}
                        onSprintChange={setCurrentSprintId}
                        onAddSprint={addSprint}
                        onRenameSprint={renameSprint}
                        onDeleteSprint={deleteSprint}
                    />
                </header>
                <div className="main-content">
                    <AddTodoForm addTodo={addTodo} teamMembers={teamMembers} />
                    <ul className="todo-list">
                        <AnimatePresence>
                            {filteredTodos.length > 0 ? (
                                filteredTodos.map((todo) => (
                                    <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        toggleTodo={toggleTodo}
                                        deleteTodo={deleteTodoHandler}
                                        teamMembers={teamMembers}
                                    />
                                ))
                            ) : (
                                <motion.p
                                    key="empty"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="empty-state"
                                >
                                    {sprints.length > 0
                                        ? 'This sprint is empty. Add a task!'
                                        : 'Create a sprint to get started.'}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </ul>
                </div>
            </main>
            <StatsPanel todos={filteredTodos} />
        </div>
    );
};

export default PlannerPage;
