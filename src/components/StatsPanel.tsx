
import React from 'react';
import { Todo, isActivePlannerTask } from '../types';

interface StatsPanelProps {
  todos: Todo[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ todos }) => {
  const active = todos.filter(isActivePlannerTask);
  const inProgress = active.filter((t) => t.status === 'in_progress').length;
  const blocked = active.filter((t) => t.status === 'blocked').length;
  const todoCount = active.filter((t) => t.status === 'todo').length;

  return (
    <div className="planner-stats__grid">
      <div className="planner-stat">
        <span className="planner-stat__value">{active.length}</span>
        <span className="planner-stat__label">Active in sprint</span>
      </div>
      <div className="planner-stat">
        <span className="planner-stat__value">{inProgress}</span>
        <span className="planner-stat__label">In progress</span>
      </div>
      <div className="planner-stat">
        <span className="planner-stat__value">{blocked}</span>
        <span className="planner-stat__label">Blocked</span>
      </div>
      <div className="planner-stat">
        <span className="planner-stat__value">{todoCount}</span>
        <span className="planner-stat__label">Todo</span>
      </div>
    </div>
  );
};

export default StatsPanel;
