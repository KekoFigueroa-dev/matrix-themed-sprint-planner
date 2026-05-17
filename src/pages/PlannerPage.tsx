import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Todo, Priority, Project, Sprint, isActivePlannerTask } from '../types';
import TodoItem from '../components/TodoItem';
import AddTodoForm from '../components/AddTodoForm';
import { AnimatePresence, motion } from 'framer-motion';
import TeamPanel from '../components/TeamPanel';
import ProjectManager from '../components/ProjectManager';
import SprintManager from '../components/SprintManager';
import StatsPanel from '../components/StatsPanel';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import { fetchActiveWorkspaceContext, type WorkspaceRole } from '../lib/workspace';
import { errorMessageFromUnknown } from '../lib/supabaseErrors';
import { usePlannerBodyLock } from '../hooks/usePlannerBodyLock';
import {
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
import {
    assignOrphanSprintsToProject,
    createProject,
    deleteProject,
    fetchProjects,
    updateProjectName,
} from '../lib/projectsDb';
import { Badge, Button, Card, EmptyState, InlineAlert } from '../ui';
import { formatMutationError } from '../lib/supabaseErrors';

function currentProjectStorageKey(workspaceId: string): string {
    return `planner:currentProjectId:${workspaceId}`;
}

function currentSprintStorageKey(workspaceId: string, projectId: string): string {
    return `planner:currentSprintId:${workspaceId}:${projectId}`;
}

function sprintsForProject(sprints: Sprint[], projectId: string | null): Sprint[] {
    if (!projectId) return [];
    return sprints.filter((s) => s.projectId === projectId);
}

function pickSprintId(
    projectSprints: Sprint[],
    workspaceId: string,
    projectId: string
): string | null {
    if (projectSprints.length === 0) return null;
    const savedId = localStorage.getItem(currentSprintStorageKey(workspaceId, projectId));
    const validSaved =
        savedId && projectSprints.some((s) => s.id === savedId) ? savedId : null;
    return validSaved ?? projectSprints[0]?.id ?? null;
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

    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [teamProfiles, setTeamProfiles] = useState<WorkspaceProfile[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
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
                setProjects([]);
                setSprints([]);
                setTodos([]);
                setTeamProfiles([]);
                setCurrentProjectId(null);
                setCurrentSprintId(null);
                setMemberAwaitingSprint(false);
                return;
            }
            setWorkspaceId(ctx.workspaceId);
            setWorkspaceRole(ctx.role);

            let loadedProjects = await fetchProjects(ctx.workspaceId);
            if (loadedProjects.length === 0 && ctx.role === 'admin') {
                const general = await createProject(ctx.workspaceId, 'General');
                loadedProjects = [general];
            }

            let loadedSprints = await fetchSprints(ctx.workspaceId);
            if (loadedProjects.length > 0) {
                const defaultProject = loadedProjects[0];
                const hasOrphans = loadedSprints.some((s) => !s.projectId);
                if (hasOrphans) {
                    await assignOrphanSprintsToProject(ctx.workspaceId, defaultProject.id);
                    loadedSprints = await fetchSprints(ctx.workspaceId);
                }
            }

            if (loadedSprints.length === 0 && ctx.role === 'admin' && loadedProjects[0]) {
                const first = await createSprint(
                    ctx.workspaceId,
                    'Sprint 1',
                    loadedProjects[0].id
                );
                loadedSprints = [first];
                setMemberAwaitingSprint(false);
            } else if (loadedSprints.length === 0) {
                setMemberAwaitingSprint(true);
            } else {
                setMemberAwaitingSprint(false);
            }

            await ensureWorkspaceProfiles(ctx.workspaceId);
            const [loadedTodos, loadedProfiles] = await Promise.all([
                fetchTasks(ctx.workspaceId),
                fetchWorkspaceProfiles(ctx.workspaceId),
            ]);
            setProjects(loadedProjects);
            setSprints(loadedSprints);
            setTodos(loadedTodos);
            setTeamProfiles(loadedProfiles);

            const savedProjectId = localStorage.getItem(
                currentProjectStorageKey(ctx.workspaceId)
            );
            const validProjectId =
                savedProjectId && loadedProjects.some((p) => p.id === savedProjectId)
                    ? savedProjectId
                    : loadedProjects[0]?.id ?? null;
            setCurrentProjectId(validProjectId);

            const projectSprints = sprintsForProject(loadedSprints, validProjectId);
            setCurrentSprintId(
                validProjectId
                    ? pickSprintId(projectSprints, ctx.workspaceId, validProjectId)
                    : null
            );
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
        if (!workspaceId || !currentProjectId) return;
        localStorage.setItem(currentProjectStorageKey(workspaceId), currentProjectId);
    }, [workspaceId, currentProjectId]);

    useEffect(() => {
        if (!workspaceId || !currentProjectId || !currentSprintId) return;
        localStorage.setItem(
            currentSprintStorageKey(workspaceId, currentProjectId),
            currentSprintId
        );
    }, [workspaceId, currentProjectId, currentSprintId]);

    const projectSprints = sprintsForProject(sprints, currentProjectId);

    const handleProjectChange = (projectId: string) => {
        setCurrentProjectId(projectId);
        if (!workspaceId) return;
        const nextSprints = sprintsForProject(sprints, projectId);
        setCurrentSprintId(pickSprintId(nextSprints, workspaceId, projectId));
    };

    const reportMutationError = (label: string, e: unknown) => {
        console.error(label, e);
        setActionError(formatMutationError(label, e));
    };

    const emptyTaskState = (() => {
        if (projectSprints.length > 0) {
            return {
                title: 'No active tasks',
                description: 'This sprint has no todo, in-progress, or blocked tasks. Add one above or mark Done tasks on the Done page.',
            };
        }
        if (projects.length === 0) {
            return isAdmin
                ? {
                      title: 'No projects yet',
                      description: 'Create a project, then add a sprint and tasks.',
                  }
                : {
                      title: 'Waiting for setup',
                      description: 'An admin needs to create a project and sprint before you can add tasks.',
                  };
        }
        return isAdmin
            ? {
                  title: 'No sprints in this project',
                  description: 'Use the Sprint section above to create your first sprint.',
              }
            : {
                  title: 'No sprints yet',
                  description: 'Ask a workspace admin to add a sprint to this project.',
              };
    })();

    const addProject = async (name: string) => {
        if (!workspaceId || !isAdmin) return;
        setActionError(null);
        try {
            const created = await createProject(workspaceId, name);
            setProjects((prev) => [...prev, created]);
            handleProjectChange(created.id);
        } catch (e) {
            reportMutationError('Could not create project', e);
        }
    };

    const renameProject = async (id: string, newName: string) => {
        if (!isAdmin) return;
        setActionError(null);
        try {
            await updateProjectName(id, newName);
            setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
        } catch (e) {
            reportMutationError('Could not rename project', e);
        }
    };

    const deleteProjectHandler = async (id: string) => {
        if (!workspaceId || !isAdmin) return;
        setActionError(null);
        if (projects.length <= 1) {
            alert('Cannot delete the last project.');
            return;
        }
        try {
            await deleteProject(id);
            const remaining = projects.filter((p) => p.id !== id);
            setProjects(remaining);
            if (currentProjectId === id) {
                const nextId = remaining[0]?.id ?? null;
                setCurrentProjectId(nextId);
                if (nextId) {
                    const nextSprints = sprintsForProject(sprints, nextId);
                    setCurrentSprintId(pickSprintId(nextSprints, workspaceId, nextId));
                } else {
                    setCurrentSprintId(null);
                }
            }
        } catch (e) {
            reportMutationError('Could not delete project', e);
        }
    };

    const addSprint = async (name: string) => {
        if (!workspaceId || !isAdmin || !currentProjectId) return;
        setActionError(null);
        try {
            const created = await createSprint(workspaceId, name, currentProjectId);
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
        if (projectSprints.length <= 1) {
            alert('Cannot delete the last sprint in this project.');
            return;
        }
        try {
            await deleteSprintAndTasks(id, workspaceId);
            const remaining = sprints.filter((s) => s.id !== id);
            setSprints(remaining);
            setTodos((prev) => prev.filter((t) => t.sprintId !== id));
            if (currentSprintId === id) {
                const remainingInProject = sprintsForProject(remaining, currentProjectId);
                setCurrentSprintId(remainingInProject[0]?.id ?? null);
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
        if (!workspaceId || !currentSprintId || !currentProjectId) return;
        setActionError(null);
        try {
            const created = await createTask(
                workspaceId,
                currentSprintId,
                currentProjectId,
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
                        <h2 className="planner-card__heading">Project</h2>
                        <ProjectManager
                            projects={projects}
                            currentProjectId={currentProjectId}
                            canManageProjects={isAdmin}
                            onProjectChange={handleProjectChange}
                            onAddProject={addProject}
                            onRenameProject={renameProject}
                            onDeleteProject={deleteProjectHandler}
                        />
                    </Card>
                    <Card className="planner-card planner-sprint">
                        <h2 className="planner-card__heading">Sprint</h2>
                        <SprintManager
                            sprints={projectSprints}
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
                        <h2 className="planner-card__heading">Add task</h2>
                        <AddTodoForm
                            addTodo={addTodo}
                            profiles={teamProfiles}
                            disabled={!currentSprintId || !currentProjectId}
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
                                    className="planner-empty-wrap"
                                >
                                    <EmptyState
                                        title={emptyTaskState.title}
                                        description={emptyTaskState.description}
                                    />
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
