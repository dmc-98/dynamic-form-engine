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
exports.DfeResponsiveLayout = DfeResponsiveLayout;
const react_1 = __importStar(require("react"));
// ─── Layout Calculation ──────────────────────────────────────────────────────
/**
 * Calculate CSS grid column span based on width hint.
 * - 'full' → span all columns
 * - 'half' → span half (rounded up)
 * - 'third' → span 1/3 (rounded up)
 */
function getColumnSpan(widthHint, totalColumns) {
    if (!widthHint)
        return 1;
    switch (widthHint) {
        case 'full':
            return totalColumns;
        case 'half':
            return Math.ceil(totalColumns / 2);
        case 'third':
            return Math.ceil(totalColumns / 3);
        default:
            return 1;
    }
}
// ─── Component ──────────────────────────────────────────────────────────────
/**
 * Responsive form layout component using CSS Grid.
 *
 * Automatically adjusts column count based on viewport width.
 * Respects field width hints (full, half, third) to determine grid span.
 *
 * Default breakpoints:
 * - sm: 640px (1 column)
 * - md: 1024px (2 columns)
 * - lg: 1280px (3 columns)
 *
 * @example
 * ```tsx
 * <DfeResponsiveLayout
 *   fields={engine.visibleFields}
 *   values={engine.values}
 *   onFieldChange={engine.setFieldValue}
 *   errors={validationErrors}
 *   renderField={customFieldRenderer}
 *   columns={{ sm: 1, md: 2, lg: 3 }}
 *   gap="1.5rem"
 * />
 * ```
 */
