
import React, { useState } from 'react';
import { Todo, TaskStatus } from '../types';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WorkspaceProfile } from '../lib/teamDb';
import type { TaskUpdatePatch } from '../lib/plannerDb';
import { TASK_STATUS_OPTIONS } from '../lib/taskLabels';
import { Button } from '../ui';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, patch: TaskUpdatePatch) => void;
  onDelete: (id: string) => void;
  profiles: WorkspaceProfile[];
}

const itemVariants = {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

const getInitials = (name: string) => {
    const names = name.split(' ').filter(Boolean);
    if (names.length === 0) return '??';
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete, profiles }) => {
  const priorityKey = todo.priority.toLowerCase() as 'high' | 'medium' | 'low';
  const assignee = profiles.find((p) => p.userId === todo.assigneeUserId);
  const [blockedDraft, setBlockedDraft] = useState(todo.blockedReason ?? '');

  const handleStatusChange = (status: TaskStatus) => {
    const patch: TaskUpdatePatch = { status };
    if (status === 'blocked' && blockedDraft.trim()) {
      patch.blockedReason = blockedDraft.trim();
    }
    onUpdate(todo.id, patch);
  };

  return (
    <motion.li
      className={[
        'planner-todo',
        `planner-todo--${priorityKey}`,
        `planner-todo--status-${todo.status}`,
      ].join(' ')}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      <div className="planner-todo__main">
        <select
          className="ui-select planner-todo__status"
          value={todo.status}
          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
          aria-label="Task status"
        >
          {TASK_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="planner-todo__text">{todo.text}</span>
        <div className="planner-todo__meta">
          {todo.startedOn && (
            <span className="planner-todo__date" title="Started">
              Start {todo.startedOn}
            </span>
          )}
          {todo.expectedDeliveryOn && (
            <span className="planner-todo__date" title="Expected delivery">
              Due {todo.expectedDeliveryOn}
            </span>
          )}
          {todo.finishedOn && (
            <span className="planner-todo__date" title="Finished">
              Done {todo.finishedOn}
            </span>
          )}
        </div>
        {todo.status === 'blocked' && (
          <input
            type="text"
            className="ui-input planner-todo__blocked"
            placeholder="Blocked reason…"
            value={blockedDraft}
            onChange={(e) => setBlockedDraft(e.target.value)}
            onBlur={() => {
              if (blockedDraft.trim() !== (todo.blockedReason ?? '')) {
                onUpdate(todo.id, { blockedReason: blockedDraft.trim() || null });
              }
            }}
          />
        )}
      </div>
      <div className="planner-todo__tags">
        {assignee && (
          <span className="planner-assignee-chip" title={`Assigned to ${assignee.displayName}`}>
            {getInitials(assignee.displayName)}
          </span>
        )}
        <span className={`planner-priority-chip planner-priority-chip--${priorityKey}`}>
          {todo.priority}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="planner-todo__delete"
        onClick={() => onDelete(todo.id)}
        aria-label="Delete task"
      >
        <Trash2 size={18} />
      </Button>
    </motion.li>
  );
};

export default TodoItem;
