"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfLayout = generatePdfLayout;
exports.generatePrintableHtml = generatePrintableHtml;
// ─── PDF Layout Generation ──────────────────────────────────────────────────
/**
 * Generate a PDF layout descriptor from form fields and values.
 * This descriptor is library-agnostic and can be consumed by jsPDF, pdfkit, reportlab, etc.
 *
 * Layout algorithm:
 * 1. Group fields by step if steps provided
 * 2. Position fields in a multi-column layout respecting width hints
 * 3. Break to new page when content exceeds page height
 * 4. Calculate absolute x, y positions for each field
 *
 * @example
 * ```ts
 * const layout = generatePdfLayout(fields, values, steps, {
 *   title: 'Customer Application Form',
 *   pageWidth: 210, // mm
 *   pageHeight: 297, // mm
 * })
 *
 * // Use with jsPDF:
 * const doc = new jsPDF()
 * layout.pages.forEach((page, idx) => {
 *   page.fields.forEach(field => {
 *     doc.text(field.label, field.x, field.y)
 *     doc.text(field.value, field.x, field.y + field.height)
 *   })
 *   if (idx < layout.pages.length - 1) doc.addPage()
 * })
 * ```
 */
function generatePdfLayout(fields, values, steps, options) {
    var _a, _b, _c, _d;
    const title = (_a = options === null || options === void 0 ? void 0 : options.title) !== null && _a !== void 0 ? _a : 'Form Submission';
    const pageWidth = (_b = options === null || options === void 0 ? void 0 : options.pageWidth) !== null && _b !== void 0 ? _b : 210; // A4 width in mm
    const pageHeight = (_c = options === null || options === void 0 ? void 0 : options.pageHeight) !== null && _c !== void 0 ? _c : 297; // A4 height in mm
    const margin = (_d = options === null || options === void 0 ? void 0 : options.margin) !== null && _d !== void 0 ? _d : 20;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;
    const pages = [];
    // Group fields by step or create single group
    const fieldGroups = steps
        ? steps.map((step) => {
            var _a;
            return ({
                stepId: step.id,
                stepTitle: step.title,
                stepDescription: (_a = step.description) !== null && _a !== void 0 ? _a : undefined,
                fields: fields.filter((f) => f.stepId === step.id),
            });
        })
        : [
            {
                stepId: 'default',
                stepTitle: undefined,
                stepDescription: undefined,
                fields,
            },
        ];
    let currentY = margin + 20; // Space for title
    let currentPage = { fields: [], pageNumber: 1 };
    let pageCount = 1;
    for (const group of fieldGroups) {
        if (group.fields.length === 0)
            continue;
        // Add step header if present
        if (group.stepTitle) {
            const stepHeaderHeight = 15;
            if (currentY + stepHeaderHeight > pageHeight - margin) {
                // Need new page
                if (currentPage.fields.length > 0) {
                    pages.push(currentPage);
                }
                pageCount++;
                currentY = margin;
                currentPage = { fields: [], pageNumber: pageCount };
            }
            currentPage.stepTitle = group.stepTitle;
            currentPage.stepDescription = group.stepDescription;
            currentY += stepHeaderHeight;
        }
        // Layout fields in 2 columns for better space utilization
        const columnWidth = (contentWidth - 5) / 2; // 5mm gap between columns
        let columnIdx = 0;
        let columnYs = [margin + 20, margin + 20]; // Track Y position for each column
        for (const field of group.fields) {
            const fieldHeight = getEstimatedFieldHeight(field, columnWidth);
            const currentColumnY = columnYs[columnIdx];
            // Check if field fits on current page
            if (currentColumnY + fieldHeight > pageHeight - margin) {
                // Move to next column
                if (columnIdx === 0) {
                    columnIdx = 1;
                }
                else {
                    // Both columns full, need new page
                    pages.push(currentPage);
                    pageCount++;
                    currentPage = {
                        fields: [],
                        stepTitle: group.stepTitle,
                        stepDescription: group.stepDescription,
                        pageNumber: pageCount,
                    };
                    columnIdx = 0;
                    columnYs = [margin + 20, margin + 20];
                }
            }
            const fieldX = margin + columnIdx * (columnWidth + 5);
            const fieldY = columnYs[columnIdx];
            const pdfField = {
                label: field.label,
                type: field.type,
                value: formatPdfValue(field, values[field.key]),
                required: field.required,
                x: fieldX,
                y: fieldY,
                width: columnWidth,
                height: fieldHeight,
                fontSize: 10,
                fontColor: '#000000',
                backgroundColor: field.required ? '#f9f9f9' : undefined,
            };
            currentPage.fields.push(pdfField);
            columnYs[columnIdx] += fieldHeight + 2; // 2mm spacing between fields
        }
    }
    // Add final page
    if (currentPage.fields.length > 0) {
        pages.push(currentPage);
    }
    // Update page numbers
    pages.forEach((page, idx) => {
        page.pageNumber = idx + 1;
        page.totalPages = pages.length;
    });
    return {
        title,
        pages,
        metadata: {
            createdAt: new Date().toISOString(),
            author: 'Dynamic Form Engine',
        },
        styles: {
            pageWidth,
            pageHeight,
            marginTop: margin,
            marginBottom: margin,
            marginLeft: margin,
            marginRight: margin,
            titleFontSize: 16,
            headingFontSize: 12,
            labelFontSize: 10,
            valueFontSize: 9,
            lineHeight: 1.5,
        },
    };
}
// ─── Printable HTML Generation ──────────────────────────────────────────────
/**
 * Generate a printable HTML representation of a form.
 * This can be rendered in a browser and printed to PDF, or converted via puppeteer.
 *
 * @example
 * ```ts
 * const html = generatePrintableHtml(fields, values, steps, {
 *   title: 'Form Submission Report',
 *   styles: customCss
 * })
 *
 * // Print to PDF via browser
 * const win = window.open()
 * win.document.write(html)
 * win.print()
 * ```
 */
