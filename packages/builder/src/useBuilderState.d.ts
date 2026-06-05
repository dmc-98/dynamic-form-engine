import type { BuilderState, BuilderAction } from './types';
/**
 * Hook that manages the builder state with a reducer.
 * Returns [state, dispatch] tuple.
 */
export declare function useBuilderState(): [BuilderState, React.Dispatch<BuilderAction>];
export type { BuilderState, BuilderAction };
