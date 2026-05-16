
import React, { useState } from 'react';
import { Sprint } from '../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button, Input, Select } from '../ui';

interface SprintManagerProps {
  sprints: Sprint[];
  currentSprintId: string | null;
  canManageSprints: boolean;
  onSprintChange: (id: string) => void;
  onAddSprint: (name: string) => void;
  onRenameSprint: (id: string, newName: string) => void;
  onDeleteSprint: (id: string) => void;
}

const SprintManager: React.FC<SprintManagerProps> = ({
  sprints,
  currentSprintId,
  canManageSprints,
  onSprintChange,
  onAddSprint,
  onRenameSprint,
  onDeleteSprint
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
    if (!currentSprintId) return;
    const currentSprint = sprints.find(s => s.id === currentSprintId);
    setAdding(false);
    setRenaming(true);
    setDraftName(currentSprint?.name ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = draftName.trim();
    if (!name) return;

    if (adding) {
      onAddSprint(name);
      resetForms();
      return;
    }
    if (renaming && currentSprintId) {
      onRenameSprint(currentSprintId, name);
      resetForms();
    }
  };

  const handleDelete = () => {
    if (!currentSprintId) return;
    const currentSprint = sprints.find(s => s.id === currentSprintId);
    if (window.confirm(`Are you sure you want to delete the sprint "${currentSprint?.name}" and all its tasks?`)) {
      onDeleteSprint(currentSprintId);
    }
  };

  const sprintOptions = sprints.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="planner-sprint">
      <div className="planner-sprint__row">
        <Select
          label="Active sprint"
          value={currentSprintId ?? ''}
          onChange={(e) => onSprintChange(e.target.value)}
          disabled={sprints.length === 0}
          options={sprintOptions.length > 0 ? sprintOptions : [{ value: '', label: 'No sprints' }]}
        />
        {canManageSprints ? (
          <div className="planner-sprint__actions">
            <Button type="button" variant="secondary" onClick={handleStartAdd}>
              <Plus size={16} /> Add
            </Button>
            <Button type="button" variant="secondary" onClick={handleStartRename} disabled={!currentSprintId}>
              <Edit2 size={16} /> Rename
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={sprints.length <= 1 || !currentSprintId}
            >
              <Trash2 size={16} /> Delete
            </Button>
          </div>
        ) : (
          <p className="planner-sprint__hint">
            Member — switch sprint to work on tasks. Ask an admin to create sprints.
          </p>
        )}
      </div>
      {canManageSprints && (adding || renaming) && (
        <form className="planner-sprint__inline" onSubmit={handleSubmit}>
          <Input
            label={adding ? 'New sprint name' : 'Rename sprint'}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={adding ? 'Sprint name' : 'Updated name'}
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

export default SprintManager;
