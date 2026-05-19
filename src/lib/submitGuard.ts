import { useCallback, useRef } from 'react';

/**
 * Ensures only one submit handler runs at a time (double-click / Enter + click).
 * Extra clicks are ignored with no error — the button stays in loading state.
 */
export function useSingleFlight() {
    const inFlightRef = useRef(false);

    const tryBegin = useCallback((): boolean => {
        if (inFlightRef.current) return false;
        inFlightRef.current = true;
        return true;
    }, []);

    const end = useCallback(() => {
        inFlightRef.current = false;
    }, []);

    return { tryBegin, end };
}
