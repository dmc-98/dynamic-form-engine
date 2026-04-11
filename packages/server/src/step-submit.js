"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEndpoint = resolveEndpoint;
exports.buildContractBody = buildContractBody;
exports.propagateContext = propagateContext;
exports.executeStepSubmit = executeStepSubmit;
exports.completeSubmission = completeSubmission;
const dfe_core_1 = require("@dmc-98/dfe-core");
// ─── Endpoint Template Resolution ───────────────────────────────────────────
/**
 * Resolve placeholders in an endpoint template using context values.
 * e.g., "/api/employees/{employeeId}" + { employeeId: "123" } → "/api/employees/123"
 */
function resolveEndpoint(template, context) {
    return template.replace(/{(\w+)}/g, (_, key) => {
        const val = context[key];
        if (val === undefined || val === null) {
            throw new Error(`Missing context value for endpoint placeholder: {${key}}`);
        }
        return String(val);
    });
}
// ─── Body Builder ───────────────────────────────────────────────────────────
/**
 * Build the request body for an API contract.
 * 1. Maps form field values → API body keys via fieldMapping
 * 2. Injects context values via contextToBody
 */
function buildContractBody(contract, values, context) {
    const body = {};
    // Map form field values to API body keys
    for (const [fieldKey, bodyKey] of Object.entries(contract.fieldMapping)) {
        if (values[fieldKey] !== undefined) {
            body[bodyKey] = values[fieldKey];
        }
    }
    // Inject context values into the body (e.g., foreign keys)
    if (contract.contextToBody) {
        for (const [contextKey, bodyKey] of Object.entries(contract.contextToBody)) {
            if (context[contextKey] !== undefined) {
                body[bodyKey] = context[contextKey];
            }
        }
    }
    return body;
}
// ─── Context Propagation ────────────────────────────────────────────────────
/**
 * Extract values from an API response and merge them into the runtime context.
 * Used for propagating generated IDs across steps (e.g., employeeId from step 1 → step 2).
 */
function propagateContext(contract, response, context) {
    const updated = { ...context };
    if (contract.responseToContext) {
        for (const [responseKey, contextKey] of Object.entries(contract.responseToContext)) {
            if (response[responseKey] !== undefined) {
                updated[contextKey] = response[responseKey];
            }
        }
    }
    return updated;
}
/**
 * Execute the step submission pipeline:
 * 1. Find the step definition
 * 2. Validate field values against Zod schema
 * 3. Execute each API contract in order
 * 4. Propagate response values into the context
 * 5. Update the submission record
 *
 * @returns StepSubmitResponse with updated context (or errors)
 */
async function executeStepSubmit(opts) {
    var _a, _b;
    const { form, stepId, payload, db, submissionId, visibleFieldKeys } = opts;
    const { values, context } = payload;
    // 1. Find the step definition
    const step = form.steps.find(s => s.id === stepId);
    if (!step) {
        return {
            success: false,
            context,
            errors: { _step: `Step "${stepId}" not found` },
        };
    }
    // 2. Get fields for this step and validate
    // If visibleFieldKeys is provided, only validate visible fields
    // to avoid requiring values for conditionally hidden fields.
    let stepFields = form.fields.filter(f => f.stepId === stepId);
    if (visibleFieldKeys) {
        stepFields = stepFields.filter(f => visibleFieldKeys.includes(f.key));
    }
    if (stepFields.length > 0) {
        const schema = (0, dfe_core_1.generateZodSchema)(stepFields);
        const stepValues = {};
        for (const f of stepFields) {
            stepValues[f.key] = values[f.key];
        }
        const validation = schema.safeParse(stepValues);
        if (!validation.success) {
            const errors = {};
            for (const issue of validation.error.issues) {
                errors[issue.path.join('.')] = issue.message;
            }
            return { success: false, context, errors };
        }
    }
    // 3. Execute API contracts in order
    let updatedContext = { ...context };
    const contracts = (_b = (_a = step.config) === null || _a === void 0 ? void 0 : _a.apiContracts) !== null && _b !== void 0 ? _b : [];
    for (const contract of contracts) {
        try {
            const body = buildContractBody(contract, values, updatedContext);
            const response = await db.executeApiContract(contract, body);
            updatedContext = propagateContext(contract, response, updatedContext);
        }
        catch (err) {
            return {
                success: false,
                context: updatedContext,
                errors: {
                    _api: `Failed to execute contract for ${contract.resourceName}: ${err instanceof Error ? err.message : String(err)}`,
                },
            };
        }
    }
    // 4. Update submission record
    try {
        await db.updateSubmission(submissionId, {
            currentStepId: stepId,
            context: updatedContext,
        });
    }
    catch (err) {
        // Log the error but don't fail the step — context was already propagated.
        // Callers should monitor for these warnings in production.
        console.warn(`[DFE] Failed to update submission ${submissionId} after step ${stepId}:`, err instanceof Error ? err.message : String(err));
    }
    return { success: true, context: updatedContext };
}
// ─── Complete Submission ────────────────────────────────────────────────────
/**
 * Mark a form submission as complete.
 */
