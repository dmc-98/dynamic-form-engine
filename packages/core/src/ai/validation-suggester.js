"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestValidationRules = suggestValidationRules;
/**
 * Suggest validation rules based on field labels, types, and keys.
 * Uses heuristic patterns without requiring an LLM.
 *
 * @example
 * const fields: FormField[] = [
 *   { key: 'email', label: 'Email', type: 'EMAIL', ... },
 *   { key: 'age', label: 'Age', type: 'NUMBER', ... },
 * ]
 * const suggestions = suggestValidationRules(fields)
 */
function suggestValidationRules(fields) {
    return fields.map(field => {
        const suggestions = collectSuggestionsForField(field);
        return {
            fieldKey: field.key,
            fieldType: field.type,
            suggestions,
        };
    });
}
/**
 * Collect validation suggestions for a single field
 */
function collectSuggestionsForField(field) {
    const label = field.label.toLowerCase();
    const key = field.key.toLowerCase();
    const type = field.type;
    const suggestions = [];
    // Email patterns
    if (type === 'EMAIL' || label.includes('email') || key.includes('email')) {
        suggestions.push({
            rule: 'email_format',
            description: 'Validate email format using standard regex pattern',
            config: {
                pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            },
            confidence: 0.95,
        });
    }
    // Phone patterns
    if (type === 'PHONE' || label.includes('phone') || key.includes('phone') || key.includes('contact')) {
        suggestions.push({
            rule: 'phone_length',
            description: 'Require minimum phone length (10 digits)',
            config: { minLength: 10 },
            confidence: 0.85,
        });
        suggestions.push({
            rule: 'phone_pattern',
            description: 'Validate phone format (digits, spaces, hyphens, parentheses)',
            config: {
                pattern: '^[\\d\\s\\-()]+$',
            },
            confidence: 0.80,
        });
    }
    // URL patterns
    if (type === 'URL' || label.includes('website') || label.includes('url') || key.includes('url') || key.includes('website')) {
        suggestions.push({
            rule: 'url_pattern',
            description: 'Validate URL format',
            config: {
                pattern: '^https?://.+',
            },
            confidence: 0.90,
        });
    }
    // Zip code patterns (US)
    if (label.includes('zip') || key.includes('zip') || key.includes('postal')) {
        suggestions.push({
            rule: 'zip_pattern',
            description: 'Validate US zip code (5 or 9 digits)',
            config: {
                pattern: '^\\d{5}(-\\d{4})?$',
            },
            confidence: 0.75,
        });
    }
    // SSN patterns
    if (label.includes('ssn') || label.includes('social') || key.includes('ssn') || key.includes('tax_id')) {
        suggestions.push({
            rule: 'sensitive_data_warning',
            description: 'WARNING: This field collects sensitive SSN data - ensure proper security',
            config: { sensitiveData: true },
            confidence: 0.95,
        });
        suggestions.push({
            rule: 'ssn_pattern',
            description: 'Validate SSN format (XXX-XX-XXXX)',
            config: {
                pattern: '^\\d{3}-\\d{2}-\\d{4}$',
            },
            confidence: 0.80,
        });
    }
    // Password patterns
    if (type === 'PASSWORD' || label.includes('password') || key.includes('password')) {
        suggestions.push({
            rule: 'password_minlength',
            description: 'Require minimum password length (8 characters)',
            config: { minLength: 8 },
            confidence: 0.90,
        });
        suggestions.push({
            rule: 'password_complexity',
            description: 'Require password to contain uppercase, lowercase, and numbers',
            config: {
                pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
            },
            confidence: 0.85,
        });
    }
    // Name patterns
    if (label.includes('name') && !label.includes('username')) {
        suggestions.push({
            rule: 'name_minlength',
            description: 'Require minimum name length (2 characters)',
            config: { minLength: 2 },
            confidence: 0.80,
        });
        suggestions.push({
            rule: 'name_maxlength',
            description: 'Limit name length (max 100 characters)',
            config: { maxLength: 100 },
            confidence: 0.75,
        });
    }
    // Age patterns
    if (label.includes('age') || key.includes('age')) {
        if (type === 'NUMBER') {
            suggestions.push({
                rule: 'age_min',
                description: 'Minimum age requirement (0)',
                config: { min: 0 },
                confidence: 0.85,
            });
            suggestions.push({
                rule: 'age_max',
                description: 'Maximum age limit (150)',
                config: { max: 150 },
                confidence: 0.80,
            });
        }
    }
    // Numeric ranges
    if (type === 'NUMBER') {
        if (label.includes('salary') || label.includes('income') || label.includes('wage')) {
            suggestions.push({
                rule: 'amount_min',
                description: 'Salary should be positive',
                config: { min: 0 },
                confidence: 0.90,
            });
        }
        if (label.includes('quantity') || label.includes('count')) {
            suggestions.push({
                rule: 'quantity_min',
                description: 'Quantity must be at least 1',
                config: { min: 1 },
                confidence: 0.85,
            });
        }
    }
    // Date patterns
    if (type === 'DATE' || type === 'DATE_TIME') {
        if (label.includes('birth') || key.includes('dob')) {
            suggestions.push({
                rule: 'date_reasonable_past',
                description: 'Birth date should be in the past',
                config: { maxDate: 'today', minDate: '1900-01-01' },
                confidence: 0.90,
            });
        }
        if (label.includes('start') && !label.includes('end')) {
            suggestions.push({
                rule: 'date_not_future',
                description: 'Start date should not be in the future',
                config: { maxDate: 'today' },
                confidence: 0.85,
            });
        }
    }
    // Select fields - require value if field is required
    if (type === 'SELECT' || type === 'MULTI_SELECT' || type === 'RADIO') {
        if (field.required) {
            suggestions.push({
                rule: 'not_empty_select',
                description: 'Require a selection to be made',
                config: {},
                confidence: 0.95,
            });
        }
    }
    // File upload patterns
    if (type === 'FILE_UPLOAD') {
        suggestions.push({
            rule: 'file_required',
            description: 'File upload must be provided',
            config: {},
            confidence: 0.90,
        });
        if (label.includes('resume') || label.includes('cv')) {
            suggestions.push({
                rule: 'file_types_document',
                description: 'Allow PDF, DOC, DOCX formats',
                config: {
                    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                },
                confidence: 0.85,
            });
            suggestions.push({
                rule: 'file_size_limit',
                description: 'Limit file size to 5MB',
                config: { maxSizeMB: 5 },
                confidence: 0.80,
            });
        }
        if (label.includes('image') || label.includes('photo') || label.includes('avatar')) {
            suggestions.push({
                rule: 'file_types_image',
                description: 'Allow image formats (JPG, PNG, GIF)',
                config: {
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                },
                confidence: 0.90,
            });
            suggestions.push({
                rule: 'file_size_limit',
                description: 'Limit image file size to 2MB',
                config: { maxSizeMB: 2 },
                confidence: 0.85,
            });
        }
    }
    // Long text patterns
    if (type === 'LONG_TEXT' || type === 'RICH_TEXT') {
        if (label.includes('message') || label.includes('comment')) {
            suggestions.push({
                rule: 'text_minlength',
                description: 'Require at least 10 characters',
                config: { minLength: 10 },
                confidence: 0.70,
            });
        }
        suggestions.push({
            rule: 'text_maxlength',
            description: 'Limit text to 5000 characters',
            config: { maxLength: 5000 },
            confidence: 0.75,
        });
    }
    // Required field validation
    if (field.required && !suggestions.some(s => s.rule.includes('required'))) {
        suggestions.push({
            rule: 'field_required',
            description: 'Field is required and cannot be empty',
            config: {},
            confidence: 0.95,
        });
    }
    // Sort by confidence descending
    suggestions.sort((a, b) => b.confidence - a.confidence);
    return suggestions;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi1zdWdnZXN0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2YWxpZGF0aW9uLXN1Z2dlc3Rlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQXdCQSx3REFTQztBQXBCRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBZ0Isc0JBQXNCLENBQUMsTUFBbUI7SUFDeEQsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLE1BQU0sV0FBVyxHQUFHLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JELE9BQU87WUFDTCxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQUc7WUFDbkIsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJO1lBQ3JCLFdBQVc7U0FDWixDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLDBCQUEwQixDQUFDLEtBQWdCO0lBQ2xELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDdkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNuQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFBO0lBQ3ZCLE1BQU0sV0FBVyxHQUF3QyxFQUFFLENBQUE7SUFFM0QsaUJBQWlCO0lBQ2pCLElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUN6RSxXQUFXLENBQUMsSUFBSSxDQUFDO1lBQ2YsSUFBSSxFQUFFLGNBQWM7WUFDcEIsV0FBVyxFQUFFLG9EQUFvRDtZQUNqRSxNQUFNLEVBQUU7Z0JBQ04sT0FBTyxFQUFFLGdDQUFnQzthQUMxQztZQUNELFVBQVUsRUFBRSxJQUFJO1NBQ2pCLENBQUMsQ0FBQTtJQUNK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O0lBRXZELE9BQU8sV0FBVyxDQUFBO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEZvcm1GaWVsZCwgRmllbGRUeXBlIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFsaWRhdGlvblN1Z2dlc3Rpb24ge1xuICBmaWVsZEtleTogc3RyaW5nXG4gIGZpZWxkVHlwZTogRmllbGRUeXBlXG4gIHN1Z2dlc3Rpb25zOiBBcnJheTx7XG4gICAgcnVsZTogc3RyaW5nXG4gICAgZGVzY3JpcHRpb246IHN0cmluZ1xuICAgIGNvbmZpZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICBjb25maWRlbmNlOiBudW1iZXIgIC8vIDAtMVxuICB9PlxufVxuXG4vKipcbiAqIFN1Z2dlc3QgdmFsaWRhdGlvbiBydWxlcyBiYXNlZCBvbiBmaWVsZCBsYWJlbHMsIHR5cGVzLCBhbmQga2V5cy5cbiAqIFVzZXMgaGV1cmlzdGljIHBhdHRlcm5zIHdpdGhvdXQgcmVxdWlyaW5nIGFuIExMTS5cbiAqXG4gKiBAZXhhbXBsZVxuICogY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAqICAgeyBrZXk6ICdlbWFpbCcsIGxhYmVsOiAnRW1haWwnLCB0eXBlOiAnRU1BSUwnLCAuLi4gfSxcbiAqICAgeyBrZXk6ICdhZ2UnLCBsYWJlbDogJ0FnZScsIHR5cGU6ICdOVU1CRVInLCAuLi4gfSxcbiAqIF1cbiAqIGNvbnN0IHN1Z2dlc3Rpb25zID0gc3VnZ2VzdFZhbGlkYXRpb25SdWxlcyhmaWVsZHMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdWdnZXN0VmFsaWRhdGlvblJ1bGVzKGZpZWxkczogRm9ybUZpZWxkW10pOiBWYWxpZGF0aW9uU3VnZ2VzdGlvbltdIHtcbiAgcmV0dXJuIGZpZWxkcy5tYXAoZmllbGQgPT4ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gY29sbGVjdFN1Z2dlc3Rpb25zRm9yRmllbGQoZmllbGQpXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpZWxkS2V5OiBmaWVsZC5rZXksXG4gICAgICBmaWVsZFR5cGU6IGZpZWxkLnR5cGUsXG4gICAgICBzdWdnZXN0aW9ucyxcbiAgICB9XG4gIH0pXG59XG5cbi8qKlxuICogQ29sbGVjdCB2YWxpZGF0aW9uIHN1Z2dlc3Rpb25zIGZvciBhIHNpbmdsZSBmaWVsZFxuICovXG5mdW5jdGlvbiBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JGaWVsZChmaWVsZDogRm9ybUZpZWxkKTogVmFsaWRhdGlvblN1Z2dlc3Rpb25bJ3N1Z2dlc3Rpb25zJ10ge1xuICBjb25zdCBsYWJlbCA9IGZpZWxkLmxhYmVsLnRvTG93ZXJDYXNlKClcbiAgY29uc3Qga2V5ID0gZmllbGQua2V5LnRvTG93ZXJDYXNlKClcbiAgY29uc3QgdHlwZSA9IGZpZWxkLnR5cGVcbiAgY29uc3Qgc3VnZ2VzdGlvbnM6IFZhbGlkYXRpb25TdWdnZXN0aW9uWydzdWdnZXN0aW9ucyddID0gW11cblxuICAvLyBFbWFpbCBwYXR0ZXJuc1xuICBpZiAodHlwZSA9PT0gJ0VNQUlMJyB8fCBsYWJlbC5pbmNsdWRlcygnZW1haWwnKSB8fCBrZXkuaW5jbHVkZXMoJ2VtYWlsJykpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIHJ1bGU6ICdlbWFpbF9mb3JtYXQnLFxuICAgICAgZGVzY3JpcHRpb246ICdWYWxpZGF0ZSBlbWFpbCBmb3JtYXQgdXNpbmcgc3RhbmRhcmQgcmVnZXggcGF0dGVybicsXG4gICAgICBjb25maWc6IHtcbiAgICAgICAgcGF0dGVybjogJ15bXlxcXFxzQF0rQFteXFxcXHNAXStcXFxcLlteXFxcXHNAXSskJyxcbiAgICAgIH0sXG4gICAgICBjb25maWRlbmNlOiAwLjk1LFxuICAgIH0pXG4gIH1cblxuICAvLyBQaG9uZSBwYXR0ZXJuc1xuICBpZiAodHlwZSA9PT0gJ1BIT05FJyB8fCBsYWJlbC5pbmNsdWRlcygncGhvbmUnKSB8fCBrZXkuaW5jbHVkZXMoJ3Bob25lJykgfHwga2V5LmluY2x1ZGVzKCdjb250YWN0JykpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIHJ1bGU6ICdwaG9uZV9sZW5ndGgnLFxuICAgICAgZGVzY3JpcHRpb246ICdSZXF1aXJlIG1pbmltdW0gcGhvbmUgbGVuZ3RoICgxMCBkaWdpdHMpJyxcbiAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDEwIH0sXG4gICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgIH0pXG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBydWxlOiAncGhvbmVfcGF0dGVybicsXG4gICAgICBkZXNjcmlwdGlvbjogJ1ZhbGlkYXRlIHBob25lIGZvcm1hdCAoZGlnaXRzLCBzcGFjZXMsIGh5cGhlbnMsIHBhcmVudGhlc2VzKScsXG4gICAgICBjb25maWc6IHtcbiAgICAgICAgcGF0dGVybjogJ15bXFxcXGRcXFxcc1xcXFwtKCldKyQnLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuODAsXG4gICAgfSlcbiAgfVxuXG4gIC8vIFVSTCBwYXR0ZXJuc1xuICBpZiAodHlwZSA9PT0gJ1VSTCcgfHwgbGFiZWwuaW5jbHVkZXMoJ3dlYnNpdGUnKSB8fCBsYWJlbC5pbmNsdWRlcygndXJsJykgfHwga2V5LmluY2x1ZGVzKCd1cmwnKSB8fCBrZXkuaW5jbHVkZXMoJ3dlYnNpdGUnKSkge1xuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgcnVsZTogJ3VybF9wYXR0ZXJuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgVVJMIGZvcm1hdCcsXG4gICAgICBjb25maWc6IHtcbiAgICAgICAgcGF0dGVybjogJ15odHRwcz86Ly8uKycsXG4gICAgICB9LFxuICAgICAgY29uZmlkZW5jZTogMC45MCxcbiAgICB9KVxuICB9XG5cbiAgLy8gWmlwIGNvZGUgcGF0dGVybnMgKFVTKVxuICBpZiAobGFiZWwuaW5jbHVkZXMoJ3ppcCcpIHx8IGtleS5pbmNsdWRlcygnemlwJykgfHwga2V5LmluY2x1ZGVzKCdwb3N0YWwnKSkge1xuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgcnVsZTogJ3ppcF9wYXR0ZXJuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgVVMgemlwIGNvZGUgKDUgb3IgOSBkaWdpdHMpJyxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICBwYXR0ZXJuOiAnXlxcXFxkezV9KC1cXFxcZHs0fSk/JCcsXG4gICAgICB9LFxuICAgICAgY29uZmlkZW5jZTogMC43NSxcbiAgICB9KVxuICB9XG5cbiAgLy8gU1NOIHBhdHRlcm5zXG4gIGlmIChsYWJlbC5pbmNsdWRlcygnc3NuJykgfHwgbGFiZWwuaW5jbHVkZXMoJ3NvY2lhbCcpIHx8IGtleS5pbmNsdWRlcygnc3NuJykgfHwga2V5LmluY2x1ZGVzKCd0YXhfaWQnKSkge1xuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgcnVsZTogJ3NlbnNpdGl2ZV9kYXRhX3dhcm5pbmcnLFxuICAgICAgZGVzY3JpcHRpb246ICdXQVJOSU5HOiBUaGlzIGZpZWxkIGNvbGxlY3RzIHNlbnNpdGl2ZSBTU04gZGF0YSAtIGVuc3VyZSBwcm9wZXIgc2VjdXJpdHknLFxuICAgICAgY29uZmlnOiB7IHNlbnNpdGl2ZURhdGE6IHRydWUgfSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOTUsXG4gICAgfSlcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIHJ1bGU6ICdzc25fcGF0dGVybicsXG4gICAgICBkZXNjcmlwdGlvbjogJ1ZhbGlkYXRlIFNTTiBmb3JtYXQgKFhYWC1YWC1YWFhYKScsXG4gICAgICBjb25maWc6IHtcbiAgICAgICAgcGF0dGVybjogJ15cXFxcZHszfS1cXFxcZHsyfS1cXFxcZHs0fSQnLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuODAsXG4gICAgfSlcbiAgfVxuXG4gIC8vIFBhc3N3b3JkIHBhdHRlcm5zXG4gIGlmICh0eXBlID09PSAnUEFTU1dPUkQnIHx8IGxhYmVsLmluY2x1ZGVzKCdwYXNzd29yZCcpIHx8IGtleS5pbmNsdWRlcygncGFzc3dvcmQnKSkge1xuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgcnVsZTogJ3Bhc3N3b3JkX21pbmxlbmd0aCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JlcXVpcmUgbWluaW11bSBwYXNzd29yZCBsZW5ndGggKDggY2hhcmFjdGVycyknLFxuICAgICAgY29uZmlnOiB7IG1pbkxlbmd0aDogOCB9LFxuICAgICAgY29uZmlkZW5jZTogMC45MCxcbiAgICB9KVxuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgcnVsZTogJ3Bhc3N3b3JkX2NvbXBsZXhpdHknLFxuICAgICAgZGVzY3JpcHRpb246ICdSZXF1aXJlIHBhc3N3b3JkIHRvIGNvbnRhaW4gdXBwZXJjYXNlLCBsb3dlcmNhc2UsIGFuZCBudW1iZXJzJyxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICBwYXR0ZXJuOiAnXig/PS4qW2Etel0pKD89LipbQS1aXSkoPz0uKlxcXFxkKVthLXpBLVpcXFxcZEAkISUqPyZdezgsfSQnLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgfSlcbiAgfVxuXG4gIC8vIE5hbWUgcGF0dGVybnNcbiAgaWYgKGxhYmVsLmluY2x1ZGVzKCduYW1lJykgJiYgIWxhYmVsLmluY2x1ZGVzKCd1c2VybmFtZScpKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBydWxlOiAnbmFtZV9taW5sZW5ndGgnLFxuICAgICAgZGVzY3JpcHRpb246ICdSZXF1aXJlIG1pbmltdW0gbmFtZSBsZW5ndGggKDIgY2hhcmFjdGVycyknLFxuICAgICAgY29uZmlnOiB7IG1pbkxlbmd0aDogMiB9LFxuICAgICAgY29uZmlkZW5jZTogMC44MCxcbiAgICB9KVxuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgcnVsZTogJ25hbWVfbWF4bGVuZ3RoJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGltaXQgbmFtZSBsZW5ndGggKG1heCAxMDAgY2hhcmFjdGVycyknLFxuICAgICAgY29uZmlnOiB7IG1heExlbmd0aDogMTAwIH0sXG4gICAgICBjb25maWRlbmNlOiAwLjc1LFxuICAgIH0pXG4gIH1cblxuICAvLyBBZ2UgcGF0dGVybnNcbiAgaWYgKGxhYmVsLmluY2x1ZGVzKCdhZ2UnKSB8fCBrZXkuaW5jbHVkZXMoJ2FnZScpKSB7XG4gICAgaWYgKHR5cGUgPT09ICdOVU1CRVInKSB7XG4gICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgcnVsZTogJ2FnZV9taW4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gYWdlIHJlcXVpcmVtZW50ICgwKScsXG4gICAgICAgIGNvbmZpZzogeyBtaW46IDAgfSxcbiAgICAgICAgY29uZmlkZW5jZTogMC44NSxcbiAgICAgIH0pXG4gICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgcnVsZTogJ2FnZV9tYXgnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01heGltdW0gYWdlIGxpbWl0ICgxNTApJyxcbiAgICAgICAgY29uZmlnOiB7IG1heDogMTUwIH0sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODAsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIE51bWVyaWMgcmFuZ2VzXG4gIGlmICh0eXBlID09PSAnTlVNQkVSJykge1xuICAgIGlmIChsYWJlbC5pbmNsdWRlcygnc2FsYXJ5JykgfHwgbGFiZWwuaW5jbHVkZXMoJ2luY29tZScpIHx8IGxhYmVsLmluY2x1ZGVzKCd3YWdlJykpIHtcbiAgICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgICBydWxlOiAnYW1vdW50X21pbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2FsYXJ5IHNob3VsZCBiZSBwb3NpdGl2ZScsXG4gICAgICAgIGNvbmZpZzogeyBtaW46IDAgfSxcbiAgICAgICAgY29uZmlkZW5jZTogMC45MCxcbiAgICAgIH0pXG4gICAgfVxuICAgIGlmIChsYWJlbC5pbmNsdWRlcygncXVhbnRpdHknKSB8fCBsYWJlbC5pbmNsdWRlcygnY291bnQnKSkge1xuICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICAgIHJ1bGU6ICdxdWFudGl0eV9taW4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1F1YW50aXR5IG11c3QgYmUgYXQgbGVhc3QgMScsXG4gICAgICAgIGNvbmZpZzogeyBtaW46IDEgfSxcbiAgICAgICAgY29uZmlkZW5jZTogMC44NSxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8gRGF0ZSBwYXR0ZXJuc1xuICBpZiAodHlwZSA9PT0gJ0RBVEUnIHx8IHR5cGUgPT09ICdEQVRFX1RJTUUnKSB7XG4gICAgaWYgKGxhYmVsLmluY2x1ZGVzKCdiaXJ0aCcpIHx8IGtleS5pbmNsdWRlcygnZG9iJykpIHtcbiAgICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgICBydWxlOiAnZGF0ZV9yZWFzb25hYmxlX3Bhc3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0JpcnRoIGRhdGUgc2hvdWxkIGJlIGluIHRoZSBwYXN0JyxcbiAgICAgICAgY29uZmlnOiB7IG1heERhdGU6ICd0b2RheScsIG1pbkRhdGU6ICcxOTAwLTAxLTAxJyB9LFxuICAgICAgICBjb25maWRlbmNlOiAwLjkwLFxuICAgICAgfSlcbiAgICB9XG4gICAgaWYgKGxhYmVsLmluY2x1ZGVzKCdzdGFydCcpICYmICFsYWJlbC5pbmNsdWRlcygnZW5kJykpIHtcbiAgICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgICBydWxlOiAnZGF0ZV9ub3RfZnV0dXJlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdGFydCBkYXRlIHNob3VsZCBub3QgYmUgaW4gdGhlIGZ1dHVyZScsXG4gICAgICAgIGNvbmZpZzogeyBtYXhEYXRlOiAndG9kYXknIH0sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIFNlbGVjdCBmaWVsZHMgLSByZXF1aXJlIHZhbHVlIGlmIGZpZWxkIGlzIHJlcXVpcmVkXG4gIGlmICh0eXBlID09PSAnU0VMRUNUJyB8fCB0eXBlID09PSAnTVVMVElfU0VMRUNUJyB8fCB0eXBlID09PSAnUkFESU8nKSB7XG4gICAgaWYgKGZpZWxkLnJlcXVpcmVkKSB7XG4gICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgcnVsZTogJ25vdF9lbXB0eV9zZWxlY3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1JlcXVpcmUgYSBzZWxlY3Rpb24gdG8gYmUgbWFkZScsXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuOTUsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIEZpbGUgdXBsb2FkIHBhdHRlcm5zXG4gIGlmICh0eXBlID09PSAnRklMRV9VUExPQUQnKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBydWxlOiAnZmlsZV9yZXF1aXJlZCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ZpbGUgdXBsb2FkIG11c3QgYmUgcHJvdmlkZWQnLFxuICAgICAgY29uZmlnOiB7fSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOTAsXG4gICAgfSlcbiAgICBpZiAobGFiZWwuaW5jbHVkZXMoJ3Jlc3VtZScpIHx8IGxhYmVsLmluY2x1ZGVzKCdjdicpKSB7XG4gICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgcnVsZTogJ2ZpbGVfdHlwZXNfZG9jdW1lbnQnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbG93IFBERiwgRE9DLCBET0NYIGZvcm1hdHMnLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICBhbGxvd2VkTWltZVR5cGVzOiBbJ2FwcGxpY2F0aW9uL3BkZicsICdhcHBsaWNhdGlvbi9tc3dvcmQnLCAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQnXSxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlkZW5jZTogMC44NSxcbiAgICAgIH0pXG4gICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgcnVsZTogJ2ZpbGVfc2l6ZV9saW1pdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTGltaXQgZmlsZSBzaXplIHRvIDVNQicsXG4gICAgICAgIGNvbmZpZzogeyBtYXhTaXplTUI6IDUgfSxcbiAgICAgICAgY29uZmlkZW5jZTogMC44MCxcbiAgICAgIH0pXG4gICAgfVxuICAgIGlmIChsYWJlbC5pbmNsdWRlcygnaW1hZ2UnKSB8fCBsYWJlbC5pbmNsdWRlcygncGhvdG8nKSB8fCBsYWJlbC5pbmNsdWRlcygnYXZhdGFyJykpIHtcbiAgICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgICBydWxlOiAnZmlsZV90eXBlc19pbWFnZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgaW1hZ2UgZm9ybWF0cyAoSlBHLCBQTkcsIEdJRiknLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICBhbGxvd2VkTWltZVR5cGVzOiBbJ2ltYWdlL2pwZWcnLCAnaW1hZ2UvcG5nJywgJ2ltYWdlL2dpZicsICdpbWFnZS93ZWJwJ10sXG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuOTAsXG4gICAgICB9KVxuICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICAgIHJ1bGU6ICdmaWxlX3NpemVfbGltaXQnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0xpbWl0IGltYWdlIGZpbGUgc2l6ZSB0byAyTUInLFxuICAgICAgICBjb25maWc6IHsgbWF4U2l6ZU1COiAyIH0sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIExvbmcgdGV4dCBwYXR0ZXJuc1xuICBpZiAodHlwZSA9PT0gJ0xPTkdfVEVYVCcgfHwgdHlwZSA9PT0gJ1JJQ0hfVEVYVCcpIHtcbiAgICBpZiAobGFiZWwuaW5jbHVkZXMoJ21lc3NhZ2UnKSB8fCBsYWJlbC5pbmNsdWRlcygnY29tbWVudCcpKSB7XG4gICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgcnVsZTogJ3RleHRfbWlubGVuZ3RoJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdSZXF1aXJlIGF0IGxlYXN0IDEwIGNoYXJhY3RlcnMnLFxuICAgICAgICBjb25maWc6IHsgbWluTGVuZ3RoOiAxMCB9LFxuICAgICAgICBjb25maWRlbmNlOiAwLjcwLFxuICAgICAgfSlcbiAgICB9XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBydWxlOiAndGV4dF9tYXhsZW5ndGgnLFxuICAgICAgZGVzY3JpcHRpb246ICdMaW1pdCB0ZXh0IHRvIDUwMDAgY2hhcmFjdGVycycsXG4gICAgICBjb25maWc6IHsgbWF4TGVuZ3RoOiA1MDAwIH0sXG4gICAgICBjb25maWRlbmNlOiAwLjc1LFxuICAgIH0pXG4gIH1cblxuICAvLyBSZXF1aXJlZCBmaWVsZCB2YWxpZGF0aW9uXG4gIGlmIChmaWVsZC5yZXF1aXJlZCAmJiAhc3VnZ2VzdGlvbnMuc29tZShzID0+IHMucnVsZS5pbmNsdWRlcygncmVxdWlyZWQnKSkpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIHJ1bGU6ICdmaWVsZF9yZXF1aXJlZCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ZpZWxkIGlzIHJlcXVpcmVkIGFuZCBjYW5ub3QgYmUgZW1wdHknLFxuICAgICAgY29uZmlnOiB7fSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOTUsXG4gICAgfSlcbiAgfVxuXG4gIC8vIFNvcnQgYnkgY29uZmlkZW5jZSBkZXNjZW5kaW5nXG4gIHN1Z2dlc3Rpb25zLnNvcnQoKGEsIGIpID0+IGIuY29uZmlkZW5jZSAtIGEuY29uZmlkZW5jZSlcblxuICByZXR1cm4gc3VnZ2VzdGlvbnNcbn1cbiJdfQ==