"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestAdditionalFields = suggestAdditionalFields;
exports.detectFormType = detectFormType;
exports.groupSuggestionsByCategory = groupSuggestionsByCategory;
/**
 * Suggest additional fields based on existing form fields.
 * Analyzes the form's purpose and suggests missing common fields.
 *
 * @example
 * const existingFields: FormField[] = [
 *   { key: 'name', label: 'Name', type: 'SHORT_TEXT', ... },
 * ]
 * const suggestions = suggestAdditionalFields(existingFields)
 * // Returns: [{ key: 'email', label: 'Email', type: 'EMAIL', reason: '...' }]
 */
function suggestAdditionalFields(existingFields) {
    const existingKeys = new Set(existingFields.map(f => f.key.toLowerCase()));
    const existingLabels = new Set(existingFields.map(f => f.label.toLowerCase()));
    const suggestions = [];
    // Analyze what fields we already have
    const hasName = existingKeys.has('name') || existingLabels.has('name') || hasAnyKey(['first_name', 'last_name', 'full_name']);
    const hasEmail = existingKeys.has('email') || existingLabels.has('email');
    const hasPhone = existingKeys.has('phone') || existingLabels.has('phone') || existingLabels.has('phone number');
    const hasAddress = existingKeys.has('address') || existingLabels.has('address');
    const hasDateOfBirth = existingKeys.has('dob') || existingLabels.has('date of birth');
    const hasPassword = existingKeys.has('password') || existingLabels.has('password');
    const hasTerms = existingLabels.has('terms') || existingLabels.has('agree') || existingLabels.has('consent');
    const hasMessage = existingLabels.has('message') || existingLabels.has('comments') || existingLabels.has('feedback');
    const hasRating = existingFields.some(f => f.type === 'RATING');
    // Helper to check if key exists
    function hasAnyKey(keys) {
        return keys.some(k => existingKeys.has(k));
    }
    // Rule: If we have name but no email, suggest email
    if (hasName && !hasEmail) {
        suggestions.push({
            key: 'email',
            label: 'Email',
            type: 'EMAIL',
            description: 'Email address for contact and communication',
            reason: 'You have a name field but no email field. Email is a common contact method.',
            confidence: 0.95,
        });
    }
    // Rule: If we have email but no phone, suggest phone
    if (hasEmail && !hasPhone && !existingFields.some(f => f.type === 'PHONE')) {
        suggestions.push({
            key: 'phone',
            label: 'Phone Number',
            type: 'PHONE',
            description: 'Phone number for contact',
            reason: 'Email is present but no phone field. Consider adding phone for additional contact options.',
            confidence: 0.70,
        });
    }
    // Rule: If we have email but no name, suggest name
    if (!hasName && hasEmail) {
        suggestions.push({
            key: 'full_name',
            label: 'Full Name',
            type: 'SHORT_TEXT',
            description: 'Your full name',
            reason: 'You have an email field but no name field. Name is typically collected with email.',
            confidence: 0.85,
        });
    }
    // Rule: If we have name and email but no address, suggest address for onboarding/registration
    if (hasName && hasEmail && !hasAddress) {
        suggestions.push({
            key: 'address',
            label: 'Address',
            type: 'ADDRESS',
            description: 'Your mailing address',
            reason: 'Typical registration forms include name, email, and address for profile completion.',
            confidence: 0.60,
        });
    }
    // Rule: Onboarding pattern detection
    if ((existingLabels.has('start') || existingLabels.has('onboard')) && hasName) {
        if (!existingLabels.has('emergency')) {
            suggestions.push({
                key: 'emergency_contact_name',
                label: 'Emergency Contact Name',
                type: 'SHORT_TEXT',
                description: 'Name of emergency contact person',
                reason: 'Onboarding forms typically include emergency contact information.',
                confidence: 0.80,
            });
        }
        if (!existingLabels.has('department')) {
            suggestions.push({
                key: 'department',
                label: 'Department',
                type: 'SELECT',
                description: 'Your department or team',
                reason: 'Employee onboarding forms should include department assignment.',
                confidence: 0.85,
            });
        }
        if (!existingLabels.has('start date')) {
            suggestions.push({
                key: 'start_date',
                label: 'Start Date',
                type: 'DATE',
                description: 'Your employment start date',
                reason: 'Employee onboarding forms need a start date.',
                confidence: 0.90,
            });
        }
    }
    // Rule: Contact form pattern (message without email)
    if (hasMessage && !hasEmail) {
        suggestions.push({
            key: 'email',
            label: 'Email',
            type: 'EMAIL',
            description: 'Your email address',
            reason: 'Contact forms with messages should include email for response.',
            confidence: 0.90,
        });
    }
    // Rule: Contact form pattern (without subject)
    if (hasMessage && !existingLabels.has('subject')) {
        suggestions.push({
            key: 'subject',
            label: 'Subject',
            type: 'SHORT_TEXT',
            description: 'Message subject',
            reason: 'Contact forms with messages benefit from a subject line.',
            confidence: 0.75,
        });
    }
    // Rule: Survey form pattern (has rating, suggest follow-up)
    if (hasRating && !hasMessage) {
        suggestions.push({
            key: 'feedback',
            label: 'Additional Feedback',
            type: 'LONG_TEXT',
            description: 'Your additional comments and feedback',
            reason: 'Survey forms with ratings often include a feedback field for detailed comments.',
            confidence: 0.70,
        });
    }
    // Rule: Registration pattern (has password, suggest password confirmation)
    if (hasPassword && !existingKeys.has('password_confirm')) {
        suggestions.push({
            key: 'password_confirm',
            label: 'Confirm Password',
            type: 'PASSWORD',
            description: 'Confirm your password',
            reason: 'Registration forms with passwords should include password confirmation.',
            confidence: 0.95,
        });
    }
    // Rule: Registration pattern (has password, suggest terms agreement)
    if (hasPassword && !hasTerms) {
        suggestions.push({
            key: 'agree_terms',
            label: 'I agree to the Terms and Conditions',
            type: 'CHECKBOX',
            description: 'Acknowledge acceptance of terms',
            reason: 'Registration forms typically require terms and conditions acceptance.',
            confidence: 0.85,
        });
    }
    // Rule: Application form pattern
    if ((existingLabels.has('resume') || existingLabels.has('application')) && !hasName) {
        suggestions.push({
            key: 'full_name',
            label: 'Full Name',
            type: 'SHORT_TEXT',
            description: 'Your full name',
            reason: 'Application forms should collect the applicant\'s name.',
            confidence: 0.95,
        });
    }
    // Rule: Application form pattern (has name, suggest email)
    if ((existingLabels.has('resume') || existingLabels.has('application')) && hasName && !hasEmail) {
        suggestions.push({
            key: 'email',
            label: 'Email',
            type: 'EMAIL',
            description: 'Your email address',
            reason: 'Job application forms should include contact email.',
            confidence: 0.95,
        });
    }
    // Rule: Application form pattern (has name/email, suggest phone)
    if ((existingLabels.has('resume') || existingLabels.has('application')) && hasEmail && !hasPhone) {
        suggestions.push({
            key: 'phone',
            label: 'Phone Number',
            type: 'PHONE',
            description: 'Your phone number',
            reason: 'Job application forms typically request phone number for contact.',
            confidence: 0.85,
        });
    }
    // Rule: If we have date of birth, check if age is also present (likely redundant)
    if (hasDateOfBirth && existingKeys.has('age')) {
        // Don't suggest anything here - both existing
    }
    else if (hasDateOfBirth && !existingKeys.has('age')) {
        suggestions.push({
            key: 'age',
            label: 'Age',
            type: 'NUMBER',
            description: 'Your age',
            reason: 'Alternative to date of birth, or can be computed from DOB.',
            confidence: 0.40, // Low confidence as DOB is sufficient
        });
    }
    // Rule: If we have many fields, suggest confirmation/review
    if (existingFields.length > 5 && !existingLabels.has('confirm') && !existingLabels.has('review')) {
        suggestions.push({
            key: 'confirm_info',
            label: 'I confirm the above information is correct',
            type: 'CHECKBOX',
            description: 'Confirm accuracy of submitted information',
            reason: 'Forms with many fields benefit from a confirmation checkbox.',
            confidence: 0.60,
        });
    }
    // Sort by confidence descending
    suggestions.sort((a, b) => b.confidence - a.confidence);
    return suggestions;
}
/**
 * Detect the likely form type based on existing fields
 */
