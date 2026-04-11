"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DfePlayground = DfePlayground;
const react_1 = __importStar(require("react"));
const dfe_core_1 = require("@dmc-98/dfe-core");
const dfe_core_2 = require("@dmc-98/dfe-core");
const components_1 = require("@dmc-98/dfe-react/components");
const validateConfig_1 = require("../validateConfig");
// ─── Component ──────────────────────────────────────────────────────────────
/**
 * Interactive playground for testing Dynamic Form Engine configurations.
 * Split pane with JSON editor on left and live form preview on right.
 * Includes validation, template loading, and field value inspection.
 */
function DfePlayground({ initialConfig, className }) {
    var _a;
    const [jsonText, setJsonText] = (0, react_1.useState)(initialConfig || JSON.stringify(dfe_core_1.TEMPLATES[0], null, 2));
    const [formValues, setFormValues] = (0, react_1.useState)(() => {
        const template = dfe_core_1.TEMPLATES[0];
        return (0, dfe_core_2.createFormEngine)(template.fields).getValues();
    });
    const [validationErrors, setValidationErrors] = (0, react_1.useState)({});
    const [parseError, setParseError] = (0, react_1.useState)(null);
    // Parse and validate JSON
    const config = (0, react_1.useMemo)(() => {
        try {
            setParseError(null);
            const parsed = JSON.parse(jsonText);
            if (!parsed.fields) {
                setParseError('Configuration must have a "fields" array');
                return null;
            }
            return parsed;
        }
        catch (e) {
            const message = e.message;
            setParseError(`Invalid JSON: ${message}`);
            return null;
        }
    }, [jsonText]);
    // Create form engine from config
    const engine = (0, react_1.useMemo)(() => {
        if (!config)
            return null;
        try {
            return (0, dfe_core_2.createFormEngine)(config.fields);
        }
        catch (e) {
            setParseError(`Form engine error: ${e.message}`);
            return null;
        }
    }, [config]);
    const visibleFields = (_a = engine === null || engine === void 0 ? void 0 : engine.getVisibleFields()) !== null && _a !== void 0 ? _a : [];
    (0, react_1.useEffect)(() => {
        if (!engine) {
            setFormValues({});
            setValidationErrors({});
            return;
        }
        setFormValues(engine.getValues());
        setValidationErrors(engine.validate().errors);
    }, [engine]);
    // Handle field changes
    const handleFieldChange = (0, react_1.useCallback)((key, value) => {
        if (!engine)
            return;
        engine.setFieldValue(key, value);
        setFormValues(engine.getValues());
        // Validate
        const { errors } = engine.validate();
        setValidationErrors(errors);
    }, [engine]);
    // Handle template load
    const handleLoadTemplate = (templateId) => {
        const template = dfe_core_1.TEMPLATES.find(t => t.id === templateId);
        if (template) {
            const config = {
                fields: template.fields,
                steps: template.steps,
            };
            setJsonText(JSON.stringify(config, null, 2));
        }
    };
    // Copy config to clipboard
    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(jsonText);
            alert('Configuration copied to clipboard!');
        }
        catch (e) {
            alert(`Failed to copy: ${e.message}`);
        }
    };
    // Validate configuration
    const handleValidateConfig = () => {
        if (!jsonText.trim()) {
            alert('No configuration to validate');
            return;
        }
        try {
            const parsed = JSON.parse(jsonText);
            const { issues } = (0, validateConfig_1.validateFormConfigData)(parsed);
            const errors = issues.filter(i => i.severity === 'error').length;
            const warnings = issues.filter(i => i.severity === 'warning').length;
            let message = '';
            if (issues.length === 0) {
                message = 'Configuration is valid!';
            }
            else {
                message =
                    issues.map(i => `[${i.path}] ${i.message}`).join('\n') +
                        `\n\n${errors} error(s), ${warnings} warning(s)`;
            }
            alert(message);
        }
        catch (e) {
            alert(`Validation error: ${e.message}`);
        }
    };
    return (<div className={className} data-dfe-playground>
      <div data-dfe-playground-toolbar>
        <div data-dfe-playground-toolbar-group>
          <label htmlFor="template-select" data-dfe-playground-label>
            Load Template:
          </label>
          <select id="template-select" onChange={e => handleLoadTemplate(e.target.value)} data-dfe-playground-select>
            <option value="">Select a template...</option>
            {dfe_core_1.TEMPLATES.map(t => (<option key={t.id} value={t.id}>
                {t.name}
              </option>))}
          </select>
        </div>

        <div data-dfe-playground-toolbar-group>
          <button type="button" onClick={handleValidateConfig} data-dfe-playground-action>
            Validate Config
          </button>
          <button type="button" onClick={handleCopyToClipboard} data-dfe-playground-action>
            Copy to Clipboard
          </button>
        </div>
      </div>

      <div data-dfe-playground-content>
        {/* Left: JSON Editor */}
        <div data-dfe-playground-pane data-dfe-playground-editor>
          <div data-dfe-playground-pane-header>
            <h3>Form Configuration (JSON)</h3>
          </div>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} data-dfe-playground-textarea spellCheck="false"/>
        </div>

        {/* Right: Form Preview */}
        <div data-dfe-playground-pane data-dfe-playground-preview>
          <div data-dfe-playground-pane-header>
            <h3>Live Preview</h3>
          </div>

          <div data-dfe-playground-preview-content>
            {parseError ? (<div data-dfe-playground-error>
                <strong>Error:</strong> {parseError}
              </div>) : !engine ? (<div data-dfe-playground-empty>Form configuration could not be loaded</div>) : (<>
                <components_1.DfeFormRenderer fields={visibleFields} values={formValues} onFieldChange={handleFieldChange} errors={validationErrors}/>
              </>)}
          </div>
        </div>
      </div>

      {/* Bottom: Values and Validation */}
      <div data-dfe-playground-footer>
        <div data-dfe-playground-section>
          <h4>Field Values</h4>
          <pre data-dfe-playground-json>
            {JSON.stringify(formValues, null, 2)}
          </pre>
        </div>

        {Object.keys(validationErrors).length > 0 && (<div data-dfe-playground-section>
            <h4>Validation Errors</h4>
            <pre data-dfe-playground-errors>
              {JSON.stringify(validationErrors, null, 2)}
            </pre>
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGZlUGxheWdyb3VuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkRmZVBsYXlncm91bmQudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBLHNDQWdOQztBQTVPRCwrQ0FBd0U7QUFFeEUsa0RBQStDO0FBQy9DLGtEQUFzRDtBQUN0RCxnRUFBaUU7QUFDakUsc0RBQTBEO0FBZ0IxRCwrRUFBK0U7QUFFL0U7Ozs7R0FJRztBQUNILFNBQWdCLGFBQWEsQ0FBQyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQXNCOztJQUM1RSxNQUFNLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFDdEMsYUFBYSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQ3ZELENBQUE7SUFDRCxNQUFNLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBYSxHQUFHLEVBQUU7UUFDNUQsTUFBTSxRQUFRLEdBQUcsb0JBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM3QixPQUFPLElBQUEsMkJBQWdCLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFBO0lBQ3RELENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxDQUFDLGdCQUFnQixFQUFFLG1CQUFtQixDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUF5QixFQUFFLENBQUMsQ0FBQTtJQUNwRixNQUFNLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBZ0IsSUFBSSxDQUFDLENBQUE7SUFFakUsMEJBQTBCO0lBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUEsZUFBTyxFQUFvQixHQUFHLEVBQUU7UUFDN0MsSUFBSSxDQUFDO1lBQ0gsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFB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QUFJLENBQzNDLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUM5QjtZQUFBLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FDekI7WUFBQSxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FDN0I7Y0FBQSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUM1QztZQUFBLEVBQUUsR0FBRyxDQUNQO1VBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUNIO01BQUEsRUFBRSxHQUFHLENBQ1A7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUE7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IEZvcm1GaWVsZCwgRm9ybVN0ZXAsIEZvcm1WYWx1ZXMgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuaW1wb3J0IHsgVEVNUExBVEVTIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcbmltcG9ydCB7IGNyZWF0ZUZvcm1FbmdpbmUgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuaW1wb3J0IHsgRGZlRm9ybVJlbmRlcmVyIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtcmVhY3QvY29tcG9uZW50cydcbmltcG9ydCB7IHZhbGlkYXRlRm9ybUNvbmZpZ0RhdGEgfSBmcm9tICcuLi92YWxpZGF0ZUNvbmZpZydcblxuLy8g4pSA4pSA4pSAIFR5cGVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgaW50ZXJmYWNlIERmZVBsYXlncm91bmRQcm9wcyB7XG4gIC8qKiBJbml0aWFsIGZvcm0gY29uZmlndXJhdGlvbiBKU09OIHN0cmluZyAqL1xuICBpbml0aWFsQ29uZmlnPzogc3RyaW5nXG4gIC8qKiBDbGFzcyBuYW1lIGZvciB0aGUgY29udGFpbmVyICovXG4gIGNsYXNzTmFtZT86IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZvcm1Db25maWcge1xuICBmaWVsZHM6IEZvcm1GaWVsZFtdXG4gIHN0ZXBzPzogRm9ybVN0ZXBbXVxufVxuXG4vLyDilIDilIDilIAgQ29tcG9uZW50IOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIEludGVyYWN0aXZlIHBsYXlncm91bmQgZm9yIHRlc3RpbmcgRHluYW1pYyBGb3JtIEVuZ2luZSBjb25maWd1cmF0aW9ucy5cbiAqIFNwbGl0IHBhbmUgd2l0aCBKU09OIGVkaXRvciBvbiBsZWZ0IGFuZCBsaXZlIGZvcm0gcHJldmlldyBvbiByaWdodC5cbiAqIEluY2x1ZGVzIHZhbGlkYXRpb24sIHRlbXBsYXRlIGxvYWRpbmcsIGFuZCBmaWVsZCB2YWx1ZSBpbnNwZWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gRGZlUGxheWdyb3VuZCh7IGluaXRpYWxDb25maWcsIGNsYXNzTmFtZSB9OiBEZmVQbGF5Z3JvdW5kUHJvcHMpOiBSZWFjdC5SZWFjdEVsZW1lbnQge1xuICBjb25zdCBbanNvblRleHQsIHNldEpzb25UZXh0XSA9IHVzZVN0YXRlPHN0cmluZz4oXG4gICAgaW5pdGlhbENvbmZpZyB8fCBKU09OLnN0cmluZ2lmeShURU1QTEFURVNbMF0sIG51bGwsIDIpXG4gIClcbiAgY29uc3QgW2Zvcm1WYWx1ZXMsIHNldEZvcm1WYWx1ZXNdID0gdXNlU3RhdGU8Rm9ybVZhbHVlcz4oKCkgPT4ge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gVEVNUExBVEVTWzBdXG4gICAgcmV0dXJuIGNyZWF0ZUZvcm1FbmdpbmUodGVtcGxhdGUuZmllbGRzKS5nZXRWYWx1ZXMoKVxuICB9KVxuICBjb25zdCBbdmFsaWRhdGlvbkVycm9ycywgc2V0VmFsaWRhdGlvbkVycm9yc10gPSB1c2VTdGF0ZTxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+Pih7fSlcbiAgY29uc3QgW3BhcnNlRXJyb3IsIHNldFBhcnNlRXJyb3JdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcblxuICAvLyBQYXJzZSBhbmQgdmFsaWRhdGUgSlNPTlxuICBjb25zdCBjb25maWcgPSB1c2VNZW1vPEZvcm1Db25maWcgfCBudWxsPigoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHNldFBhcnNlRXJyb3IobnVsbClcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblRleHQpIGFzIEZvcm1Db25maWdcbiAgICAgIGlmICghcGFyc2VkLmZpZWxkcykge1xuICAgICAgICBzZXRQYXJzZUVycm9yKCdDb25maWd1cmF0aW9uIG11c3QgaGF2ZSBhIFwiZmllbGRzXCIgYXJyYXknKVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlZFxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSAoZSBhcyBFcnJvcikubWVzc2FnZVxuICAgICAgc2V0UGFyc2VFcnJvcihgSW52YWxpZCBKU09OOiAke21lc3NhZ2V9YClcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9LCBbanNvblRleHRdKVxuXG4gIC8vIENyZWF0ZSBmb3JtIGVuZ2luZSBmcm9tIGNvbmZpZ1xuICBjb25zdCBlbmdpbmUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIWNvbmZpZykgcmV0dXJuIG51bGxcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUZvcm1FbmdpbmUoY29uZmlnLmZpZWxkcylcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBzZXRQYXJzZUVycm9yKGBGb3JtIGVuZ2luZSBlcnJvcjogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH0sIFtjb25maWddKVxuXG4gIGNvbnN0IHZpc2libGVGaWVsZHMgPSBlbmdpbmU/LmdldFZpc2libGVGaWVsZHMoKSA/PyBbXVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmdpbmUpIHtcbiAgICAgIHNldEZvcm1WYWx1ZXMoe30pXG4gICAgICBzZXRWYWxpZGF0aW9uRXJyb3JzKHt9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgc2V0Rm9ybVZhbHVlcyhlbmdpbmUuZ2V0VmFsdWVzKCkpXG4gICAgc2V0VmFsaWRhdGlvbkVycm9ycyhlbmdpbmUudmFsaWRhdGUoKS5lcnJvcnMpXG4gIH0sIFtlbmdpbmVdKVxuXG4gIC8vIEhhbmRsZSBmaWVsZCBjaGFuZ2VzXG4gIGNvbnN0IGhhbmRsZUZpZWxkQ2hhbmdlID0gdXNlQ2FsbGJhY2soXG4gICAgKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikgPT4ge1xuICAgICAgaWYgKCFlbmdpbmUpIHJldHVyblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSlcbiAgICAgIHNldEZvcm1WYWx1ZXMoZW5naW5lLmdldFZhbHVlcygpKVxuXG4gICAgICAvLyBWYWxpZGF0ZVxuICAgICAgY29uc3QgeyBlcnJvcnMgfSA9IGVuZ2luZS52YWxpZGF0ZSgpXG4gICAgICBzZXRWYWxpZGF0aW9uRXJyb3JzKGVycm9ycylcbiAgICB9LFxuICAgIFtlbmdpbmVdXG4gIClcblxuICAvLyBIYW5kbGUgdGVtcGxhdGUgbG9hZFxuICBjb25zdCBoYW5kbGVMb2FkVGVtcGxhdGUgPSAodGVtcGxhdGVJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdGVtcGxhdGUgPSBURU1QTEFURVMuZmluZCh0ID0+IHQuaWQgPT09IHRlbXBsYXRlSWQpXG4gICAgaWYgKHRlbXBsYXRlKSB7XG4gICAgICBjb25zdCBjb25maWc6IEZvcm1Db25maWcgPSB7XG4gICAgICAgIGZpZWxkczogdGVtcGxhdGUuZmllbGRzLFxuICAgICAgICBzdGVwczogdGVtcGxhdGUuc3RlcHMsXG4gICAgICB9XG4gICAgICBzZXRKc29uVGV4dChKU09OLnN0cmluZ2lmeShjb25maWcsIG51bGwsIDIpKVxuICAgIH1cbiAgfVxuXG4gIC8vIENvcHkgY29uZmlnIHRvIGNsaXBib2FyZFxuICBjb25zdCBoYW5kbGVDb3B5VG9DbGlwYm9hcmQgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGpzb25UZXh0KVxuICAgICAgYWxlcnQoJ0NvbmZpZ3VyYXRpb24gY29waWVkIHRvIGNsaXBib2FyZCEnKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGFsZXJ0KGBGYWlsZWQgdG8gY29weTogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gKVxuICAgIH1cbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgaGFuZGxlVmFsaWRhdGVDb25maWcgPSAoKSA9PiB7XG4gICAgaWYgKCFqc29uVGV4dC50cmltKCkpIHtcbiAgICAgIGFsZXJ0KCdObyBjb25maWd1cmF0aW9uIHRvIHZhbGlkYXRlJylcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25UZXh0KVxuICAgICAgY29uc3QgeyBpc3N1ZXMgfSA9IHZhbGlkYXRlRm9ybUNvbmZpZ0RhdGEocGFyc2VkKVxuICAgICAgY29uc3QgZXJyb3JzID0gaXNzdWVzLmZpbHRlcihpID0+IGkuc2V2ZXJpdHkgPT09ICdlcnJvcicpLmxlbmd0aFxuICAgICAgY29uc3Qgd2FybmluZ3MgPSBpc3N1ZXMuZmlsdGVyKGkgPT4gaS5zZXZlcml0eSA9PT0gJ3dhcm5pbmcnKS5sZW5ndGhcblxuICAgICAgbGV0IG1lc3NhZ2UgPSAnJ1xuICAgICAgaWYgKGlzc3Vlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbWVzc2FnZSA9ICdDb25maWd1cmF0aW9uIGlzIHZhbGlkISdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPVxuICAgICAgICAgIGlzc3Vlcy5tYXAoaSA9PiBgWyR7aS5wYXRofV0gJHtpLm1lc3NhZ2V9YCkuam9pbignXFxuJykgK1xuICAgICAgICAgIGBcXG5cXG4ke2Vycm9yc30gZXJyb3IocyksICR7d2FybmluZ3N9IHdhcm5pbmcocylgXG4gICAgICB9XG5cbiAgICAgIGFsZXJ0KG1lc3NhZ2UpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgYWxlcnQoYFZhbGlkYXRpb24gZXJyb3I6ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YClcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc05hbWV9IGRhdGEtZGZlLXBsYXlncm91bmQ+XG4gICAgICA8ZGl2IGRhdGEtZGZlLXBsYXlncm91bmQtdG9vbGJhcj5cbiAgICAgICAgPGRpdiBkYXRhLWRmZS1wbGF5Z3JvdW5kLXRvb2xiYXItZ3JvdXA+XG4gICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJ0ZW1wbGF0ZS1zZWxlY3RcIiBkYXRhLWRmZS1wbGF5Z3JvdW5kLWxhYmVsPlxuICAgICAgICAgICAgTG9hZCBUZW1wbGF0ZTpcbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgIGlkPVwidGVtcGxhdGUtc2VsZWN0XCJcbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGhhbmRsZUxvYWRUZW1wbGF0ZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICBkYXRhLWRmZS1wbGF5Z3JvdW5kLXNlbGVjdFxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj5TZWxlY3QgYSB0ZW1wbGF0ZS4uLjwvb3B0aW9uPlxuICAgICAgICAgICAge1RFTVBMQVRFUy5tYXAodCA9PiAoXG4gICAgICAgICAgICAgIDxvcHRpb24ga2V5PXt0LmlkfSB2YWx1ZT17dC5pZH0+XG4gICAgICAgICAgICAgICAge3QubmFtZX1cbiAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBkYXRhLWRmZS1wbGF5Z3JvdW5kLXRvb2xiYXItZ3JvdXA+XG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17aGFuZGxlVmFsaWRhdGVDb25maWd9IGRhdGEtZGZlLXBsYXlncm91bmQtYWN0aW9uPlxuICAgICAgICAgICAgVmFsaWRhdGUgQ29uZmlnXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17aGFuZGxlQ29weVRvQ2xpcGJvYXJkfSBkYXRhLWRmZS1wbGF5Z3JvdW5kLWFjdGlvbj5cbiAgICAgICAgICAgIENvcHkgdG8gQ2xpcGJvYXJkXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgZGF0YS1kZmUtcGxheWdyb3VuZC1jb250ZW50PlxuICAgICAgICB7LyogTGVmdDogSlNPTiBFZGl0b3IgKi99XG4gICAgICAgIDxkaXYgZGF0YS1kZmUtcGxheWdyb3VuZC1wYW5lIGRhdGEtZGZlLXBsYXlncm91bmQtZWRpdG9yPlxuICAgICAgICAgIDxkaXYgZGF0YS1kZmUtcGxheWdyb3VuZC1wYW5lLWhlYWRlcj5cbiAgICAgICAgICAgIDxoMz5Gb3JtIENvbmZpZ3VyYXRpb24gKEpTT04pPC9oMz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgIHZhbHVlPXtqc29uVGV4dH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldEpzb25UZXh0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIGRhdGEtZGZlLXBsYXlncm91bmQtdGV4dGFyZWFcbiAgICAgICAgICAgIHNwZWxsQ2hlY2s9XCJmYWxzZVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFJpZ2h0OiBGb3JtIFByZXZpZXcgKi99XG4gICAgICAgIDxkaXYgZGF0YS1kZmUtcGxheWdyb3VuZC1wYW5lIGRhdGEtZGZlLXBsYXlncm91bmQtcHJldmlldz5cbiAgICAgICAgICA8ZGl2IGRhdGEtZGZlLXBsYXlncm91bmQtcGFuZS1oZWFkZXI+XG4gICAgICAgICAgICA8aDM+TGl2ZSBQcmV2aWV3PC9oMz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgZGF0YS1kZmUtcGxheWdyb3VuZC1wcmV2aWV3LWNvbnRlbnQ+XG4gICAgICAgICAgICB7cGFyc2VFcnJvciA/IChcbiAgICAgICAgICAgICAgPGRpdiBkYXRhLWRmZS1wbGF5Z3JvdW5kLWVycm9yPlxuICAgICAgICAgICAgICAgIDxzdHJvbmc+RXJyb3I6PC9zdHJvbmc+IHtwYXJzZUVycm9yfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiAhZW5naW5lID8gKFxuICAgICAgICAgICAgICA8ZGl2IGRhdGEtZGZlLXBsYXlncm91bmQtZW1wdHk+Rm9ybSBjb25maWd1cmF0aW9uIGNvdWxkIG5vdCBiZSBsb2FkZWQ8L2Rpdj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgPERmZUZvcm1SZW5kZXJlclxuICAgICAgICAgICAgICAgICAgZmllbGRzPXt2aXNpYmxlRmllbGRzfVxuICAgICAgICAgICAgICAgICAgdmFsdWVzPXtmb3JtVmFsdWVzfVxuICAgICAgICAgICAgICAgICAgb25GaWVsZENoYW5nZT17aGFuZGxlRmllbGRDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICBlcnJvcnM9e3ZhbGlkYXRpb25FcnJvcnN9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tOiBWYWx1ZXMgYW5kIFZhbGlkYXRpb24gKi99XG4gICAgICA8ZGl2IGRhdGEtZGZlLXBsYXlncm91bmQtZm9vdGVyPlxuICAgICAgICA8ZGl2IGRhdGEtZGZlLXBsYXlncm91bmQtc2VjdGlvbj5cbiAgICAgICAgICA8aDQ+RmllbGQgVmFsdWVzPC9oND5cbiAgICAgICAgICA8cHJlIGRhdGEtZGZlLXBsYXlncm91bmQtanNvbj5cbiAgICAgICAgICAgIHtKU09OLnN0cmluZ2lmeShmb3JtVmFsdWVzLCBudWxsLCAyKX1cbiAgICAgICAgICA8L3ByZT5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge09iamVjdC5rZXlzKHZhbGlkYXRpb25FcnJvcnMpLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgIDxkaXYgZGF0YS1kZmUtcGxheWdyb3VuZC1zZWN0aW9uPlxuICAgICAgICAgICAgPGg0PlZhbGlkYXRpb24gRXJyb3JzPC9oND5cbiAgICAgICAgICAgIDxwcmUgZGF0YS1kZmUtcGxheWdyb3VuZC1lcnJvcnM+XG4gICAgICAgICAgICAgIHtKU09OLnN0cmluZ2lmeSh2YWxpZGF0aW9uRXJyb3JzLCBudWxsLCAyKX1cbiAgICAgICAgICAgIDwvcHJlPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIClcbn1cbiJdfQ==