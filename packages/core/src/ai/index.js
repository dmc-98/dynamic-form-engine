"use strict";
// ─── AI Integration & Assistants ──────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupSuggestionsByCategory = exports.detectFormType = exports.suggestAdditionalFields = exports.suggestValidationRules = exports.buildLlmPrompt = exports.generateFormFromDescription = void 0;
// Form Generation
var form_generator_1 = require("./form-generator");
Object.defineProperty(exports, "generateFormFromDescription", { enumerable: true, get: function () { return form_generator_1.generateFormFromDescription; } });
Object.defineProperty(exports, "buildLlmPrompt", { enumerable: true, get: function () { return form_generator_1.buildLlmPrompt; } });
// Validation Rule Suggestions
var validation_suggester_1 = require("./validation-suggester");
Object.defineProperty(exports, "suggestValidationRules", { enumerable: true, get: function () { return validation_suggester_1.suggestValidationRules; } });
// Field Suggestions
var field_suggester_1 = require("./field-suggester");
Object.defineProperty(exports, "suggestAdditionalFields", { enumerable: true, get: function () { return field_suggester_1.suggestAdditionalFields; } });
Object.defineProperty(exports, "detectFormType", { enumerable: true, get: function () { return field_suggester_1.detectFormType; } });
Object.defineProperty(exports, "groupSuggestionsByCategory", { enumerable: true, get: function () { return field_suggester_1.groupSuggestionsByCategory; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUZBQWlGOzs7QUFFakYsa0JBQWtCO0FBQ2xCLG1EQUt5QjtBQUp2Qiw2SEFBQSwyQkFBMkIsT0FBQTtBQUMzQixnSEFBQSxjQUFjLE9BQUE7QUFLaEIsOEJBQThCO0FBQzlCLCtEQUcrQjtBQUY3Qiw4SEFBQSxzQkFBc0IsT0FBQTtBQUl4QixvQkFBb0I7QUFDcEIscURBSzBCO0FBSnhCLDBIQUFBLHVCQUF1QixPQUFBO0FBQ3ZCLGlIQUFBLGNBQWMsT0FBQTtBQUNkLDZIQUFBLDBCQUEwQixPQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8g4pSA4pSA4pSAIEFJIEludGVncmF0aW9uICYgQXNzaXN0YW50cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLy8gRm9ybSBHZW5lcmF0aW9uXG5leHBvcnQge1xuICBnZW5lcmF0ZUZvcm1Gcm9tRGVzY3JpcHRpb24sXG4gIGJ1aWxkTGxtUHJvbXB0LFxuICB0eXBlIEZvcm1HZW5lcmF0aW9uUHJvbXB0LFxuICB0eXBlIEdlbmVyYXRlZEZvcm1Db25maWcsXG59IGZyb20gJy4vZm9ybS1nZW5lcmF0b3InXG5cbi8vIFZhbGlkYXRpb24gUnVsZSBTdWdnZXN0aW9uc1xuZXhwb3J0IHtcbiAgc3VnZ2VzdFZhbGlkYXRpb25SdWxlcyxcbiAgdHlwZSBWYWxpZGF0aW9uU3VnZ2VzdGlvbixcbn0gZnJvbSAnLi92YWxpZGF0aW9uLXN1Z2dlc3RlcidcblxuLy8gRmllbGQgU3VnZ2VzdGlvbnNcbmV4cG9ydCB7XG4gIHN1Z2dlc3RBZGRpdGlvbmFsRmllbGRzLFxuICBkZXRlY3RGb3JtVHlwZSxcbiAgZ3JvdXBTdWdnZXN0aW9uc0J5Q2F0ZWdvcnksXG4gIHR5cGUgRmllbGRTdWdnZXN0aW9uLFxufSBmcm9tICcuL2ZpZWxkLXN1Z2dlc3RlcidcbiJdfQ==