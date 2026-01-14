/**
 * Async Helpers Hook Tests
 * Tests for custom hooks that handle async operations safely
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSafeState, useDebounce, useLoadingState, useCancellableRequest } from '../hooks/useAsyncHelpers';

describe('useSafeState', () => {
    test('should update state when mounted', () => {
        const { result } = renderHook(() => useSafeState('initial'));

        expect(result.current[0]).toBe('initial');

        act(() => {
            result.current[1]('updated');
        });

        expect(result.current[0]).toBe('updated');
    });

    test('should support functional updates', () => {
        const { result } = renderHook(() => useSafeState(0));

        act(() => {
            result.current[1]((prev: number) => prev + 1);
        });

        expect(result.current[0]).toBe(1);

        act(() => {
            result.current[1]((prev: number) => prev + 5);
        });

        expect(result.current[0]).toBe(6);
    });

    test('should not update state after unmount', () => {
        const { result, unmount } = renderHook(() => useSafeState('initial'));

        unmount();

        // This should not throw or update
        act(() => {
            result.current[1]('updated');
        });

        // State should remain initial (not updated after unmount)
        expect(result.current[0]).toBe('initial');
    });
});

describe('useDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial'));
        expect(result.current).toBe('initial');
    });

    test('should debounce value changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'first' } }
        );

        expect(result.current).toBe('first');

        rerender({ value: 'second' });
        expect(result.current).toBe('first'); // Not updated yet

        act(() => {
            jest.advanceTimersByTime(150);
        });
        expect(result.current).toBe('first'); // Still not updated

        act(() => {
            jest.advanceTimersByTime(150);
        });
        expect(result.current).toBe('second'); // Now updated
    });

    test('should reset timer on new value', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'first' } }
        );

        rerender({ value: 'second' });
        act(() => {
            jest.advanceTimersByTime(200);
        });

        rerender({ value: 'third' });
        act(() => {
            jest.advanceTimersByTime(200);
        });
        expect(result.current).toBe('first'); // Timer reset, still first

        act(() => {
            jest.advanceTimersByTime(100);
        });
        expect(result.current).toBe('third'); // Now updated to third
    });
});

describe('useLoadingState', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should start with loading false', () => {
        const { result } = renderHook(() => useLoadingState());
        expect(result.current.isLoading).toBe(false);
    });

    test('should set loading true when started', () => {
        const { result } = renderHook(() => useLoadingState());

        act(() => {
            result.current.startLoading();
        });

        expect(result.current.isLoading).toBe(true);
    });

    test('should maintain minimum loading time', () => {
        const { result } = renderHook(() => useLoadingState(300));

        act(() => {
            result.current.startLoading();
        });

        // Stop immediately
        act(() => {
            result.current.stopLoading();
        });

        // Should still be loading (minimum time not elapsed)
        expect(result.current.isLoading).toBe(true);

        // Advance time past minimum
        act(() => {
            jest.advanceTimersByTime(300);
        });

        expect(result.current.isLoading).toBe(false);
    });

    test('should stop immediately if minimum time elapsed', () => {
        const { result } = renderHook(() => useLoadingState(300));

        act(() => {
            result.current.startLoading();
        });

        // Wait longer than minimum
        act(() => {
            jest.advanceTimersByTime(500);
        });

        act(() => {
            result.current.stopLoading();
        });

        expect(result.current.isLoading).toBe(false);
    });
});

describe('useCancellableRequest', () => {
    test('should provide isMounted check', () => {
        const { result } = renderHook(() => useCancellableRequest());
        expect(result.current.isMounted()).toBe(true);
    });

    test('should return false for isMounted after unmount', () => {
        const { result, unmount } = renderHook(() => useCancellableRequest());

        expect(result.current.isMounted()).toBe(true);
        unmount();
        expect(result.current.isMounted()).toBe(false);
    });

    test('should execute async function', async () => {
        const { result } = renderHook(() => useCancellableRequest());

        let executed = false;
        await act(async () => {
            await result.current.execute(async () => {
                executed = true;
                return 'done';
            });
        });

        expect(executed).toBe(true);
    });

    test('should provide abort signal to function', async () => {
        const { result } = renderHook(() => useCancellableRequest());

        let receivedSignal: AbortSignal | null = null;
        await act(async () => {
            await result.current.execute(async (signal) => {
                receivedSignal = signal;
                return 'done';
            });
        });

        expect(receivedSignal).not.toBeNull();
        expect(receivedSignal!.aborted).toBe(false);
    });

    test('should cancel previous request when new one starts', async () => {
        const { result } = renderHook(() => useCancellableRequest());

        let firstSignal: AbortSignal | null = null;
        let secondSignal: AbortSignal | null = null;

        // Start first request
        const firstPromise = result.current.execute(async (signal) => {
            firstSignal = signal;
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return 'first';
        });

        // Start second request immediately
        await act(async () => {
            await result.current.execute(async (signal) => {
                secondSignal = signal;
                return 'second';
            });
        });

        expect(firstSignal!.aborted).toBe(true);
        expect(secondSignal!.aborted).toBe(false);
    });

    test('should cancel on manual cancel call', async () => {
        const { result } = renderHook(() => useCancellableRequest());

        let signal: AbortSignal | null = null;
        result.current.execute(async (s) => {
            signal = s;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        });

        act(() => {
            result.current.cancel();
        });

        expect(signal!.aborted).toBe(true);
    });
});