async function completeSubmission(db, submissionId, context) {
    await db.updateSubmission(submissionId, {
        status: 'COMPLETED',
        context,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcC1zdWJtaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGVwLXN1Ym1pdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWFBLDBDQVFDO0FBU0QsOENBd0JDO0FBUUQsNENBZ0JDO0FBaUNELDhDQThFQztBQU9ELGdEQVNDO0FBek1ELGtEQUF1RDtBQUd2RCwrRUFBK0U7QUFFL0U7OztHQUdHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLFFBQWdCLEVBQUUsT0FBMkI7SUFDM0UsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUM3QyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDeEIsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxHQUFHLEdBQUcsQ0FBQyxDQUFBO1FBQzdFLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNwQixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFRCwrRUFBK0U7QUFFL0U7Ozs7R0FJRztBQUNILFNBQWdCLGlCQUFpQixDQUMvQixRQUF5QixFQUN6QixNQUFrQixFQUNsQixPQUEyQjtJQUUzQixNQUFNLElBQUksR0FBNEIsRUFBRSxDQUFBO0lBRXhDLHlDQUF5QztJQUN6QyxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztRQUN4RSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0lBRUQs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QUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNqRCxFQUFFO2lCQUNIO2FBQ0YsQ0FBQTtRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsOEJBQThCO0lBQzlCLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRTtZQUN0QyxhQUFhLEVBQUUsTUFBTTtZQUNyQixPQUFPLEVBQUUsY0FBYztTQUN4QixDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLDBFQUEwRTtRQUMxRSwyREFBMkQ7UUFDM0QsT0FBTyxDQUFDLElBQUksQ0FDVixxQ0FBcUMsWUFBWSxlQUFlLE1BQU0sR0FBRyxFQUN6RSxHQUFHLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQ2pELENBQUE7SUFDSCxDQUFDO0lBRUQsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxDQUFBO0FBQ25ELENBQUM7QUFFRCwrRUFBK0U7QUFFL0U7O0dBRUc7QUFDSSxLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLEVBQW1CLEVBQ25CLFlBQW9CLEVBQ3BCLE9BQTJCO0lBRTNCLE1BQU0sRUFBRSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRTtRQUN0QyxNQUFNLEVBQUUsV0FBVztRQUNuQixPQUFPO0tBQ1IsQ0FBQyxDQUFBO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgU3RlcEFwaUNvbnRyYWN0LCBGb3JtUnVudGltZUNvbnRleHQsIEZvcm1WYWx1ZXMsXG4gIFN0ZXBTdWJtaXRQYXlsb2FkLCBTdGVwU3VibWl0UmVzcG9uc2UsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQgeyBnZW5lcmF0ZVpvZFNjaGVtYSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlQWRhcHRlciwgRm9ybVZlcnNpb25SZWNvcmQgfSBmcm9tICcuL2FkYXB0ZXJzJ1xuXG4vLyDilIDilIDilIAgRW5kcG9pbnQgVGVtcGxhdGUgUmVzb2x1dGlvbiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBSZXNvbHZlIHBsYWNlaG9sZGVycyBpbiBhbiBlbmRwb2ludCB0ZW1wbGF0ZSB1c2luZyBjb250ZXh0IHZhbHVlcy5cbiAqIGUuZy4sIFwiL2FwaS9lbXBsb3llZXMve2VtcGxveWVlSWR9XCIgKyB7IGVtcGxveWVlSWQ6IFwiMTIzXCIgfSDihpIgXCIvYXBpL2VtcGxveWVlcy8xMjNcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUVuZHBvaW50KHRlbXBsYXRlOiBzdHJpbmcsIGNvbnRleHQ6IEZvcm1SdW50aW1lQ29udGV4dCk6IHN0cmluZyB7XG4gIHJldHVybiB0ZW1wbGF0ZS5yZXBsYWNlKC97KFxcdyspfS9nLCAoXywga2V5KSA9PiB7XG4gICAgY29uc3QgdmFsID0gY29udGV4dFtrZXldXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkIHx8IHZhbCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGNvbnRleHQgdmFsdWUgZm9yIGVuZHBvaW50IHBsYWNlaG9sZGVyOiB7JHtrZXl9fWApXG4gICAgfVxuICAgIHJldHVybiBTdHJpbmcodmFsKVxuICB9KVxufVxuXG4vLyDilIDilIDilIAgQm9keSBCdWlsZGVyIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIEJ1aWxkIHRoZSByZXF1ZXN0IGJvZHkgZm9yIGFuIEFQSSBjb250cmFjdC5cbiAqIDEuIE1hcHMgZm9ybSBmaWVsZCB2YWx1ZXMg4oaSIEFQSSBib2R5IGtleXMgdmlhIGZpZWxkTWFwcGluZ1xuICogMi4gSW5qZWN0cyBjb250ZXh0IHZhbHVlcyB2aWEgY29udGV4dFRvQm9keVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRDb250cmFjdEJvZHkoXG4gIGNvbnRyYWN0OiBTdGVwQXBpQ29udHJhY3QsXG4gIHZhbHVlczogRm9ybVZhbHVlcyxcbiAgY29udGV4dDogRm9ybVJ1bnRpbWVDb250ZXh0LFxuKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICBjb25zdCBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9XG5cbiAgLy8gTWFwIGZvcm0gZmllbGQgdmFsdWVzIHRvIEFQSSBib2R5IGtleXNcbiAgZm9yIChjb25zdCBbZmllbGRLZXksIGJvZHlLZXldIG9mIE9iamVjdC5lbnRyaWVzKGNvbnRyYWN0LmZpZWxkTWFwcGluZykpIHtcbiAgICBpZiAodmFsdWVzW2ZpZWxkS2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBib2R5W2JvZHlLZXldID0gdmFsdWVzW2ZpZWxkS2V5XVxuICAgIH1cbiAgfVxuXG4gIC8vIEluamVjdCBjb250ZXh0IHZhbHVlcyBpbnRvIHRoZSBib2R5IChlLmcuLCBmb3JlaWduIGtleXMpXG4gIGlmIChjb250cmFjdC5jb250ZXh0VG9Cb2R5KSB7XG4gICAgZm9yIChjb25zdCBbY29udGV4dEtleSwgYm9keUtleV0gb2YgT2JqZWN0LmVudHJpZXMoY29udHJhY3QuY29udGV4dFRvQm9keSkpIHtcbiAgICAgIGlmIChjb250ZXh0W2NvbnRleHRLZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYm9keVtib2R5S2V5XSA9IGNvbnRleHRbY29udGV4dEtleV1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gYm9keVxufVxuXG4vLyDilIDilIDilIAgQ29udGV4dCBQcm9wYWdhdGlvbiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBFeHRyYWN0IHZhbHVlcyBmcm9tIGFuIEFQSSByZXNwb25zZSBhbmQgbWVyZ2UgdGhlbSBpbnRvIHRoZSBydW50aW1lIGNvbnRleHQuXG4gKiBVc2VkIGZvciBwcm9wYWdhdGluZyBnZW5lcmF0ZWQgSURzIGFjcm9zcyBzdGVwcyAoZS5nLiwgZW1wbG95ZWVJZCBmcm9tIHN0ZXAgMSDihpIgc3RlcCAyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3BhZ2F0ZUNvbnRleHQoXG4gIGNvbnRyYWN0OiBTdGVwQXBpQ29udHJhY3QsXG4gIHJlc3BvbnNlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgY29udGV4dDogRm9ybVJ1bnRpbWVDb250ZXh0LFxuKTogRm9ybVJ1bnRpbWVDb250ZXh0IHtcbiAgY29uc3QgdXBkYXRlZCA9IHsgLi4uY29udGV4dCB9XG5cbiAgaWYgKGNvbnRyYWN0LnJlc3BvbnNlVG9Db250ZXh0KSB7XG4gICAgZm9yIChjb25zdCBbcmVzcG9uc2VLZXksIGNvbnRleHRLZXldIG9mIE9iamVjdC5lbnRyaWVzKGNvbnRyYWN0LnJlc3BvbnNlVG9Db250ZXh0KSkge1xuICAgICAgaWYgKHJlc3BvbnNlW3Jlc3BvbnNlS2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHVwZGF0ZWRbY29udGV4dEtleV0gPSByZXNwb25zZVtyZXNwb25zZUtleV1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdXBkYXRlZFxufVxuXG4vLyDilIDilIDilIAgU3RlcCBTdWJtaXNzaW9uIFBpcGVsaW5lIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgaW50ZXJmYWNlIFN0ZXBTdWJtaXRPcHRpb25zIHtcbiAgLyoqIFRoZSBmb3JtIGRlZmluaXRpb24gKGZvciB2YWxpZGF0aW9uIHNjaGVtYSBnZW5lcmF0aW9uKSAqL1xuICBmb3JtOiBGb3JtVmVyc2lvblJlY29yZFxuICAvKiogVGhlIHN0ZXAgSUQgYmVpbmcgc3VibWl0dGVkICovXG4gIHN0ZXBJZDogc3RyaW5nXG4gIC8qKiBTdWJtaXNzaW9uIHBheWxvYWQgZnJvbSB0aGUgY2xpZW50ICovXG4gIHBheWxvYWQ6IFN0ZXBTdWJtaXRQYXlsb2FkXG4gIC8qKiBEYXRhYmFzZSBhZGFwdGVyIGZvciBleGVjdXRpbmcgQVBJIGNvbnRyYWN0cyAqL1xuICBkYjogRGF0YWJhc2VBZGFwdGVyXG4gIC8qKiBTdWJtaXNzaW9uIElEIChmb3IgdXBkYXRpbmcgcHJvZ3Jlc3MpICovXG4gIHN1Ym1pc3Npb25JZDogc3RyaW5nXG4gIC8qKlxuICAgKiBPcHRpb25hbCBsaXN0IG9mIGZpZWxkIGtleXMgdGhhdCBhcmUgY3VycmVudGx5IHZpc2libGUgb24gdGhlIGNsaWVudC5cbiAgICogV2hlbiBwcm92aWRlZCwgb25seSB0aGVzZSBmaWVsZHMgYXJlIHZhbGlkYXRlZCAoaGlkZGVuIGZpZWxkcyBhcmUgc2tpcHBlZCkuXG4gICAqIFRoaXMgcHJldmVudHMgcmVxdWlyaW5nIHZhbHVlcyBmb3IgY29uZGl0aW9uYWxseSBoaWRkZW4gZmllbGRzLlxuICAgKi9cbiAgdmlzaWJsZUZpZWxkS2V5cz86IHN0cmluZ1tdXG59XG5cbi8qKlxuICogRXhlY3V0ZSB0aGUgc3RlcCBzdWJtaXNzaW9uIHBpcGVsaW5lOlxuICogMS4gRmluZCB0aGUgc3RlcCBkZWZpbml0aW9uXG4gKiAyLiBWYWxpZGF0ZSBmaWVsZCB2YWx1ZXMgYWdhaW5zdCBab2Qgc2NoZW1hXG4gKiAzLiBFeGVjdXRlIGVhY2ggQVBJIGNvbnRyYWN0IGluIG9yZGVyXG4gKiA0LiBQcm9wYWdhdGUgcmVzcG9uc2UgdmFsdWVzIGludG8gdGhlIGNvbnRleHRcbiAqIDUuIFVwZGF0ZSB0aGUgc3VibWlzc2lvbiByZWNvcmRcbiAqXG4gKiBAcmV0dXJucyBTdGVwU3VibWl0UmVzcG9uc2Ugd2l0aCB1cGRhdGVkIGNvbnRleHQgKG9yIGVycm9ycylcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVTdGVwU3VibWl0KFxuICBvcHRzOiBTdGVwU3VibWl0T3B0aW9ucyxcbik6IFByb21pc2U8U3RlcFN1Ym1pdFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgZm9ybSwgc3RlcElkLCBwYXlsb2FkLCBkYiwgc3VibWlzc2lvbklkLCB2aXNpYmxlRmllbGRLZXlzIH0gPSBvcHRzXG4gIGNvbnN0IHsgdmFsdWVzLCBjb250ZXh0IH0gPSBwYXlsb2FkXG5cbiAgLy8gMS4gRmluZCB0aGUgc3RlcCBkZWZpbml0aW9uXG4gIGNvbnN0IHN0ZXAgPSBmb3JtLnN0ZXBzLmZpbmQocyA9PiBzLmlkID09PSBzdGVwSWQpXG4gIGlmICghc3RlcCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGNvbnRleHQsXG4gICAgICBlcnJvcnM6IHsgX3N0ZXA6IGBTdGVwIFwiJHtzdGVwSWR9XCIgbm90IGZvdW5kYCB9LFxuICAgIH1cbiAgfVxuXG4gIC8vIDIuIEdldCBmaWVsZHMgZm9yIHRoaXMgc3RlcCBhbmQgdmFsaWRhdGVcbiAgLy8gSWYgdmlzaWJsZUZpZWxkS2V5cyBpcyBwcm92aWRlZCwgb25seSB2YWxpZGF0ZSB2aXNpYmxlIGZpZWxkc1xuICAvLyB0byBhdm9pZCByZXF1aXJpbmcgdmFsdWVzIGZvciBjb25kaXRpb25hbGx5IGhpZGRlbiBmaWVsZHMuXG4gIGxldCBzdGVwRmllbGRzID0gZm9ybS5maWVsZHMuZmlsdGVyKGYgPT4gZi5zdGVwSWQgPT09IHN0ZXBJZClcbiAgaWYgKHZpc2libGVGaWVsZEtleXMpIHtcbiAgICBzdGVwRmllbGRzID0gc3RlcEZpZWxkcy5maWx0ZXIoZiA9PiB2aXNpYmxlRmllbGRLZXlzLmluY2x1ZGVzKGYua2V5KSlcbiAgfVxuICBpZiAoc3RlcEZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoc3RlcEZpZWxkcylcbiAgICBjb25zdCBzdGVwVmFsdWVzOiBGb3JtVmFsdWVzID0ge31cbiAgICBmb3IgKGNvbnN0IGYgb2Ygc3RlcEZpZWxkcykge1xuICAgICAgc3RlcFZhbHVlc1tmLmtleV0gPSB2YWx1ZXNbZi5rZXldXG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGlvbiA9IHNjaGVtYS5zYWZlUGFyc2Uoc3RlcFZhbHVlcylcbiAgICBpZiAoIXZhbGlkYXRpb24uc3VjY2Vzcykge1xuICAgICAgY29uc3QgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cbiAgICAgIGZvciAoY29uc3QgaXNzdWUgb2YgdmFsaWRhdGlvbi5lcnJvci5pc3N1ZXMpIHtcbiAgICAgICAgZXJyb3JzW2lzc3VlLnBhdGguam9pbignLicpXSA9IGlzc3VlLm1lc3NhZ2VcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBjb250ZXh0LCBlcnJvcnMgfVxuICAgIH1cbiAgfVxuXG4gIC8vIDMuIEV4ZWN1dGUgQVBJIGNvbnRyYWN0cyBpbiBvcmRlclxuICBsZXQgdXBkYXRlZENvbnRleHQgPSB7IC4uLmNvbnRleHQgfVxuICBjb25zdCBjb250cmFjdHMgPSBzdGVwLmNvbmZpZz8uYXBpQ29udHJhY3RzID8/IFtdXG5cbiAgZm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYm9keSA9IGJ1aWxkQ29udHJhY3RCb2R5KGNvbnRyYWN0LCB2YWx1ZXMsIHVwZGF0ZWRDb250ZXh0KVxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBkYi5leGVjdXRlQXBpQ29udHJhY3QoY29udHJhY3QsIGJvZHkpXG4gICAgICB1cGRhdGVkQ29udGV4dCA9IHByb3BhZ2F0ZUNvbnRleHQoY29udHJhY3QsIHJlc3BvbnNlLCB1cGRhdGVkQ29udGV4dClcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBjb250ZXh0OiB1cGRhdGVkQ29udGV4dCxcbiAgICAgICAgZXJyb3JzOiB7XG4gICAgICAgICAgX2FwaTogYEZhaWxlZCB0byBleGVjdXRlIGNvbnRyYWN0IGZvciAke2NvbnRyYWN0LnJlc291cmNlTmFtZX06ICR7XG4gICAgICAgICAgICBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycilcbiAgICAgICAgICB9YCxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyA0LiBVcGRhdGUgc3VibWlzc2lvbiByZWNvcmRcbiAgdHJ5IHtcbiAgICBhd2FpdCBkYi51cGRhdGVTdWJtaXNzaW9uKHN1Ym1pc3Npb25JZCwge1xuICAgICAgY3VycmVudFN0ZXBJZDogc3RlcElkLFxuICAgICAgY29udGV4dDogdXBkYXRlZENvbnRleHQsXG4gICAgfSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gTG9nIHRoZSBlcnJvciBidXQgZG9uJ3QgZmFpbCB0aGUgc3RlcCDigJQgY29udGV4dCB3YXMgYWxyZWFkeSBwcm9wYWdhdGVkLlxuICAgIC8vIENhbGxlcnMgc2hvdWxkIG1vbml0b3IgZm9yIHRoZXNlIHdhcm5pbmdzIGluIHByb2R1Y3Rpb24uXG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtERkVdIEZhaWxlZCB0byB1cGRhdGUgc3VibWlzc2lvbiAke3N1Ym1pc3Npb25JZH0gYWZ0ZXIgc3RlcCAke3N0ZXBJZH06YCxcbiAgICAgIGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKSxcbiAgICApXG4gIH1cblxuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBjb250ZXh0OiB1cGRhdGVkQ29udGV4dCB9XG59XG5cbi8vIOKUgOKUgOKUgCBDb21wbGV0ZSBTdWJtaXNzaW9uIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIE1hcmsgYSBmb3JtIHN1Ym1pc3Npb24gYXMgY29tcGxldGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wbGV0ZVN1Ym1pc3Npb24oXG4gIGRiOiBEYXRhYmFzZUFkYXB0ZXIsXG4gIHN1Ym1pc3Npb25JZDogc3RyaW5nLFxuICBjb250ZXh0OiBGb3JtUnVudGltZUNvbnRleHQsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgZGIudXBkYXRlU3VibWlzc2lvbihzdWJtaXNzaW9uSWQsIHtcbiAgICBzdGF0dXM6ICdDT01QTEVURUQnLFxuICAgIGNvbnRleHQsXG4gIH0pXG59XG4iXX0=