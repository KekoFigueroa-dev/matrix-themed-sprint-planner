
import React, { useState } from 'react';
import { Priority } from '../types';
import type { WorkspaceProfile } from '../lib/teamDb';
import { Button } from '../ui';

interface AddTodoFormProps {
  addTodo: (
    text: string,
    priority: Priority,
    assigneeUserId?: string,
    expectedDeliveryOn?: string | null
  ) => void;
  profiles: WorkspaceProfile[];
  disabled?: boolean;
}

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

const AddTodoForm: React.FC<AddTodoFormProps> = ({ addTodo, profiles, disabled = false }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [expectedDeliveryOn, setExpectedDeliveryOn] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(
        text.trim(),
        priority,
        assigneeUserId || undefined,
        expectedDeliveryOn || null
      );
      setText('');
      setPriority('Medium');
      setAssigneeUserId('');
      setExpectedDeliveryOn('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="planner-add-task">
      <div className="planner-add-task__title">
        <label className="ui-field__label" htmlFor="add-task-title">
          Task
        </label>
        <input
          id="add-task-title"
          type="text"
          className="ui-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? 'Select a sprint first' : 'What needs to be done?'}
          disabled={disabled}
        />
      </div>
      <div className="planner-add-task__priority">
        <label className="ui-field__label" htmlFor="add-task-priority">
          Priority
        </label>
        <select
          id="add-task-priority"
          className="ui-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          disabled={disabled}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="planner-add-task__due">
        <label className="ui-field__label" htmlFor="add-task-due">
          Due (optional)
        </label>
        <input
          id="add-task-due"
          type="date"
          className="ui-input"
          value={expectedDeliveryOn}
          onChange={(e) => setExpectedDeliveryOn(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="planner-add-task__assignee">
        <label className="ui-field__label" htmlFor="add-task-assignee">
          Assignee
        </label>
        <select
          id="add-task-assignee"
          className="ui-select"
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
      </div>
      <Button type="submit" variant="primary" disabled={disabled}>
        Add task
      </Button>
    </form>
  );
};

export default AddTodoForm;
