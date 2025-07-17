
import React from 'react';
import { Todo } from '../types';

interface StatsPanelProps {
  todos: Todo[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ todos }) => {
  const completedTasks = todos.filter(t => t.completed).length;
  const inProgressTasks = todos.length - completedTasks;

  return (
    <div className="stats-panel">
      <div className="stat-item">
        <span className="stat-value">{inProgressTasks}</span>
        <span className="stat-label">Tasks In Progress</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{completedTasks}</span>
        <span className="stat-label">Tasks Completed</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{todos.length}</span>
        <span className="stat-label">Total In Sprint</span>
      </div>
    </div>
  );
};

export default StatsPanel;
