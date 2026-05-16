
import React, { useState } from 'react';
import { Priority } from '../types';
import type { WorkspaceProfile } from '../lib/teamDb';

interface AddTodoFormProps {
  addTodo: (text: string, priority: Priority, assigneeUserId?: string) => void;
  profiles: WorkspaceProfile[];
  disabled?: boolean;
}

const AddTodoForm: React.FC<AddTodoFormProps> = ({ addTodo, profiles, disabled = false }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeUserId, setAssigneeUserId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(text.trim(), priority, assigneeUserId || undefined);
      setText('');
      setPriority('Medium');
      setAssigneeUserId('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo-form">
      <input
        type="text"
        className="add-todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? 'Select a sprint first' : 'What needs to be done?'}
        disabled={disabled}
      />
      <select 
        className="priority-select" 
        value={priority} 
        onChange={(e) => setPriority(e.target.value as Priority)}
        disabled={disabled}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <select
        className="assignee-select"
        value={assigneeUserId}
        onChange={(e) => setAssigneeUserId(e.target.value)}
        disabled={disabled}
      >
        <option value="">Unassigned</option>
        {profiles.map((profile) => (
            <option key={profile.userId} value={profile.userId}>
                {profile.displayName}
            </option>
        ))}
      </select>
      <button type="submit" className="add-todo-button" disabled={disabled}>Add</button>
    </form>
  );
};

export default AddTodoForm;
