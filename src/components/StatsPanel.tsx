
import React from 'react';
import { Todo } from '../types';

interface StatsPanelProps {
  todos: Todo[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ todos }) => {
  const completedTasks = todos.filter((t) => t.completed).length;
  const inProgressTasks = todos.length - completedTasks;

  return (
    <div className="planner-stats__grid">
      <div className="planner-stat">
        <span className="planner-stat__value">{inProgressTasks}</span>
        <span className="planner-stat__label">In progress</span>
      </div>
      <div className="planner-stat">
        <span className="planner-stat__value">{completedTasks}</span>
        <span className="planner-stat__label">Completed</span>
      </div>
      <div className="planner-stat">
        <span className="planner-stat__value">{todos.length}</span>
        <span className="planner-stat__label">Total in sprint</span>
      </div>
    </div>
  );
};

export default StatsPanel;
