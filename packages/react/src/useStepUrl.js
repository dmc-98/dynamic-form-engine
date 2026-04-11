"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStepUrl = useStepUrl;
const react_1 = require("react");
// ─── Hook ───────────────────────────────────────────────────────────────────
/**
 * Utility hook for syncing step index to URL search params.
 * Works with react-router-dom's `useSearchParams` or any
 * compatible search param API.
 *
 * The URL stores a 0-based step index (e.g., `?step=2` for step 3).
 *
 * @example
 * ```tsx
 * import { useSearchParams } from 'react-router-dom'
 * import { useFormEngine, useFormStepper, useStepUrl } from '@dmc-98/dfe-react'
 *
 * function MultiStepForm({ formData }) {
 *   const [searchParams, setSearchParams] = useSearchParams()
 *   const engine = useFormEngine({ fields: formData.fields })
 *
 *   const stepUrl = useStepUrl({
 *     totalSteps: formData.steps.length,
 *     searchParams,
 *     setSearchParams,
 *   })
 *
 *   const stepper = useFormStepper({
 *     steps: formData.steps,
 *     engine: engine.engine,
 *     initialIndex: stepUrl.initialIndex,
 *     onIndexChange: stepUrl.onIndexChange,
 *     onNavigate: (direction) => {
 *       if (direction === 'back') refetchSubmissionData()
 *     },
 *   })
 *
 *   // ...
 * }
 * ```
 */
