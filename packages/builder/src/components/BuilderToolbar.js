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
exports.BuilderToolbar = BuilderToolbar;
const react_1 = __importStar(require("react"));
// ─── Component ──────────────────────────────────────────────────────────────
/**
 * Top toolbar with actions like export/import, preview, undo/redo, and add step.
 */
function BuilderToolbar({ fields, steps, dispatch, className, }) {
    const fileInputRef = (0, react_1.useRef)(null);
    const handleExport = () => {
        const config = {
            fields,
            steps,
            exportedAt: new Date().toISOString(),
        };
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `form-config-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const handleImport = (e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = event => {
            var _a, _b;
            try {
                const content = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
                const config = JSON.parse(content);
                if (config.fields && Array.isArray(config.fields)) {
                    dispatch({
                        type: 'IMPORT_CONFIG',
                        fields: config.fields,
                        steps: (_b = config.steps) !== null && _b !== void 0 ? _b : [],
                    });
                }
                else {
                    alert('Invalid form configuration format');
                }
            }
            catch (error) {
                alert(`Failed to import: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };
    const handleAddStep = () => {
        const title = prompt('Enter step title:');
        if (title) {
            dispatch({ type: 'ADD_STEP', title });
        }
    };
    return (<div className={className} data-dfe-toolbar>
      <div data-dfe-toolbar-section>
        <button type="button" onClick={handleExport} data-dfe-toolbar-action>
          Export JSON
        </button>

        <button type="button" onClick={() => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} data-dfe-toolbar-action>
          Import JSON
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} aria-label="Import form configuration"/>
      </div>

      <div data-dfe-toolbar-section>
        <button type="button" onClick={handleAddStep} data-dfe-toolbar-action>
          + Add Step
        </button>
      </div>

      <div data-dfe-toolbar-info>
        <span>
          {fields.length} field{fields.length !== 1 ? 's' : ''}
          {steps.length > 0 && ` • ${steps.length} step${steps.length !== 1 ? 's' : ''}`}
        </span>
      </div>
    </div>);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnVpbGRlclRvb2xiYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJCdWlsZGVyVG9vbGJhci50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQkEsd0NBNEZDO0FBdEhELCtDQUFxQztBQXFCckMsK0VBQStFO0FBRS9FOztHQUVHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLEVBQzdCLE1BQU0sRUFDTixLQUFLLEVBQ0wsUUFBUSxFQUNSLFNBQVMsR0FDVztJQUNwQixNQUFNLFlBQVksR0FBRyxJQUFBLGNBQU0sRUFBbUIsSUFBSSxDQUFDLENBQUE7SUFFbkQsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFO1FBQ3hCLE1BQU0sTUFBTSxHQUFHO1lBQ2IsTUFBTTtZQUNOLEtBQUs7WUFDTCxVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDckMsQ0FBQTtRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM1QyxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtRQUMzRCxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDeEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUE7UUFDZixJQUFJLENBQUMsUUFBUSxHQUFHLGVBQWUsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUE7UUFDaEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ1osR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUMxQixDQUFDLENBQUE7SUFFRCxNQUFNLFlBQVksR0FBRyxDQUFDLENBQXNDLEVBQUUsRUFBRTs7UUFDOUQsTUFBTSxJQUFJLEdBQUcsTUFBQSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssMENBQUcsQ0FBQyxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFNO1FBRWpCLE1BQU0sTUFBTSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUE7UUFDL0IsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsRUFBRTs7WUFDdEIsSUFBSSxDQUFDO2dCQUNILE1BQU0sT0FBTyxHQUFHLE1BQUEsS0FBSyxDQUFDLE1BQU0sMENBQUUsTUFBZ0IsQ0FBQTtnQkFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFFbEMsSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ2xELFFBQVEsQ0FBQzt3QkFDUCxJQUFJLEVBQUUsZUFBZTt3QkFDckIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO3dCQUNyQixLQUFLLEVBQUUsTUFBQSxNQUFNLENBQUMsS0FBSyxtQ0FBSSxFQUFFO3FCQUMxQixDQUFDLENBQUE7Z0JBQ0osQ0FBQztxQkFBTSxDQUFDO29CQUNOLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFBO2dCQUM1QyxDQUFDO1lBQ0gsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxDQUFDLHFCQUFzQixLQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUN4RCxDQUFDO1FBQ0gsQ0FBQyxDQUFBO1FBQ0QsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN6QixDQUFDLENBQUE7SUFFRCxNQUFNLGFBQWEsR0FBRyxHQUFHLEVBQUU7UUFDekIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFDekMsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNWLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUN2QyxDQUFDO0lBQ0gsQ0FBQyxDQUFBO0lBRUQsT0FBTyxDQUNMLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGdCQUFnQixDQUN6QztNQUFBLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUMzQjtRQUFBLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsdUJBQXVCLENBQ2xFOztRQUNGLEVBQUUsTUFBTSxDQUVSOztRQUFBLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLFdBQUMsT0FBQSxNQUFBLFlBQVksQ0FBQyxPQUFPLDBDQUFFLEtBQUssRUFBRSxDQUFBLEVBQUEsQ0FBQyxDQUFDLHVCQUF1QixDQUN6Rjs7UUFDRixFQUFFLE1BQU0sQ0FDUjtRQUFBLENBQUMsS0FBSyxDQUNKLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUNsQixJQUFJLENBQUMsTUFBTSxDQUNYLE1BQU0sQ0FBQyxPQUFPLENBQ2QsUUFBUSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQ3ZCLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQzNCLFVBQVUsQ0FBQywyQkFBMkIsRUFFMUM7TUFBQSxFQUFFLEdBQUcsQ0FFTDs7TUFBQSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FDM0I7UUFBQSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLHVCQUF1QixDQUNuRTs7UUFDRixFQUFFLE1BQU0sQ0FDVjtNQUFBLEVBQUUsR0FBRyxDQUVMOztNQUFBLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUN4QjtRQUFBLENBQUMsSUFBSSxDQUNIO1VBQUEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFFLE1BQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQ3BEO1VBQUEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxNQUFNLFFBQVEsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQ2hGO1FBQUEsRUFBRSxJQUFJLENBQ1I7TUFBQSxFQUFFLEdBQUcsQ0FDUDtJQUFBLEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQTtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlUmVmIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IEZvcm1GaWVsZCwgRm9ybVN0ZXAsIEZpZWxkVHlwZSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQgdHlwZSB7IEJ1aWxkZXJBY3Rpb24gfSBmcm9tICcuLi90eXBlcydcblxuLy8g4pSA4pSA4pSAIFR5cGVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1aWxkZXJUb29sYmFyUHJvcHMge1xuICAvKiogQWxsIGZpZWxkcyB0byBleHBvcnQgKi9cbiAgZmllbGRzOiBGb3JtRmllbGRbXVxuICAvKiogQWxsIHN0ZXBzIHRvIGV4cG9ydCAqL1xuICBzdGVwczogRm9ybVN0ZXBbXVxuICAvKiogQ2FsbGJhY2sgdG8gZGlzcGF0Y2ggYnVpbGRlciBhY3Rpb25zICovXG4gIGRpc3BhdGNoOiBSZWFjdC5EaXNwYXRjaDxCdWlsZGVyQWN0aW9uPlxuICAvKiogV2hldGhlciB1bmRvIGlzIGF2YWlsYWJsZSAqL1xuICBjYW5VbmRvPzogYm9vbGVhblxuICAvKiogV2hldGhlciByZWRvIGlzIGF2YWlsYWJsZSAqL1xuICBjYW5SZWRvPzogYm9vbGVhblxuICAvKiogQ2xhc3MgbmFtZSBmb3IgdGhlIGNvbnRhaW5lciAqL1xuICBjbGFzc05hbWU/OiBzdHJpbmdcbn1cblxuLy8g4pSA4pSA4pSAIENvbXBvbmVudCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBUb3AgdG9vbGJhciB3aXRoIGFjdGlvbnMgbGlrZSBleHBvcnQvaW1wb3J0LCBwcmV2aWV3LCB1bmRvL3JlZG8sIGFuZCBhZGQgc3RlcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEJ1aWxkZXJUb29sYmFyKHtcbiAgZmllbGRzLFxuICBzdGVwcyxcbiAgZGlzcGF0Y2gsXG4gIGNsYXNzTmFtZSxcbn06IEJ1aWxkZXJUb29sYmFyUHJvcHMpOiBSZWFjdC5SZWFjdEVsZW1lbnQge1xuICBjb25zdCBmaWxlSW5wdXRSZWYgPSB1c2VSZWY8SFRNTElucHV0RWxlbWVudD4obnVsbClcblxuICBjb25zdCBoYW5kbGVFeHBvcnQgPSAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzLFxuICAgICAgc3RlcHMsXG4gICAgICBleHBvcnRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfVxuXG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMilcbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2pzb25dLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyB9KVxuICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYilcbiAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gICAgbGluay5ocmVmID0gdXJsXG4gICAgbGluay5kb3dubG9hZCA9IGBmb3JtLWNvbmZpZy0ke0RhdGUubm93KCl9Lmpzb25gXG4gICAgbGluay5jbGljaygpXG4gICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpXG4gIH1cblxuICBjb25zdCBoYW5kbGVJbXBvcnQgPSAoZTogUmVhY3QuQ2hhbmdlRXZlbnQ8SFRNTElucHV0RWxlbWVudD4pID0+IHtcbiAgICBjb25zdCBmaWxlID0gZS50YXJnZXQuZmlsZXM/LlswXVxuICAgIGlmICghZmlsZSkgcmV0dXJuXG5cbiAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLm9ubG9hZCA9IGV2ZW50ID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBldmVudC50YXJnZXQ/LnJlc3VsdCBhcyBzdHJpbmdcbiAgICAgICAgY29uc3QgY29uZmlnID0gSlNPTi5wYXJzZShjb250ZW50KVxuXG4gICAgICAgIGlmIChjb25maWcuZmllbGRzICYmIEFycmF5LmlzQXJyYXkoY29uZmlnLmZpZWxkcykpIHtcbiAgICAgICAgICBkaXNwYXRjaCh7XG4gICAgICAgICAgICB0eXBlOiAnSU1QT1JUX0NPTkZJRycsXG4gICAgICAgICAgICBmaWVsZHM6IGNvbmZpZy5maWVsZHMsXG4gICAgICAgICAgICBzdGVwczogY29uZmlnLnN0ZXBzID8/IFtdLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWxlcnQoJ0ludmFsaWQgZm9ybSBjb25maWd1cmF0aW9uIGZvcm1hdCcpXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGFsZXJ0KGBGYWlsZWQgdG8gaW1wb3J0OiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gKVxuICAgICAgfVxuICAgIH1cbiAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlKVxuICB9XG5cbiAgY29uc3QgaGFuZGxlQWRkU3RlcCA9ICgpID0+IHtcbiAgICBjb25zdCB0aXRsZSA9IHByb21wdCgnRW50ZXIgc3RlcCB0aXRsZTonKVxuICAgIGlmICh0aXRsZSkge1xuICAgICAgZGlzcGF0Y2goeyB0eXBlOiAnQUREX1NURVAnLCB0aXRsZSB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gZGF0YS1kZmUtdG9vbGJhcj5cbiAgICAgIDxkaXYgZGF0YS1kZmUtdG9vbGJhci1zZWN0aW9uPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXtoYW5kbGVFeHBvcnR9IGRhdGEtZGZlLXRvb2xiYXItYWN0aW9uPlxuICAgICAgICAgIEV4cG9ydCBKU09OXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IGZpbGVJbnB1dFJlZi5jdXJyZW50Py5jbGljaygpfSBkYXRhLWRmZS10b29sYmFyLWFjdGlvbj5cbiAgICAgICAgICBJbXBvcnQgSlNPTlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgcmVmPXtmaWxlSW5wdXRSZWZ9XG4gICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgIGFjY2VwdD1cIi5qc29uXCJcbiAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlSW1wb3J0fVxuICAgICAgICAgIHN0eWxlPXt7IGRpc3BsYXk6ICdub25lJyB9fVxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJJbXBvcnQgZm9ybSBjb25maWd1cmF0aW9uXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGRhdGEtZGZlLXRvb2xiYXItc2VjdGlvbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17aGFuZGxlQWRkU3RlcH0gZGF0YS1kZmUtdG9vbGJhci1hY3Rpb24+XG4gICAgICAgICAgKyBBZGQgU3RlcFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGRhdGEtZGZlLXRvb2xiYXItaW5mbz5cbiAgICAgICAgPHNwYW4+XG4gICAgICAgICAge2ZpZWxkcy5sZW5ndGh9IGZpZWxke2ZpZWxkcy5sZW5ndGggIT09IDEgPyAncycgOiAnJ31cbiAgICAgICAgICB7c3RlcHMubGVuZ3RoID4gMCAmJiBgIOKAoiAke3N0ZXBzLmxlbmd0aH0gc3RlcCR7c3RlcHMubGVuZ3RoICE9PSAxID8gJ3MnIDogJyd9YH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIClcbn1cbiJdfQ==