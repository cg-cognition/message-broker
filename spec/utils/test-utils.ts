import { vi, beforeEach, MockInstance } from 'vitest';

/**
 * Creates a mock object with TypeScript type support
 * Similar API to ts-mocking-bird's Mock.create<T>()
 */
export function createMock<T>() {
    const mock = {} as T;
    const mockFunctions = new Map<string, MockInstance>();

    const mockObj = {
        mock,
        setup: <K extends keyof T>(fn: K, impl: T[K] extends (...args: any[]) => any ? T[K] : never) => {
            const mockFn = vi.fn().mockImplementation(impl as any);
            mockFunctions.set(fn as string, mockFn);
            (mock as any)[fn] = mockFn;
            return mockObj;
        },
    };

    return mockObj;
}

/**
 * Replaces properties on objects before each test
 * Similar to ts-mocking-bird's replacePropertiesBeforeEach
 */
export function replaceProperties(mocks: Array<{ package: any; mocks: Record<string, unknown> }>) {
    beforeEach(() => {
        mocks.forEach(({ package: pkg, mocks }) => {
            Object.entries(mocks).forEach(([key, value]) => {
                if (typeof value === 'function') {
                    pkg[key] = vi.fn().mockImplementation(value as any);
                } else {
                    pkg[key] = value;
                }
            });
        });
    });
}

/**
 * Type helper for creating mock implementations
 */
export type MockOf<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? MockInstance : T[K];
};