function useStepUrl(options) {
    const { totalSteps, paramName = 'step', searchParams, setSearchParams } = options;
    const initialIndex = (0, react_1.useMemo)(() => {
        const raw = searchParams.get(paramName);
        if (raw === null)
            return 0;
        const parsed = parseInt(raw, 10);
        if (!Number.isFinite(parsed) || parsed < 0)
            return 0;
        return Math.min(parsed, Math.max(0, totalSteps - 1));
    }, [searchParams, paramName, totalSteps]);
    const onIndexChange = (0, react_1.useCallback)((index) => {
        const next = new URLSearchParams(searchParams);
        if (index === 0) {
            next.delete(paramName);
        }
        else {
            next.set(paramName, String(index));
        }
        setSearchParams(next, { replace: true });
    }, [searchParams, paramName, setSearchParams]);
    return { initialIndex, onIndexChange };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlU3RlcFVybC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZVN0ZXBVcmwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFxRUEsZ0NBc0JDO0FBM0ZELGlDQUE0QztBQStCNUMsK0VBQStFO0FBRS9FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1DRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxPQUEwQjtJQUNuRCxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsR0FBRyxNQUFNLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxHQUFHLE9BQU8sQ0FBQTtJQUVqRixNQUFNLFlBQVksR0FBRyxJQUFBLGVBQU8sRUFBQyxHQUFHLEVBQUU7UUFDaEMsTUFBTSxHQUFHLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUN2QyxJQUFJLEdBQUcsS0FBSyxJQUFJO1lBQUUsT0FBTyxDQUFDLENBQUE7UUFDMUIsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQztZQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdEQsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFBO0lBRXpDLE1BQU0sYUFBYSxHQUFHLElBQUEsbUJBQVcsRUFBQyxDQUFDLEtBQWEsRUFBRSxFQUFFO1FBQ2xELE1BQU0sSUFBSSxHQUFHLElBQUksZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQzlDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDeEIsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtRQUNwQyxDQUFDO1FBQ0QsZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQzFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQTtJQUU5QyxPQUFPLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxDQUFBO0FBQ3hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlTWVtbyB9IGZyb20gJ3JlYWN0J1xuXG4vLyDilIDilIDilIAgVHlwZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlU3RlcFVybE9wdGlvbnMge1xuICAvKiogVG90YWwgbnVtYmVyIG9mIHN0ZXBzIChmb3IgY2xhbXBpbmcpICovXG4gIHRvdGFsU3RlcHM6IG51bWJlclxuICAvKiogU2VhcmNoIHBhcmFtIG5hbWUgKGRlZmF1bHQ6ICdzdGVwJykgKi9cbiAgcGFyYW1OYW1lPzogc3RyaW5nXG4gIC8qKlxuICAgKiBSZWFkIGN1cnJlbnQgc2VhcmNoIHBhcmFtcy5cbiAgICogQ29tcGF0aWJsZSB3aXRoIHJlYWN0LXJvdXRlci1kb20ncyBgdXNlU2VhcmNoUGFyYW1zKClbMF1gLlxuICAgKi9cbiAgc2VhcmNoUGFyYW1zOiBVUkxTZWFyY2hQYXJhbXNcbiAgLyoqXG4gICAqIFNldCBzZWFyY2ggcGFyYW1zLlxuICAgKiBDb21wYXRpYmxlIHdpdGggcmVhY3Qtcm91dGVyLWRvbSdzIGB1c2VTZWFyY2hQYXJhbXMoKVsxXWAuXG4gICAqL1xuICBzZXRTZWFyY2hQYXJhbXM6IChwYXJhbXM6IFVSTFNlYXJjaFBhcmFtcywgb3B0aW9ucz86IHsgcmVwbGFjZT86IGJvb2xlYW4gfSkgPT4gdm9pZFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVzZVN0ZXBVcmxSZXR1cm4ge1xuICAvKiogVGhlIGluaXRpYWwgc3RlcCBpbmRleCBwYXJzZWQgZnJvbSB0aGUgVVJMIChjbGFtcGVkIHRvIHZhbGlkIHJhbmdlKSAqL1xuICBpbml0aWFsSW5kZXg6IG51bWJlclxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gc3luYyB0aGUgc3RlcCBpbmRleCB0byB0aGUgVVJMLlxuICAgKiBQYXNzIHRoaXMgYXMgYG9uSW5kZXhDaGFuZ2VgIHRvIGB1c2VGb3JtU3RlcHBlcmAuXG4gICAqL1xuICBvbkluZGV4Q2hhbmdlOiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZFxufVxuXG4vLyDilIDilIDilIAgSG9vayDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBVdGlsaXR5IGhvb2sgZm9yIHN5bmNpbmcgc3RlcCBpbmRleCB0byBVUkwgc2VhcmNoIHBhcmFtcy5cbiAqIFdvcmtzIHdpdGggcmVhY3Qtcm91dGVyLWRvbSdzIGB1c2VTZWFyY2hQYXJhbXNgIG9yIGFueVxuICogY29tcGF0aWJsZSBzZWFyY2ggcGFyYW0gQVBJLlxuICpcbiAqIFRoZSBVUkwgc3RvcmVzIGEgMC1iYXNlZCBzdGVwIGluZGV4IChlLmcuLCBgP3N0ZXA9MmAgZm9yIHN0ZXAgMykuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzeFxuICogaW1wb3J0IHsgdXNlU2VhcmNoUGFyYW1zIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcbiAqIGltcG9ydCB7IHVzZUZvcm1FbmdpbmUsIHVzZUZvcm1TdGVwcGVyLCB1c2VTdGVwVXJsIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtcmVhY3QnXG4gKlxuICogZnVuY3Rpb24gTXVsdGlTdGVwRm9ybSh7IGZvcm1EYXRhIH0pIHtcbiAqICAgY29uc3QgW3NlYXJjaFBhcmFtcywgc2V0U2VhcmNoUGFyYW1zXSA9IHVzZVNlYXJjaFBhcmFtcygpXG4gKiAgIGNvbnN0IGVuZ2luZSA9IHVzZUZvcm1FbmdpbmUoeyBmaWVsZHM6IGZvcm1EYXRhLmZpZWxkcyB9KVxuICpcbiAqICAgY29uc3Qgc3RlcFVybCA9IHVzZVN0ZXBVcmwoe1xuICogICAgIHRvdGFsU3RlcHM6IGZvcm1EYXRhLnN0ZXBzLmxlbmd0aCxcbiAqICAgICBzZWFyY2hQYXJhbXMsXG4gKiAgICAgc2V0U2VhcmNoUGFyYW1zLFxuICogICB9KVxuICpcbiAqICAgY29uc3Qgc3RlcHBlciA9IHVzZUZvcm1TdGVwcGVyKHtcbiAqICAgICBzdGVwczogZm9ybURhdGEuc3RlcHMsXG4gKiAgICAgZW5naW5lOiBlbmdpbmUuZW5naW5lLFxuICogICAgIGluaXRpYWxJbmRleDogc3RlcFVybC5pbml0aWFsSW5kZXgsXG4gKiAgICAgb25JbmRleENoYW5nZTogc3RlcFVybC5vbkluZGV4Q2hhbmdlLFxuICogICAgIG9uTmF2aWdhdGU6IChkaXJlY3Rpb24pID0+IHtcbiAqICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdiYWNrJykgcmVmZXRjaFN1Ym1pc3Npb25EYXRhKClcbiAqICAgICB9LFxuICogICB9KVxuICpcbiAqICAgLy8gLi4uXG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVN0ZXBVcmwob3B0aW9uczogVXNlU3RlcFVybE9wdGlvbnMpOiBVc2VTdGVwVXJsUmV0dXJuIHtcbiAgY29uc3QgeyB0b3RhbFN0ZXBzLCBwYXJhbU5hbWUgPSAnc3RlcCcsIHNlYXJjaFBhcmFtcywgc2V0U2VhcmNoUGFyYW1zIH0gPSBvcHRpb25zXG5cbiAgY29uc3QgaW5pdGlhbEluZGV4ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgcmF3ID0gc2VhcmNoUGFyYW1zLmdldChwYXJhbU5hbWUpXG4gICAgaWYgKHJhdyA9PT0gbnVsbCkgcmV0dXJuIDBcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChyYXcsIDEwKVxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgfHwgcGFyc2VkIDwgMCkgcmV0dXJuIDBcbiAgICByZXR1cm4gTWF0aC5taW4ocGFyc2VkLCBNYXRoLm1heCgwLCB0b3RhbFN0ZXBzIC0gMSkpXG4gIH0sIFtzZWFyY2hQYXJhbXMsIHBhcmFtTmFtZSwgdG90YWxTdGVwc10pXG5cbiAgY29uc3Qgb25JbmRleENoYW5nZSA9IHVzZUNhbGxiYWNrKChpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgY29uc3QgbmV4dCA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoc2VhcmNoUGFyYW1zKVxuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgbmV4dC5kZWxldGUocGFyYW1OYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0LnNldChwYXJhbU5hbWUsIFN0cmluZyhpbmRleCkpXG4gICAgfVxuICAgIHNldFNlYXJjaFBhcmFtcyhuZXh0LCB7IHJlcGxhY2U6IHRydWUgfSlcbiAgfSwgW3NlYXJjaFBhcmFtcywgcGFyYW1OYW1lLCBzZXRTZWFyY2hQYXJhbXNdKVxuXG4gIHJldHVybiB7IGluaXRpYWxJbmRleCwgb25JbmRleENoYW5nZSB9XG59XG4iXX0=