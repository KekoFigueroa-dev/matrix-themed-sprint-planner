
import React, { useState } from 'react';
import { Priority, TeamMember } from '../types';

interface AddTodoFormProps {
  addTodo: (text: string, priority: Priority, assigneeId?: number) => void;
  teamMembers: TeamMember[];
}

const AddTodoForm: React.FC<AddTodoFormProps> = ({ addTodo, teamMembers }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeId, setAssigneeId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(text.trim(), priority, assigneeId ? Number(assigneeId) : undefined);
      setText('');
      setPriority('Medium');
      setAssigneeId('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo-form">
      <input
        type="text"
        className="add-todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
      />
      <select 
        className="priority-select" 
        value={priority} 
        onChange={(e) => setPriority(e.target.value as Priority)}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <select
        className="assignee-select"
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
      >
        <option value="">Unassigned</option>
        {teamMembers.map(member => (
            <option key={member.id} value={member.id}>
                {member.name}
            </option>
        ))}
      </select>
      <button type="submit" className="add-todo-button">Add</button>
    </form>
  );
};

export default AddTodoForm;