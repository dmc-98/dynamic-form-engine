import type { SelectOption } from '@dmc--98/dfe-core';
export interface UseDynamicOptionsConfig {
    /** API endpoint for fetching options */
    endpoint: string;
    /** Number of items per page */
    pageSize?: number;
    /** Current search query */
    search?: string;
    /** Dependent field value (for cascading dropdowns) */
    dependsOnValue?: unknown;
    /** Dependency parameter name */
    dependsOnParam?: string;
    /** Custom fetch function */
    fetchFn?: typeof fetch;
    /** Additional headers */
    headers?: Record<string, string>;
    /** Whether to fetch on mount (default: true) */
    enabled?: boolean;
}
export interface UseDynamicOptionsReturn {
    /** Loaded options */
    options: SelectOption[];
    /** Whether options are loading */
    isLoading: boolean;
    /** Whether more pages are available */
    hasMore: boolean;
    /** Load the next page of options */
    loadMore: () => Promise<void>;
    /** Reset and reload with new search query */
    search: (query: string) => void;
    /** Error message if fetch failed */
    error: string | null;
}
/**
 * React hook for loading dynamic SELECT field options with
 * cursor-based pagination, search, and dependent field support.
 *
 * @example
 * ```tsx
 * const { options, isLoading, hasMore, loadMore, search } = useDynamicOptions({
 *   endpoint: '/api/dfe/fields/department-field/options',
 *   pageSize: 20,
 *   dependsOnValue: selectedCountry,
 *   dependsOnParam: 'countryId',
 * })
 * ```
 */
export declare function useDynamicOptions(config: UseDynamicOptionsConfig): UseDynamicOptionsReturn;