function generatePrintableHtml(fields, values, steps, options) {
    var _a, _b;
    const title = (_a = options === null || options === void 0 ? void 0 : options.title) !== null && _a !== void 0 ? _a : 'Form Submission';
    const customStyles = (_b = options === null || options === void 0 ? void 0 : options.styles) !== null && _b !== void 0 ? _b : '';
    const defaultStyles = `
    * { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #333;
      line-height: 1.6;
      background: white;
    }
    .print-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
      border-bottom: 3px solid #007bff;
      padding-bottom: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .print-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .print-section h2 {
      font-size: 16px;
      margin-bottom: 20px;
      color: #222;
      border-left: 4px solid #007bff;
      padding-left: 12px;
    }
    .print-section p {
      color: #666;
      margin-bottom: 15px;
      font-size: 13px;
    }
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .field-row {
      padding: 12px;
      border: 1px solid #e0e0e0;
      background: #fafafa;
      border-radius: 4px;
    }
    .field-row.required {
      border-left: 3px solid #ff6b6b;
    }
    .field-label {
      font-weight: 600;
      font-size: 12px;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 14px;
      color: #333;
      word-wrap: break-word;
    }
    .field-value.empty {
      color: #999;
      font-style: italic;
    }
    .print-metadata {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 11px;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .print-container { max-width: 100%; padding: 20mm; }
      .print-section { page-break-inside: avoid; }
    }
    @page { size: A4; margin: 20mm; }
  `;
    // Group fields by step
    let sectionsHtml = '';
    if (steps && steps.length > 0) {
        for (const step of steps) {
            const stepFields = fields.filter((f) => f.stepId === step.id);
            if (stepFields.length === 0)
                continue;
            sectionsHtml += `
        <div class="print-section">
          <h2>${escapeHtml(step.title)}</h2>
          ${step.description ? `<p>${escapeHtml(step.description)}</p>` : ''}
          <div class="fields-grid">
            ${stepFields.map((field) => renderPrintField(field, values[field.key])).join('')}
          </div>
        </div>
      `;
        }
    }
    else {
        sectionsHtml = `
      <div class="fields-grid">
        ${fields.map((field) => renderPrintField(field, values[field.key])).join('')}
      </div>
    `;
    }
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
      <style>${defaultStyles}${customStyles}</style>
    </head>
    <body>
      <div class="print-container">
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
        ${sectionsHtml}
        <div class="print-metadata">
          <p>This is an automated form submission report generated by Dynamic Form Engine.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
// ─── Utilities ──────────────────────────────────────────────────────────────
function formatPdfValue(field, value) {
    var _a;
    if (value === null || value === undefined) {
        return '[Not provided]';
    }
    switch (field.type) {
        case 'CHECKBOX':
            return value ? 'Yes' : 'No';
        case 'DATE':
        case 'DATE_RANGE':
            if (typeof value === 'object') {
                const range = value;
                const from = range.from ? new Date(range.from).toLocaleDateString() : '';
                const to = range.to ? new Date(range.to).toLocaleDateString() : '';
                return [from, to].filter(Boolean).join(' to ');
            }
            return new Date(value).toLocaleDateString();
        case 'DATE_TIME':
            return new Date(value).toLocaleString();
        case 'MULTI_SELECT':
            return Array.isArray(value) ? value.join(', ') : String(value);
        case 'FILE_UPLOAD':
            if (Array.isArray(value)) {
                return value.map((f) => f.name || String(f)).join(', ');
            }
            return (_a = value === null || value === void 0 ? void 0 : value.name) !== null && _a !== void 0 ? _a : String(value);
        case 'ADDRESS':
            if (typeof value === 'object') {
                const addr = value;
                return [addr.street, addr.city, addr.state, addr.zip, addr.country]
                    .filter(Boolean)
                    .join(', ');
            }
            return String(value);
        case 'RICH_TEXT':
            // Strip HTML tags
            return String(value).replace(/<[^>]*>/g, '');
        case 'SIGNATURE':
            return '[Signature on file]';
        default:
            return String(value);
    }
}
function getEstimatedFieldHeight(field, columnWidth) {
    // Base height in mm
    switch (field.type) {
        case 'SHORT_TEXT':
        case 'EMAIL':
        case 'PHONE':
        case 'NUMBER':
        case 'DATE':
        case 'TIME':
        case 'URL':
            return 8;
        case 'SELECT':
        case 'RADIO':
            return 10;
        case 'CHECKBOX':
            return 6;
        case 'LONG_TEXT':
        case 'RICH_TEXT':
            return 15;
        case 'MULTI_SELECT':
            return 12;
        case 'ADDRESS':
        case 'FIELD_GROUP':
            return 20;
        case 'FILE_UPLOAD':
        case 'DATE_RANGE':
            return 10;
        case 'RATING':
        case 'SCALE':
            return 12;
        case 'SIGNATURE':
            return 25;
        default:
            return 8;
    }
}
function renderPrintField(field, value) {
    const displayValue = value === null || value === undefined ? '—' : String(value);
    const requiredClass = field.required ? 'required' : '';
    return `
    <div class="field-row ${requiredClass}">
      <div class="field-label">
        ${escapeHtml(field.label)}
        ${field.required ? ' <span style="color: #ff6b6b;">*</span>' : ''}
      </div>
      <div class="field-value ${value === null || value === undefined ? 'empty' : ''}">
        ${escapeHtml(displayValue)}
      </div>
    </div>
  `;
}
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (c) => map[c]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLXJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGRmLXJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBc0ZBLDhDQW1KQztBQXFCRCxzREE4SUM7QUFyVkQsK0VBQStFO0FBRS9FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNEJHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQy9CLE1BQW1CLEVBQ25CLE1BQWtCLEVBQ2xCLEtBQWtCLEVBQ2xCLE9BS0M7O0lBRUQsTUFBTSxLQUFLLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsS0FBSyxtQ0FBSSxpQkFBaUIsQ0FBQTtJQUNqRCxNQUFNLFNBQVMsR0FBRyxNQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxTQUFTLG1DQUFJLEdBQUcsQ0FBQSxDQUFDLGlCQUFpQjtJQUM3RCxNQUFNLFVBQVUsR0FBRyxNQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxVQUFVLG1DQUFJLEdBQUcsQ0FBQSxDQUFDLGtCQUFrQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxNQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLG1DQUFJLEVBQUUsQ0FBQTtJQUVwQyxNQUFNLFlBQVksR0FBRyxTQUFTLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtJQUMzQyxNQUFNLGFBQWEsR0FBRyxVQUFVLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtJQUU3QyxNQUFNLEtBQUssR0FBYyxFQUFFLENBQUE7SUFFM0IsOENBQThDO0lBQzlDLE1BQU0sV0FBVyxHQUFHLEtBQUs7UUFDdkIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTs7WUFBQyxPQUFBLENBQUM7Z0JBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDZixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ3JCLGVBQWUsRUFBRSxNQUFBLElBQUksQ0FBQyxXQUFXLG1DQUFJLFNBQVM7Z0JBQzlDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUM7YUFDbkQsQ0FBQyxDQUFBO1NBQUEsQ0FBQztRQUNMLENBQUMsQ0FBQztZQUNFO2dCQUNFLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsU0FBUztnQkFDcEIsZUFBZSxFQUFFLFNBQVM7Z0JBQzFCLE1BQU07YUFDUDtTQUNGLENBQUE7SUFFTCxJQUFJLFFBQVEsR0FBRyxNQUFNLEdBQUcsRUFBRSxDQUFBLENBQUMsa0JBQWtCO0lBQzdDLElBQUksV0FBVyxHQUFZLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUE7SUFDeEQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFBO0lBRWpCLEtBQUssTUFBTSxLQUFLLElBQUksV0FBVyxFQUFFLENBQUM7UUFDaEMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQUUsU0FBUTtRQUV2Qyw2QkFBNkI7UUFDN0IsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7WUFDM0IsSUFBSSxRQUFRLEdBQUcsZ0JBQWdCLEdBQUcsVUFBVSxHQUFHLE1BQU0sRUFBRSxDQUFDO2dCQUN0RCxnQkFBZ0I7Z0JBQ2hCLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7Z0JBQ3pCLENBQUM7Z0JBQ0QsU0FBUyxFQUFFLENBQUE7Z0JBQ1gsUUFBUSxHQUFHLE1BQU0sQ0FBQTtnQkFDakIsV0FBVyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUE7WUFDckQsQ0FBQztZQUVELFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQTtZQUN2QyxXQUFXLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUE7WUFDbkQsUUFBUSxJQUFJLGdCQUFnQixDQUFBO1FBQzlCLENBQUM7UUFFRCwwREFBMEQ7UUFDMUQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUMsMEJBQTBCO1FBRXJFLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQTtRQUNqQixJQUFJLFFBQVEsR0FBRyxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFBLENBQUMsbUNBQW1DO1FBRTdFLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pDLE1BQU0sV0FBVyxHQUFHLHVCQUF1QixDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTtZQUMvRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUE7WUFFMUMsc0NBQXNDO1lBQ3RDLElBQUksY0FBYyxHQUFHLFdBQVcsR0FBRyxVQUFVLEdBQUcsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZELHNCQUFzQjtnQkFDdEIsSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3BCLFNBQVMsR0FBRyxDQUFDLENBQUE7Z0JBQ2YsQ0FBQztxQkFBTSxDQUFDO29CQUNOLG1DQUFtQztvQkFDbkMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQTtvQkFDdkIsU0FBUyxFQUFFLENBQUE7b0JBQ1gsV0FBVyxHQUFHO3dCQUNaLE1BQU0sRUFBRSxFQUFFO3dCQUNWLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzt3QkFDMUIsZUFBZSxFQUFFLEtBQUssQ0FBQyxlQUFlO3dCQUN0QyxVQUFVLEVBQUUsU0FBUztxQkFDdEIsQ0FBQTtvQkFDRCxTQUFTLEdBQUcsQ0FBQyxDQUFBO29CQUNiLFFBQVEsR0FBRyxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFBO2dCQUN2QyxDQUFDO1lBQ0gsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxTQUFTLEdBQUcsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDckQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBRWxDLE1BQU0sUUFBUSxHQUFtQjtnQkFDL0IsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO2dCQUNsQixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ2hCLEtBQUssRUFBRSxjQUFjLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQy9DLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUTtnQkFDeEIsQ0FBQyxFQUFFLE1BQU07Z0JBQ1QsQ0FBQyxFQUFFLE1BQU07Z0JBQ1QsS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixRQUFRLEVBQUUsRUFBRTtnQkFDWixTQUFTLEVBQUUsU0FBUztnQkFDcEIsZUFBZSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUzthQUN4RCxDQUFBO1lBRUQsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7WUFDakMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUEsQ0FBQyw2QkFBNkI7UUFDdEUsQ0FBQztJQUNILENBQUM7SUFFRCxpQkFBaUI7SUFDakIsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0lBQ3pCLENBQUM7SUFFRCxzQkFBc0I7SUFDdEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUMxQixJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUE7UUFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFBO0lBQ2hDLENBQUMsQ0FBQyxDQUFBO0lBRUYsT0FBTztRQUNMLEtBQUs7UUFDTCxLQUFLO1FBQ0wsUUFBUSxFQUFFO1lBQ1IsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1lBQ25DLE1BQU0sRUFBRSxxQkFBcUI7U0FDOUI7UUFDRCxNQUFNLEVBQUU7WUFDTixTQUFTO1lBQ1QsVUFBVTtZQUNWLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFlBQVksRUFBRSxNQUFNO1lBQ3BCLFVBQVUsRUFBRSxNQUFNO1lBQ2xCLFdBQVcsRUFBRSxNQUFNO1lBQ25CLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLGVBQWUsRUFBRSxFQUFFO1lBQ25CLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLFVBQVUsRUFBRSxHQUFHO1NBQ2hCO0tBQ0YsQ0FBQTtBQUNILENBQUM7QUFFRCwrRUFBK0U7QUFFL0U7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxTQUFnQixxQkFBcUIsQ0FDbkMsTUFBbUIsRUFDbkIsTUFBa0IsRUFDbEIsS0FBa0IsRUFDbEIsT0FBNkM7O0lBRTdDLE1BQU0sS0FBSyxHQUFHLE1BQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLEtBQUssbUNBQUksaUJBQWlCLENBQUE7SUFDakQsTUFBTSxZQUFZLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxtQ0FBSSxFQUFFLENBQUE7SUFFMUMsTUFBTSxhQUFhLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9GckIsQ0FBQTtJQUVELHVCQUF1QjtJQUN2QixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUE7SUFFckIsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUM5QixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3pCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQzdELElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDO2dCQUFFLFNBQVE7WUFFckMsWUFBWSxJQUFJOztnQkFFTixVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTs7Y0FFOUQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7OztPQUdyRixDQUFBO1FBQ0gsQ0FBQztJQUNILENBQUM7U0FBTSxDQUFDO1FBQ04sWUFBWSxHQUFHOztVQUVULE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOztLQUUvRSxDQUFBO0lBQ0gsQ0FBQztJQUVELE9BQU87Ozs7OztlQU1NLFVBQVUsQ0FBQyxLQUFLLENBQUM7ZUFDakIsYUFBYSxHQUFHLFlBQVk7Ozs7Y0FJN0IsVUFBVSxDQUFDLEtBQUssQ0FBQzs2Q0FDYyxJQUFJLElBQUksRUFBRSxDQUFDLGNBQWMsRUFBRTtVQUM5RCxZQUFZOzs7Ozs7O0dBT25CLENBQUE7QUFDSCxDQUFDO0FBRUQsK0VBQStFO0FBRS9FLFNBQVMsY0FBYyxDQUFDLEtBQWdCLEVBQUUsS0FBYzs7SUFDdEQsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUMxQyxPQUFPLGdCQUFnQixDQUFBO0lBQ3pCLENBQUM7SUFFRCxRQUFRLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuQixLQUFLLFVBQVU7WUFDYixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7UUFFN0IsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLFlBQVk7WUFDZixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixNQUFNLEtBQUssR0FBRyxLQUFZLENBQUE7Z0JBQzFCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7Z0JBQ3hFLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7Z0JBQ2xFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNoRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFlLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO1FBRXZELEtBQUssV0FBVztZQUNkLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBZSxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUE7UUFFbkQsS0FBSyxjQUFjO1lBQ2pCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWhFLEtBQUssYUFBYTtZQUNoQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUM5RCxDQUFDO1lBQ0QsT0FBTyxNQUFDLEtBQWEsYUFBYixLQUFLLHVCQUFMLEtBQUssQ0FBVSxJQUFJLG1DQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUU5QyxLQUFLLFNBQVM7WUFDWixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixNQUFNLElBQUksR0FBRyxLQUFZLENBQUE7Z0JBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7cUJBQ2hFLE1BQU0sQ0FBQyxPQUFPLENBQUM7cUJBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ2YsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXRCLEtBQUssV0FBVztZQUNkLGtCQUFrQjtZQUNsQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRTlDLEtBQUssV0FBVztZQUNkLE9BQU8scUJBQXFCLENBQUE7UUFFOUI7WUFDRSxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUN4QixDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsS0FBZ0IsRUFBRSxXQUFtQjtJQUNwRSxvQkFBb0I7SUFDcEIsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbkIsS0FBSyxZQUFZLENBQUM7UUFDbEIsS0FBSyxPQUFPLENBQUM7UUFDYixLQUFLLE9BQU8sQ0FBQztRQUNiLEtBQUssUUFBUSxDQUFDO1FBQ2QsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssS0FBSztZQUNSLE9BQU8sQ0FBQyxDQUFBO1FBRVYsS0FBSyxRQUFRLENBQUM7UUFDZCxLQUFLLE9BQU87WUFDVixPQUFPLEVBQUUsQ0FBQTtRQUVYLEtBQUssVUFBVTtZQUNiLE9BQU8sQ0FBQyxDQUFBO1FBRVYsS0FBSyxXQUFXLENBQUM7UUFDakIsS0FBSyxXQUFXO1lBQ2QsT0FBTyxFQUFFLENBQUE7UUFFWCxLQUFLLGNBQWM7WUFDakIsT0FBTyxFQUFFLENBQUE7UUFFWCxLQUFLLFNBQVMsQ0FBQztRQUNmLEtBQUssYUFBYTtZQUNoQixPQUFPLEVBQUUsQ0FBQTtRQUVYLEtBQUssYUFBYSxDQUFDO1FBQ25CLEtBQUssWUFBWTtZQUNmLE9BQU8sRUFBRSxDQUFBO1FBRVgsS0FBSyxRQUFRLENBQUM7UUFDZCxLQUFLLE9BQU87WUFDVixPQUFPLEVBQUUsQ0FBQTtRQUVYLEtBQUssV0FBVztZQUNkLE9BQU8sRUFBRSxDQUFBO1FBRVg7WUFDRSxPQUFPLENBQUMsQ0FBQTtJQUNaLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFnQixFQUFFLEtBQWM7SUFDeEQsTUFBTSxZQUFZLEdBQUcsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNoRixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUV0RCxPQUFPOzRCQUNtQixhQUFhOztVQUUvQixVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztVQUN2QixLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLENBQUMsRUFBRTs7Z0NBRXpDLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO1VBQzFFLFVBQVUsQ0FBQyxZQUFZLENBQUM7OztHQUcvQixDQUFBO0FBQ0gsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLElBQVk7SUFDOUIsTUFBTSxHQUFHLEdBQTJCO1FBQ2xDLEdBQUcsRUFBRSxPQUFPO1FBQ1osR0FBRyxFQUFFLE1BQU07UUFDWCxHQUFHLEVBQUUsTUFBTTtRQUNYLEdBQUcsRUFBRSxRQUFRO1FBQ2IsR0FBRyxFQUFFLFFBQVE7S0FDZCxDQUFBO0lBQ0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDaEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRm9ybUZpZWxkLCBGb3JtVmFsdWVzLCBGb3JtU3RlcCB9IGZyb20gJy4vdHlwZXMnXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqIFBvc2l0aW9uIGFuZCBsYXlvdXQgaW5mb3JtYXRpb24gZm9yIGEgc2luZ2xlIGZpZWxkIG9uIGEgUERGIHBhZ2UgKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGRmRmllbGRMYXlvdXQge1xuICBsYWJlbDogc3RyaW5nXG4gIHR5cGU6IHN0cmluZ1xuICB2YWx1ZTogc3RyaW5nXG4gIHJlcXVpcmVkOiBib29sZWFuXG4gIHg6IG51bWJlclxuICB5OiBudW1iZXJcbiAgd2lkdGg6IG51bWJlclxuICBoZWlnaHQ6IG51bWJlclxuICBmb250U2l6ZT86IG51bWJlclxuICBmb250Q29sb3I/OiBzdHJpbmdcbiAgYmFja2dyb3VuZENvbG9yPzogc3RyaW5nXG59XG5cbi8qKiBEZWZpbml0aW9uIG9mIGEgc2luZ2xlIHBhZ2UgaW4gdGhlIFBERiBkb2N1bWVudCAqL1xuZXhwb3J0IGludGVyZmFjZSBQZGZQYWdlIHtcbiAgc3RlcFRpdGxlPzogc3RyaW5nXG4gIHN0ZXBEZXNjcmlwdGlvbj86IHN0cmluZ1xuICBmaWVsZHM6IFBkZkZpZWxkTGF5b3V0W11cbiAgcGFnZU51bWJlcj86IG51bWJlclxuICB0b3RhbFBhZ2VzPzogbnVtYmVyXG59XG5cbi8qKiBDb21wbGV0ZSBQREYgbGF5b3V0IGRlc2NyaXB0b3IgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgYW55IFBERiBsaWJyYXJ5ICovXG5leHBvcnQgaW50ZXJmYWNlIFBkZkZvcm1MYXlvdXQge1xuICB0aXRsZTogc3RyaW5nXG4gIHN1YnRpdGxlPzogc3RyaW5nXG4gIHBhZ2VzOiBQZGZQYWdlW11cbiAgbWV0YWRhdGE6IHtcbiAgICBhdXRob3I/OiBzdHJpbmdcbiAgICBzdWJqZWN0Pzogc3RyaW5nXG4gICAga2V5d29yZHM/OiBzdHJpbmdbXVxuICAgIGNyZWF0ZWRBdDogc3RyaW5nXG4gICAgZm9ybUlkPzogc3RyaW5nXG4gIH1cbiAgc3R5bGVzPzoge1xuICAgIHBhZ2VXaWR0aD86IG51bWJlclxuICAgIHBhZ2VIZWlnaHQ/OiBudW1iZXJcbiAgICBtYXJnaW5Ub3A/OiBudW1iZXJcbiAgICBtYXJnaW5Cb3R0b20/OiBudW1iZXJcbiAgICBtYXJnaW5MZWZ0PzogbnVtYmVyXG4gICAgbWFyZ2luUmlnaHQ/OiBudW1iZXJcbiAgICB0aXRsZUZvbnRTaXplPzogbnVtYmVyXG4gICAgaGVhZGluZ0ZvbnRTaXplPzogbnVtYmVyXG4gICAgbGFiZWxGb250U2l6ZT86IG51bWJlclxuICAgIHZhbHVlRm9udFNpemU/OiBudW1iZXJcbiAgICBsaW5lSGVpZ2h0PzogbnVtYmVyXG4gIH1cbn1cblxuLy8g4pSA4pSA4pSAIFBERiBMYXlvdXQgR2VuZXJhdGlvbiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIFBERiBsYXlvdXQgZGVzY3JpcHRvciBmcm9tIGZvcm0gZmllbGRzIGFuZCB2YWx1ZXMuXG4gKiBUaGlzIGRlc2NyaXB0b3IgaXMgbGlicmFyeS1hZ25vc3RpYyBhbmQgY2FuIGJlIGNvbnN1bWVkIGJ5IGpzUERGLCBwZGZraXQsIHJlcG9ydGxhYiwgZXRjLlxuICpcbiAqIExheW91dCBhbGdvcml0aG06XG4gKiAxLiBHcm91cCBmaWVsZHMgYnkgc3RlcCBpZiBzdGVwcyBwcm92aWRlZFxuICogMi4gUG9zaXRpb24gZmllbGRzIGluIGEgbXVsdGktY29sdW1uIGxheW91dCByZXNwZWN0aW5nIHdpZHRoIGhpbnRzXG4gKiAzLiBCcmVhayB0byBuZXcgcGFnZSB3aGVuIGNvbnRlbnQgZXhjZWVkcyBwYWdlIGhlaWdodFxuICogNC4gQ2FsY3VsYXRlIGFic29sdXRlIHgsIHkgcG9zaXRpb25zIGZvciBlYWNoIGZpZWxkXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBjb25zdCBsYXlvdXQgPSBnZW5lcmF0ZVBkZkxheW91dChmaWVsZHMsIHZhbHVlcywgc3RlcHMsIHtcbiAqICAgdGl0bGU6ICdDdXN0b21lciBBcHBsaWNhdGlvbiBGb3JtJyxcbiAqICAgcGFnZVdpZHRoOiAyMTAsIC8vIG1tXG4gKiAgIHBhZ2VIZWlnaHQ6IDI5NywgLy8gbW1cbiAqIH0pXG4gKlxuICogLy8gVXNlIHdpdGgganNQREY6XG4gKiBjb25zdCBkb2MgPSBuZXcganNQREYoKVxuICogbGF5b3V0LnBhZ2VzLmZvckVhY2goKHBhZ2UsIGlkeCkgPT4ge1xuICogICBwYWdlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAqICAgICBkb2MudGV4dChmaWVsZC5sYWJlbCwgZmllbGQueCwgZmllbGQueSlcbiAqICAgICBkb2MudGV4dChmaWVsZC52YWx1ZSwgZmllbGQueCwgZmllbGQueSArIGZpZWxkLmhlaWdodClcbiAqICAgfSlcbiAqICAgaWYgKGlkeCA8IGxheW91dC5wYWdlcy5sZW5ndGggLSAxKSBkb2MuYWRkUGFnZSgpXG4gKiB9KVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVBkZkxheW91dChcbiAgZmllbGRzOiBGb3JtRmllbGRbXSxcbiAgdmFsdWVzOiBGb3JtVmFsdWVzLFxuICBzdGVwcz86IEZvcm1TdGVwW10sXG4gIG9wdGlvbnM/OiB7XG4gICAgdGl0bGU/OiBzdHJpbmdcbiAgICBwYWdlV2lkdGg/OiBudW1iZXJcbiAgICBwYWdlSGVpZ2h0PzogbnVtYmVyXG4gICAgbWFyZ2luPzogbnVtYmVyXG4gIH1cbik6IFBkZkZvcm1MYXlvdXQge1xuICBjb25zdCB0aXRsZSA9IG9wdGlvbnM/LnRpdGxlID8/ICdGb3JtIFN1Ym1pc3Npb24nXG4gIGNvbnN0IHBhZ2VXaWR0aCA9IG9wdGlvbnM/LnBhZ2VXaWR0aCA/PyAyMTAgLy8gQTQgd2lkdGggaW4gbW1cbiAgY29uc3QgcGFnZUhlaWdodCA9IG9wdGlvbnM/LnBhZ2VIZWlnaHQgPz8gMjk3IC8vIEE0IGhlaWdodCBpbiBtbVxuICBjb25zdCBtYXJnaW4gPSBvcHRpb25zPy5tYXJnaW4gPz8gMjBcblxuICBjb25zdCBjb250ZW50V2lkdGggPSBwYWdlV2lkdGggLSAyICogbWFyZ2luXG4gIGNvbnN0IGNvbnRlbnRIZWlnaHQgPSBwYWdlSGVpZ2h0IC0gMiAqIG1hcmdpblxuXG4gIGNvbnN0IHBhZ2VzOiBQZGZQYWdlW10gPSBbXVxuXG4gIC8vIEdyb3VwIGZpZWxkcyBieSBzdGVwIG9yIGNyZWF0ZSBzaW5nbGUgZ3JvdXBcbiAgY29uc3QgZmllbGRHcm91cHMgPSBzdGVwc1xuICAgID8gc3RlcHMubWFwKChzdGVwKSA9PiAoe1xuICAgICAgICBzdGVwSWQ6IHN0ZXAuaWQsXG4gICAgICAgIHN0ZXBUaXRsZTogc3RlcC50aXRsZSxcbiAgICAgICAgc3RlcERlc2NyaXB0aW9uOiBzdGVwLmRlc2NyaXB0aW9uID8/IHVuZGVmaW5lZCxcbiAgICAgICAgZmllbGRzOiBmaWVsZHMuZmlsdGVyKChmKSA9PiBmLnN0ZXBJZCA9PT0gc3RlcC5pZCksXG4gICAgICB9KSlcbiAgICA6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0ZXBJZDogJ2RlZmF1bHQnLFxuICAgICAgICAgIHN0ZXBUaXRsZTogdW5kZWZpbmVkLFxuICAgICAgICAgIHN0ZXBEZXNjcmlwdGlvbjogdW5kZWZpbmVkLFxuICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgfSxcbiAgICAgIF1cblxuICBsZXQgY3VycmVudFkgPSBtYXJnaW4gKyAyMCAvLyBTcGFjZSBmb3IgdGl0bGVcbiAgbGV0IGN1cnJlbnRQYWdlOiBQZGZQYWdlID0geyBmaWVsZHM6IFtdLCBwYWdlTnVtYmVyOiAxIH1cbiAgbGV0IHBhZ2VDb3VudCA9IDFcblxuICBmb3IgKGNvbnN0IGdyb3VwIG9mIGZpZWxkR3JvdXBzKSB7XG4gICAgaWYgKGdyb3VwLmZpZWxkcy5sZW5ndGggPT09IDApIGNvbnRpbnVlXG5cbiAgICAvLyBBZGQgc3RlcCBoZWFkZXIgaWYgcHJlc2VudFxuICAgIGlmIChncm91cC5zdGVwVGl0bGUpIHtcbiAgICAgIGNvbnN0IHN0ZXBIZWFkZXJIZWlnaHQgPSAxNVxuICAgICAgaWYgKGN1cnJlbnRZICsgc3RlcEhlYWRlckhlaWdodCA+IHBhZ2VIZWlnaHQgLSBtYXJnaW4pIHtcbiAgICAgICAgLy8gTmVlZCBuZXcgcGFnZVxuICAgICAgICBpZiAoY3VycmVudFBhZ2UuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBwYWdlcy5wdXNoKGN1cnJlbnRQYWdlKVxuICAgICAgICB9XG4gICAgICAgIHBhZ2VDb3VudCsrXG4gICAgICAgIGN1cnJlbnRZID0gbWFyZ2luXG4gICAgICAgIGN1cnJlbnRQYWdlID0geyBmaWVsZHM6IFtdLCBwYWdlTnVtYmVyOiBwYWdlQ291bnQgfVxuICAgICAgfVxuXG4gICAgICBjdXJyZW50UGFnZS5zdGVwVGl0bGUgPSBncm91cC5zdGVwVGl0bGVcbiAgICAgIGN1cnJlbnRQYWdlLnN0ZXBEZXNjcmlwdGlvbiA9IGdyb3VwLnN0ZXBEZXNjcmlwdGlvblxuICAgICAgY3VycmVudFkgKz0gc3RlcEhlYWRlckhlaWdodFxuICAgIH1cblxuICAgIC8vIExheW91dCBmaWVsZHMgaW4gMiBjb2x1bW5zIGZvciBiZXR0ZXIgc3BhY2UgdXRpbGl6YXRpb25cbiAgICBjb25zdCBjb2x1bW5XaWR0aCA9IChjb250ZW50V2lkdGggLSA1KSAvIDIgLy8gNW1tIGdhcCBiZXR3ZWVuIGNvbHVtbnNcblxuICAgIGxldCBjb2x1bW5JZHggPSAwXG4gICAgbGV0IGNvbHVtbllzID0gW21hcmdpbiArIDIwLCBtYXJnaW4gKyAyMF0gLy8gVHJhY2sgWSBwb3NpdGlvbiBmb3IgZWFjaCBjb2x1bW5cblxuICAgIGZvciAoY29uc3QgZmllbGQgb2YgZ3JvdXAuZmllbGRzKSB7XG4gICAgICBjb25zdCBmaWVsZEhlaWdodCA9IGdldEVzdGltYXRlZEZpZWxkSGVpZ2h0KGZpZWxkLCBjb2x1bW5XaWR0aClcbiAgICAgIGNvbnN0IGN1cnJlbnRDb2x1bW5ZID0gY29sdW1uWXNbY29sdW1uSWR4XVxuXG4gICAgICAvLyBDaGVjayBpZiBmaWVsZCBmaXRzIG9uIGN1cnJlbnQgcGFnZVxuICAgICAgaWYgKGN1cnJlbnRDb2x1bW5ZICsgZmllbGRIZWlnaHQgPiBwYWdlSGVpZ2h0IC0gbWFyZ2luKSB7XG4gICAgICAgIC8vIE1vdmUgdG8gbmV4dCBjb2x1bW5cbiAgICAgICAgaWYgKGNvbHVtbklkeCA9PT0gMCkge1xuICAgICAgICAgIGNvbHVtbklkeCA9IDFcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBCb3RoIGNvbHVtbnMgZnVsbCwgbmVlZCBuZXcgcGFnZVxuICAgICAgICAgIHBhZ2VzLnB1c2goY3VycmVudFBhZ2UpXG4gICAgICAgICAgcGFnZUNvdW50KytcbiAgICAgICAgICBjdXJyZW50UGFnZSA9IHtcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBzdGVwVGl0bGU6IGdyb3VwLnN0ZXBUaXRsZSxcbiAgICAgICAgICAgIHN0ZXBEZXNjcmlwdGlvbjogZ3JvdXAuc3RlcERlc2NyaXB0aW9uLFxuICAgICAgICAgICAgcGFnZU51bWJlcjogcGFnZUNvdW50LFxuICAgICAgICAgIH1cbiAgICAgICAgICBjb2x1bW5JZHggPSAwXG4gICAgICAgICAgY29sdW1uWXMgPSBbbWFyZ2luICsgMjAsIG1hcmdpbiArIDIwXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkWCA9IG1hcmdpbiArIGNvbHVtbklkeCAqIChjb2x1bW5XaWR0aCArIDUpXG4gICAgICBjb25zdCBmaWVsZFkgPSBjb2x1bW5Zc1tjb2x1bW5JZHhdXG5cbiAgICAgIGNvbnN0IHBkZkZpZWxkOiBQZGZGaWVsZExheW91dCA9IHtcbiAgICAgICAgbGFiZWw6IGZpZWxkLmxhYmVsLFxuICAgICAgICB0eXBlOiBmaWVsZC50eXBlLFxuICAgICAgICB2YWx1ZTogZm9ybWF0UGRmVmFsdWUoZmllbGQsIHZhbHVlc1tmaWVsZC5rZXldKSxcbiAgICAgICAgcmVxdWlyZWQ6IGZpZWxkLnJlcXVpcmVkLFxuICAgICAgICB4OiBmaWVsZFgsXG4gICAgICAgIHk6IGZpZWxkWSxcbiAgICAgICAgd2lkdGg6IGNvbHVtbldpZHRoLFxuICAgICAgICBoZWlnaHQ6IGZpZWxkSGVpZ2h0LFxuICAgICAgICBmb250U2l6ZTogMTAsXG4gICAgICAgIGZvbnRDb2xvcjogJyMwMDAwMDAnLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGZpZWxkLnJlcXVpcmVkID8gJyNmOWY5ZjknIDogdW5kZWZpbmVkLFxuICAgICAgfVxuXG4gICAgICBjdXJyZW50UGFnZS5maWVsZHMucHVzaChwZGZGaWVsZClcbiAgICAgIGNvbHVtbllzW2NvbHVtbklkeF0gKz0gZmllbGRIZWlnaHQgKyAyIC8vIDJtbSBzcGFjaW5nIGJldHdlZW4gZmllbGRzXG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGZpbmFsIHBhZ2VcbiAgaWYgKGN1cnJlbnRQYWdlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgcGFnZXMucHVzaChjdXJyZW50UGFnZSlcbiAgfVxuXG4gIC8vIFVwZGF0ZSBwYWdlIG51bWJlcnNcbiAgcGFnZXMuZm9yRWFjaCgocGFnZSwgaWR4KSA9PiB7XG4gICAgcGFnZS5wYWdlTnVtYmVyID0gaWR4ICsgMVxuICAgIHBhZ2UudG90YWxQYWdlcyA9IHBhZ2VzLmxlbmd0aFxuICB9KVxuXG4gIHJldHVybiB7XG4gICAgdGl0bGUsXG4gICAgcGFnZXMsXG4gICAgbWV0YWRhdGE6IHtcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgYXV0aG9yOiAnRHluYW1pYyBGb3JtIEVuZ2luZScsXG4gICAgfSxcbiAgICBzdHlsZXM6IHtcbiAgICAgIHBhZ2VXaWR0aCxcbiAgICAgIHBhZ2VIZWlnaHQsXG4gICAgICBtYXJnaW5Ub3A6IG1hcmdpbixcbiAgICAgIG1hcmdpbkJvdHRvbTogbWFyZ2luLFxuICAgICAgbWFyZ2luTGVmdDogbWFyZ2luLFxuICAgICAgbWFyZ2luUmlnaHQ6IG1hcmdpbixcbiAgICAgIHRpdGxlRm9udFNpemU6IDE2LFxuICAgICAgaGVhZGluZ0ZvbnRTaXplOiAxMixcbiAgICAgIGxhYmVsRm9udFNpemU6IDEwLFxuICAgICAgdmFsdWVGb250U2l6ZTogOSxcbiAgICAgIGxpbmVIZWlnaHQ6IDEuNSxcbiAgICB9LFxuICB9XG59XG5cbi8vIOKUgOKUgOKUgCBQcmludGFibGUgSFRNTCBHZW5lcmF0aW9uIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIEdlbmVyYXRlIGEgcHJpbnRhYmxlIEhUTUwgcmVwcmVzZW50YXRpb24gb2YgYSBmb3JtLlxuICogVGhpcyBjYW4gYmUgcmVuZGVyZWQgaW4gYSBicm93c2VyIGFuZCBwcmludGVkIHRvIFBERiwgb3IgY29udmVydGVkIHZpYSBwdXBwZXRlZXIuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBjb25zdCBodG1sID0gZ2VuZXJhdGVQcmludGFibGVIdG1sKGZpZWxkcywgdmFsdWVzLCBzdGVwcywge1xuICogICB0aXRsZTogJ0Zvcm0gU3VibWlzc2lvbiBSZXBvcnQnLFxuICogICBzdHlsZXM6IGN1c3RvbUNzc1xuICogfSlcbiAqXG4gKiAvLyBQcmludCB0byBQREYgdmlhIGJyb3dzZXJcbiAqIGNvbnN0IHdpbiA9IHdpbmRvdy5vcGVuKClcbiAqIHdpbi5kb2N1bWVudC53cml0ZShodG1sKVxuICogd2luLnByaW50KClcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVQcmludGFibGVIdG1sKFxuICBmaWVsZHM6IEZvcm1GaWVsZFtdLFxuICB2YWx1ZXM6IEZvcm1WYWx1ZXMsXG4gIHN0ZXBzPzogRm9ybVN0ZXBbXSxcbiAgb3B0aW9ucz86IHsgdGl0bGU/OiBzdHJpbmc7IHN0eWxlcz86IHN0cmluZyB9XG4pOiBzdHJpbmcge1xuICBjb25zdCB0aXRsZSA9IG9wdGlvbnM/LnRpdGxlID8/ICdGb3JtIFN1Ym1pc3Npb24nXG4gIGNvbnN0IGN1c3RvbVN0eWxlcyA9IG9wdGlvbnM/LnN0eWxlcyA/PyAnJ1xuXG4gIGNvbnN0IGRlZmF1bHRTdHlsZXMgPSBgXG4gICAgKiB7IG1hcmdpbjogMDsgcGFkZGluZzogMDsgfVxuICAgIGJvZHkge1xuICAgICAgZm9udC1mYW1pbHk6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIHNhbnMtc2VyaWY7XG4gICAgICBjb2xvcjogIzMzMztcbiAgICAgIGxpbmUtaGVpZ2h0OiAxLjY7XG4gICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICB9XG4gICAgLnByaW50LWNvbnRhaW5lciB7XG4gICAgICBtYXgtd2lkdGg6IDkwMHB4O1xuICAgICAgbWFyZ2luOiAwIGF1dG87XG4gICAgICBwYWRkaW5nOiA0MHB4O1xuICAgIH1cbiAgICBoMSB7XG4gICAgICBmb250LXNpemU6IDI0cHg7XG4gICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICAgICAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICMwMDdiZmY7XG4gICAgICBwYWRkaW5nLWJvdHRvbTogMTBweDtcbiAgICB9XG4gICAgLnN1YnRpdGxlIHtcbiAgICAgIGNvbG9yOiAjNjY2O1xuICAgICAgbWFyZ2luLWJvdHRvbTogMzBweDtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB9XG4gICAgLnByaW50LXNlY3Rpb24ge1xuICAgICAgbWFyZ2luLWJvdHRvbTogNDBweDtcbiAgICAgIHBhZ2UtYnJlYWstaW5zaWRlOiBhdm9pZDtcbiAgICB9XG4gICAgLnByaW50LXNlY3Rpb24gaDIge1xuICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgbWFyZ2luLWJvdHRvbTogMjBweDtcbiAgICAgIGNvbG9yOiAjMjIyO1xuICAgICAgYm9yZGVyLWxlZnQ6IDRweCBzb2xpZCAjMDA3YmZmO1xuICAgICAgcGFkZGluZy1sZWZ0OiAxMnB4O1xuICAgIH1cbiAgICAucHJpbnQtc2VjdGlvbiBwIHtcbiAgICAgIGNvbG9yOiAjNjY2O1xuICAgICAgbWFyZ2luLWJvdHRvbTogMTVweDtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gICAgLmZpZWxkcy1ncmlkIHtcbiAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpdCwgbWlubWF4KDMwMHB4LCAxZnIpKTtcbiAgICAgIGdhcDogMjBweDtcbiAgICB9XG4gICAgLmZpZWxkLXJvdyB7XG4gICAgICBwYWRkaW5nOiAxMnB4O1xuICAgICAgYm9yZGVyOiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgIGJhY2tncm91bmQ6ICNmYWZhZmE7XG4gICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgfVxuICAgIC5maWVsZC1yb3cucmVxdWlyZWQge1xuICAgICAgYm9yZGVyLWxlZnQ6IDNweCBzb2xpZCAjZmY2YjZiO1xuICAgIH1cbiAgICAuZmllbGQtbGFiZWwge1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgIGNvbG9yOiAjNDQ0O1xuICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgIGxldHRlci1zcGFjaW5nOiAwLjVweDtcbiAgICAgIG1hcmdpbi1ib3R0b206IDVweDtcbiAgICB9XG4gICAgLmZpZWxkLXZhbHVlIHtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgIGNvbG9yOiAjMzMzO1xuICAgICAgd29yZC13cmFwOiBicmVhay13b3JkO1xuICAgIH1cbiAgICAuZmllbGQtdmFsdWUuZW1wdHkge1xuICAgICAgY29sb3I6ICM5OTk7XG4gICAgICBmb250LXN0eWxlOiBpdGFsaWM7XG4gICAgfVxuICAgIC5wcmludC1tZXRhZGF0YSB7XG4gICAgICBtYXJnaW4tdG9wOiA0MHB4O1xuICAgICAgcGFkZGluZy10b3A6IDIwcHg7XG4gICAgICBib3JkZXItdG9wOiAxcHggc29saWQgI2RkZDtcbiAgICAgIGNvbG9yOiAjOTk5O1xuICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgIH1cbiAgICBAbWVkaWEgcHJpbnQge1xuICAgICAgYm9keSB7IG1hcmdpbjogMDsgcGFkZGluZzogMDsgfVxuICAgICAgLnByaW50LWNvbnRhaW5lciB7IG1heC13aWR0aDogMTAwJTsgcGFkZGluZzogMjBtbTsgfVxuICAgICAgLnByaW50LXNlY3Rpb24geyBwYWdlLWJyZWFrLWluc2lkZTogYXZvaWQ7IH1cbiAgICB9XG4gICAgQHBhZ2UgeyBzaXplOiBBNDsgbWFyZ2luOiAyMG1tOyB9XG4gIGBcblxuICAvLyBHcm91cCBmaWVsZHMgYnkgc3RlcFxuICBsZXQgc2VjdGlvbnNIdG1sID0gJydcblxuICBpZiAoc3RlcHMgJiYgc3RlcHMubGVuZ3RoID4gMCkge1xuICAgIGZvciAoY29uc3Qgc3RlcCBvZiBzdGVwcykge1xuICAgICAgY29uc3Qgc3RlcEZpZWxkcyA9IGZpZWxkcy5maWx0ZXIoKGYpID0+IGYuc3RlcElkID09PSBzdGVwLmlkKVxuICAgICAgaWYgKHN0ZXBGaWVsZHMubGVuZ3RoID09PSAwKSBjb250aW51ZVxuXG4gICAgICBzZWN0aW9uc0h0bWwgKz0gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwicHJpbnQtc2VjdGlvblwiPlxuICAgICAgICAgIDxoMj4ke2VzY2FwZUh0bWwoc3RlcC50aXRsZSl9PC9oMj5cbiAgICAgICAgICAke3N0ZXAuZGVzY3JpcHRpb24gPyBgPHA+JHtlc2NhcGVIdG1sKHN0ZXAuZGVzY3JpcHRpb24pfTwvcD5gIDogJyd9XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZpZWxkcy1ncmlkXCI+XG4gICAgICAgICAgICAke3N0ZXBGaWVsZHMubWFwKChmaWVsZCkgPT4gcmVuZGVyUHJpbnRGaWVsZChmaWVsZCwgdmFsdWVzW2ZpZWxkLmtleV0pKS5qb2luKCcnKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHNlY3Rpb25zSHRtbCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJmaWVsZHMtZ3JpZFwiPlxuICAgICAgICAke2ZpZWxkcy5tYXAoKGZpZWxkKSA9PiByZW5kZXJQcmludEZpZWxkKGZpZWxkLCB2YWx1ZXNbZmllbGQua2V5XSkpLmpvaW4oJycpfVxuICAgICAgPC9kaXY+XG4gICAgYFxuICB9XG5cbiAgcmV0dXJuIGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbCBsYW5nPVwiZW5cIj5cbiAgICA8aGVhZD5cbiAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cbiAgICAgIDx0aXRsZT4ke2VzY2FwZUh0bWwodGl0bGUpfTwvdGl0bGU+XG4gICAgICA8c3R5bGU+JHtkZWZhdWx0U3R5bGVzfSR7Y3VzdG9tU3R5bGVzfTwvc3R5bGU+XG4gICAgPC9oZWFkPlxuICAgIDxib2R5PlxuICAgICAgPGRpdiBjbGFzcz1cInByaW50LWNvbnRhaW5lclwiPlxuICAgICAgICA8aDE+JHtlc2NhcGVIdG1sKHRpdGxlKX08L2gxPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3VidGl0bGVcIj5HZW5lcmF0ZWQgb24gJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9PC9kaXY+XG4gICAgICAgICR7c2VjdGlvbnNIdG1sfVxuICAgICAgICA8ZGl2IGNsYXNzPVwicHJpbnQtbWV0YWRhdGFcIj5cbiAgICAgICAgICA8cD5UaGlzIGlzIGFuIGF1dG9tYXRlZCBmb3JtIHN1Ym1pc3Npb24gcmVwb3J0IGdlbmVyYXRlZCBieSBEeW5hbWljIEZvcm0gRW5naW5lLjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2JvZHk+XG4gICAgPC9odG1sPlxuICBgXG59XG5cbi8vIOKUgOKUgOKUgCBVdGlsaXRpZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmZ1bmN0aW9uIGZvcm1hdFBkZlZhbHVlKGZpZWxkOiBGb3JtRmllbGQsIHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ1tOb3QgcHJvdmlkZWRdJ1xuICB9XG5cbiAgc3dpdGNoIChmaWVsZC50eXBlKSB7XG4gICAgY2FzZSAnQ0hFQ0tCT1gnOlxuICAgICAgcmV0dXJuIHZhbHVlID8gJ1llcycgOiAnTm8nXG5cbiAgICBjYXNlICdEQVRFJzpcbiAgICBjYXNlICdEQVRFX1JBTkdFJzpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IHJhbmdlID0gdmFsdWUgYXMgYW55XG4gICAgICAgIGNvbnN0IGZyb20gPSByYW5nZS5mcm9tID8gbmV3IERhdGUocmFuZ2UuZnJvbSkudG9Mb2NhbGVEYXRlU3RyaW5nKCkgOiAnJ1xuICAgICAgICBjb25zdCB0byA9IHJhbmdlLnRvID8gbmV3IERhdGUocmFuZ2UudG8pLnRvTG9jYWxlRGF0ZVN0cmluZygpIDogJydcbiAgICAgICAgcmV0dXJuIFtmcm9tLCB0b10uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyB0byAnKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBEYXRlKHZhbHVlIGFzIHN0cmluZykudG9Mb2NhbGVEYXRlU3RyaW5nKClcblxuICAgIGNhc2UgJ0RBVEVfVElNRSc6XG4gICAgICByZXR1cm4gbmV3IERhdGUodmFsdWUgYXMgc3RyaW5nKS50b0xvY2FsZVN0cmluZygpXG5cbiAgICBjYXNlICdNVUxUSV9TRUxFQ1QnOlxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUuam9pbignLCAnKSA6IFN0cmluZyh2YWx1ZSlcblxuICAgIGNhc2UgJ0ZJTEVfVVBMT0FEJzpcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUubWFwKChmOiBhbnkpID0+IGYubmFtZSB8fCBTdHJpbmcoZikpLmpvaW4oJywgJylcbiAgICAgIH1cbiAgICAgIHJldHVybiAodmFsdWUgYXMgYW55KT8ubmFtZSA/PyBTdHJpbmcodmFsdWUpXG5cbiAgICBjYXNlICdBRERSRVNTJzpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IGFkZHIgPSB2YWx1ZSBhcyBhbnlcbiAgICAgICAgcmV0dXJuIFthZGRyLnN0cmVldCwgYWRkci5jaXR5LCBhZGRyLnN0YXRlLCBhZGRyLnppcCwgYWRkci5jb3VudHJ5XVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbignLCAnKVxuICAgICAgfVxuICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSlcblxuICAgIGNhc2UgJ1JJQ0hfVEVYVCc6XG4gICAgICAvLyBTdHJpcCBIVE1MIHRhZ3NcbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpLnJlcGxhY2UoLzxbXj5dKj4vZywgJycpXG5cbiAgICBjYXNlICdTSUdOQVRVUkUnOlxuICAgICAgcmV0dXJuICdbU2lnbmF0dXJlIG9uIGZpbGVdJ1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RXN0aW1hdGVkRmllbGRIZWlnaHQoZmllbGQ6IEZvcm1GaWVsZCwgY29sdW1uV2lkdGg6IG51bWJlcik6IG51bWJlciB7XG4gIC8vIEJhc2UgaGVpZ2h0IGluIG1tXG4gIHN3aXRjaCAoZmllbGQudHlwZSkge1xuICAgIGNhc2UgJ1NIT1JUX1RFWFQnOlxuICAgIGNhc2UgJ0VNQUlMJzpcbiAgICBjYXNlICdQSE9ORSc6XG4gICAgY2FzZSAnTlVNQkVSJzpcbiAgICBjYXNlICdEQVRFJzpcbiAgICBjYXNlICdUSU1FJzpcbiAgICBjYXNlICdVUkwnOlxuICAgICAgcmV0dXJuIDhcblxuICAgIGNhc2UgJ1NFTEVDVCc6XG4gICAgY2FzZSAnUkFESU8nOlxuICAgICAgcmV0dXJuIDEwXG5cbiAgICBjYXNlICdDSEVDS0JPWCc6XG4gICAgICByZXR1cm4gNlxuXG4gICAgY2FzZSAnTE9OR19URVhUJzpcbiAgICBjYXNlICdSSUNIX1RFWFQnOlxuICAgICAgcmV0dXJuIDE1XG5cbiAgICBjYXNlICdNVUxUSV9TRUxFQ1QnOlxuICAgICAgcmV0dXJuIDEyXG5cbiAgICBjYXNlICdBRERSRVNTJzpcbiAgICBjYXNlICdGSUVMRF9HUk9VUCc6XG4gICAgICByZXR1cm4gMjBcblxuICAgIGNhc2UgJ0ZJTEVfVVBMT0FEJzpcbiAgICBjYXNlICdEQVRFX1JBTkdFJzpcbiAgICAgIHJldHVybiAxMFxuXG4gICAgY2FzZSAnUkFUSU5HJzpcbiAgICBjYXNlICdTQ0FMRSc6XG4gICAgICByZXR1cm4gMTJcblxuICAgIGNhc2UgJ1NJR05BVFVSRSc6XG4gICAgICByZXR1cm4gMjVcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gOFxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlclByaW50RmllbGQoZmllbGQ6IEZvcm1GaWVsZCwgdmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICBjb25zdCBkaXNwbGF5VmFsdWUgPSB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gJ+KAlCcgOiBTdHJpbmcodmFsdWUpXG4gIGNvbnN0IHJlcXVpcmVkQ2xhc3MgPSBmaWVsZC5yZXF1aXJlZCA/ICdyZXF1aXJlZCcgOiAnJ1xuXG4gIHJldHVybiBgXG4gICAgPGRpdiBjbGFzcz1cImZpZWxkLXJvdyAke3JlcXVpcmVkQ2xhc3N9XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZmllbGQtbGFiZWxcIj5cbiAgICAgICAgJHtlc2NhcGVIdG1sKGZpZWxkLmxhYmVsKX1cbiAgICAgICAgJHtmaWVsZC5yZXF1aXJlZCA/ICcgPHNwYW4gc3R5bGU9XCJjb2xvcjogI2ZmNmI2YjtcIj4qPC9zcGFuPicgOiAnJ31cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZpZWxkLXZhbHVlICR7dmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/ICdlbXB0eScgOiAnJ31cIj5cbiAgICAgICAgJHtlc2NhcGVIdG1sKGRpc3BsYXlWYWx1ZSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgYFxufVxuXG5mdW5jdGlvbiBlc2NhcGVIdG1sKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzAzOTsnLFxuICB9XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL1smPD5cIiddL2csIChjKSA9PiBtYXBbY10pXG59XG4iXX0=