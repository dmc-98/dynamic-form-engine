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
exports.ConfigPanel = ConfigPanel;
const react_1 = __importStar(require("react"));
// ─── All Field Types ────────────────────────────────────────────────────────
const ALL_FIELD_TYPES = [
    { value: 'SHORT_TEXT', label: 'Short Text' },
    { value: 'LONG_TEXT', label: 'Long Text' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'PHONE', label: 'Phone' },
    { value: 'DATE', label: 'Date' },
    { value: 'DATE_RANGE', label: 'Date Range' },
    { value: 'TIME', label: 'Time' },
    { value: 'DATE_TIME', label: 'Date & Time' },
    { value: 'SELECT', label: 'Dropdown' },
    { value: 'MULTI_SELECT', label: 'Multi-Select' },
    { value: 'RADIO', label: 'Radio Group' },
    { value: 'CHECKBOX', label: 'Checkbox' },
    { value: 'FILE_UPLOAD', label: 'File Upload' },
    { value: 'RATING', label: 'Rating' },
    { value: 'SCALE', label: 'Scale' },
    { value: 'URL', label: 'URL' },
    { value: 'PASSWORD', label: 'Password' },
    { value: 'HIDDEN', label: 'Hidden' },
    { value: 'SECTION_BREAK', label: 'Section Break' },
    { value: 'FIELD_GROUP', label: 'Field Group' },
];
function BasicsPanel({ field, onChange, allowedTypes }) {
    var _a;
    return (<div data-dfe-builder-basics>
      <div data-dfe-builder-field>
        <label htmlFor="field-label">Label</label>
        <input id="field-label" type="text" value={field.label} onChange={e => onChange({ label: e.target.value })}/>
      </div>

      <div data-dfe-builder-field>
        <label htmlFor="field-key">Field key</label>
        <small>Unique identifier used in form values</small>
        <input id="field-key" type="text" value={field.key} onChange={e => onChange({ key: e.target.value })}/>
      </div>

      <div data-dfe-builder-field>
        <label htmlFor="field-type">Field type</label>
        <select id="field-type" value={field.type} onChange={e => onChange({ type: e.target.value })}>
          {allowedTypes.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>
      </div>

      <div data-dfe-builder-field>
        <label htmlFor="field-description">Description</label>
        <textarea id="field-description" value={(_a = field.description) !== null && _a !== void 0 ? _a : ''} onChange={e => onChange({ description: e.target.value || null })} rows={2}/>
      </div>

      <label data-dfe-builder-checkbox>
        <input type="checkbox" checked={field.required} onChange={e => onChange({ required: e.target.checked })}/>
        Required
      </label>

      {/*
          NOTE: No "Model Binding" section here.
          Field-to-API mapping is configured at the STEP level via StepConfigPanel's
          "Request Body Mapping" — that is the single source of truth.
        */}
    </div>);
}
function TextConfigPanel({ config, onChange }) {
    var _a, _b, _c, _d;
    return (<div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="text-placeholder">Placeholder</label>
        <input id="text-placeholder" type="text" value={(_a = config.placeholder) !== null && _a !== void 0 ? _a : ''} onChange={e => onChange({ ...config, placeholder: e.target.value || undefined })}/>
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="text-min">Min length</label>
        <input id="text-min" type="number" value={(_b = config.minLength) !== null && _b !== void 0 ? _b : ''} onChange={e => onChange({ ...config, minLength: e.target.value ? Number(e.target.value) : undefined })}/>
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="text-max">Max length</label>
        <input id="text-max" type="number" value={(_c = config.maxLength) !== null && _c !== void 0 ? _c : ''} onChange={e => onChange({ ...config, maxLength: e.target.value ? Number(e.target.value) : undefined })}/>
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="text-pattern">Validation pattern (regex)</label>
        <input id="text-pattern" type="text" value={(_d = config.pattern) !== null && _d !== void 0 ? _d : ''} onChange={e => onChange({ ...config, pattern: e.target.value || undefined })} placeholder="e.g., ^[A-Z]{2,3}$"/>
      </div>
    </div>);
}
function NumberConfigPanel({ config, onChange }) {
    var _a, _b, _c;
    return (<div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="num-min">Minimum</label>
        <input id="num-min" type="number" value={(_a = config.min) !== null && _a !== void 0 ? _a : ''} onChange={e => onChange({ ...config, min: e.target.value ? Number(e.target.value) : undefined })}/>
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="num-max">Maximum</label>
        <input id="num-max" type="number" value={(_b = config.max) !== null && _b !== void 0 ? _b : ''} onChange={e => onChange({ ...config, max: e.target.value ? Number(e.target.value) : undefined })}/>
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="num-format">Format</label>
        <select id="num-format" value={(_c = config.format) !== null && _c !== void 0 ? _c : 'decimal'} onChange={e => onChange({ ...config, format: e.target.value })}>
          <option value="integer">Integer</option>
          <option value="decimal">Decimal</option>
          <option value="currency">Currency</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>
    </div>);
}
function SelectConfigPanel({ config, onChange }) {
    var _a, _b, _c, _d;
    const dataSource = config.dataSource;
    const updateDataSource = (partial) => {
        onChange({
            ...config,
            dataSource: {
                ...(dataSource !== null && dataSource !== void 0 ? dataSource : {
                    endpoint: '',
                    cursorParam: 'cursor',
                    pageSize: 20,
                    labelKey: 'label',
                    valueKey: 'value',
                }),
                ...partial,
            },
        });
    };
    return (<div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="select-mode">Data source</label>
        <select id="select-mode" value={config.mode} onChange={e => onChange({ ...config, mode: e.target.value })}>
          <option value="static">Static options</option>
          <option value="dynamic">Dynamic (API-backed)</option>
        </select>
      </div>

      {config.mode === 'static' && (<div data-dfe-builder-section>
          <h4>Options</h4>
          {((_a = config.options) !== null && _a !== void 0 ? _a : []).map((opt, i) => (<div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={opt.label} onChange={e => {
                    var _a;
                    const updated = [...((_a = config.options) !== null && _a !== void 0 ? _a : [])];
                    updated[i] = { ...opt, label: e.target.value };
                    onChange({ ...config, options: updated });
                }} placeholder="Label" aria-label="Option label"/>
              <input type="text" value={opt.value} onChange={e => {
                    var _a;
                    const updated = [...((_a = config.options) !== null && _a !== void 0 ? _a : [])];
                    updated[i] = { ...opt, value: e.target.value };
                    onChange({ ...config, options: updated });
                }} placeholder="Value" aria-label="Option value"/>
              <button type="button" onClick={() => {
                    var _a;
                    const updated = ((_a = config.options) !== null && _a !== void 0 ? _a : []).filter((_, j) => j !== i);
                    onChange({ ...config, options: updated });
                }} aria-label="Remove option">
                ×
              </button>
            </div>))}
          <button type="button" onClick={() => {
                var _a;
                onChange({
                    ...config,
                    options: [...((_a = config.options) !== null && _a !== void 0 ? _a : []), { label: '', value: '' }],
                });
            }}>
            + Add option
          </button>
        </div>)}

      {config.mode === 'dynamic' && dataSource && (<div data-dfe-builder-section>
          <h4>Dynamic Data Source</h4>

          <div data-dfe-builder-field>
            <label htmlFor="ds-resource">Resource name</label>
            <small>Internal identifier for the API resource</small>
            <input id="ds-resource" type="text" value={dataSource.endpoint} onChange={e => updateDataSource({ endpoint: e.target.value })} placeholder="/api/fields/:id/options"/>
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-label-key">Display field</label>
            <small>API response field to show as label (use + to combine, e.g., "firstName + lastName")</small>
            <input id="ds-label-key" type="text" value={dataSource.labelKey} onChange={e => updateDataSource({ labelKey: e.target.value })} placeholder="name"/>
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-value-key">ID field</label>
            <small>API response field to use as value</small>
            <input id="ds-value-key" type="text" value={dataSource.valueKey} onChange={e => updateDataSource({ valueKey: e.target.value })} placeholder="id"/>
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-page-size">Page size</label>
            <input id="ds-page-size" type="number" value={dataSource.pageSize} onChange={e => updateDataSource({ pageSize: Number(e.target.value) || 20 })}/>
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-depends-on">Depends on field</label>
            <small>Field key for cascading dropdown (parent field)</small>
            <input id="ds-depends-on" type="text" value={(_b = dataSource.dependsOnField) !== null && _b !== void 0 ? _b : ''} onChange={e => updateDataSource({ dependsOnField: e.target.value || undefined })} placeholder="countryId"/>
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-depends-param">Dependency parameter</label>
            <small>Query parameter name sent to the API</small>
            <input id="ds-depends-param" type="text" value={(_c = dataSource.dependsOnParam) !== null && _c !== void 0 ? _c : ''} onChange={e => updateDataSource({ dependsOnParam: e.target.value || undefined })} placeholder="countryId"/>
          </div>
        </div>)}

      <label data-dfe-builder-checkbox>
        <input type="checkbox" checked={(_d = config.allowOther) !== null && _d !== void 0 ? _d : false} onChange={e => onChange({ ...config, allowOther: e.target.checked })}/>
        Allow "Other" option
      </label>
    </div>);
}
function FileUploadConfigPanel({ config, onChange }) {
    var _a, _b, _c;
    return (<div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="file-max-size">Max size (MB)</label>
        <input id="file-max-size" type="number" value={(_a = config.maxSizeMB) !== null && _a !== void 0 ? _a : ''} onChange={e => onChange({ ...config, maxSizeMB: e.target.value ? Number(e.target.value) : undefined })}/>
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="file-max-files">Max files</label>
        <input id="file-max-files" type="number" value={(_b = config.maxFiles) !== null && _b !== void 0 ? _b : ''} onChange={e => onChange({ ...config, maxFiles: e.target.value ? Number(e.target.value) : undefined })}/>
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="file-types">Allowed MIME types</label>
        <small>Comma-separated, e.g., image/png, application/pdf</small>
        <input id="file-types" type="text" value={((_c = config.allowedMimeTypes) !== null && _c !== void 0 ? _c : []).join(', ')} onChange={e => onChange({
            ...config,
            allowedMimeTypes: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined,
        })}/>
      </div>
    </div>);
}
// ─── Main Component ─────────────────────────────────────────────────────────
/**
 * Builder panel for configuring a single form field.
 *
 * Renders a "Basics" section (label, key, type, required) and a
 * type-specific configuration panel.
 *
 * **Intentionally omits field-level "Model Binding"** — the step-level
 * StepConfigPanel's "Request Body Mapping" is the single source of truth
 * for mapping field values to API request bodies.
 *
 * For SELECT fields, uses API-centric labels:
 * - "Resource name" (not "Model name")
 * - "Display field" (not "Label key")
 * - "ID field" (not "Value key")
 *
 * @example
 * ```tsx
 * <ConfigPanel
 *   field={selectedField}
 *   onChange={(updates) => updateField(selectedField.id, updates)}
 * />
 * ```
 */
function ConfigPanel({ field, onChange, allowedTypes, className }) {
    const types = allowedTypes
        ? ALL_FIELD_TYPES.filter(t => allowedTypes.includes(t.value))
        : ALL_FIELD_TYPES;
    const updateConfig = (0, react_1.useCallback)((config) => {
        onChange({ config });
    }, [onChange]);
    const renderTypeConfig = () => {
        var _a, _b, _c, _d;
        switch (field.type) {
            case 'SHORT_TEXT':
            case 'LONG_TEXT':
            case 'EMAIL':
            case 'PHONE':
            case 'URL':
            case 'PASSWORD':
                return (<TextConfigPanel config={field.config} onChange={updateConfig}/>);
            case 'NUMBER':
                return (<NumberConfigPanel config={field.config} onChange={updateConfig}/>);
            case 'SELECT':
            case 'MULTI_SELECT':
            case 'RADIO':
                return (<SelectConfigPanel config={(_a = field.config) !== null && _a !== void 0 ? _a : { mode: 'static', options: [] }} onChange={updateConfig}/>);
            case 'FILE_UPLOAD':
                return (<FileUploadConfigPanel config={field.config} onChange={updateConfig}/>);
            case 'RATING':
                return (<div data-dfe-builder-type-config>
            <div data-dfe-builder-field>
              <label htmlFor="rating-max">Max rating</label>
              <input id="rating-max" type="number" value={(_b = field.config.max) !== null && _b !== void 0 ? _b : 5} onChange={e => updateConfig({ ...field.config, max: Number(e.target.value) || 5 })}/>
            </div>
          </div>);
            case 'SCALE':
                return (<div data-dfe-builder-type-config>
            <div data-dfe-builder-field>
              <label htmlFor="scale-min">Min</label>
              <input id="scale-min" type="number" value={(_c = field.config.min) !== null && _c !== void 0 ? _c : 1} onChange={e => updateConfig({ ...field.config, min: Number(e.target.value) })}/>
            </div>
            <div data-dfe-builder-field>
              <label htmlFor="scale-max">Max</label>
              <input id="scale-max" type="number" value={(_d = field.config.max) !== null && _d !== void 0 ? _d : 10} onChange={e => updateConfig({ ...field.config, max: Number(e.target.value) })}/>
            </div>
          </div>);
            default:
                return null;
        }
    };
    return (<div className={className} data-dfe-builder-config-panel>
      <BasicsPanel field={field} onChange={onChange} allowedTypes={types}/>
      {renderTypeConfig()}
    </div>);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uZmlnUGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb25maWdQYW5lbC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtZEEsa0NBb0dDO0FBdmpCRCwrQ0FBMEM7QUFxQjFDLCtFQUErRTtBQUUvRSxNQUFNLGVBQWUsR0FBMEM7SUFDN0QsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUU7SUFDNUMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7SUFDMUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7SUFDcEMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7SUFDbEMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7SUFDbEMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDaEMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUU7SUFDNUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDaEMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUU7SUFDNUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7SUFDdEMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUU7SUFDaEQsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUU7SUFDeEMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7SUFDeEMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLEtB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RUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBaUIsQ0FBQyxDQUFDLEVBRWpHO1lBQUEsRUFBRSxHQUFHLENBQ1A7VUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUE7WUFFSDtnQkFDRSxPQUFPLElBQUksQ0FBQTtRQUNmLENBQUM7SUFDSCxDQUFDLENBQUE7SUFFRCxPQUFPLENBQ0wsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsNkJBQTZCLENBQ3REO01BQUEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQ25FO01BQUEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUNyQjtJQUFBLEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQTtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHtcbiAgRm9ybUZpZWxkLCBGaWVsZFR5cGUsIEZpZWxkQ29uZmlnLFxuICBTZWxlY3RGaWVsZENvbmZpZywgRHluYW1pY0RhdGFTb3VyY2UsXG4gIFRleHRGaWVsZENvbmZpZywgTnVtYmVyRmllbGRDb25maWcsXG4gIEZpbGVVcGxvYWRDb25maWcsIFJhdGluZ0NvbmZpZywgU2NhbGVDb25maWcsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGludGVyZmFjZSBDb25maWdQYW5lbFByb3BzIHtcbiAgLyoqIFRoZSBmaWVsZCBiZWluZyBjb25maWd1cmVkICovXG4gIGZpZWxkOiBGb3JtRmllbGRcbiAgLyoqIENhbGxiYWNrIHdoZW4gZmllbGQgcHJvcGVydGllcyBjaGFuZ2UgKi9cbiAgb25DaGFuZ2U6ICh1cGRhdGVzOiBQYXJ0aWFsPEZvcm1GaWVsZD4pID0+IHZvaWRcbiAgLyoqIEF2YWlsYWJsZSBmaWVsZCB0eXBlcyAoc3Vic2V0IGNhbiBiZSBwYXNzZWQgZm9yIHJlc3RyaWN0ZWQgYnVpbGRlcnMpICovXG4gIGFsbG93ZWRUeXBlcz86IEZpZWxkVHlwZVtdXG4gIC8qKiBDbGFzcyBuYW1lIGZvciB0aGUgY29udGFpbmVyICovXG4gIGNsYXNzTmFtZT86IHN0cmluZ1xufVxuXG4vLyDilIDilIDilIAgQWxsIEZpZWxkIFR5cGVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5jb25zdCBBTExfRklFTERfVFlQRVM6IHsgdmFsdWU6IEZpZWxkVHlwZTsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gIHsgdmFsdWU6ICdTSE9SVF9URVhUJywgbGFiZWw6ICdTaG9ydCBUZXh0JyB9LFxuICB7IHZhbHVlOiAnTE9OR19URVhUJywgbGFiZWw6ICdMb25nIFRleHQnIH0sXG4gIHsgdmFsdWU6ICdOVU1CRVInLCBsYWJlbDogJ051bWJlcicgfSxcbiAgeyB2YWx1ZTogJ0VNQUlMJywgbGFiZWw6ICdFbWFpbCcgfSxcbiAgeyB2YWx1ZTogJ1BIT05FJywgbGFiZWw6ICdQaG9uZScgfSxcbiAgeyB2YWx1ZTogJ0RBVEUnLCBsYWJlbDogJ0RhdGUnIH0sXG4gIHsgdmFsdWU6ICdEQVRFX1JBTkdFJywgbGFiZWw6ICdEYXRlIFJhbmdlJyB9LFxuICB7IHZhbHVlOiAnVElNRScsIGxhYmVsOiAnVGltZScgfSxcbiAgeyB2YWx1ZTogJ0RBVEVfVElNRScsIGxhYmVsOiAnRGF0ZSAmIFRpbWUnIH0sXG4gIHsgdmFsdWU6ICdTRUxFQ1QnLCBsYWJlbDogJ0Ryb3Bkb3duJyB9LFxuICB7IHZhbHVlOiAnTVVMVElfU0VMRUNUJywgbGFiZWw6ICdNdWx0aS1TZWxlY3QnIH0sXG4gIHsgdmFsdWU6ICdSQURJTycsIGxhYmVsOiAnUmFkaW8gR3JvdXAnIH0sXG4gIHsgdmFsdWU6ICdDSEVDS0JPWCcsIGxhYmVsOiAnQ2hlY2tib3gnIH0sXG4gIHsgdmFsdWU6ICdGSUxFX1VQTE9BRCcsIGxhYmVsOiAnRmlsZSBVcGxvYWQnIH0sXG4gIHsgdmFsdWU6ICdSQVRJTkcnLCBsYWJlbDogJ1JhdGluZycgfSxcbiAgeyB2YWx1ZTogJ1NDQUxFJywgbGFiZWw6ICdTY2FsZScgfSxcbiAgeyB2YWx1ZTogJ1VSTCcsIGxhYmVsOiAnVVJMJyB9LFxuICB7IHZhbHVlOiAnUEFTU1dPUkQnLCBsYWJlbDogJ1Bhc3N3b3JkJyB9LFxuICB7IHZhbHVlOiAnSElEREVOJywgbGFiZWw6ICdIaWRkZW4nIH0sXG4gIHsgdmFsdWU6ICdTRUNUSU9OX0JSRUFLJywgbGFiZWw6ICdTZWN0aW9uIEJyZWFrJyB9LFxuICB7IHZhbHVlOiAnRklFTERfR1JPVVAnLCBsYWJlbDogJ0ZpZWxkIEdyb3VwJyB9LFxuXVxuXG4vLyDilIDilIDilIAgU3ViLVBhbmVscyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuaW50ZXJmYWNlIEJhc2ljc1BhbmVsUHJvcHMge1xuICBmaWVsZDogRm9ybUZpZWxkXG4gIG9uQ2hhbmdlOiAodXBkYXRlczogUGFydGlhbDxGb3JtRmllbGQ+KSA9PiB2b2lkXG4gIGFsbG93ZWRUeXBlczogeyB2YWx1ZTogRmllbGRUeXBlOyBsYWJlbDogc3RyaW5nIH1bXVxufVxuXG5mdW5jdGlvbiBCYXNpY3NQYW5lbCh7IGZpZWxkLCBvbkNoYW5nZSwgYWxsb3dlZFR5cGVzIH06IEJhc2ljc1BhbmVsUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItYmFzaWNzPlxuICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImZpZWxkLWxhYmVsXCI+TGFiZWw8L2xhYmVsPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICBpZD1cImZpZWxkLWxhYmVsXCJcbiAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgdmFsdWU9e2ZpZWxkLmxhYmVsfVxuICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IG9uQ2hhbmdlKHsgbGFiZWw6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci1maWVsZD5cbiAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmaWVsZC1rZXlcIj5GaWVsZCBrZXk8L2xhYmVsPlxuICAgICAgICA8c21hbGw+VW5pcXVlIGlkZW50aWZpZXIgdXNlZCBpbiBmb3JtIHZhbHVlczwvc21hbGw+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIGlkPVwiZmllbGQta2V5XCJcbiAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgdmFsdWU9e2ZpZWxkLmtleX1cbiAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBvbkNoYW5nZSh7IGtleTogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImZpZWxkLXR5cGVcIj5GaWVsZCB0eXBlPC9sYWJlbD5cbiAgICAgICAgPHNlbGVjdFxuICAgICAgICAgIGlkPVwiZmllbGQtdHlwZVwiXG4gICAgICAgICAgdmFsdWU9e2ZpZWxkLnR5cGV9XG4gICAgICAgICAgb25DaGFuZ2U9e2UgPT4gb25DaGFuZ2UoeyB0eXBlOiBlLnRhcmdldC52YWx1ZSBhcyBGaWVsZFR5cGUgfSl9XG4gICAgICAgID5cbiAgICAgICAgICB7YWxsb3dlZFR5cGVzLm1hcCh0ID0+IChcbiAgICAgICAgICAgIDxvcHRpb24ga2V5PXt0LnZhbHVlfSB2YWx1ZT17dC52YWx1ZX0+e3QubGFiZWx9PC9vcHRpb24+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvc2VsZWN0PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci1maWVsZD5cbiAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmaWVsZC1kZXNjcmlwdGlvblwiPkRlc2NyaXB0aW9uPC9sYWJlbD5cbiAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgaWQ9XCJmaWVsZC1kZXNjcmlwdGlvblwiXG4gICAgICAgICAgdmFsdWU9e2ZpZWxkLmRlc2NyaXB0aW9uID8/ICcnfVxuICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IG9uQ2hhbmdlKHsgZGVzY3JpcHRpb246IGUudGFyZ2V0LnZhbHVlIHx8IG51bGwgfSl9XG4gICAgICAgICAgcm93cz17Mn1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8bGFiZWwgZGF0YS1kZmUtYnVpbGRlci1jaGVja2JveD5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICBjaGVja2VkPXtmaWVsZC5yZXF1aXJlZH1cbiAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBvbkNoYW5nZSh7IHJlcXVpcmVkOiBlLnRhcmdldC5jaGVja2VkIH0pfVxuICAgICAgICAvPlxuICAgICAgICBSZXF1aXJlZFxuICAgICAgPC9sYWJlbD5cblxuICAgICAgey8qXG4gICAgICAgIE5PVEU6IE5vIFwiTW9kZWwgQmluZGluZ1wiIHNlY3Rpb24gaGVyZS5cbiAgICAgICAgRmllbGQtdG8tQVBJIG1hcHBpbmcgaXMgY29uZmlndXJlZCBhdCB0aGUgU1RFUCBsZXZlbCB2aWEgU3RlcENvbmZpZ1BhbmVsJ3NcbiAgICAgICAgXCJSZXF1ZXN0IEJvZHkgTWFwcGluZ1wiIOKAlCB0aGF0IGlzIHRoZSBzaW5nbGUgc291cmNlIG9mIHRydXRoLlxuICAgICAgKi99XG4gICAgPC9kaXY+XG4gIClcbn1cblxuLy8g4pSA4pSA4pSAIFRleHQgQ29uZmlnIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5pbnRlcmZhY2UgVGV4dENvbmZpZ1BhbmVsUHJvcHMge1xuICBjb25maWc6IFRleHRGaWVsZENvbmZpZ1xuICBvbkNoYW5nZTogKGNvbmZpZzogVGV4dEZpZWxkQ29uZmlnKSA9PiB2b2lkXG59XG5cbmZ1bmN0aW9uIFRleHRDb25maWdQYW5lbCh7IGNvbmZpZywgb25DaGFuZ2UgfTogVGV4dENvbmZpZ1BhbmVsUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItdHlwZS1jb25maWc+XG4gICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgIDxsYWJlbCBodG1sRm9yPVwidGV4dC1wbGFjZWhvbGRlclwiPlBsYWNlaG9sZGVyPC9sYWJlbD5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgaWQ9XCJ0ZXh0LXBsYWNlaG9sZGVyXCJcbiAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgdmFsdWU9e2NvbmZpZy5wbGFjZWhvbGRlciA/PyAnJ31cbiAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBvbkNoYW5nZSh7IC4uLmNvbmZpZywgcGxhY2Vob2xkZXI6IGUudGFyZ2V0LnZhbHVlIHx8IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICA8bGFiZWwgaHRtbEZvcj1cInRleHQtbWluXCI+TWluIGxlbmd0aDwvbGFiZWw+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIGlkPVwidGV4dC1taW5cIlxuICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgIHZhbHVlPXtjb25maWcubWluTGVuZ3RoID8/ICcnfVxuICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IG9uQ2hhbmdlKHsgLi4uY29uZmlnLCBtaW5MZW5ndGg6IGUudGFyZ2V0LnZhbHVlID8gTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSA6IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICA8bGFiZWwgaHRtbEZvcj1cInRleHQtbWF4XCI+TWF4IGxlbmd0aDwvbGFiZWw+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIGlkPVwidGV4dC1tYXhcIlxuICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgIHZhbHVlPXtjb25maWcubWF4TGVuZ3RoID8/ICcnfVxuICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IG9uQ2hhbmdlKHsgLi4uY29uZmlnLCBtYXhMZW5ndGg6IGUudGFyZ2V0LnZhbHVlID8gTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSA6IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICA8bGFiZWwgaHRtbEZvcj1cInRleHQtcGF0dGVyblwiPlZhbGlkYXRpb24gcGF0dGVybiAocmVnZXgpPC9sYWJlbD5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgaWQ9XCJ0ZXh0LXBhdHRlcm5cIlxuICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICB2YWx1ZT17Y29uZmlnLnBhdHRlcm4gPz8gJyd9XG4gICAgICAgICAgb25DaGFuZ2U9e2UgPT4gb25DaGFuZ2UoeyAuLi5jb25maWcsIHBhdHRlcm46IGUudGFyZ2V0LnZhbHVlIHx8IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgICBwbGFjZWhvbGRlcj1cImUuZy4sIF5bQS1aXXsyLDN9JFwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG4vLyDilIDilIDilIAgTnVtYmVyIENvbmZpZyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuaW50ZXJmYWNlIE51bWJlckNvbmZpZ1BhbmVsUHJvcHMge1xuICBjb25maWc6IE51bWJlckZpZWxkQ29uZmlnXG4gIG9uQ2hhbmdlOiAoY29uZmlnOiBOdW1iZXJGaWVsZENvbmZpZykgPT4gdm9pZFxufVxuXG5mdW5jdGlvbiBOdW1iZXJDb25maWdQYW5lbCh7IGNvbmZpZywgb25DaGFuZ2UgfTogTnVtYmVyQ29uZmlnUGFuZWxQcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci10eXBlLWNvbmZpZz5cbiAgICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci1maWVsZD5cbiAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJudW0tbWluXCI+TWluaW11bTwvbGFiZWw+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIGlkPVwibnVtLW1pblwiXG4gICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgdmFsdWU9e2NvbmZpZy5taW4gPz8gJyd9XG4gICAgICAgICAgb25DaGFuZ2U9e2UgPT4gb25DaGFuZ2UoeyAuLi5jb25maWcsIG1pbjogZS50YXJnZXQudmFsdWUgPyBOdW1iZXIoZS50YXJnZXQudmFsdWUpIDogdW5kZWZpbmVkIH0pfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgIDxsYWJlbCBodG1sRm9yPVwibnVtLW1heFwiPk1heGltdW08L2xhYmVsPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICBpZD1cIm51bS1tYXhcIlxuICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgIHZhbHVlPXtjb25maWcubWF4ID8/ICcnfVxuICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IG9uQ2hhbmdlKHsgLi4uY29uZmlnLCBtYXg6IGUudGFyZ2V0LnZhbHVlID8gTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSA6IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICA8bGFiZWwgaHRtbEZvcj1cIm51bS1mb3JtYXRcIj5Gb3JtYXQ8L2xhYmVsPlxuICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgaWQ9XCJudW0tZm9ybWF0XCJcbiAgICAgICAgICB2YWx1ZT17Y29uZmlnLmZvcm1hdCA/PyAnZGVjaW1hbCd9XG4gICAgICAgICAgb25DaGFuZ2U9e2UgPT4gb25DaGFuZ2UoeyAuLi5jb25maWcsIGZvcm1hdDogZS50YXJnZXQudmFsdWUgYXMgTnVtYmVyRmllbGRDb25maWdbJ2Zvcm1hdCddIH0pfVxuICAgICAgICA+XG4gICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImludGVnZXJcIj5JbnRlZ2VyPC9vcHRpb24+XG4gICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImRlY2ltYWxcIj5EZWNpbWFsPC9vcHRpb24+XG4gICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImN1cnJlbmN5XCI+Q3VycmVuY3k8L29wdGlvbj5cbiAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyY2VudGFnZVwiPlBlcmNlbnRhZ2U8L29wdGlvbj5cbiAgICAgICAgPC9zZWxlY3Q+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG4vLyDilIDilIDilIAgU2VsZWN0IENvbmZpZyAoQVBJLWNlbnRyaWMgbGFiZWxzKSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuaW50ZXJmYWNlIFNlbGVjdENvbmZpZ1BhbmVsUHJvcHMge1xuICBjb25maWc6IFNlbGVjdEZpZWxkQ29uZmlnXG4gIG9uQ2hhbmdlOiAoY29uZmlnOiBTZWxlY3RGaWVsZENvbmZpZykgPT4gdm9pZFxufVxuXG5mdW5jdGlvbiBTZWxlY3RDb25maWdQYW5lbCh7IGNvbmZpZywgb25DaGFuZ2UgfTogU2VsZWN0Q29uZmlnUGFuZWxQcm9wcykge1xuICBjb25zdCBkYXRhU291cmNlID0gY29uZmlnLmRhdGFTb3VyY2VcblxuICBjb25zdCB1cGRhdGVEYXRhU291cmNlID0gKHBhcnRpYWw6IFBhcnRpYWw8RHluYW1pY0RhdGFTb3VyY2U+KSA9PiB7XG4gICAgb25DaGFuZ2Uoe1xuICAgICAgLi4uY29uZmlnLFxuICAgICAgZGF0YVNvdXJjZToge1xuICAgICAgICAuLi4oZGF0YVNvdXJjZSA/PyB7XG4gICAgICAgICAgZW5kcG9pbnQ6ICcnLFxuICAgICAgICAgIGN1cnNvclBhcmFtOiAnY3Vyc29yJyxcbiAgICAgICAgICBwYWdlU2l6ZTogMjAsXG4gICAgICAgICAgbGFiZWxLZXk6ICdsYWJlbCcsXG4gICAgICAgICAgdmFsdWVLZXk6ICd2YWx1ZScsXG4gICAgICAgIH0pLFxuICAgICAgICAuLi5wYXJ0aWFsLFxuICAgICAgfSBhcyBEeW5hbWljRGF0YVNvdXJjZSxcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItdHlwZS1jb25maWc+XG4gICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgIDxsYWJlbCBodG1sRm9yPVwic2VsZWN0LW1vZGVcIj5EYXRhIHNvdXJjZTwvbGFiZWw+XG4gICAgICAgIDxzZWxlY3RcbiAgICAgICAgICBpZD1cInNlbGVjdC1tb2RlXCJcbiAgICAgICAgICB2YWx1ZT17Y29uZmlnLm1vZGV9XG4gICAgICAgICAgb25DaGFuZ2U9e2UgPT4gb25DaGFuZ2UoeyAuLi5jb25maWcsIG1vZGU6IGUudGFyZ2V0LnZhbHVlIGFzICdzdGF0aWMnIHwgJ2R5bmFtaWMnIH0pfVxuICAgICAgICA+XG4gICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInN0YXRpY1wiPlN0YXRpYyBvcHRpb25zPC9vcHRpb24+XG4gICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImR5bmFtaWNcIj5EeW5hbWljIChBUEktYmFja2VkKTwvb3B0aW9uPlxuICAgICAgICA8L3NlbGVjdD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7Y29uZmlnLm1vZGUgPT09ICdzdGF0aWMnICYmIChcbiAgICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLXNlY3Rpb24+XG4gICAgICAgICAgPGg0Pk9wdGlvbnM8L2g0PlxuICAgICAgICAgIHsoY29uZmlnLm9wdGlvbnMgPz8gW10pLm1hcCgob3B0LCBpKSA9PiAoXG4gICAgICAgICAgICA8ZGl2IGtleT17aX0gc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBnYXA6ICcwLjVyZW0nIH19PlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e29wdC5sYWJlbH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkID0gWy4uLihjb25maWcub3B0aW9ucyA/PyBbXSldXG4gICAgICAgICAgICAgICAgICB1cGRhdGVkW2ldID0geyAuLi5vcHQsIGxhYmVsOiBlLnRhcmdldC52YWx1ZSB9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZSh7IC4uLmNvbmZpZywgb3B0aW9uczogdXBkYXRlZCB9KVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJMYWJlbFwiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIk9wdGlvbiBsYWJlbFwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17b3B0LnZhbHVlfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBbLi4uKGNvbmZpZy5vcHRpb25zID8/IFtdKV1cbiAgICAgICAgICAgICAgICAgIHVwZGF0ZWRbaV0gPSB7IC4uLm9wdCwgdmFsdWU6IGUudGFyZ2V0LnZhbHVlIH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlKHsgLi4uY29uZmlnLCBvcHRpb25zOiB1cGRhdGVkIH0pXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlZhbHVlXCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiT3B0aW9uIHZhbHVlXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWQgPSAoY29uZmlnLm9wdGlvbnMgPz8gW10pLmZpbHRlcigoXywgaikgPT4gaiAhPT0gaSlcbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlKHsgLi4uY29uZmlnLCBvcHRpb25zOiB1cGRhdGVkIH0pXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiUmVtb3ZlIG9wdGlvblwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICDDl1xuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICkpfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgLi4uY29uZmlnLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IFsuLi4oY29uZmlnLm9wdGlvbnMgPz8gW10pLCB7IGxhYmVsOiAnJywgdmFsdWU6ICcnIH1dLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICArIEFkZCBvcHRpb25cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7Y29uZmlnLm1vZGUgPT09ICdkeW5hbWljJyAmJiBkYXRhU291cmNlICYmIChcbiAgICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLXNlY3Rpb24+XG4gICAgICAgICAgPGg0PkR5bmFtaWMgRGF0YSBTb3VyY2U8L2g0PlxuXG4gICAgICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJkcy1yZXNvdXJjZVwiPlJlc291cmNlIG5hbWU8L2xhYmVsPlxuICAgICAgICAgICAgPHNtYWxsPkludGVybmFsIGlkZW50aWZpZXIgZm9yIHRoZSBBUEkgcmVzb3VyY2U8L3NtYWxsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwiZHMtcmVzb3VyY2VcIlxuICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXtkYXRhU291cmNlLmVuZHBvaW50fVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB1cGRhdGVEYXRhU291cmNlKHsgZW5kcG9pbnQ6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIi9hcGkvZmllbGRzLzppZC9vcHRpb25zXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImRzLWxhYmVsLWtleVwiPkRpc3BsYXkgZmllbGQ8L2xhYmVsPlxuICAgICAgICAgICAgPHNtYWxsPkFQSSByZXNwb25zZSBmaWVsZCB0byBzaG93IGFzIGxhYmVsICh1c2UgKyB0byBjb21iaW5lLCBlLmcuLCBcImZpcnN0TmFtZSArIGxhc3ROYW1lXCIpPC9zbWFsbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cImRzLWxhYmVsLWtleVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e2RhdGFTb3VyY2UubGFiZWxLZXl9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHVwZGF0ZURhdGFTb3VyY2UoeyBsYWJlbEtleTogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwibmFtZVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJkcy12YWx1ZS1rZXlcIj5JRCBmaWVsZDwvbGFiZWw+XG4gICAgICAgICAgICA8c21hbGw+QVBJIHJlc3BvbnNlIGZpZWxkIHRvIHVzZSBhcyB2YWx1ZTwvc21hbGw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJkcy12YWx1ZS1rZXlcIlxuICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXtkYXRhU291cmNlLnZhbHVlS2V5fVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB1cGRhdGVEYXRhU291cmNlKHsgdmFsdWVLZXk6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImlkXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImRzLXBhZ2Utc2l6ZVwiPlBhZ2Ugc2l6ZTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJkcy1wYWdlLXNpemVcIlxuICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgdmFsdWU9e2RhdGFTb3VyY2UucGFnZVNpemV9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHVwZGF0ZURhdGFTb3VyY2UoeyBwYWdlU2l6ZTogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSB8fCAyMCB9KX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImRzLWRlcGVuZHMtb25cIj5EZXBlbmRzIG9uIGZpZWxkPC9sYWJlbD5cbiAgICAgICAgICAgIDxzbWFsbD5GaWVsZCBrZXkgZm9yIGNhc2NhZGluZyBkcm9wZG93biAocGFyZW50IGZpZWxkKTwvc21hbGw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJkcy1kZXBlbmRzLW9uXCJcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICB2YWx1ZT17ZGF0YVNvdXJjZS5kZXBlbmRzT25GaWVsZCA/PyAnJ31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdXBkYXRlRGF0YVNvdXJjZSh7IGRlcGVuZHNPbkZpZWxkOiBlLnRhcmdldC52YWx1ZSB8fCB1bmRlZmluZWQgfSl9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiY291bnRyeUlkXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImRzLWRlcGVuZHMtcGFyYW1cIj5EZXBlbmRlbmN5IHBhcmFtZXRlcjwvbGFiZWw+XG4gICAgICAgICAgICA8c21hbGw+UXVlcnkgcGFyYW1ldGVyIG5hbWUgc2VudCB0byB0aGUgQVBJPC9zbWFsbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cImRzLWRlcGVuZHMtcGFyYW1cIlxuICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXtkYXRhU291cmNlLmRlcGVuZHNPblBhcmFtID8/ICcnfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB1cGRhdGVEYXRhU291cmNlKHsgZGVwZW5kc09uUGFyYW06IGUudGFyZ2V0LnZhbHVlIHx8IHVuZGVmaW5lZCB9KX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJjb3VudHJ5SWRcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICA8bGFiZWwgZGF0YS1kZmUtYnVpbGRlci1jaGVja2JveD5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICBjaGVja2VkPXtjb25maWcuYWxsb3dPdGhlciA/PyBmYWxzZX1cbiAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBvbkNoYW5nZSh7IC4uLmNvbmZpZywgYWxsb3dPdGhlcjogZS50YXJnZXQuY2hlY2tlZCB9KX1cbiAgICAgICAgLz5cbiAgICAgICAgQWxsb3cgXCJPdGhlclwiIG9wdGlvblxuICAgICAgPC9sYWJlbD5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG4vLyDilIDilIDilIAgRmlsZSBVcGxvYWQgQ29uZmlnIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5pbnRlcmZhY2UgRmlsZVVwbG9hZENvbmZpZ1BhbmVsUHJvcHMge1xuICBjb25maWc6IEZpbGVVcGxvYWRDb25maWdcbiAgb25DaGFuZ2U6IChjb25maWc6IEZpbGVVcGxvYWRDb25maWcpID0+IHZvaWRcbn1cblxuZnVuY3Rpb24gRmlsZVVwbG9hZENvbmZpZ1BhbmVsKHsgY29uZmlnLCBvbkNoYW5nZSB9OiBGaWxlVXBsb2FkQ29uZmlnUGFuZWxQcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci10eXBlLWNvbmZpZz5cbiAgICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci1maWVsZD5cbiAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmaWxlLW1heC1zaXplXCI+TWF4IHNpemUgKE1CKTwvbGFiZWw+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIGlkPVwiZmlsZS1tYXgtc2l6ZVwiXG4gICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgdmFsdWU9e2NvbmZpZy5tYXhTaXplTUIgPz8gJyd9XG4gICAgICAgICAgb25DaGFuZ2U9e2UgPT4gb25DaGFuZ2UoeyAuLi5jb25maWcsIG1heFNpemVNQjogZS50YXJnZXQudmFsdWUgPyBOdW1iZXIoZS50YXJnZXQudmFsdWUpIDogdW5kZWZpbmVkIH0pfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgIDxsYWJlbCBodG1sRm9yPVwiZmlsZS1tYXgtZmlsZXNcIj5NYXggZmlsZXM8L2xhYmVsPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICBpZD1cImZpbGUtbWF4LWZpbGVzXCJcbiAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICB2YWx1ZT17Y29uZmlnLm1heEZpbGVzID8/ICcnfVxuICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IG9uQ2hhbmdlKHsgLi4uY29uZmlnLCBtYXhGaWxlczogZS50YXJnZXQudmFsdWUgPyBOdW1iZXIoZS50YXJnZXQudmFsdWUpIDogdW5kZWZpbmVkIH0pfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgIDxsYWJlbCBodG1sRm9yPVwiZmlsZS10eXBlc1wiPkFsbG93ZWQgTUlNRSB0eXBlczwvbGFiZWw+XG4gICAgICAgIDxzbWFsbD5Db21tYS1zZXBhcmF0ZWQsIGUuZy4sIGltYWdlL3BuZywgYXBwbGljYXRpb24vcGRmPC9zbWFsbD5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgaWQ9XCJmaWxlLXR5cGVzXCJcbiAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgdmFsdWU9eyhjb25maWcuYWxsb3dlZE1pbWVUeXBlcyA/PyBbXSkuam9pbignLCAnKX1cbiAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBvbkNoYW5nZSh7XG4gICAgICAgICAgICAuLi5jb25maWcsXG4gICAgICAgICAgICBhbGxvd2VkTWltZVR5cGVzOiBlLnRhcmdldC52YWx1ZSA/IGUudGFyZ2V0LnZhbHVlLnNwbGl0KCcsJykubWFwKHMgPT4gcy50cmltKCkpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH0pfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuLy8g4pSA4pSA4pSAIE1haW4gQ29tcG9uZW50IOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIEJ1aWxkZXIgcGFuZWwgZm9yIGNvbmZpZ3VyaW5nIGEgc2luZ2xlIGZvcm0gZmllbGQuXG4gKlxuICogUmVuZGVycyBhIFwiQmFzaWNzXCIgc2VjdGlvbiAobGFiZWwsIGtleSwgdHlwZSwgcmVxdWlyZWQpIGFuZCBhXG4gKiB0eXBlLXNwZWNpZmljIGNvbmZpZ3VyYXRpb24gcGFuZWwuXG4gKlxuICogKipJbnRlbnRpb25hbGx5IG9taXRzIGZpZWxkLWxldmVsIFwiTW9kZWwgQmluZGluZ1wiKiog4oCUIHRoZSBzdGVwLWxldmVsXG4gKiBTdGVwQ29uZmlnUGFuZWwncyBcIlJlcXVlc3QgQm9keSBNYXBwaW5nXCIgaXMgdGhlIHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGhcbiAqIGZvciBtYXBwaW5nIGZpZWxkIHZhbHVlcyB0byBBUEkgcmVxdWVzdCBib2RpZXMuXG4gKlxuICogRm9yIFNFTEVDVCBmaWVsZHMsIHVzZXMgQVBJLWNlbnRyaWMgbGFiZWxzOlxuICogLSBcIlJlc291cmNlIG5hbWVcIiAobm90IFwiTW9kZWwgbmFtZVwiKVxuICogLSBcIkRpc3BsYXkgZmllbGRcIiAobm90IFwiTGFiZWwga2V5XCIpXG4gKiAtIFwiSUQgZmllbGRcIiAobm90IFwiVmFsdWUga2V5XCIpXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzeFxuICogPENvbmZpZ1BhbmVsXG4gKiAgIGZpZWxkPXtzZWxlY3RlZEZpZWxkfVxuICogICBvbkNoYW5nZT17KHVwZGF0ZXMpID0+IHVwZGF0ZUZpZWxkKHNlbGVjdGVkRmllbGQuaWQsIHVwZGF0ZXMpfVxuICogLz5cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gQ29uZmlnUGFuZWwoeyBmaWVsZCwgb25DaGFuZ2UsIGFsbG93ZWRUeXBlcywgY2xhc3NOYW1lIH06IENvbmZpZ1BhbmVsUHJvcHMpIHtcbiAgY29uc3QgdHlwZXMgPSBhbGxvd2VkVHlwZXNcbiAgICA/IEFMTF9GSUVMRF9UWVBFUy5maWx0ZXIodCA9PiBhbGxvd2VkVHlwZXMuaW5jbHVkZXModC52YWx1ZSkpXG4gICAgOiBBTExfRklFTERfVFlQRVNcblxuICBjb25zdCB1cGRhdGVDb25maWcgPSB1c2VDYWxsYmFjaygoY29uZmlnOiBGaWVsZENvbmZpZykgPT4ge1xuICAgIG9uQ2hhbmdlKHsgY29uZmlnIH0pXG4gIH0sIFtvbkNoYW5nZV0pXG5cbiAgY29uc3QgcmVuZGVyVHlwZUNvbmZpZyA9ICgpID0+IHtcbiAgICBzd2l0Y2ggKGZpZWxkLnR5cGUpIHtcbiAgICAgIGNhc2UgJ1NIT1JUX1RFWFQnOlxuICAgICAgY2FzZSAnTE9OR19URVhUJzpcbiAgICAgIGNhc2UgJ0VNQUlMJzpcbiAgICAgIGNhc2UgJ1BIT05FJzpcbiAgICAgIGNhc2UgJ1VSTCc6XG4gICAgICBjYXNlICdQQVNTV09SRCc6XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPFRleHRDb25maWdQYW5lbFxuICAgICAgICAgICAgY29uZmlnPXtmaWVsZC5jb25maWcgYXMgVGV4dEZpZWxkQ29uZmlnfVxuICAgICAgICAgICAgb25DaGFuZ2U9e3VwZGF0ZUNvbmZpZ31cbiAgICAgICAgICAvPlxuICAgICAgICApXG5cbiAgICAgIGNhc2UgJ05VTUJFUic6XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPE51bWJlckNvbmZpZ1BhbmVsXG4gICAgICAgICAgICBjb25maWc9e2ZpZWxkLmNvbmZpZyBhcyBOdW1iZXJGaWVsZENvbmZpZ31cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt1cGRhdGVDb25maWd9XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuXG4gICAgICBjYXNlICdTRUxFQ1QnOlxuICAgICAgY2FzZSAnTVVMVElfU0VMRUNUJzpcbiAgICAgIGNhc2UgJ1JBRElPJzpcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8U2VsZWN0Q29uZmlnUGFuZWxcbiAgICAgICAgICAgIGNvbmZpZz17KGZpZWxkLmNvbmZpZyBhcyBTZWxlY3RGaWVsZENvbmZpZykgPz8geyBtb2RlOiAnc3RhdGljJywgb3B0aW9uczogW10gfX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt1cGRhdGVDb25maWd9XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuXG4gICAgICBjYXNlICdGSUxFX1VQTE9BRCc6XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPEZpbGVVcGxvYWRDb25maWdQYW5lbFxuICAgICAgICAgICAgY29uZmlnPXtmaWVsZC5jb25maWcgYXMgRmlsZVVwbG9hZENvbmZpZ31cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt1cGRhdGVDb25maWd9XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuXG4gICAgICBjYXNlICdSQVRJTkcnOlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci10eXBlLWNvbmZpZz5cbiAgICAgICAgICAgIDxkaXYgZGF0YS1kZmUtYnVpbGRlci1maWVsZD5cbiAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJyYXRpbmctbWF4XCI+TWF4IHJhdGluZzwvbGFiZWw+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwicmF0aW5nLW1heFwiXG4gICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgdmFsdWU9eyhmaWVsZC5jb25maWcgYXMgUmF0aW5nQ29uZmlnKS5tYXggPz8gNX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB1cGRhdGVDb25maWcoeyAuLi5maWVsZC5jb25maWcsIG1heDogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSB8fCA1IH0gYXMgUmF0aW5nQ29uZmlnKX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG5cbiAgICAgIGNhc2UgJ1NDQUxFJzpcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItdHlwZS1jb25maWc+XG4gICAgICAgICAgICA8ZGl2IGRhdGEtZGZlLWJ1aWxkZXItZmllbGQ+XG4gICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwic2NhbGUtbWluXCI+TWluPC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgaWQ9XCJzY2FsZS1taW5cIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXsoZmllbGQuY29uZmlnIGFzIFNjYWxlQ29uZmlnKS5taW4gPz8gMX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB1cGRhdGVDb25maWcoeyAuLi5maWVsZC5jb25maWcsIG1pbjogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSB9IGFzIFNjYWxlQ29uZmlnKX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBkYXRhLWRmZS1idWlsZGVyLWZpZWxkPlxuICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cInNjYWxlLW1heFwiPk1heDwvbGFiZWw+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIGlkPVwic2NhbGUtbWF4XCJcbiAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17KGZpZWxkLmNvbmZpZyBhcyBTY2FsZUNvbmZpZykubWF4ID8/IDEwfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHVwZGF0ZUNvbmZpZyh7IC4uLmZpZWxkLmNvbmZpZywgbWF4OiBOdW1iZXIoZS50YXJnZXQudmFsdWUpIH0gYXMgU2NhbGVDb25maWcpfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc05hbWV9IGRhdGEtZGZlLWJ1aWxkZXItY29uZmlnLXBhbmVsPlxuICAgICAgPEJhc2ljc1BhbmVsIGZpZWxkPXtmaWVsZH0gb25DaGFuZ2U9e29uQ2hhbmdlfSBhbGxvd2VkVHlwZXM9e3R5cGVzfSAvPlxuICAgICAge3JlbmRlclR5cGVDb25maWcoKX1cbiAgICA8L2Rpdj5cbiAgKVxufVxuIl19