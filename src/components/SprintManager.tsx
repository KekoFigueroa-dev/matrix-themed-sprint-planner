
import React, { useState } from 'react';
import { Sprint } from '../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface SprintManagerProps {
  sprints: Sprint[];
  currentSprintId: string | null;
  onSprintChange: (id: string) => void;
  onAddSprint: (name: string) => void;
  onRenameSprint: (id: string, newName: string) => void;
  onDeleteSprint: (id: string) => void;
}

const SprintManager: React.FC<SprintManagerProps> = ({
  sprints,
  currentSprintId,
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

  return (
    <div className="sprint-manager">
      <div className="sprint-manager-row">
        <select
          value={currentSprintId ?? ''}
          onChange={(e) => onSprintChange(e.target.value)}
          className="sprint-select"
          disabled={sprints.length === 0}
        >
          {sprints.map(sprint => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </select>
        <div className="sprint-actions">
          <button type="button" onClick={handleStartAdd} title="Add New Sprint"><Plus size={16} /> Add Sprint</button>
          <button type="button" onClick={handleStartRename} disabled={!currentSprintId} title="Rename Current Sprint"><Edit2 size={16} /> Rename</button>
          <button type="button" onClick={handleDelete} disabled={sprints.length <= 1 || !currentSprintId} className="delete-action" title="Delete Current Sprint"><Trash2 size={16} /> Delete</button>
        </div>
      </div>
      {(adding || renaming) && (
        <form className="sprint-inline-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="sprint-inline-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={adding ? 'New sprint name' : 'Rename sprint'}
            autoFocus
          />
          <button type="submit" className="sprint-inline-save">{adding ? 'Create' : 'Save'}</button>
          <button type="button" className="sprint-inline-cancel" onClick={resetForms}>Cancel</button>
        </form>
      )}
    </div>
  );
};

export default SprintManager;
