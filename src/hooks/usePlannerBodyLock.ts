import { useEffect } from 'react';

/** Prevent document scroll on full-viewport planner grid (internal panels scroll instead). */
export function usePlannerBodyLock(active: boolean): void {
    useEffect(() => {
        if (!active) return;
        document.body.classList.add('body--lock');
        return () => {
            document.body.classList.remove('body--lock');
        };
    }, [active]);
}