function DfeResponsiveLayout({ fields, values, onFieldChange, errors = {}, renderField, breakpoints = { sm: 640, md: 1024, lg: 1280 }, columns = { sm: 1, md: 2, lg: 3 }, gap = '1.5rem', className, }) {
    // Group fields by sections (if any use SECTION_BREAK)
    const sections = (0, react_1.useMemo)(() => {
        const result = [];
        let currentSection = {
            fields: [],
        };
        for (const field of fields) {
            if (field.type === 'SECTION_BREAK') {
                if (currentSection.fields.length > 0) {
                    result.push(currentSection);
                }
                currentSection = { title: field.label, fields: [] };
            }
            else {
                currentSection.fields.push(field);
            }
        }
        if (currentSection.fields.length > 0) {
            result.push(currentSection);
        }
        return result.length > 0 ? result : [{ fields }];
    }, [fields]);
    // Generate CSS for responsive layout
    const layoutCss = (0, react_1.useMemo)(() => `
      @media (min-width: ${breakpoints.sm}px) {
        [data-dfe-responsive-grid] {
          grid-template-columns: repeat(${columns.sm}, minmax(0, 1fr));
        }
      }
      @media (min-width: ${breakpoints.md}px) {
        [data-dfe-responsive-grid] {
          grid-template-columns: repeat(${columns.md}, minmax(0, 1fr));
        }
      }
      @media (min-width: ${breakpoints.lg}px) {
        [data-dfe-responsive-grid] {
          grid-template-columns: repeat(${columns.lg}, minmax(0, 1fr));
        }
      }
    `, [breakpoints, columns]);
    return (<div className={className} data-dfe-responsive-layout>
      <style>{layoutCss}</style>

      {sections.map((section, sectionIdx) => (<div key={sectionIdx}>
          {section.title && (<h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    marginTop: sectionIdx > 0 ? '2rem' : 0,
                }}>
              {section.title}
            </h2>)}

          <div data-dfe-responsive-grid style={{
                display: 'grid',
                gap,
                gridTemplateColumns: `repeat(${columns.sm}, minmax(0, 1fr))`,
            }}>
            {section.fields.map((field) => {
                var _a, _b;
                const columnSpan = getColumnSpan((_a = field.config) === null || _a === void 0 ? void 0 : _a.width, columns.sm);
                return (<div key={field.key} data-dfe-responsive-field={field.key} style={{
                        gridColumn: `span ${Math.min(columnSpan, columns.sm)}`,
                    }}>
                  {renderField ? (renderField({
                        field,
                        value: values[field.key],
                        onChange: (v) => onFieldChange(field.key, v),
                        error: (_b = errors[field.key]) !== null && _b !== void 0 ? _b : null,
                    })) : (<div>
                      <label>{field.label}</label>
                      <input type="text"/>
                    </div>)}
                </div>);
            })}
          </div>
        </div>))}
    </div>);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGZlUmVzcG9uc2l2ZUxheW91dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkRmZVJlc3BvbnNpdmVMYXlvdXQudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUVBLGtEQXdIQztBQWpNRCwrQ0FBc0M7QUFrQnRDLGdGQUFnRjtBQUVoRjs7Ozs7R0FLRztBQUNILFNBQVMsYUFBYSxDQUNwQixTQUE2QixFQUM3QixZQUFvQjtJQUVwQixJQUFJLENBQUMsU0FBUztRQUFFLE9BQU8sQ0FBQyxDQUFBO0lBRXhCLFFBQVEsU0FBUyxFQUFFLENBQUM7UUFDbEIsS0FBSyxNQUFNO1lBQ1QsT0FBTyxZQUFZLENBQUE7UUFFckIsS0FBSyxNQUFNO1lBQ1QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUVwQyxLQUFLLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBRXBDO1lBQ0UsT0FBTyxDQUFDLENBQUE7SUFDWixDQUFDO0FBQ0gsQ0FBQztBQUVELCtFQUErRTtBQUUvRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Qkc7QUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxFQUNsQyxNQUFNLEVBQ04sTUFBTSxFQUNOLGFBQWEsRUFDYixNQUFNLEdBQUcsRUFBRSxFQUNYLFdBQVcsRUFDWCxXQUFXLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUM3QyxPQUFPLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUNqQyxHQUFHLEdBQUcsUUFBUSxFQUNkLFNBQVMsR0FDZ0I7SUFDekIsc0RBQXNEO0lBQ3RELE1BQU0sUUFBUSxH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QUVELE9BQU8sQ0FDTCxDQUFDLEdBQUcsQ0FDRixHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQ2YseUJBQXlCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQ3JDLEtBQUssQ0FBQyxDQUFDO3dCQUNMLFVBQVUsRUFBRSxRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRTtxQkFDdkQsQ0FBQyxDQUVGO2tCQUFBLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUNiLFdBQVcsQ0FBQzt3QkFDVixLQUFLO3dCQUNMLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQzt3QkFDeEIsUUFBUSxFQUFFLENBQUMsQ0FBVSxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7d0JBQ3JELEtBQUssRUFBRSxNQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLG1DQUFJLElBQUk7cUJBQ2pDLENBQUMsQ0FDSCxDQUFDLENBQUMsQ0FBQyxDQUNGLENBQUMsR0FBRyxDQUNGO3NCQUFBLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FDM0I7c0JBQUEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFDcEI7b0JBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUNIO2dCQUFBLEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQTtZQUNILENBQUMsQ0FBQyxDQUNKO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUMsQ0FDSjtJQUFBLEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQTtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlTWVtbyB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBGb3JtRmllbGQsIEZvcm1WYWx1ZXMgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuaW1wb3J0IHR5cGUgeyBGaWVsZFJlbmRlcmVyUHJvcHMgfSBmcm9tICcuL0RmZUZvcm1SZW5kZXJlcidcblxuLy8g4pSA4pSA4pSAIFR5cGVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgaW50ZXJmYWNlIERmZVJlc3BvbnNpdmVMYXlvdXRQcm9wcyB7XG4gIGZpZWxkczogRm9ybUZpZWxkW11cbiAgdmFsdWVzOiBGb3JtVmFsdWVzXG4gIG9uRmllbGRDaGFuZ2U6IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pID0+IHZvaWRcbiAgZXJyb3JzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICByZW5kZXJGaWVsZD86IChwcm9wczogRmllbGRSZW5kZXJlclByb3BzKSA9PiBSZWFjdC5SZWFjdE5vZGVcbiAgYnJlYWtwb2ludHM/OiB7IHNtOiBudW1iZXI7IG1kOiBudW1iZXI7IGxnOiBudW1iZXIgfVxuICBjb2x1bW5zPzogeyBzbTogbnVtYmVyOyBtZDogbnVtYmVyOyBsZzogbnVtYmVyIH1cbiAgZ2FwPzogc3RyaW5nXG4gIGNsYXNzTmFtZT86IHN0cmluZ1xufVxuXG4vLyDilIDilIDilIAgTGF5b3V0IENhbGN1bGF0aW9uIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIENhbGN1bGF0ZSBDU1MgZ3JpZCBjb2x1bW4gc3BhbiBiYXNlZCBvbiB3aWR0aCBoaW50LlxuICogLSAnZnVsbCcg4oaSIHNwYW4gYWxsIGNvbHVtbnNcbiAqIC0gJ2hhbGYnIOKGkiBzcGFuIGhhbGYgKHJvdW5kZWQgdXApXG4gKiAtICd0aGlyZCcg4oaSIHNwYW4gMS8zIChyb3VuZGVkIHVwKVxuICovXG5mdW5jdGlvbiBnZXRDb2x1bW5TcGFuKFxuICB3aWR0aEhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgdG90YWxDb2x1bW5zOiBudW1iZXJcbik6IG51bWJlciB7XG4gIGlmICghd2lkdGhIaW50KSByZXR1cm4gMVxuXG4gIHN3aXRjaCAod2lkdGhIaW50KSB7XG4gICAgY2FzZSAnZnVsbCc6XG4gICAgICByZXR1cm4gdG90YWxDb2x1bW5zXG5cbiAgICBjYXNlICdoYWxmJzpcbiAgICAgIHJldHVybiBNYXRoLmNlaWwodG90YWxDb2x1bW5zIC8gMilcblxuICAgIGNhc2UgJ3RoaXJkJzpcbiAgICAgIHJldHVybiBNYXRoLmNlaWwodG90YWxDb2x1bW5zIC8gMylcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gMVxuICB9XG59XG5cbi8vIOKUgOKUgOKUgCBDb21wb25lbnQg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogUmVzcG9uc2l2ZSBmb3JtIGxheW91dCBjb21wb25lbnQgdXNpbmcgQ1NTIEdyaWQuXG4gKlxuICogQXV0b21hdGljYWxseSBhZGp1c3RzIGNvbHVtbiBjb3VudCBiYXNlZCBvbiB2aWV3cG9ydCB3aWR0aC5cbiAqIFJlc3BlY3RzIGZpZWxkIHdpZHRoIGhpbnRzIChmdWxsLCBoYWxmLCB0aGlyZCkgdG8gZGV0ZXJtaW5lIGdyaWQgc3Bhbi5cbiAqXG4gKiBEZWZhdWx0IGJyZWFrcG9pbnRzOlxuICogLSBzbTogNjQwcHggKDEgY29sdW1uKVxuICogLSBtZDogMTAyNHB4ICgyIGNvbHVtbnMpXG4gKiAtIGxnOiAxMjgwcHggKDMgY29sdW1ucylcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHN4XG4gKiA8RGZlUmVzcG9uc2l2ZUxheW91dFxuICogICBmaWVsZHM9e2VuZ2luZS52aXNpYmxlRmllbGRzfVxuICogICB2YWx1ZXM9e2VuZ2luZS52YWx1ZXN9XG4gKiAgIG9uRmllbGRDaGFuZ2U9e2VuZ2luZS5zZXRGaWVsZFZhbHVlfVxuICogICBlcnJvcnM9e3ZhbGlkYXRpb25FcnJvcnN9XG4gKiAgIHJlbmRlckZpZWxkPXtjdXN0b21GaWVsZFJlbmRlcmVyfVxuICogICBjb2x1bW5zPXt7IHNtOiAxLCBtZDogMiwgbGc6IDMgfX1cbiAqICAgZ2FwPVwiMS41cmVtXCJcbiAqIC8+XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIERmZVJlc3BvbnNpdmVMYXlvdXQoe1xuICBmaWVsZHMsXG4gIHZhbHVlcyxcbiAgb25GaWVsZENoYW5nZSxcbiAgZXJyb3JzID0ge30sXG4gIHJlbmRlckZpZWxkLFxuICBicmVha3BvaW50cyA9IHsgc206IDY0MCwgbWQ6IDEwMjQsIGxnOiAxMjgwIH0sXG4gIGNvbHVtbnMgPSB7IHNtOiAxLCBtZDogMiwgbGc6IDMgfSxcbiAgZ2FwID0gJzEuNXJlbScsXG4gIGNsYXNzTmFtZSxcbn06IERmZVJlc3BvbnNpdmVMYXlvdXRQcm9wcyk6IFJlYWN0LlJlYWN0RWxlbWVudCB7XG4gIC8vIEdyb3VwIGZpZWxkcyBieSBzZWN0aW9ucyAoaWYgYW55IHVzZSBTRUNUSU9OX0JSRUFLKVxuICBjb25zdCBzZWN0aW9ucyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IHJlc3VsdDogQXJyYXk8eyB0aXRsZT86IHN0cmluZzsgZmllbGRzOiBGb3JtRmllbGRbXSB9PiA9IFtdXG4gICAgbGV0IGN1cnJlbnRTZWN0aW9uOiB7IHRpdGxlPzogc3RyaW5nOyBmaWVsZHM6IEZvcm1GaWVsZFtdIH0gPSB7XG4gICAgICBmaWVsZHM6IFtdLFxuICAgIH1cblxuICAgIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XG4gICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ1NFQ1RJT05fQlJFQUsnKSB7XG4gICAgICAgIGlmIChjdXJyZW50U2VjdGlvbi5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnJlbnRTZWN0aW9uKVxuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTZWN0aW9uID0geyB0aXRsZTogZmllbGQubGFiZWwsIGZpZWxkczogW10gfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudFNlY3Rpb24uZmllbGRzLnB1c2goZmllbGQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICByZXN1bHQucHVzaChjdXJyZW50U2VjdGlvbilcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0Lmxlbmd0aCA+IDAgPyByZXN1bHQgOiBbeyBmaWVsZHMgfV1cbiAgfSwgW2ZpZWxkc10pXG5cbiAgLy8gR2VuZXJhdGUgQ1NTIGZvciByZXNwb25zaXZlIGxheW91dFxuICBjb25zdCBsYXlvdXRDc3MgPSB1c2VNZW1vKFxuICAgICgpID0+IGBcbiAgICAgIEBtZWRpYSAobWluLXdpZHRoOiAke2JyZWFrcG9pbnRzLnNtfXB4KSB7XG4gICAgICAgIFtkYXRhLWRmZS1yZXNwb25zaXZlLWdyaWRdIHtcbiAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgke2NvbHVtbnMuc219LCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIEBtZWRpYSAobWluLXdpZHRoOiAke2JyZWFrcG9pbnRzLm1kfXB4KSB7XG4gICAgICAgIFtkYXRhLWRmZS1yZXNwb25zaXZlLWdyaWRdIHtcbiAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgke2NvbHVtbnMubWR9LCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIEBtZWRpYSAobWluLXdpZHRoOiAke2JyZWFrcG9pbnRzLmxnfXB4KSB7XG4gICAgICAgIFtkYXRhLWRmZS1yZXNwb25zaXZlLWdyaWRdIHtcbiAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgke2NvbHVtbnMubGd9LCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBgLFxuICAgIFticmVha3BvaW50cywgY29sdW1uc11cbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gZGF0YS1kZmUtcmVzcG9uc2l2ZS1sYXlvdXQ+XG4gICAgICA8c3R5bGU+e2xheW91dENzc308L3N0eWxlPlxuXG4gICAgICB7c2VjdGlvbnMubWFwKChzZWN0aW9uLCBzZWN0aW9uSWR4KSA9PiAoXG4gICAgICAgIDxkaXYga2V5PXtzZWN0aW9uSWR4fT5cbiAgICAgICAgICB7c2VjdGlvbi50aXRsZSAmJiAoXG4gICAgICAgICAgICA8aDJcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEuMTI1cmVtJyxcbiAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiA2MDAsXG4gICAgICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnMXJlbScsXG4gICAgICAgICAgICAgICAgbWFyZ2luVG9wOiBzZWN0aW9uSWR4ID4gMCA/ICcycmVtJyA6IDAsXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtzZWN0aW9uLnRpdGxlfVxuICAgICAgICAgICAgPC9oMj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgZGF0YS1kZmUtcmVzcG9uc2l2ZS1ncmlkXG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBkaXNwbGF5OiAnZ3JpZCcsXG4gICAgICAgICAgICAgIGdhcCxcbiAgICAgICAgICAgICAgZ3JpZFRlbXBsYXRlQ29sdW1uczogYHJlcGVhdCgke2NvbHVtbnMuc219LCBtaW5tYXgoMCwgMWZyKSlgLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7c2VjdGlvbi5maWVsZHMubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBjb2x1bW5TcGFuID0gZ2V0Q29sdW1uU3BhbihcbiAgICAgICAgICAgICAgICAoZmllbGQuY29uZmlnIGFzIGFueSk/LndpZHRoLFxuICAgICAgICAgICAgICAgIGNvbHVtbnMuc21cbiAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAga2V5PXtmaWVsZC5rZXl9XG4gICAgICAgICAgICAgICAgICBkYXRhLWRmZS1yZXNwb25zaXZlLWZpZWxkPXtmaWVsZC5rZXl9XG4gICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICBncmlkQ29sdW1uOiBgc3BhbiAke01hdGgubWluKGNvbHVtblNwYW4sIGNvbHVtbnMuc20pfWAsXG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtyZW5kZXJGaWVsZCA/IChcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyRmllbGQoe1xuICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZXNbZmllbGQua2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZTogKHY6IHVua25vd24pID0+IG9uRmllbGRDaGFuZ2UoZmllbGQua2V5LCB2KSxcbiAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3JzW2ZpZWxkLmtleV0gPz8gbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPntmaWVsZC5sYWJlbH08L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSl9XG4gICAgPC9kaXY+XG4gIClcbn1cbiJdfQ==