function detectFormType(fields) {
    const labels = new Set(fields.map(f => f.label.toLowerCase()));
    // Onboarding detection
    if (labels.has('start date') || labels.has('department') || labels.has('emergency contact')) {
        return 'onboarding';
    }
    // Registration detection
    if (fields.some(f => f.type === 'PASSWORD') && labels.has('password')) {
        return 'registration';
    }
    // Application detection
    if (labels.has('resume') || labels.has('cover letter')) {
        return 'application';
    }
    // Survey detection
    if (fields.some(f => f.type === 'RATING') && labels.has('feedback')) {
        return 'survey';
    }
    // Contact form detection
    if (labels.has('message') || labels.has('subject')) {
        return 'contact';
    }
    // Feedback form detection
    if (labels.has('rating') && labels.has('feedback')) {
        return 'feedback';
    }
    return 'custom';
}
/**
 * Get field suggestions grouped by category
 */
function groupSuggestionsByCategory(suggestions) {
    const grouped = {
        'Contact Information': [],
        'Personal Information': [],
        'Employment': [],
        'Account Settings': [],
        'Feedback & Survey': [],
        'Legal & Compliance': [],
        'Other': [],
    };
    for (const suggestion of suggestions) {
        const key = suggestion.key.toLowerCase();
        const label = suggestion.label.toLowerCase();
        if (key.includes('email') || key.includes('phone') || key.includes('address')) {
            grouped['Contact Information'].push(suggestion);
        }
        else if (key.includes('name') || key.includes('dob') || key.includes('age')) {
            grouped['Personal Information'].push(suggestion);
        }
        else if (key.includes('department') || key.includes('start') || key.includes('emergency')) {
            grouped['Employment'].push(suggestion);
        }
        else if (key.includes('password') || key.includes('confirm')) {
            grouped['Account Settings'].push(suggestion);
        }
        else if (key.includes('rating') || key.includes('feedback')) {
            grouped['Feedback & Survey'].push(suggestion);
        }
        else if (key.includes('agree') || key.includes('terms') || key.includes('consent')) {
            grouped['Legal & Compliance'].push(suggestion);
        }
        else {
            grouped['Other'].push(suggestion);
        }
    }
    // Remove empty categories
    return Object.fromEntries(Object.entries(grouped).filter(([_, v]) => v.length > 0));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmllbGQtc3VnZ2VzdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmllbGQtc3VnZ2VzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBc0JBLDBEQXVPQztBQUtELHdDQWtDQztBQUtELGdFQW9DQztBQWxVRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsY0FBMkI7SUFDakUsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQzFFLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUM5RSxNQUFNLFdBQVcsR0FBc0IsRUFBRSxDQUFBO0lBRXpDLHNDQUFzQztJQUN0QyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFBO0lBQzdILE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUN6RSxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQTtJQUMvRyxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FB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Q0FBQztZQUNOLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDbkMsQ0FBQztJQUNILENBQUM7SUFFRCwwQkFBMEI7SUFDMUIsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNyRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBGb3JtRmllbGQsIEZpZWxkVHlwZSB9IGZyb20gJy4uL3R5cGVzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEZpZWxkU3VnZ2VzdGlvbiB7XG4gIGtleTogc3RyaW5nXG4gIGxhYmVsOiBzdHJpbmdcbiAgdHlwZTogRmllbGRUeXBlXG4gIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgcmVhc29uOiBzdHJpbmdcbiAgY29uZmlkZW5jZTogbnVtYmVyXG59XG5cbi8qKlxuICogU3VnZ2VzdCBhZGRpdGlvbmFsIGZpZWxkcyBiYXNlZCBvbiBleGlzdGluZyBmb3JtIGZpZWxkcy5cbiAqIEFuYWx5emVzIHRoZSBmb3JtJ3MgcHVycG9zZSBhbmQgc3VnZ2VzdHMgbWlzc2luZyBjb21tb24gZmllbGRzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBjb25zdCBleGlzdGluZ0ZpZWxkczogRm9ybUZpZWxkW10gPSBbXG4gKiAgIHsga2V5OiAnbmFtZScsIGxhYmVsOiAnTmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgLi4uIH0sXG4gKiBdXG4gKiBjb25zdCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3RBZGRpdGlvbmFsRmllbGRzKGV4aXN0aW5nRmllbGRzKVxuICogLy8gUmV0dXJuczogW3sga2V5OiAnZW1haWwnLCBsYWJlbDogJ0VtYWlsJywgdHlwZTogJ0VNQUlMJywgcmVhc29uOiAnLi4uJyB9XVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3VnZ2VzdEFkZGl0aW9uYWxGaWVsZHMoZXhpc3RpbmdGaWVsZHM6IEZvcm1GaWVsZFtdKTogRmllbGRTdWdnZXN0aW9uW10ge1xuICBjb25zdCBleGlzdGluZ0tleXMgPSBuZXcgU2V0KGV4aXN0aW5nRmllbGRzLm1hcChmID0+IGYua2V5LnRvTG93ZXJDYXNlKCkpKVxuICBjb25zdCBleGlzdGluZ0xhYmVscyA9IG5ldyBTZXQoZXhpc3RpbmdGaWVsZHMubWFwKGYgPT4gZi5sYWJlbC50b0xvd2VyQ2FzZSgpKSlcbiAgY29uc3Qgc3VnZ2VzdGlvbnM6IEZpZWxkU3VnZ2VzdGlvbltdID0gW11cblxuICAvLyBBbmFseXplIHdoYXQgZmllbGRzIHdlIGFscmVhZHkgaGF2ZVxuICBjb25zdCBoYXNOYW1lID0gZXhpc3RpbmdLZXlzLmhhcygnbmFtZScpIHx8IGV4aXN0aW5nTGFiZWxzLmhhcygnbmFtZScpIHx8IGhhc0FueUtleShbJ2ZpcnN0X25hbWUnLCAnbGFzdF9uYW1lJywgJ2Z1bGxfbmFtZSddKVxuICBjb25zdCBoYXNFbWFpbCA9IGV4aXN0aW5nS2V5cy5oYXMoJ2VtYWlsJykgfHwgZXhpc3RpbmdMYWJlbHMuaGFzKCdlbWFpbCcpXG4gIGNvbnN0IGhhc1Bob25lID0gZXhpc3RpbmdLZXlzLmhhcygncGhvbmUnKSB8fCBleGlzdGluZ0xhYmVscy5oYXMoJ3Bob25lJykgfHwgZXhpc3RpbmdMYWJlbHMuaGFzKCdwaG9uZSBudW1iZXInKVxuICBjb25zdCBoYXNBZGRyZXNzID0gZXhpc3RpbmdLZXlzLmhhcygnYWRkcmVzcycpIHx8IGV4aXN0aW5nTGFiZWxzLmhhcygnYWRkcmVzcycpXG4gIGNvbnN0IGhhc0RhdGVPZkJpcnRoID0gZXhpc3RpbmdLZXlzLmhhcygnZG9iJykgfHwgZXhpc3RpbmdMYWJlbHMuaGFzKCdkYXRlIG9mIGJpcnRoJylcbiAgY29uc3QgaGFzUGFzc3dvcmQgPSBleGlzdGluZ0tleXMuaGFzKCdwYXNzd29yZCcpIHx8IGV4aXN0aW5nTGFiZWxzLmhhcygncGFzc3dvcmQnKVxuICBjb25zdCBoYXNUZXJtcyA9IGV4aXN0aW5nTGFiZWxzLmhhcygndGVybXMnKSB8fCBleGlzdGluZ0xhYmVscy5oYXMoJ2FncmVlJykgfHwgZXhpc3RpbmdMYWJlbHMuaGFzKCdjb25zZW50JylcbiAgY29uc3QgaGFzTWVzc2FnZSA9IGV4aXN0aW5nTGFiZWxzLmhhcygnbWVzc2FnZScpIHx8IGV4aXN0aW5nTGFiZWxzLmhhcygnY29tbWVudHMnKSB8fCBleGlzdGluZ0xhYmVscy5oYXMoJ2ZlZWRiYWNrJylcbiAgY29uc3QgaGFzUmF0aW5nID0gZXhpc3RpbmdGaWVsZHMuc29tZShmID0+IGYudHlwZSA9PT0gJ1JBVElORycpXG5cbiAgLy8gSGVscGVyIHRvIGNoZWNrIGlmIGtleSBleGlzdHNcbiAgZnVuY3Rpb24gaGFzQW55S2V5KGtleXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGtleXMuc29tZShrID0+IGV4aXN0aW5nS2V5cy5oYXMoaykpXG4gIH1cblxuICAvLyBSdWxlOiBJZiB3ZSBoYXZlIG5hbWUgYnV0IG5vIGVtYWlsLCBzdWdnZXN0IGVtYWlsXG4gIGlmIChoYXNOYW1lICYmICFoYXNFbWFpbCkge1xuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAga2V5OiAnZW1haWwnLFxuICAgICAgbGFiZWw6ICdFbWFpbCcsXG4gICAgICB0eXBlOiAnRU1BSUwnLFxuICAgICAgZGVzY3JpcHRpb246ICdFbWFpbCBhZGRyZXNzIGZvciBjb250YWN0IGFuZCBjb21tdW5pY2F0aW9uJyxcbiAgICAgIHJlYXNvbjogJ1lvdSBoYXZlIGEgbmFtZSBmaWVsZCBidXQgbm8gZW1haWwgZmllbGQuIEVtYWlsIGlzIGEgY29tbW9uIGNvbnRhY3QgbWV0aG9kLicsXG4gICAgICBjb25maWRlbmNlOiAwLjk1LFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBJZiB3ZSBoYXZlIGVtYWlsIGJ1dCBubyBwaG9uZSwgc3VnZ2VzdCBwaG9uZVxuICBpZiAoaGFzRW1haWwgJiYgIWhhc1Bob25lICYmICFleGlzdGluZ0ZpZWxkcy5zb21lKGYgPT4gZi50eXBlID09PSAnUEhPTkUnKSkge1xuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAga2V5OiAncGhvbmUnLFxuICAgICAgbGFiZWw6ICdQaG9uZSBOdW1iZXInLFxuICAgICAgdHlwZTogJ1BIT05FJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUGhvbmUgbnVtYmVyIGZvciBjb250YWN0JyxcbiAgICAgIHJlYXNvbjogJ0VtYWlsIGlzIHByZXNlbnQgYnV0IG5vIHBob25lIGZpZWxkLiBDb25zaWRlciBhZGRpbmcgcGhvbmUgZm9yIGFkZGl0aW9uYWwgY29udGFjdCBvcHRpb25zLicsXG4gICAgICBjb25maWRlbmNlOiAwLjcwLFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBJZiB3ZSBoYXZlIGVtYWlsIGJ1dCBubyBuYW1lLCBzdWdnZXN0IG5hbWVcbiAgaWYgKCFoYXNOYW1lICYmIGhhc0VtYWlsKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBrZXk6ICdmdWxsX25hbWUnLFxuICAgICAgbGFiZWw6ICdGdWxsIE5hbWUnLFxuICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgZGVzY3JpcHRpb246ICdZb3VyIGZ1bGwgbmFtZScsXG4gICAgICByZWFzb246ICdZb3UgaGF2ZSBhbiBlbWFpbCBmaWVsZCBidXQgbm8gbmFtZSBmaWVsZC4gTmFtZSBpcyB0eXBpY2FsbHkgY29sbGVjdGVkIHdpdGggZW1haWwuJyxcbiAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgfSlcbiAgfVxuXG4gIC8vIFJ1bGU6IElmIHdlIGhhdmUgbmFtZSBhbmQgZW1haWwgYnV0IG5vIGFkZHJlc3MsIHN1Z2dlc3QgYWRkcmVzcyBmb3Igb25ib2FyZGluZy9yZWdpc3RyYXRpb25cbiAgaWYgKGhhc05hbWUgJiYgaGFzRW1haWwgJiYgIWhhc0FkZHJlc3MpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIGtleTogJ2FkZHJlc3MnLFxuICAgICAgbGFiZWw6ICdBZGRyZXNzJyxcbiAgICAgIHR5cGU6ICdBRERSRVNTJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnWW91ciBtYWlsaW5nIGFkZHJlc3MnLFxuICAgICAgcmVhc29uOiAnVHlwaWNhbCByZWdpc3RyYXRpb24gZm9ybXMgaW5jbHVkZSBuYW1lLCBlbWFpbCwgYW5kIGFkZHJlc3MgZm9yIHByb2ZpbGUgY29tcGxldGlvbi4nLFxuICAgICAgY29uZmlkZW5jZTogMC42MCxcbiAgICB9KVxuICB9XG5cbiAgLy8gUnVsZTogT25ib2FyZGluZyBwYXR0ZXJuIGRldGVjdGlvblxuICBpZiAoKGV4aXN0aW5nTGFiZWxzLmhhcygnc3RhcnQnKSB8fCBleGlzdGluZ0xhYmVscy5oYXMoJ29uYm9hcmQnKSkgJiYgaGFzTmFtZSkge1xuICAgIGlmICghZXhpc3RpbmdMYWJlbHMuaGFzKCdlbWVyZ2VuY3knKSkge1xuICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICAgIGtleTogJ2VtZXJnZW5jeV9jb250YWN0X25hbWUnLFxuICAgICAgICBsYWJlbDogJ0VtZXJnZW5jeSBDb250YWN0IE5hbWUnLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiBlbWVyZ2VuY3kgY29udGFjdCBwZXJzb24nLFxuICAgICAgICByZWFzb246ICdPbmJvYXJkaW5nIGZvcm1zIHR5cGljYWxseSBpbmNsdWRlIGVtZXJnZW5jeSBjb250YWN0IGluZm9ybWF0aW9uLicsXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODAsXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICghZXhpc3RpbmdMYWJlbHMuaGFzKCdkZXBhcnRtZW50JykpIHtcbiAgICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdkZXBhcnRtZW50JyxcbiAgICAgICAgbGFiZWw6ICdEZXBhcnRtZW50JyxcbiAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnWW91ciBkZXBhcnRtZW50IG9yIHRlYW0nLFxuICAgICAgICByZWFzb246ICdFbXBsb3llZSBvbmJvYXJkaW5nIGZvcm1zIHNob3VsZCBpbmNsdWRlIGRlcGFydG1lbnQgYXNzaWdubWVudC4nLFxuICAgICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoIWV4aXN0aW5nTGFiZWxzLmhhcygnc3RhcnQgZGF0ZScpKSB7XG4gICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnc3RhcnRfZGF0ZScsXG4gICAgICAgIGxhYmVsOiAnU3RhcnQgRGF0ZScsXG4gICAgICAgIHR5cGU6ICdEQVRFJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdZb3VyIGVtcGxveW1lbnQgc3RhcnQgZGF0ZScsXG4gICAgICAgIHJlYXNvbjogJ0VtcGxveWVlIG9uYm9hcmRpbmcgZm9ybXMgbmVlZCBhIHN0YXJ0IGRhdGUuJyxcbiAgICAgICAgY29uZmlkZW5jZTogMC45MCxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8gUnVsZTogQ29udGFjdCBmb3JtIHBhdHRlcm4gKG1lc3NhZ2Ugd2l0aG91dCBlbWFpbClcbiAgaWYgKGhhc01lc3NhZ2UgJiYgIWhhc0VtYWlsKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgIHR5cGU6ICdFTUFJTCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgZW1haWwgYWRkcmVzcycsXG4gICAgICByZWFzb246ICdDb250YWN0IGZvcm1zIHdpdGggbWVzc2FnZXMgc2hvdWxkIGluY2x1ZGUgZW1haWwgZm9yIHJlc3BvbnNlLicsXG4gICAgICBjb25maWRlbmNlOiAwLjkwLFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBDb250YWN0IGZvcm0gcGF0dGVybiAod2l0aG91dCBzdWJqZWN0KVxuICBpZiAoaGFzTWVzc2FnZSAmJiAhZXhpc3RpbmdMYWJlbHMuaGFzKCdzdWJqZWN0JykpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIGtleTogJ3N1YmplY3QnLFxuICAgICAgbGFiZWw6ICdTdWJqZWN0JyxcbiAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTWVzc2FnZSBzdWJqZWN0JyxcbiAgICAgIHJlYXNvbjogJ0NvbnRhY3QgZm9ybXMgd2l0aCBtZXNzYWdlcyBiZW5lZml0IGZyb20gYSBzdWJqZWN0IGxpbmUuJyxcbiAgICAgIGNvbmZpZGVuY2U6IDAuNzUsXG4gICAgfSlcbiAgfVxuXG4gIC8vIFJ1bGU6IFN1cnZleSBmb3JtIHBhdHRlcm4gKGhhcyByYXRpbmcsIHN1Z2dlc3QgZm9sbG93LXVwKVxuICBpZiAoaGFzUmF0aW5nICYmICFoYXNNZXNzYWdlKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBrZXk6ICdmZWVkYmFjaycsXG4gICAgICBsYWJlbDogJ0FkZGl0aW9uYWwgRmVlZGJhY2snLFxuICAgICAgdHlwZTogJ0xPTkdfVEVYVCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgYWRkaXRpb25hbCBjb21tZW50cyBhbmQgZmVlZGJhY2snLFxuICAgICAgcmVhc29uOiAnU3VydmV5IGZvcm1zIHdpdGggcmF0aW5ncyBvZnRlbiBpbmNsdWRlIGEgZmVlZGJhY2sgZmllbGQgZm9yIGRldGFpbGVkIGNvbW1lbnRzLicsXG4gICAgICBjb25maWRlbmNlOiAwLjcwLFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBSZWdpc3RyYXRpb24gcGF0dGVybiAoaGFzIHBhc3N3b3JkLCBzdWdnZXN0IHBhc3N3b3JkIGNvbmZpcm1hdGlvbilcbiAgaWYgKGhhc1Bhc3N3b3JkICYmICFleGlzdGluZ0tleXMuaGFzKCdwYXNzd29yZF9jb25maXJtJykpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIGtleTogJ3Bhc3N3b3JkX2NvbmZpcm0nLFxuICAgICAgbGFiZWw6ICdDb25maXJtIFBhc3N3b3JkJyxcbiAgICAgIHR5cGU6ICdQQVNTV09SRCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbmZpcm0geW91ciBwYXNzd29yZCcsXG4gICAgICByZWFzb246ICdSZWdpc3RyYXRpb24gZm9ybXMgd2l0aCBwYXNzd29yZHMgc2hvdWxkIGluY2x1ZGUgcGFzc3dvcmQgY29uZmlybWF0aW9uLicsXG4gICAgICBjb25maWRlbmNlOiAwLjk1LFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBSZWdpc3RyYXRpb24gcGF0dGVybiAoaGFzIHBhc3N3b3JkLCBzdWdnZXN0IHRlcm1zIGFncmVlbWVudClcbiAgaWYgKGhhc1Bhc3N3b3JkICYmICFoYXNUZXJtcykge1xuICAgIHN1Z2dlc3Rpb25zLnB1c2goe1xuICAgICAga2V5OiAnYWdyZWVfdGVybXMnLFxuICAgICAgbGFiZWw6ICdJIGFncmVlIHRvIHRoZSBUZXJtcyBhbmQgQ29uZGl0aW9ucycsXG4gICAgICB0eXBlOiAnQ0hFQ0tCT1gnLFxuICAgICAgZGVzY3JpcHRpb246ICdBY2tub3dsZWRnZSBhY2NlcHRhbmNlIG9mIHRlcm1zJyxcbiAgICAgIHJlYXNvbjogJ1JlZ2lzdHJhdGlvbiBmb3JtcyB0eXBpY2FsbHkgcmVxdWlyZSB0ZXJtcyBhbmQgY29uZGl0aW9ucyBhY2NlcHRhbmNlLicsXG4gICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBBcHBsaWNhdGlvbiBmb3JtIHBhdHRlcm5cbiAgaWYgKChleGlzdGluZ0xhYmVscy5oYXMoJ3Jlc3VtZScpIHx8IGV4aXN0aW5nTGFiZWxzLmhhcygnYXBwbGljYXRpb24nKSkgJiYgIWhhc05hbWUpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIGtleTogJ2Z1bGxfbmFtZScsXG4gICAgICBsYWJlbDogJ0Z1bGwgTmFtZScsXG4gICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgZnVsbCBuYW1lJyxcbiAgICAgIHJlYXNvbjogJ0FwcGxpY2F0aW9uIGZvcm1zIHNob3VsZCBjb2xsZWN0IHRoZSBhcHBsaWNhbnRcXCdzIG5hbWUuJyxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOTUsXG4gICAgfSlcbiAgfVxuXG4gIC8vIFJ1bGU6IEFwcGxpY2F0aW9uIGZvcm0gcGF0dGVybiAoaGFzIG5hbWUsIHN1Z2dlc3QgZW1haWwpXG4gIGlmICgoZXhpc3RpbmdMYWJlbHMuaGFzKCdyZXN1bWUnKSB8fCBleGlzdGluZ0xhYmVscy5oYXMoJ2FwcGxpY2F0aW9uJykpICYmIGhhc05hbWUgJiYgIWhhc0VtYWlsKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgIHR5cGU6ICdFTUFJTCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgZW1haWwgYWRkcmVzcycsXG4gICAgICByZWFzb246ICdKb2IgYXBwbGljYXRpb24gZm9ybXMgc2hvdWxkIGluY2x1ZGUgY29udGFjdCBlbWFpbC4nLFxuICAgICAgY29uZmlkZW5jZTogMC45NSxcbiAgICB9KVxuICB9XG5cbiAgLy8gUnVsZTogQXBwbGljYXRpb24gZm9ybSBwYXR0ZXJuIChoYXMgbmFtZS9lbWFpbCwgc3VnZ2VzdCBwaG9uZSlcbiAgaWYgKChleGlzdGluZ0xhYmVscy5oYXMoJ3Jlc3VtZScpIHx8IGV4aXN0aW5nTGFiZWxzLmhhcygnYXBwbGljYXRpb24nKSkgJiYgaGFzRW1haWwgJiYgIWhhc1Bob25lKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBrZXk6ICdwaG9uZScsXG4gICAgICBsYWJlbDogJ1Bob25lIE51bWJlcicsXG4gICAgICB0eXBlOiAnUEhPTkUnLFxuICAgICAgZGVzY3JpcHRpb246ICdZb3VyIHBob25lIG51bWJlcicsXG4gICAgICByZWFzb246ICdKb2IgYXBwbGljYXRpb24gZm9ybXMgdHlwaWNhbGx5IHJlcXVlc3QgcGhvbmUgbnVtYmVyIGZvciBjb250YWN0LicsXG4gICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBJZiB3ZSBoYXZlIGRhdGUgb2YgYmlydGgsIGNoZWNrIGlmIGFnZSBpcyBhbHNvIHByZXNlbnQgKGxpa2VseSByZWR1bmRhbnQpXG4gIGlmIChoYXNEYXRlT2ZCaXJ0aCAmJiBleGlzdGluZ0tleXMuaGFzKCdhZ2UnKSkge1xuICAgIC8vIERvbid0IHN1Z2dlc3QgYW55dGhpbmcgaGVyZSAtIGJvdGggZXhpc3RpbmdcbiAgfSBlbHNlIGlmIChoYXNEYXRlT2ZCaXJ0aCAmJiAhZXhpc3RpbmdLZXlzLmhhcygnYWdlJykpIHtcbiAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgIGtleTogJ2FnZScsXG4gICAgICBsYWJlbDogJ0FnZScsXG4gICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnWW91ciBhZ2UnLFxuICAgICAgcmVhc29uOiAnQWx0ZXJuYXRpdmUgdG8gZGF0ZSBvZiBiaXJ0aCwgb3IgY2FuIGJlIGNvbXB1dGVkIGZyb20gRE9CLicsXG4gICAgICBjb25maWRlbmNlOiAwLjQwLCAvLyBMb3cgY29uZmlkZW5jZSBhcyBET0IgaXMgc3VmZmljaWVudFxuICAgIH0pXG4gIH1cblxuICAvLyBSdWxlOiBJZiB3ZSBoYXZlIG1hbnkgZmllbGRzLCBzdWdnZXN0IGNvbmZpcm1hdGlvbi9yZXZpZXdcbiAgaWYgKGV4aXN0aW5nRmllbGRzLmxlbmd0aCA+IDUgJiYgIWV4aXN0aW5nTGFiZWxzLmhhcygnY29uZmlybScpICYmICFleGlzdGluZ0xhYmVscy5oYXMoJ3JldmlldycpKSB7XG4gICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICBrZXk6ICdjb25maXJtX2luZm8nLFxuICAgICAgbGFiZWw6ICdJIGNvbmZpcm0gdGhlIGFib3ZlIGluZm9ybWF0aW9uIGlzIGNvcnJlY3QnLFxuICAgICAgdHlwZTogJ0NIRUNLQk9YJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29uZmlybSBhY2N1cmFjeSBvZiBzdWJtaXR0ZWQgaW5mb3JtYXRpb24nLFxuICAgICAgcmVhc29uOiAnRm9ybXMgd2l0aCBtYW55IGZpZWxkcyBiZW5lZml0IGZyb20gYSBjb25maXJtYXRpb24gY2hlY2tib3guJyxcbiAgICAgIGNvbmZpZGVuY2U6IDAuNjAsXG4gICAgfSlcbiAgfVxuXG4gIC8vIFNvcnQgYnkgY29uZmlkZW5jZSBkZXNjZW5kaW5nXG4gIHN1Z2dlc3Rpb25zLnNvcnQoKGEsIGIpID0+IGIuY29uZmlkZW5jZSAtIGEuY29uZmlkZW5jZSlcblxuICByZXR1cm4gc3VnZ2VzdGlvbnNcbn1cblxuLyoqXG4gKiBEZXRlY3QgdGhlIGxpa2VseSBmb3JtIHR5cGUgYmFzZWQgb24gZXhpc3RpbmcgZmllbGRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RGb3JtVHlwZShmaWVsZHM6IEZvcm1GaWVsZFtdKTogc3RyaW5nIHtcbiAgY29uc3QgbGFiZWxzID0gbmV3IFNldChmaWVsZHMubWFwKGYgPT4gZi5sYWJlbC50b0xvd2VyQ2FzZSgpKSlcblxuICAvLyBPbmJvYXJkaW5nIGRldGVjdGlvblxuICBpZiAobGFiZWxzLmhhcygnc3RhcnQgZGF0ZScpIHx8IGxhYmVscy5oYXMoJ2RlcGFydG1lbnQnKSB8fCBsYWJlbHMuaGFzKCdlbWVyZ2VuY3kgY29udGFjdCcpKSB7XG4gICAgcmV0dXJuICdvbmJvYXJkaW5nJ1xuICB9XG5cbiAgLy8gUmVnaXN0cmF0aW9uIGRldGVjdGlvblxuICBpZiAoZmllbGRzLnNvbWUoZiA9PiBmLnR5cGUgPT09ICdQQVNTV09SRCcpICYmIGxhYmVscy5oYXMoJ3Bhc3N3b3JkJykpIHtcbiAgICByZXR1cm4gJ3JlZ2lzdHJhdGlvbidcbiAgfVxuXG4gIC8vIEFwcGxpY2F0aW9uIGRldGVjdGlvblxuICBpZiAobGFiZWxzLmhhcygncmVzdW1lJykgfHwgbGFiZWxzLmhhcygnY292ZXIgbGV0dGVyJykpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uJ1xuICB9XG5cbiAgLy8gU3VydmV5IGRldGVjdGlvblxuICBpZiAoZmllbGRzLnNvbWUoZiA9PiBmLnR5cGUgPT09ICdSQVRJTkcnKSAmJiBsYWJlbHMuaGFzKCdmZWVkYmFjaycpKSB7XG4gICAgcmV0dXJuICdzdXJ2ZXknXG4gIH1cblxuICAvLyBDb250YWN0IGZvcm0gZGV0ZWN0aW9uXG4gIGlmIChsYWJlbHMuaGFzKCdtZXNzYWdlJykgfHwgbGFiZWxzLmhhcygnc3ViamVjdCcpKSB7XG4gICAgcmV0dXJuICdjb250YWN0J1xuICB9XG5cbiAgLy8gRmVlZGJhY2sgZm9ybSBkZXRlY3Rpb25cbiAgaWYgKGxhYmVscy5oYXMoJ3JhdGluZycpICYmIGxhYmVscy5oYXMoJ2ZlZWRiYWNrJykpIHtcbiAgICByZXR1cm4gJ2ZlZWRiYWNrJ1xuICB9XG5cbiAgcmV0dXJuICdjdXN0b20nXG59XG5cbi8qKlxuICogR2V0IGZpZWxkIHN1Z2dlc3Rpb25zIGdyb3VwZWQgYnkgY2F0ZWdvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyb3VwU3VnZ2VzdGlvbnNCeUNhdGVnb3J5KFxuICBzdWdnZXN0aW9uczogRmllbGRTdWdnZXN0aW9uW11cbik6IFJlY29yZDxzdHJpbmcsIEZpZWxkU3VnZ2VzdGlvbltdPiB7XG4gIGNvbnN0IGdyb3VwZWQ6IFJlY29yZDxzdHJpbmcsIEZpZWxkU3VnZ2VzdGlvbltdPiA9IHtcbiAgICAnQ29udGFjdCBJbmZvcm1hdGlvbic6IFtdLFxuICAgICdQZXJzb25hbCBJbmZvcm1hdGlvbic6IFtdLFxuICAgICdFbXBsb3ltZW50JzogW10sXG4gICAgJ0FjY291bnQgU2V0dGluZ3MnOiBbXSxcbiAgICAnRmVlZGJhY2sgJiBTdXJ2ZXknOiBbXSxcbiAgICAnTGVnYWwgJiBDb21wbGlhbmNlJzogW10sXG4gICAgJ090aGVyJzogW10sXG4gIH1cblxuICBmb3IgKGNvbnN0IHN1Z2dlc3Rpb24gb2Ygc3VnZ2VzdGlvbnMpIHtcbiAgICBjb25zdCBrZXkgPSBzdWdnZXN0aW9uLmtleS50b0xvd2VyQ2FzZSgpXG4gICAgY29uc3QgbGFiZWwgPSBzdWdnZXN0aW9uLmxhYmVsLnRvTG93ZXJDYXNlKClcblxuICAgIGlmIChrZXkuaW5jbHVkZXMoJ2VtYWlsJykgfHwga2V5LmluY2x1ZGVzKCdwaG9uZScpIHx8IGtleS5pbmNsdWRlcygnYWRkcmVzcycpKSB7XG4gICAgICBncm91cGVkWydDb250YWN0IEluZm9ybWF0aW9uJ10ucHVzaChzdWdnZXN0aW9uKVxuICAgIH0gZWxzZSBpZiAoa2V5LmluY2x1ZGVzKCduYW1lJykgfHwga2V5LmluY2x1ZGVzKCdkb2InKSB8fCBrZXkuaW5jbHVkZXMoJ2FnZScpKSB7XG4gICAgICBncm91cGVkWydQZXJzb25hbCBJbmZvcm1hdGlvbiddLnB1c2goc3VnZ2VzdGlvbilcbiAgICB9IGVsc2UgaWYgKGtleS5pbmNsdWRlcygnZGVwYXJ0bWVudCcpIHx8IGtleS5pbmNsdWRlcygnc3RhcnQnKSB8fCBrZXkuaW5jbHVkZXMoJ2VtZXJnZW5jeScpKSB7XG4gICAgICBncm91cGVkWydFbXBsb3ltZW50J10ucHVzaChzdWdnZXN0aW9uKVxuICAgIH0gZWxzZSBpZiAoa2V5LmluY2x1ZGVzKCdwYXNzd29yZCcpIHx8IGtleS5pbmNsdWRlcygnY29uZmlybScpKSB7XG4gICAgICBncm91cGVkWydBY2NvdW50IFNldHRpbmdzJ10ucHVzaChzdWdnZXN0aW9uKVxuICAgIH0gZWxzZSBpZiAoa2V5LmluY2x1ZGVzKCdyYXRpbmcnKSB8fCBrZXkuaW5jbHVkZXMoJ2ZlZWRiYWNrJykpIHtcbiAgICAgIGdyb3VwZWRbJ0ZlZWRiYWNrICYgU3VydmV5J10ucHVzaChzdWdnZXN0aW9uKVxuICAgIH0gZWxzZSBpZiAoa2V5LmluY2x1ZGVzKCdhZ3JlZScpIHx8IGtleS5pbmNsdWRlcygndGVybXMnKSB8fCBrZXkuaW5jbHVkZXMoJ2NvbnNlbnQnKSkge1xuICAgICAgZ3JvdXBlZFsnTGVnYWwgJiBDb21wbGlhbmNlJ10ucHVzaChzdWdnZXN0aW9uKVxuICAgIH0gZWxzZSB7XG4gICAgICBncm91cGVkWydPdGhlciddLnB1c2goc3VnZ2VzdGlvbilcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgZW1wdHkgY2F0ZWdvcmllc1xuICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKGdyb3VwZWQpLmZpbHRlcigoW18sIHZdKSA9PiB2Lmxlbmd0aCA+IDApKVxufVxuIl19