
import React from 'react';
import { Todo } from '../types';
import { Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WorkspaceProfile } from '../lib/teamDb';
import { Button } from '../ui';

interface TodoItemProps {
  todo: Todo;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
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

const TodoItem: React.FC<TodoItemProps> = ({ todo, toggleTodo, deleteTodo, profiles }) => {
  const priorityKey = todo.priority.toLowerCase() as 'high' | 'medium' | 'low';
  const assignee = profiles.find((p) => p.userId === todo.assigneeUserId);

  return (
    <motion.li
      className={[
        'planner-todo',
        `planner-todo--${priorityKey}`,
        todo.completed ? 'planner-todo--done' : '',
      ].filter(Boolean).join(' ')}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      <button
        type="button"
        className="planner-todo__check"
        onClick={() => toggleTodo(todo.id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        <Check className="planner-todo__check-icon" size={14} strokeWidth={3} />
      </button>
      <span className="planner-todo__text" onClick={() => toggleTodo(todo.id)} role="presentation">
        {todo.text}
      </span>
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
        onClick={() => deleteTodo(todo.id)}
        aria-label="Delete task"
      >
        <Trash2 size={18} />
      </Button>
    </motion.li>
  );
};

export default TodoItem;
