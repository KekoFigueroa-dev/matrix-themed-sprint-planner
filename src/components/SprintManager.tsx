
import React from 'react';
import { Sprint } from '../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface SprintManagerProps {
  sprints: Sprint[];
  currentSprintId: number | null;
  onSprintChange: (id: number) => void;
  onAddSprint: (name: string) => void;
  onRenameSprint: (id: number, newName: string) => void;
  onDeleteSprint: (id: number) => void;
}

const SprintManager: React.FC<SprintManagerProps> = ({
  sprints,
  currentSprintId,
  onSprintChange,
  onAddSprint,
  onRenameSprint,
  onDeleteSprint
}) => {
  const handleAdd = () => {
    const name = prompt('Enter new sprint name:');
    if (name) {
      onAddSprint(name);
    }
  };

  const handleRename = () => {
    if (!currentSprintId) return;
    const currentSprint = sprints.find(s => s.id === currentSprintId);
    const newName = prompt('Enter new name for the sprint:', currentSprint?.name);
    if (newName && currentSprintId) {
      onRenameSprint(currentSprintId, newName);
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
      <select
        value={currentSprintId ?? ''}
        onChange={(e) => onSprintChange(Number(e.target.value))}
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
        <button onClick={handleAdd} title="Add New Sprint"><Plus size={16} /> Add Sprint</button>
        <button onClick={handleRename} disabled={!currentSprintId} title="Rename Current Sprint"><Edit2 size={16} /> Rename</button>
        <button onClick={handleDelete} disabled={sprints.length <= 1 || !currentSprintId} className="delete-action" title="Delete Current Sprint"><Trash2 size={16} /> Delete</button>
      </div>
    </div>
  );
};

export default SprintManager;