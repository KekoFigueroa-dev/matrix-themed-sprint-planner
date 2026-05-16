
import React from 'react';
import { Todo } from '../types';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WorkspaceProfile } from '../lib/teamDb';

interface TodoItemProps {
  todo: Todo;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  profiles: WorkspaceProfile[];
}

const itemVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { opacity: 0, height: 0, scale: 0.9, marginBottom: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.2 } },
};

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, toggleTodo, deleteTodo, profiles }) => {
  const priorityClass = `priority-${todo.priority.toLowerCase()}`;
  const assignee = profiles.find((p) => p.userId === todo.assigneeUserId);

  return (
    <motion.li 
      className={`todo-item ${todo.completed ? 'completed' : ''} ${priorityClass}`}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      <button className="toggle-button" onClick={() => toggleTodo(todo.id)}>
         <div className="toggle-button-tick">X</div>
      </button>
      <span className="todo-text" onClick={() => toggleTodo(todo.id)}>
        {todo.text}
      </span>
      <div className="item-tags">
        {assignee && (
            <span className="assignee-tag" title={`Assigned to ${assignee.displayName}`}>
                {getInitials(assignee.displayName)}
            </span>
        )}
        <span className={`priority-tag ${priorityClass}`}>
          {todo.priority}
        </span>
      </div>
      <button className="delete-button" onClick={() => deleteTodo(todo.id)}>
        <X size={24} />
      </button>
    </motion.li>
  );
};

export default TodoItem;
