"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeHydrationData = mergeHydrationData;
exports.resolveEndpointTemplate = resolveEndpointTemplate;
const dag_1 = require("./dag");
/**
 * Merge hydration data (from API response) with field defaults.
 * Returns the merged values and any warnings about missing/extra fields.
 *
 * @param fields - Array of field definitions
 * @param data - Raw data from the API (key → value)
 * @returns Merged values and warnings
 *
 * @example
 * ```ts
 * const { values, warnings } = mergeHydrationData(fields, apiResponse.data)
 * // values has defaults for missing fields, API values for existing ones
 * // warnings lists any data keys that don't match a field
 * ```
 */
function mergeHydrationData(fields, data) {
    const values = {};
    const warnings = [];
    const fieldKeys = new Set(fields.map(f => f.key));
    // Start with defaults for all fields
    for (const field of fields) {
        values[field.key] = (0, dag_1.getDefaultValue)(field);
    }
    // Overlay hydration data
    if (data) {
        for (const [key, value] of Object.entries(data)) {
            if (fieldKeys.has(key)) {
                values[key] = value;
            }
            else {
                warnings.push(`Hydration data contains unknown field key: "${key}"`);
            }
        }
    }
    return { values, warnings };
}
/**
 * Resolve an API endpoint template with context values.
 * Replaces {placeholders} with actual context values.
 *
 * @example
 * ```ts
 * resolveEndpointTemplate('/api/users/{userId}', { userId: 'usr_123' })
 * // → '/api/users/usr_123'
 * ```
 */
function resolveEndpointTemplate(template, context) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        const value = context[key];
        return value != null ? String(value) : `{${key}}`;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHlkcmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHlkcmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBa0JBLGdEQTBCQztBQVlELDBEQVFDO0FBL0RELCtCQUF1QztBQUV2Qzs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUNILFNBQWdCLGtCQUFrQixDQUNoQyxNQUFtQixFQUNuQixJQUFnRDtJQUVoRCxNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUE7SUFDN0IsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFBO0lBRTdCLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUVqRCxxQ0FBcUM7SUFDckMsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUEscUJBQWUsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUM1QyxDQUFDO0lBRUQseUJBQXlCO0lBQ3pCLElBQUksSUFBSSxFQUFFLENBQUM7UUFDVCxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2hELElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN2QixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFBO1lBQ3JCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixRQUFRLENBQUMsSUFBSSxDQUFDLCtDQUErQyxHQUFHLEdBQUcsQ0FBQyxDQUFBO1lBQ3RFLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUE7QUFDN0IsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILFNBQWdCLHVCQUF1QixDQUNyQyxRQUFnQixFQUNoQixPQUFnQztJQUVoQyxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBQy9DLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUMxQixPQUFPLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQTtJQUNuRCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEZvcm1GaWVsZCwgRm9ybVZhbHVlcywgSHlkcmF0aW9uUmVzdWx0IH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7IGdldERlZmF1bHRWYWx1ZSB9IGZyb20gJy4vZGFnJ1xuXG4vKipcbiAqIE1lcmdlIGh5ZHJhdGlvbiBkYXRhIChmcm9tIEFQSSByZXNwb25zZSkgd2l0aCBmaWVsZCBkZWZhdWx0cy5cbiAqIFJldHVybnMgdGhlIG1lcmdlZCB2YWx1ZXMgYW5kIGFueSB3YXJuaW5ncyBhYm91dCBtaXNzaW5nL2V4dHJhIGZpZWxkcy5cbiAqXG4gKiBAcGFyYW0gZmllbGRzIC0gQXJyYXkgb2YgZmllbGQgZGVmaW5pdGlvbnNcbiAqIEBwYXJhbSBkYXRhIC0gUmF3IGRhdGEgZnJvbSB0aGUgQVBJIChrZXkg4oaSIHZhbHVlKVxuICogQHJldHVybnMgTWVyZ2VkIHZhbHVlcyBhbmQgd2FybmluZ3NcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGNvbnN0IHsgdmFsdWVzLCB3YXJuaW5ncyB9ID0gbWVyZ2VIeWRyYXRpb25EYXRhKGZpZWxkcywgYXBpUmVzcG9uc2UuZGF0YSlcbiAqIC8vIHZhbHVlcyBoYXMgZGVmYXVsdHMgZm9yIG1pc3NpbmcgZmllbGRzLCBBUEkgdmFsdWVzIGZvciBleGlzdGluZyBvbmVzXG4gKiAvLyB3YXJuaW5ncyBsaXN0cyBhbnkgZGF0YSBrZXlzIHRoYXQgZG9uJ3QgbWF0Y2ggYSBmaWVsZFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUh5ZHJhdGlvbkRhdGEoXG4gIGZpZWxkczogRm9ybUZpZWxkW10sXG4gIGRhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB8IHVuZGVmaW5lZCxcbik6IEh5ZHJhdGlvblJlc3VsdCB7XG4gIGNvbnN0IHZhbHVlczogRm9ybVZhbHVlcyA9IHt9XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdXG5cbiAgY29uc3QgZmllbGRLZXlzID0gbmV3IFNldChmaWVsZHMubWFwKGYgPT4gZi5rZXkpKVxuXG4gIC8vIFN0YXJ0IHdpdGggZGVmYXVsdHMgZm9yIGFsbCBmaWVsZHNcbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICB2YWx1ZXNbZmllbGQua2V5XSA9IGdldERlZmF1bHRWYWx1ZShmaWVsZClcbiAgfVxuXG4gIC8vIE92ZXJsYXkgaHlkcmF0aW9uIGRhdGFcbiAgaWYgKGRhdGEpIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhkYXRhKSkge1xuICAgICAgaWYgKGZpZWxkS2V5cy5oYXMoa2V5KSkge1xuICAgICAgICB2YWx1ZXNba2V5XSA9IHZhbHVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3YXJuaW5ncy5wdXNoKGBIeWRyYXRpb24gZGF0YSBjb250YWlucyB1bmtub3duIGZpZWxkIGtleTogXCIke2tleX1cImApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgdmFsdWVzLCB3YXJuaW5ncyB9XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhbiBBUEkgZW5kcG9pbnQgdGVtcGxhdGUgd2l0aCBjb250ZXh0IHZhbHVlcy5cbiAqIFJlcGxhY2VzIHtwbGFjZWhvbGRlcnN9IHdpdGggYWN0dWFsIGNvbnRleHQgdmFsdWVzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogcmVzb2x2ZUVuZHBvaW50VGVtcGxhdGUoJy9hcGkvdXNlcnMve3VzZXJJZH0nLCB7IHVzZXJJZDogJ3Vzcl8xMjMnIH0pXG4gKiAvLyDihpIgJy9hcGkvdXNlcnMvdXNyXzEyMydcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUVuZHBvaW50VGVtcGxhdGUoXG4gIHRlbXBsYXRlOiBzdHJpbmcsXG4gIGNvbnRleHQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRlbXBsYXRlLnJlcGxhY2UoL1xceyhcXHcrKVxcfS9nLCAoXywga2V5KSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBjb250ZXh0W2tleV1cbiAgICByZXR1cm4gdmFsdWUgIT0gbnVsbCA/IFN0cmluZyh2YWx1ZSkgOiBgeyR7a2V5fX1gXG4gIH0pXG59XG4iXX0=