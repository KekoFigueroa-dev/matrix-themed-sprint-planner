import React, { useState } from 'react';
import type { Project } from '../types';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select } from '../ui';

interface ProjectManagerProps {
    projects: Project[];
    currentProjectId: string | null;
    canManageProjects: boolean;
    onProjectChange: (id: string) => void;
    onAddProject: (name: string) => void;
    onRenameProject: (id: string, newName: string) => void;
    onDeleteProject: (id: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
    projects,
    currentProjectId,
    canManageProjects,
    onProjectChange,
    onAddProject,
    onRenameProject,
    onDeleteProject,
}) => {
    const [adding, setAdding] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [draftName, setDraftName] = useState('');

    const resetForms = () => {
        setAdding(false);
        setRenaming(false);
        setDraftName('');
    };

    const handleStartAdd = () => {
        setRenaming(false);
        setAdding(true);
        setDraftName('');
    };

    const handleStartRename = () => {
        if (!currentProjectId) return;
        const current = projects.find((p) => p.id === currentProjectId);
        setAdding(false);
        setRenaming(true);
        setDraftName(current?.name ?? '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = draftName.trim();
        if (!name) return;

        if (adding) {
            onAddProject(name);
            resetForms();
            return;
        }
        if (renaming && currentProjectId) {
            onRenameProject(currentProjectId, name);
            resetForms();
        }
    };

    const handleDelete = () => {
        if (!currentProjectId) return;
        const current = projects.find((p) => p.id === currentProjectId);
        if (
            window.confirm(
                `Delete project "${current?.name}"? Remove or reassign its sprints first.`
            )
        ) {
            onDeleteProject(currentProjectId);
        }
    };

    const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

    return (
        <div className="planner-sprint">
            <div className="planner-sprint__row">
                <Select
                    label="Active project"
                    value={currentProjectId ?? ''}
                    onChange={(e) => onProjectChange(e.target.value)}
                    disabled={projects.length === 0}
                    options={
                        projectOptions.length > 0
                            ? projectOptions
                            : [{ value: '', label: 'No projects' }]
                    }
                />
                {canManageProjects ? (
                    <div className="planner-sprint__actions">
                        <Button type="button" variant="secondary" onClick={handleStartAdd}>
                            <Plus size={16} /> Add
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleStartRename}
                            disabled={!currentProjectId}
                        >
                            <Edit2 size={16} /> Rename
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleDelete}
                            disabled={projects.length <= 1 || !currentProjectId}
                        >
                            <Trash2 size={16} /> Delete
                        </Button>
                    </div>
                ) : (
                    <p className="planner-sprint__hint">
                        Member — switch project to see its sprints. Ask an admin to manage projects.
                    </p>
                )}
            </div>
            {canManageProjects && (adding || renaming) && (
                <form className="planner-sprint__inline" onSubmit={handleSubmit}>
                    <Input
                        label={adding ? 'New project name' : 'Rename project'}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder={adding ? 'Project name' : 'Updated name'}
                        autoFocus
                    />
                    <Button type="submit" variant="primary">
                        {adding ? 'Create' : 'Save'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetForms}>
                        Cancel
                    </Button>
                </form>
            )}
        </div>
    );
};

export default ProjectManager;
