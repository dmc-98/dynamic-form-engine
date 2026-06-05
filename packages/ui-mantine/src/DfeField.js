"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MantineFieldRenderer = MantineFieldRenderer;
const react_1 = __importDefault(require("react"));
/**
 * Styled field renderer using Mantine components.
 * Renders all 24 field types with Mantine's design system.
 */
function MantineFieldRenderer({ field, value, onChange, error, }) {
    const id = `dfe-field-${field.key}`;
    const renderInput = () => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
        switch (field.type) {
            case 'SHORT_TEXT':
            case 'EMAIL':
            case 'PHONE':
            case 'URL':
            case 'PASSWORD': {
                const inputType = field.type === 'EMAIL'
                    ? 'email'
                    : field.type === 'PHONE'
                        ? 'tel'
                        : field.type === 'URL'
                            ? 'url'
                            : field.type === 'PASSWORD'
                                ? 'password'
                                : 'text';
                return (<input id={id} type={inputType} value={(_a = value) !== null && _a !== void 0 ? _a : ''} onChange={(e) => onChange(e.target.value)} placeholder={(_b = field.config) === null || _b === void 0 ? void 0 : _b.placeholder} required={field.required} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        padding: '8px 12px',
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }} onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1971c2';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 113, 194, 0.1)';
                    }} onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? '#f76707' : '#ced4da';
                        e.currentTarget.style.boxShadow = 'none';
                    }}/>);
            }
            case 'LONG_TEXT': {
                return (<textarea id={id} value={(_c = value) !== null && _c !== void 0 ? _c : ''} onChange={(e) => onChange(e.target.value)} placeholder={(_d = field.config) === null || _d === void 0 ? void 0 : _d.placeholder} required={field.required} rows={4} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        padding: '8px 12px',
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                        resize: 'vertical',
                    }} onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1971c2';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 113, 194, 0.1)';
                    }} onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? '#f76707' : '#ced4da';
                        e.currentTarget.style.boxShadow = 'none';
                    }}/>);
            }
            case 'NUMBER': {
                const config = field.config;
                return (<div style={{ position: 'relative' }}>
            {(config === null || config === void 0 ? void 0 : config.prefix) && (<span style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#868e96',
                            fontSize: '14px',
                        }}>
                {config.prefix}
              </span>)}
            <input id={id} type="number" value={value !== undefined && value !== null ? String(value) : ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)} min={config === null || config === void 0 ? void 0 : config.min} max={config === null || config === void 0 ? void 0 : config.max} step={config === null || config === void 0 ? void 0 : config.step} placeholder={(_e = field.config) === null || _e === void 0 ? void 0 : _e.placeholder} required={field.required} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        padding: `8px ${(config === null || config === void 0 ? void 0 : config.suffix) ? '32px' : '12px'} 8px ${(config === null || config === void 0 ? void 0 : config.prefix) ? '32px' : '12px'}`,
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                        width: '100%',
                        boxSizing: 'border-box',
                    }} onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1971c2';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 113, 194, 0.1)';
                    }} onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? '#f76707' : '#ced4da';
                        e.currentTarget.style.boxShadow = 'none';
                    }}/>
            {(config === null || config === void 0 ? void 0 : config.suffix) && (<span style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#868e96',
                            fontSize: '14px',
                        }}>
                {config.suffix}
              </span>)}
          </div>);
            }
            case 'DATE':
            case 'TIME':
            case 'DATE_TIME': {
                const inputType = field.type === 'DATE'
                    ? 'date'
                    : field.type === 'TIME'
                        ? 'time'
                        : 'datetime-local';
                return (<input id={id} type={inputType} value={(_f = value) !== null && _f !== void 0 ? _f : ''} onChange={(e) => onChange(e.target.value)} required={field.required} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        padding: '8px 12px',
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}/>);
            }
            case 'DATE_RANGE': {
                const range = (_g = value) !== null && _g !== void 0 ? _g : {};
                return (<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input id={`${id}-from`} type="date" value={(_h = range.from) !== null && _h !== void 0 ? _h : ''} onChange={(e) => onChange({
                        ...range,
                        from: e.target.value || undefined,
                    })} placeholder="From" aria-label="Start date" aria-invalid={!!error} style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}/>
            <span style={{ color: '#868e96' }}>→</span>
            <input id={`${id}-to`} type="date" value={(_j = range.to) !== null && _j !== void 0 ? _j : ''} onChange={(e) => onChange({
                        ...range,
                        to: e.target.value || undefined,
                    })} placeholder="To" aria-label="End date" aria-invalid={!!error} style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}/>
          </div>);
            }
            case 'SELECT':
            case 'RADIO': {
                const options = (_l = (_k = field.config) === null || _k === void 0 ? void 0 : _k.options) !== null && _l !== void 0 ? _l : [];
                return (<select id={id} value={(_m = value) !== null && _m !== void 0 ? _m : ''} onChange={(e) => onChange(e.target.value || undefined)} required={field.required} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        padding: '8px 12px',
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23495057' d='M2 4l4 4 4-4z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        paddingRight: '32px',
                    }}>
            <option value="">Select an option...</option>
            {options.map((opt) => (<option key={opt.value} value={opt.value}>
                {opt.label}
              </option>))}
          </select>);
            }
            case 'MULTI_SELECT': {
                const options = (_p = (_o = field.config) === null || _o === void 0 ? void 0 : _o.options) !== null && _p !== void 0 ? _p : [];
                const selected = Array.isArray(value) ? value : [];
                return (<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {options.map((opt) => (<label key={opt.value} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}>
                <input type="checkbox" checked={selected.includes(opt.value)} onChange={(e) => {
                            const newSelected = e.target.checked
                                ? [...selected, opt.value]
                                : selected.filter((v) => v !== opt.value);
                            onChange(newSelected);
                        }} style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                        }}/>
                <span style={{ fontSize: '14px' }}>{opt.label}</span>
              </label>))}
          </div>);
            }
            case 'CHECKBOX': {
                return (<label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                    }}>
            <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                    }}/>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {field.label}
            </span>
            {field.required && (<span style={{ color: '#f76707', marginLeft: '4px' }}>*</span>)}
          </label>);
            }
            case 'RATING': {
                const config = field.config;
                const max = (_q = config === null || config === void 0 ? void 0 : config.max) !== null && _q !== void 0 ? _q : 5;
                const rating = (_r = value) !== null && _r !== void 0 ? _r : 0;
                return (<div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: max }).map((_, i) => (<button key={i} type="button" onClick={() => onChange(i + 1)} aria-label={`Rate ${i + 1} out of ${max}`} aria-pressed={rating === i + 1} style={{
                            fontSize: '24px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: rating >= i + 1 ? '#fcc419' : '#ccc',
                            transition: 'color 150ms ease',
                        }} onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#fcc419';
                        }} onMouseLeave={(e) => {
                            e.currentTarget.style.color = rating >= i + 1 ? '#fcc419' : '#ccc';
                        }}>
                ★
              </button>))}
          </div>);
            }
            case 'SCALE': {
                const config = field.config;
                const min = (_s = config === null || config === void 0 ? void 0 : config.min) !== null && _s !== void 0 ? _s : 0;
                const max = (_t = config === null || config === void 0 ? void 0 : config.max) !== null && _t !== void 0 ? _t : 10;
                return (<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input id={id} type="range" min={min} max={max} value={value !== null && value !== void 0 ? value : min} onChange={(e) => onChange(Number(e.target.value))} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{ width: '100%' }}/>
            <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#868e96',
                    }}>
              <span>{(config === null || config === void 0 ? void 0 : config.minLabel) || min}</span>
              <span style={{ fontWeight: 600, color: '#333' }}>
                {value !== null && value !== void 0 ? value : min}
              </span>
              <span>{(config === null || config === void 0 ? void 0 : config.maxLabel) || max}</span>
            </div>
          </div>);
            }
            case 'FILE_UPLOAD': {
                const config = field.config;
                const files = Array.isArray(value) ? value : value ? [value] : [];
                return (<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input id={id} type="file" multiple={(config === null || config === void 0 ? void 0 : config.maxFiles) !== 1} accept={(_u = config === null || config === void 0 ? void 0 : config.allowedMimeTypes) === null || _u === void 0 ? void 0 : _u.join(',')} onChange={(e) => {
                        var _a;
                        const newFiles = Array.from((_a = e.target.files) !== null && _a !== void 0 ? _a : []).map((f) => ({
                            name: f.name,
                            size: f.size,
                            type: f.type,
                        }));
                        onChange(newFiles);
                    }} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        padding: '8px 12px',
                        border: '2px dashed #ced4da',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}/>
            {files.length > 0 && (<ul style={{ fontSize: '12px', color: '#868e96', margin: 0, padding: 0 }}>
                {files.map((f, idx) => (<li key={idx} style={{ listStyle: 'none' }}>
                    {f.name}
                  </li>))}
              </ul>)}
          </div>);
            }
            case 'RICH_TEXT': {
                return (<textarea id={id} value={(_v = value) !== null && _v !== void 0 ? _v : ''} onChange={(e) => onChange(e.target.value)} placeholder={(_w = field.config) === null || _w === void 0 ? void 0 : _w.placeholder} required={field.required} rows={6} aria-invalid={!!error} aria-describedby={field.description ? `${id}-desc` : undefined} style={{
                        padding: '8px 12px',
                        border: error ? '1px solid #f76707' : '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                        resize: 'vertical',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}/>);
            }
            case 'SIGNATURE': {
                const config = field.config;
                const width = (_x = config === null || config === void 0 ? void 0 : config.canvasWidth) !== null && _x !== void 0 ? _x : 400;
                const height = (_y = config === null || config === void 0 ? void 0 : config.canvasHeight) !== null && _y !== void 0 ? _y : 100;
                return (<div style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}>
            <canvas id={id} width={width} height={height} style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        background: (_z = config === null || config === void 0 ? void 0 : config.backgroundColor) !== null && _z !== void 0 ? _z : 'white',
                        display: 'block',
                        width: '100%',
                        maxWidth: '100%',
                    }}/>
            <button type="button" onClick={() => {
                        const canvas = document.getElementById(id);
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                onChange(null);
                            }
                        }
                    }} style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#868e96',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                    }}>
              Clear
            </button>
          </div>);
            }
            case 'ADDRESS': {
                const addr = (_0 = value) !== null && _0 !== void 0 ? _0 : {};
                return (<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input type="text" placeholder="Street" value={(_1 = addr.street) !== null && _1 !== void 0 ? _1 : ''} onChange={(e) => onChange({
                        ...addr,
                        street: e.target.value,
                    })} style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}/>
            <input type="text" placeholder="City" value={(_2 = addr.city) !== null && _2 !== void 0 ? _2 : ''} onChange={(e) => onChange({
                        ...addr,
                        city: e.target.value,
                    })} style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}/>
            <input type="text" placeholder="State" value={(_3 = addr.state) !== null && _3 !== void 0 ? _3 : ''} onChange={(e) => onChange({
                        ...addr,
                        state: e.target.value,
                    })} style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}/>
            <input type="text" placeholder="ZIP" value={(_4 = addr.zip) !== null && _4 !== void 0 ? _4 : ''} onChange={(e) => onChange({
                        ...addr,
                        zip: e.target.value,
                    })} style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}/>
            <input type="text" placeholder="Country" value={(_5 = addr.country) !== null && _5 !== void 0 ? _5 : ''} onChange={(e) => onChange({
                        ...addr,
                        country: e.target.value,
                    })} style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}/>
          </div>);
            }
            case 'SECTION_BREAK':
                return <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ced4da' }}/>;
            case 'FIELD_GROUP':
            case 'HIDDEN':
            default:
                return null;
        }
    };
    if (field.type === 'SECTION_BREAK') {
        return (<div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          {field.label}
        </h3>
        {field.description && (<p style={{ fontSize: '14px', color: '#868e96', margin: 0 }}>
            {field.description}
          </p>)}
      </div>);
    }
    if (field.type === 'FIELD_GROUP' || field.type === 'HIDDEN') {
        return <></>;
    }
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {field.type !== 'CHECKBOX' && (<label htmlFor={id} style={{ fontSize: '14px', fontWeight: 500 }}>
          {field.label}
          {field.required && (<span style={{ color: '#f76707', marginLeft: '4px' }}>*</span>)}
        </label>)}

      {field.description && field.type !== 'CHECKBOX' && (<p id={`${id}-desc`} style={{
                fontSize: '12px',
                color: '#868e96',
                margin: 0,
            }}>
          {field.description}
        </p>)}

      {renderInput()}

      {error && (<p id={`${id}-error`} role="alert" style={{
                fontSize: '12px',
                color: '#f76707',
                fontWeight: 500,
                margin: 0,
            }}>
          {error}
        </p>)}
    </div>);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGZlRmllbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZmVGaWVsZC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFPQSxvREF1ckJDO0FBOXJCRCxrREFBeUI7QUFHekI7OztHQUdHO0FBQ0gsU0FBZ0Isb0JBQW9CLENBQUMsRUFDbkMsS0FBSyxFQUNMLEtBQUssRUFDTCxRQUFRLEVBQ1IsS0FBSyxHQUNjO0lBQ25CLE1BQU0sRUFBRSxHQUFHLGFBQWEsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBRW5DLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRTs7UUFDdkIsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkIsS0FBSyxZQUFZLENBQUM7WUFDbEIsS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLE9BQU8sQ0FBQztZQUNiLEtBQUssS0FBSyxDQUFDO1lBQ1gsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLFNBQVMsR0FDYixLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU87b0JBQ3BCLENBQUMsQ0FBQyxPQUFPO29CQUNULENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU87d0JBQ3RCLENBQUMsQ0FBQyxLQUFLO3dCQUNQLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUs7NEJBQ3BCLENBQUMsQ0FBQyxLQUFLOzRCQUNQLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLFVBQVU7Z0NBQ3pCLENBQUMsQ0FBQyxVQUFVO2dDQUNaLENBQUMsQ0FBQyxNQUFNLENBQUE7Z0JBRWxCLE9BQU8sQ0FDTCxDQUFDLEtBQUssQ0FDSixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDUCxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FDaEIsS0FBSyxDQUFDLENBQUMsTUFBQyxLQUFnQixtQ0FBSSxFQUFFLENBQUMsQ0FDL0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUs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Q0g7UUFBQSxFQUFFLEtBQUssQ0FBQyxDQUNULENBRUQ7O01BQUEsQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxJQUFJLENBQ2pELENBQUMsQ0FBQyxDQUNBLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FDakIsS0FBSyxDQUFDLENBQUM7Z0JBQ0wsUUFBUSxFQUFFLE1BQU07Z0JBQ2hCLEtBQUssRUFBRSxTQUFTO2dCQUNoQixNQUFNLEVBQUUsQ0FBQzthQUNWLENBQUMsQ0FFRjtVQUFBLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FDcEI7UUFBQSxFQUFFLENBQUMsQ0FBQyxDQUNMLENBRUQ7O01BQUEsQ0FBQyxXQUFXLEVBQUUsQ0FFZDs7TUFBQSxDQUFDLEtBQUssSUFBSSxDQUNSLENBQUMsQ0FBQyxDQUNBLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FDbEIsSUFBSSxDQUFDLE9BQU8sQ0FDWixLQUFLLENBQUMsQ0FBQztnQkFDTCxRQUFRLEVBQUUsTUFBTTtnQkFDaEIsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxHQUFHO2dCQUNmLE1BQU0sRUFBRSxDQUFDO2FBQ1YsQ0FBQyxDQUVGO1VBQUEsQ0FBQyxLQUFLLENBQ1I7UUFBQSxFQUFFLENBQUMsQ0FBQyxDQUNMLENBQ0g7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUE7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBGaWVsZFJlbmRlcmVyUHJvcHMgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1yZWFjdCdcblxuLyoqXG4gKiBTdHlsZWQgZmllbGQgcmVuZGVyZXIgdXNpbmcgTWFudGluZSBjb21wb25lbnRzLlxuICogUmVuZGVycyBhbGwgMjQgZmllbGQgdHlwZXMgd2l0aCBNYW50aW5lJ3MgZGVzaWduIHN5c3RlbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE1hbnRpbmVGaWVsZFJlbmRlcmVyKHtcbiAgZmllbGQsXG4gIHZhbHVlLFxuICBvbkNoYW5nZSxcbiAgZXJyb3IsXG59OiBGaWVsZFJlbmRlcmVyUHJvcHMpOiBSZWFjdC5SZWFjdEVsZW1lbnQge1xuICBjb25zdCBpZCA9IGBkZmUtZmllbGQtJHtmaWVsZC5rZXl9YFxuXG4gIGNvbnN0IHJlbmRlcklucHV0ID0gKCkgPT4ge1xuICAgIHN3aXRjaCAoZmllbGQudHlwZSkge1xuICAgICAgY2FzZSAnU0hPUlRfVEVYVCc6XG4gICAgICBjYXNlICdFTUFJTCc6XG4gICAgICBjYXNlICdQSE9ORSc6XG4gICAgICBjYXNlICdVUkwnOlxuICAgICAgY2FzZSAnUEFTU1dPUkQnOiB7XG4gICAgICAgIGNvbnN0IGlucHV0VHlwZSA9XG4gICAgICAgICAgZmllbGQudHlwZSA9PT0gJ0VNQUlMJ1xuICAgICAgICAgICAgPyAnZW1haWwnXG4gICAgICAgICAgICA6IGZpZWxkLnR5cGUgPT09ICdQSE9ORSdcbiAgICAgICAgICAgICAgPyAndGVsJ1xuICAgICAgICAgICAgICA6IGZpZWxkLnR5cGUgPT09ICdVUkwnXG4gICAgICAgICAgICAgICAgPyAndXJsJ1xuICAgICAgICAgICAgICAgIDogZmllbGQudHlwZSA9PT0gJ1BBU1NXT1JEJ1xuICAgICAgICAgICAgICAgICAgPyAncGFzc3dvcmQnXG4gICAgICAgICAgICAgICAgICA6ICd0ZXh0J1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICBpZD17aWR9XG4gICAgICAgICAgICB0eXBlPXtpbnB1dFR5cGV9XG4gICAgICAgICAgICB2YWx1ZT17KHZhbHVlIGFzIHN0cmluZykgPz8gJyd9XG4gICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPXsoZmllbGQuY29uZmlnIGFzIGFueSk/LnBsYWNlaG9sZGVyfVxuICAgICAgICAgICAgcmVxdWlyZWQ9e2ZpZWxkLnJlcXVpcmVkfVxuICAgICAgICAgICAgYXJpYS1pbnZhbGlkPXshIWVycm9yfVxuICAgICAgICAgICAgYXJpYS1kZXNjcmliZWRieT17ZmllbGQuZGVzY3JpcHRpb24gPyBgJHtpZH0tZGVzY2AgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBwYWRkaW5nOiAnOHB4IDEycHgnLFxuICAgICAgICAgICAgICBib3JkZXI6IGVycm9yID8gJzFweCBzb2xpZCAjZjc2NzA3JyA6ICcxcHggc29saWQgI2NlZDRkYScsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgIGZvbnRTaXplOiAnMTRweCcsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb246ICdib3JkZXItY29sb3IgMTUwbXMgZWFzZSwgYm94LXNoYWRvdyAxNTBtcyBlYXNlJyxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkZvY3VzPXsoZSkgPT4ge1xuICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAnIzE5NzFjMidcbiAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJveFNoYWRvdyA9ICcwIDAgMCAzcHggcmdiYSgyNSwgMTEzLCAxOTQsIDAuMSknXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25CbHVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYm9yZGVyQ29sb3IgPSBlcnJvciA/ICcjZjc2NzA3JyA6ICcjY2VkNGRhJ1xuICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYm94U2hhZG93ID0gJ25vbmUnXG4gICAgICAgICAgICB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY2FzZSAnTE9OR19URVhUJzoge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgaWQ9e2lkfVxuICAgICAgICAgICAgdmFsdWU9eyh2YWx1ZSBhcyBzdHJpbmcpID8/ICcnfVxuICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBvbkNoYW5nZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICBwbGFjZWhvbGRlcj17KGZpZWxkLmNvbmZpZyBhcyBhbnkpPy5wbGFjZWhvbGRlcn1cbiAgICAgICAgICAgIHJlcXVpcmVkPXtmaWVsZC5yZXF1aXJlZH1cbiAgICAgICAgICAgIHJvd3M9ezR9XG4gICAgICAgICAgICBhcmlhLWludmFsaWQ9eyEhZXJyb3J9XG4gICAgICAgICAgICBhcmlhLWRlc2NyaWJlZGJ5PXtmaWVsZC5kZXNjcmlwdGlvbiA/IGAke2lkfS1kZXNjYCA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIHBhZGRpbmc6ICc4cHggMTJweCcsXG4gICAgICAgICAgICAgIGJvcmRlcjogZXJyb3IgPyAnMXB4IHNvbGlkICNmNzY3MDcnIDogJzFweCBzb2xpZCAjY2VkNGRhJyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgZm9udEZhbWlseTogJ21vbm9zcGFjZScsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb246ICdib3JkZXItY29sb3IgMTUwbXMgZWFzZSwgYm94LXNoYWRvdyAxNTBtcyBlYXNlJyxcbiAgICAgICAgICAgICAgcmVzaXplOiAndmVydGljYWwnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uRm9jdXM9eyhlKSA9PiB7XG4gICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjMTk3MWMyJ1xuICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYm94U2hhZG93ID0gJzAgMCAwIDNweCByZ2JhKDI1LCAxMTMsIDE5NCwgMC4xKSdcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkJsdXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGVycm9yID8gJyNmNzY3MDcnIDogJyNjZWQ0ZGEnXG4gICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3hTaGFkb3cgPSAnbm9uZSdcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBjYXNlICdOVU1CRVInOiB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGZpZWxkLmNvbmZpZyBhcyBhbnlcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBvc2l0aW9uOiAncmVsYXRpdmUnIH19PlxuICAgICAgICAgICAge2NvbmZpZz8ucHJlZml4ICYmIChcbiAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICBsZWZ0OiAnMTJweCcsXG4gICAgICAgICAgICAgICAgICB0b3A6ICc1MCUnLFxuICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWSgtNTAlKScsXG4gICAgICAgICAgICAgICAgICBjb2xvcjogJyM4NjhlOTYnLFxuICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2NvbmZpZy5wcmVmaXh9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9e2lkfVxuICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwgPyBTdHJpbmcodmFsdWUpIDogJyd9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICBvbkNoYW5nZShlLnRhcmdldC52YWx1ZSA/IE51bWJlcihlLnRhcmdldC52YWx1ZSkgOiB1bmRlZmluZWQpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbWluPXtjb25maWc/Lm1pbn1cbiAgICAgICAgICAgICAgbWF4PXtjb25maWc/Lm1heH1cbiAgICAgICAgICAgICAgc3RlcD17Y29uZmlnPy5zdGVwfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17KGZpZWxkLmNvbmZpZyBhcyBhbnkpPy5wbGFjZWhvbGRlcn1cbiAgICAgICAgICAgICAgcmVxdWlyZWQ9e2ZpZWxkLnJlcXVpcmVkfVxuICAgICAgICAgICAgICBhcmlhLWludmFsaWQ9eyEhZXJyb3J9XG4gICAgICAgICAgICAgIGFyaWEtZGVzY3JpYmVkYnk9e2ZpZWxkLmRlc2NyaXB0aW9uID8gYCR7aWR9LWRlc2NgIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6IGA4cHggJHtjb25maWc/LnN1ZmZpeCA/ICczMnB4JyA6ICcxMnB4J30gOHB4ICR7Y29uZmlnPy5wcmVmaXggPyAnMzJweCcgOiAnMTJweCd9YCxcbiAgICAgICAgICAgICAgICBib3JkZXI6IGVycm9yID8gJzFweCBzb2xpZCAjZjc2NzA3JyA6ICcxcHggc29saWQgI2NlZDRkYScsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdib3JkZXItY29sb3IgMTUwbXMgZWFzZSwgYm94LXNoYWRvdyAxNTBtcyBlYXNlJyxcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBvbkZvY3VzPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9ICcjMTk3MWMyJ1xuICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5ib3hTaGFkb3cgPSAnMCAwIDAgM3B4IHJnYmEoMjUsIDExMywgMTk0LCAwLjEpJ1xuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBvbkJsdXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJvcmRlckNvbG9yID0gZXJyb3IgPyAnI2Y3NjcwNycgOiAnI2NlZDRkYSdcbiAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuc3R5bGUuYm94U2hhZG93ID0gJ25vbmUnXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAge2NvbmZpZz8uc3VmZml4ICYmIChcbiAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICByaWdodDogJzEycHgnLFxuICAgICAgICAgICAgICAgICAgdG9wOiAnNTAlJyxcbiAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVkoLTUwJSknLFxuICAgICAgICAgICAgICAgICAgY29sb3I6ICcjODY4ZTk2JyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTRweCcsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtjb25maWcuc3VmZml4fVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0RBVEUnOlxuICAgICAgY2FzZSAnVElNRSc6XG4gICAgICBjYXNlICdEQVRFX1RJTUUnOiB7XG4gICAgICAgIGNvbnN0IGlucHV0VHlwZSA9XG4gICAgICAgICAgZmllbGQudHlwZSA9PT0gJ0RBVEUnXG4gICAgICAgICAgICA/ICdkYXRlJ1xuICAgICAgICAgICAgOiBmaWVsZC50eXBlID09PSAnVElNRSdcbiAgICAgICAgICAgICAgPyAndGltZSdcbiAgICAgICAgICAgICAgOiAnZGF0ZXRpbWUtbG9jYWwnXG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgIGlkPXtpZH1cbiAgICAgICAgICAgIHR5cGU9e2lucHV0VHlwZX1cbiAgICAgICAgICAgIHZhbHVlPXsodmFsdWUgYXMgc3RyaW5nKSA/PyAnJ31cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gb25DaGFuZ2UoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgcmVxdWlyZWQ9e2ZpZWxkLnJlcXVpcmVkfVxuICAgICAgICAgICAgYXJpYS1pbnZhbGlkPXshIWVycm9yfVxuICAgICAgICAgICAgYXJpYS1kZXNjcmliZWRieT17ZmllbGQuZGVzY3JpcHRpb24gPyBgJHtpZH0tZGVzY2AgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBwYWRkaW5nOiAnOHB4IDEycHgnLFxuICAgICAgICAgICAgICBib3JkZXI6IGVycm9yID8gJzFweCBzb2xpZCAjZjc2NzA3JyA6ICcxcHggc29saWQgI2NlZDRkYScsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgIGZvbnRTaXplOiAnMTRweCcsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb246ICdib3JkZXItY29sb3IgMTUwbXMgZWFzZSwgYm94LXNoYWRvdyAxNTBtcyBlYXNlJyxcbiAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY2FzZSAnREFURV9SQU5HRSc6IHtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSAodmFsdWUgYXMgYW55KSA/PyB7fVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBnYXA6ICc4cHgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD17YCR7aWR9LWZyb21gfVxuICAgICAgICAgICAgICB0eXBlPVwiZGF0ZVwiXG4gICAgICAgICAgICAgIHZhbHVlPXtyYW5nZS5mcm9tID8/ICcnfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+XG4gICAgICAgICAgICAgICAgb25DaGFuZ2Uoe1xuICAgICAgICAgICAgICAgICAgLi4ucmFuZ2UsXG4gICAgICAgICAgICAgICAgICBmcm9tOiBlLnRhcmdldC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkZyb21cIlxuICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiU3RhcnQgZGF0ZVwiXG4gICAgICAgICAgICAgIGFyaWEtaW52YWxpZD17ISFlcnJvcn1cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc4cHggMTJweCcsXG4gICAgICAgICAgICAgICAgYm9yZGVyOiBlcnJvciA/ICcxcHggc29saWQgI2Y3NjcwNycgOiAnMXB4IHNvbGlkICNjZWQ0ZGEnLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBjb2xvcjogJyM4NjhlOTYnIH19PuKGkjwvc3Bhbj5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD17YCR7aWR9LXRvYH1cbiAgICAgICAgICAgICAgdHlwZT1cImRhdGVcIlxuICAgICAgICAgICAgICB2YWx1ZT17cmFuZ2UudG8gPz8gJyd9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAuLi5yYW5nZSxcbiAgICAgICAgICAgICAgICAgIHRvOiBlLnRhcmdldC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlRvXCJcbiAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkVuZCBkYXRlXCJcbiAgICAgICAgICAgICAgYXJpYS1pbnZhbGlkPXshIWVycm9yfVxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIGZsZXg6IDEsXG4gICAgICAgICAgICAgICAgcGFkZGluZzogJzhweCAxMnB4JyxcbiAgICAgICAgICAgICAgICBib3JkZXI6IGVycm9yID8gJzFweCBzb2xpZCAjZjc2NzA3JyA6ICcxcHggc29saWQgI2NlZDRkYScsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBjYXNlICdTRUxFQ1QnOlxuICAgICAgY2FzZSAnUkFESU8nOiB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSAoZmllbGQuY29uZmlnIGFzIGFueSk/Lm9wdGlvbnMgPz8gW11cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICBpZD17aWR9XG4gICAgICAgICAgICB2YWx1ZT17KHZhbHVlIGFzIHN0cmluZykgPz8gJyd9XG4gICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKGUudGFyZ2V0LnZhbHVlIHx8IHVuZGVmaW5lZCl9XG4gICAgICAgICAgICByZXF1aXJlZD17ZmllbGQucmVxdWlyZWR9XG4gICAgICAgICAgICBhcmlhLWludmFsaWQ9eyEhZXJyb3J9XG4gICAgICAgICAgICBhcmlhLWRlc2NyaWJlZGJ5PXtmaWVsZC5kZXNjcmlwdGlvbiA/IGAke2lkfS1kZXNjYCA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIHBhZGRpbmc6ICc4cHggMTJweCcsXG4gICAgICAgICAgICAgIGJvcmRlcjogZXJyb3IgPyAnMXB4IHNvbGlkICNmNzY3MDcnIDogJzFweCBzb2xpZCAjY2VkNGRhJyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2JvcmRlci1jb2xvciAxNTBtcyBlYXNlLCBib3gtc2hhZG93IDE1MG1zIGVhc2UnLFxuICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgICAgICAgICAgICAgYXBwZWFyYW5jZTogJ25vbmUnLFxuICAgICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IGB1cmwoXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgd2lkdGg9JzEyJyBoZWlnaHQ9JzEyJyB2aWV3Qm94PScwIDAgMTIgMTInJTNFJTNDcGF0aCBmaWxsPSclMjM0OTUwNTcnIGQ9J00yIDRsNCA0IDQtNHonLyUzRSUzQy9zdmclM0VcIilgLFxuICAgICAgICAgICAgICBiYWNrZ3JvdW5kUmVwZWF0OiAnbm8tcmVwZWF0JyxcbiAgICAgICAgICAgICAgYmFja2dyb3VuZFBvc2l0aW9uOiAncmlnaHQgOHB4IGNlbnRlcicsXG4gICAgICAgICAgICAgIHBhZGRpbmdSaWdodDogJzMycHgnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+U2VsZWN0IGFuIG9wdGlvbi4uLjwvb3B0aW9uPlxuICAgICAgICAgICAge29wdGlvbnMubWFwKChvcHQ6IGFueSkgPT4gKFxuICAgICAgICAgICAgICA8b3B0aW9uIGtleT17b3B0LnZhbHVlfSB2YWx1ZT17b3B0LnZhbHVlfT5cbiAgICAgICAgICAgICAgICB7b3B0LmxhYmVsfVxuICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ01VTFRJX1NFTEVDVCc6IHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IChmaWVsZC5jb25maWcgYXMgYW55KT8ub3B0aW9ucyA/PyBbXVxuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbXVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc4cHgnIH19PlxuICAgICAgICAgICAge29wdGlvbnMubWFwKChvcHQ6IGFueSkgPT4gKFxuICAgICAgICAgICAgICA8bGFiZWxcbiAgICAgICAgICAgICAgICBrZXk9e29wdC52YWx1ZX1cbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgICBnYXA6ICc4cHgnLFxuICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e3NlbGVjdGVkLmluY2x1ZGVzKG9wdC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3U2VsZWN0ZWQgPSBlLnRhcmdldC5jaGVja2VkXG4gICAgICAgICAgICAgICAgICAgICAgPyBbLi4uc2VsZWN0ZWQsIG9wdC52YWx1ZV1cbiAgICAgICAgICAgICAgICAgICAgICA6IHNlbGVjdGVkLmZpbHRlcigodikgPT4gdiAhPT0gb3B0LnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZShuZXdTZWxlY3RlZClcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzE2cHgnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxNnB4JyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6ICcxNHB4JyB9fT57b3B0LmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0NIRUNLQk9YJzoge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxsYWJlbFxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgZ2FwOiAnOHB4JyxcbiAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD17aWR9XG4gICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgIGNoZWNrZWQ9eyEhdmFsdWV9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gb25DaGFuZ2UoZS50YXJnZXQuY2hlY2tlZCl9XG4gICAgICAgICAgICAgIGFyaWEtaW52YWxpZD17ISFlcnJvcn1cbiAgICAgICAgICAgICAgYXJpYS1kZXNjcmliZWRieT17ZmllbGQuZGVzY3JpcHRpb24gPyBgJHtpZH0tZGVzY2AgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICcxNnB4JyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxNnB4JyxcbiAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzE0cHgnLCBmb250V2VpZ2h0OiA1MDAgfX0+XG4gICAgICAgICAgICAgIHtmaWVsZC5sYWJlbH1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIHtmaWVsZC5yZXF1aXJlZCAmJiAoXG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGNvbG9yOiAnI2Y3NjcwNycsIG1hcmdpbkxlZnQ6ICc0cHgnIH19Pio8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY2FzZSAnUkFUSU5HJzoge1xuICAgICAgICBjb25zdCBjb25maWcgPSBmaWVsZC5jb25maWcgYXMgYW55XG4gICAgICAgIGNvbnN0IG1heCA9IGNvbmZpZz8ubWF4ID8/IDVcbiAgICAgICAgY29uc3QgcmF0aW5nID0gKHZhbHVlIGFzIG51bWJlcikgPz8gMFxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGdhcDogJzRweCcgfX0+XG4gICAgICAgICAgICB7QXJyYXkuZnJvbSh7IGxlbmd0aDogbWF4IH0pLm1hcCgoXywgaSkgPT4gKFxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAga2V5PXtpfVxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ2hhbmdlKGkgKyAxKX1cbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPXtgUmF0ZSAke2kgKyAxfSBvdXQgb2YgJHttYXh9YH1cbiAgICAgICAgICAgICAgICBhcmlhLXByZXNzZWQ9e3JhdGluZyA9PT0gaSArIDF9XG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMjRweCcsXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgY29sb3I6IHJhdGluZyA+PSBpICsgMSA/ICcjZmNjNDE5JyA6ICcjY2NjJyxcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdjb2xvciAxNTBtcyBlYXNlJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5zdHlsZS5jb2xvciA9ICcjZmNjNDE5J1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmNvbG9yID0gcmF0aW5nID49IGkgKyAxID8gJyNmY2M0MTknIDogJyNjY2MnXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIOKYhVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NDQUxFJzoge1xuICAgICAgICBjb25zdCBjb25maWcgPSBmaWVsZC5jb25maWcgYXMgYW55XG4gICAgICAgIGNvbnN0IG1pbiA9IGNvbmZpZz8ubWluID8/IDBcbiAgICAgICAgY29uc3QgbWF4ID0gY29uZmlnPy5tYXggPz8gMTBcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnOHB4JyB9fT5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD17aWR9XG4gICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgICAgIG1pbj17bWlufVxuICAgICAgICAgICAgICBtYXg9e21heH1cbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlID8/IG1pbn1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBvbkNoYW5nZShOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgYXJpYS1pbnZhbGlkPXshIWVycm9yfVxuICAgICAgICAgICAgICBhcmlhLWRlc2NyaWJlZGJ5PXtmaWVsZC5kZXNjcmlwdGlvbiA/IGAke2lkfS1kZXNjYCA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6ICcxMDAlJyB9fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzg2OGU5NicsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxzcGFuPntjb25maWc/Lm1pbkxhYmVsIHx8IG1pbn08L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRXZWlnaHQ6IDYwMCwgY29sb3I6ICcjMzMzJyB9fT5cbiAgICAgICAgICAgICAgICB7dmFsdWUgPz8gbWlufVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPntjb25maWc/Lm1heExhYmVsIHx8IG1heH08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBjYXNlICdGSUxFX1VQTE9BRCc6IHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gZmllbGQuY29uZmlnIGFzIGFueVxuICAgICAgICBjb25zdCBmaWxlcyA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiB2YWx1ZSA/IFt2YWx1ZV0gOiBbXVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc4cHgnIH19PlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPXtpZH1cbiAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICBtdWx0aXBsZT17Y29uZmlnPy5tYXhGaWxlcyAhPT0gMX1cbiAgICAgICAgICAgICAgYWNjZXB0PXtjb25maWc/LmFsbG93ZWRNaW1lVHlwZXM/LmpvaW4oJywnKX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3RmlsZXMgPSBBcnJheS5mcm9tKGUudGFyZ2V0LmZpbGVzID8/IFtdKS5tYXAoKGYpID0+ICh7XG4gICAgICAgICAgICAgICAgICBuYW1lOiBmLm5hbWUsXG4gICAgICAgICAgICAgICAgICBzaXplOiBmLnNpemUsXG4gICAgICAgICAgICAgICAgICB0eXBlOiBmLnR5cGUsXG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgb25DaGFuZ2UobmV3RmlsZXMpXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGFyaWEtaW52YWxpZD17ISFlcnJvcn1cbiAgICAgICAgICAgICAgYXJpYS1kZXNjcmliZWRieT17ZmllbGQuZGVzY3JpcHRpb24gPyBgJHtpZH0tZGVzY2AgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogJzhweCAxMnB4JyxcbiAgICAgICAgICAgICAgICBib3JkZXI6ICcycHggZGFzaGVkICNjZWQ0ZGEnLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAge2ZpbGVzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8dWwgc3R5bGU9e3sgZm9udFNpemU6ICcxMnB4JywgY29sb3I6ICcjODY4ZTk2JywgbWFyZ2luOiAwLCBwYWRkaW5nOiAwIH19PlxuICAgICAgICAgICAgICAgIHtmaWxlcy5tYXAoKGY6IGFueSwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8bGkga2V5PXtpZHh9IHN0eWxlPXt7IGxpc3RTdHlsZTogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICB7Zi5uYW1lfVxuICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY2FzZSAnUklDSF9URVhUJzoge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgaWQ9e2lkfVxuICAgICAgICAgICAgdmFsdWU9eyh2YWx1ZSBhcyBzdHJpbmcpID8/ICcnfVxuICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBvbkNoYW5nZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICBwbGFjZWhvbGRlcj17KGZpZWxkLmNvbmZpZyBhcyBhbnkpPy5wbGFjZWhvbGRlcn1cbiAgICAgICAgICAgIHJlcXVpcmVkPXtmaWVsZC5yZXF1aXJlZH1cbiAgICAgICAgICAgIHJvd3M9ezZ9XG4gICAgICAgICAgICBhcmlhLWludmFsaWQ9eyEhZXJyb3J9XG4gICAgICAgICAgICBhcmlhLWRlc2NyaWJlZGJ5PXtmaWVsZC5kZXNjcmlwdGlvbiA/IGAke2lkfS1kZXNjYCA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIHBhZGRpbmc6ICc4cHggMTJweCcsXG4gICAgICAgICAgICAgIGJvcmRlcjogZXJyb3IgPyAnMXB4IHNvbGlkICNmNzY3MDcnIDogJzFweCBzb2xpZCAjY2VkNGRhJyxcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2JvcmRlci1jb2xvciAxNTBtcyBlYXNlLCBib3gtc2hhZG93IDE1MG1zIGVhc2UnLFxuICAgICAgICAgICAgICByZXNpemU6ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NJR05BVFVSRSc6IHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gZmllbGQuY29uZmlnIGFzIGFueVxuICAgICAgICBjb25zdCB3aWR0aCA9IGNvbmZpZz8uY2FudmFzV2lkdGggPz8gNDAwXG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGNvbmZpZz8uY2FudmFzSGVpZ2h0ID8/IDEwMFxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBwYWRkaW5nOiAnOHB4JywgYm9yZGVyOiAnMXB4IHNvbGlkICNjZWQ0ZGEnLCBib3JkZXJSYWRpdXM6ICc0cHgnIH19PlxuICAgICAgICAgICAgPGNhbnZhc1xuICAgICAgICAgICAgICBpZD17aWR9XG4gICAgICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICAgICAgaGVpZ2h0PXtoZWlnaHR9XG4gICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICNjY2MnLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogY29uZmlnPy5iYWNrZ3JvdW5kQ29sb3IgPz8gJ3doaXRlJyxcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgbWF4V2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpIGFzIEhUTUxDYW52YXNFbGVtZW50XG4gICAgICAgICAgICAgICAgaWYgKGNhbnZhcykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgICAgICAgICAgICAgICAgIGlmIChjdHgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlKG51bGwpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIG1hcmdpblRvcDogJzhweCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgICAgICAgICBjb2xvcjogJyM4NjhlOTYnLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdub25lJyxcbiAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgQ2xlYXJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0FERFJFU1MnOiB7XG4gICAgICAgIGNvbnN0IGFkZHIgPSAodmFsdWUgYXMgYW55KSA/PyB7fVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc4cHgnIH19PlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTdHJlZXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17YWRkci5zdHJlZXQgPz8gJyd9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAuLi5hZGRyLFxuICAgICAgICAgICAgICAgICAgc3RyZWV0OiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogJzhweCAxMnB4JyxcbiAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgI2NlZDRkYScsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiQ2l0eVwiXG4gICAgICAgICAgICAgIHZhbHVlPXthZGRyLmNpdHkgPz8gJyd9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAuLi5hZGRyLFxuICAgICAgICAgICAgICAgICAgY2l0eTogZS50YXJnZXQudmFsdWUsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc4cHggMTJweCcsXG4gICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICNjZWQ0ZGEnLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlN0YXRlXCJcbiAgICAgICAgICAgICAgdmFsdWU9e2FkZHIuc3RhdGUgPz8gJyd9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAuLi5hZGRyLFxuICAgICAgICAgICAgICAgICAgc3RhdGU6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnOHB4IDEycHgnLFxuICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjY2VkNGRhJyxcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTRweCcsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJaSVBcIlxuICAgICAgICAgICAgICB2YWx1ZT17YWRkci56aXAgPz8gJyd9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAuLi5hZGRyLFxuICAgICAgICAgICAgICAgICAgemlwOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogJzhweCAxMnB4JyxcbiAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgI2NlZDRkYScsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiQ291bnRyeVwiXG4gICAgICAgICAgICAgIHZhbHVlPXthZGRyLmNvdW50cnkgPz8gJyd9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAuLi5hZGRyLFxuICAgICAgICAgICAgICAgICAgY291bnRyeTogZS50YXJnZXQudmFsdWUsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc4cHggMTJweCcsXG4gICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICNjZWQ0ZGEnLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU0VDVElPTl9CUkVBSyc6XG4gICAgICAgIHJldHVybiA8aHIgc3R5bGU9e3sgbWFyZ2luOiAnMTZweCAwJywgYm9yZGVyOiAnbm9uZScsIGJvcmRlclRvcDogJzFweCBzb2xpZCAjY2VkNGRhJyB9fSAvPlxuXG4gICAgICBjYXNlICdGSUVMRF9HUk9VUCc6XG4gICAgICBjYXNlICdISURERU4nOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICBpZiAoZmllbGQudHlwZSA9PT0gJ1NFQ1RJT05fQlJFQUsnKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgc3R5bGU9e3sgbWFyZ2luQm90dG9tOiAnMjRweCcgfX0+XG4gICAgICAgIDxoMyBzdHlsZT17eyBmb250U2l6ZTogJzE4cHgnLCBmb250V2VpZ2h0OiA2MDAsIG1hcmdpbkJvdHRvbTogJzhweCcgfX0+XG4gICAgICAgICAge2ZpZWxkLmxhYmVsfVxuICAgICAgICA8L2gzPlxuICAgICAgICB7ZmllbGQuZGVzY3JpcHRpb24gJiYgKFxuICAgICAgICAgIDxwIHN0eWxlPXt7IGZvbnRTaXplOiAnMTRweCcsIGNvbG9yOiAnIzg2OGU5NicsIG1hcmdpbjogMCB9fT5cbiAgICAgICAgICAgIHtmaWVsZC5kZXNjcmlwdGlvbn1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cblxuICBpZiAoZmllbGQudHlwZSA9PT0gJ0ZJRUxEX0dST1VQJyB8fCBmaWVsZC50eXBlID09PSAnSElEREVOJykge1xuICAgIHJldHVybiA8PjwvPlxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzZweCcgfX0+XG4gICAgICB7ZmllbGQudHlwZSAhPT0gJ0NIRUNLQk9YJyAmJiAoXG4gICAgICAgIDxsYWJlbCBodG1sRm9yPXtpZH0gc3R5bGU9e3sgZm9udFNpemU6ICcxNHB4JywgZm9udFdlaWdodDogNTAwIH19PlxuICAgICAgICAgIHtmaWVsZC5sYWJlbH1cbiAgICAgICAgICB7ZmllbGQucmVxdWlyZWQgJiYgKFxuICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgY29sb3I6ICcjZjc2NzA3JywgbWFyZ2luTGVmdDogJzRweCcgfX0+Kjwvc3Bhbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2xhYmVsPlxuICAgICAgKX1cblxuICAgICAge2ZpZWxkLmRlc2NyaXB0aW9uICYmIGZpZWxkLnR5cGUgIT09ICdDSEVDS0JPWCcgJiYgKFxuICAgICAgICA8cFxuICAgICAgICAgIGlkPXtgJHtpZH0tZGVzY2B9XG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICBjb2xvcjogJyM4NjhlOTYnLFxuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICB7ZmllbGQuZGVzY3JpcHRpb259XG4gICAgICAgIDwvcD5cbiAgICAgICl9XG5cbiAgICAgIHtyZW5kZXJJbnB1dCgpfVxuXG4gICAgICB7ZXJyb3IgJiYgKFxuICAgICAgICA8cFxuICAgICAgICAgIGlkPXtgJHtpZH0tZXJyb3JgfVxuICAgICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICBjb2xvcjogJyNmNzY3MDcnLFxuICAgICAgICAgICAgZm9udFdlaWdodDogNTAwLFxuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICB7ZXJyb3J9XG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gIClcbn1cbiJdfQ==