import type { TaskStatus } from '../types';

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'done', label: 'Done' },
];

export function taskStatusLabel(status: TaskStatus): string {
    return TASK_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function formatTaskDate(isoDate: string | null | undefined): string | null {
    if (!isoDate) return null;
    return isoDate;
}
