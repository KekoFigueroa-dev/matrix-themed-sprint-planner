import React, { useState, useEffect } from 'react';
import { Todo, Priority, TeamMember, Sprint } from './types';
import TodoItem from './components/TodoItem';
import AddTodoForm from './components/AddTodoForm';
import './styles.css';
import { AnimatePresence, motion } from 'framer-motion';
import TeamPanel from './components/TeamPanel';
import SprintManager from './components/SprintManager';
import StatsPanel from './components/StatsPanel';

const App: React.FC = () => {
    // State for Sprints, Todos, and Team Members
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [currentSprintId, setCurrentSprintId] = useState<number | null>(null);

    // One-time data migration and initialization from localStorage
    useEffect(() => {
        const savedSprints = localStorage.getItem('sprints');
        let savedTodos = localStorage.getItem('todos');
        const savedMembers = localStorage.getItem('teamMembers');

        let allSprints: Sprint[] = savedSprints ? JSON.parse(savedSprints) : [];
        let allTodos: Todo[] = savedTodos ? JSON.parse(savedTodos) : [];
        const allMembers: TeamMember[] = savedMembers ? JSON.parse(savedMembers) : [];

        // --- Data Migration Logic ---
        // If there are legacy todos but no sprints, migrate them.
        if (allTodos.length > 0 && allSprints.length === 0) {
            const initialSprint: Sprint = { id: Date.now(), name: 'Initial Sprint' };
            allSprints = [initialSprint];
            allTodos = allTodos.map(todo => ({
                ...todo,
                priority: todo.priority || 'Medium',
                sprintId: initialSprint.id, // Assign to the new sprint
            }));
            // Persist the migrated data right away
            localStorage.setItem('sprints', JSON.stringify(allSprints));
            localStorage.setItem('todos', JSON.stringify(allTodos));
        }

        setSprints(allSprints);
        setTodos(allTodos);
        setTeamMembers(allMembers);

        if (allSprints.length > 0) {
            const savedCurrentSprintId = localStorage.getItem('currentSprintId');
            setCurrentSprintId(savedCurrentSprintId ? JSON.parse(savedCurrentSprintId) : allSprints[0].id);
        }

    }, []);

    // Effect to save sprints to localStorage
    useEffect(() => {
        if (sprints.length > 0) {
            localStorage.setItem('sprints', JSON.stringify(sprints));
        } else {
             localStorage.removeItem('sprints'); // Clean up if no sprints left
        }
    }, [sprints]);
    
    // Effect to save todos to localStorage
    useEffect(() => {
        localStorage.setItem('todos', JSON.stringify(todos));
    }, [todos]);

    // Effect to save team members to localStorage
    useEffect(() => {
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    }, [teamMembers]);

    // Effect to save the current sprint ID
    useEffect(() => {
        if (currentSprintId) {
            localStorage.setItem('currentSprintId', JSON.stringify(currentSprintId));
        }
    }, [currentSprintId]);

    // --- Sprint Management ---
    const addSprint = (name: string) => {
        const newSprint = { id: Date.now(), name };
        const newSprints = [...sprints, newSprint];
        setSprints(newSprints);
        setCurrentSprintId(newSprint.id); // Switch to the new sprint
    };

    const renameSprint = (id: number, newName: string) => {
        setSprints(sprints.map(s => s.id === id ? { ...s, name: newName } : s));
    };

    const deleteSprint = (id: number) => {
        // Prevent deleting the last sprint
        if (sprints.length <= 1) {
            alert("Cannot delete the last sprint.");
            return;
        }
        setTodos(todos.filter(t => t.sprintId !== id));
        const remainingSprints = sprints.filter(s => s.id !== id);
        setSprints(remainingSprints);
        setCurrentSprintId(remainingSprints[0]?.id || null);
    };

    // --- Task Management ---
    const addTodo = (text: string, priority: Priority, assigneeId?: number) => {
        if (!currentSprintId) return;
        const newTodo: Todo = {
            id: Date.now(),
            text,
            completed: false,
            priority,
            sprintId: currentSprintId,
            assigneeId: assigneeId ? Number(assigneeId) : undefined,
        };
        setTodos([newTodo, ...todos]);
    };

    const toggleTodo = (id: number) => {
        setTodos(
            todos.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };

    const deleteTodo = (id: number) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    // --- Team Management ---
    const addTeamMember = (name: string, role: string) => {
        const newMember: TeamMember = { id: Date.now(), name, role };
        setTeamMembers([...teamMembers, newMember]);
    };

    const editTeamMember = (id: number, name: string, role: string) => {
        setTeamMembers(teamMembers.map(member => 
            member.id === id ? { ...member, name, role } : member));
    };



    const deleteTeamMember = (id: number) => {
        // Also unassign tasks from the deleted member
        setTodos(todos.map(todo => todo.assigneeId === id ? {...todo, assigneeId: undefined} : todo));
        setTeamMembers(teamMembers.filter(member => member.id !== id));
    };


    const filteredTodos = todos.filter(todo => todo.sprintId === currentSprintId);

    return (
        <div className="sprint-planner-layout">
            <TeamPanel 
                teamMembers={teamMembers}
                addTeamMember={addTeamMember}
                editTeamMember={editTeamMember}
                deleteTeamMember={deleteTeamMember}
            />
            <main className="main-content-wrapper">
                <header className="main-header">
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
                                filteredTodos.map(todo => (
                                    <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        toggleTodo={toggleTodo}
                                        deleteTodo={deleteTodo}
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
                                    {sprints.length > 0 ? "This sprint is empty. Add a task!" : "Create a sprint to get started."}
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

export default App;