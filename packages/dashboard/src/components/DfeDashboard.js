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
exports.DfeDashboard = void 0;
const react_1 = __importStar(require("react"));
const FormsList_1 = require("./FormsList");
const SubmissionsList_1 = require("./SubmissionsList");
const AnalyticsPanel_1 = require("./AnalyticsPanel");
const TemplateGallery_1 = require("./TemplateGallery");
/**
 * Main dashboard layout component for the Dynamic Form Engine.
 * Provides navigation between Forms, Submissions, Analytics, and Templates views.
 */
const DfeDashboard = ({ config, onFormEdit, onFormCreate, }) => {
    var _a;
    const [currentView, setCurrentView] = (0, react_1.useState)('forms');
    const navItems = [
        { id: 'forms', label: 'Forms', icon: '📋' },
        { id: 'submissions', label: 'Submissions', icon: '📝' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
        { id: 'templates', label: 'Templates', icon: '📦' },
    ];
    return (<div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar Navigation */}
      <aside style={{
            width: '220px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            padding: '20px',
            borderRight: '1px solid #333',
            overflowY: 'auto',
        }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '30px' }}>
          DFE Dashboard
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (<button key={item.id} onClick={() => setCurrentView(item.id)} style={{
                padding: '10px 12px',
                backgroundColor: currentView === item.id ? '#0066cc' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                transition: 'background-color 0.2s',
            }} onMouseEnter={(e) => {
                if (currentView !== item.id) {
                    e.currentTarget.style.backgroundColor = '#333';
                }
            }} onMouseLeave={(e) => {
                if (currentView !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }
            }}>
              {item.icon} {item.label}
            </button>))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f5f5f5',
            overflowY: 'auto',
        }}>
        {/* Header */}
        <header style={{
            padding: '20px 30px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>
            {(_a = navItems.find((item) => item.id === currentView)) === null || _a === void 0 ? void 0 : _a.label}
          </h1>

          {currentView === 'forms' && onFormCreate && (<button onClick={onFormCreate} style={{
                padding: '8px 16px',
                backgroundColor: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
            }}>
              Create Form
            </button>)}
        </header>

        {/* View Content */}
        <div style={{ padding: '30px', flex: 1, overflow: 'auto' }}>
          {currentView === 'forms' && (<FormsList_1.FormsList config={config} onFormEdit={onFormEdit}/>)}
          {currentView === 'submissions' && <SubmissionsList_1.SubmissionsList config={config}/>}
          {currentView === 'analytics' && <AnalyticsPanel_1.AnalyticsPanel config={config}/>}
          {currentView === 'templates' && <TemplateGallery_1.TemplateGallery />}
        </div>
      </main>
    </div>);
};
exports.DfeDashboard = DfeDashboard;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGZlRGFzaGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRGZlRGFzaGJvYXJkLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBdUM7QUFFdkMsMkNBQXVDO0FBQ3ZDLHVEQUFtRDtBQUNuRCxxREFBaUQ7QUFDakQsdURBQW1EO0FBUW5EOzs7R0FHRztBQUNJLE1BQU0sWUFBWSxHQUFnQyxDQUFDLEVBQ3hELE1BQU0sRUFDTixVQUFVLEVBQ1YsWUFBWSxHQUNiLEVBQUUsRUFBRTs7SUFDSCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBZ0IsT0FBTyxDQUFDLENBQUE7SUFFdEUsTUFBTSxRQUFRLEdBQThEO1FBQzFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7UUFDM0MsRUFBRSxFQUFFLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtRQUN2RCxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ25ELEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7S0FDcEQsQ0FBQTtJQUVELE9BQU8sQ0FDTCxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsc0NBQXNDLEVBQUUsQ0FBQyxDQUNuRztNQUFBLENBQUMsd0JBQXdCLENBQ3pCO01BQUEsQ0FBQyxLQUFLLENBQ0osS0FBSyxDQUFDLENBQUM7WUFDTCxLQUFLLEVBQUUsT0FBTztZQUNkLGVBQWUsRUFBRSxT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QUssV0FBVyxJQUFJLENBQUMsaUNBQWUsQ0FBQyxBQUFELEVBQUcsQ0FDckQ7UUFBQSxFQUFFLEdBQUcsQ0FDUDtNQUFBLEVBQUUsSUFBSSxDQUNSO0lBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBeEhZLFFBQUEsWUFBWSxnQkF3SHhCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IERhc2hib2FyZENvbmZpZywgRGFzaGJvYXJkVmlldyB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgRm9ybXNMaXN0IH0gZnJvbSAnLi9Gb3Jtc0xpc3QnXG5pbXBvcnQgeyBTdWJtaXNzaW9uc0xpc3QgfSBmcm9tICcuL1N1Ym1pc3Npb25zTGlzdCdcbmltcG9ydCB7IEFuYWx5dGljc1BhbmVsIH0gZnJvbSAnLi9BbmFseXRpY3NQYW5lbCdcbmltcG9ydCB7IFRlbXBsYXRlR2FsbGVyeSB9IGZyb20gJy4vVGVtcGxhdGVHYWxsZXJ5J1xuXG5leHBvcnQgaW50ZXJmYWNlIERmZURhc2hib2FyZFByb3BzIHtcbiAgY29uZmlnOiBEYXNoYm9hcmRDb25maWdcbiAgb25Gb3JtRWRpdD86IChmb3JtSWQ6IHN0cmluZykgPT4gdm9pZFxuICBvbkZvcm1DcmVhdGU/OiAoKSA9PiB2b2lkXG59XG5cbi8qKlxuICogTWFpbiBkYXNoYm9hcmQgbGF5b3V0IGNvbXBvbmVudCBmb3IgdGhlIER5bmFtaWMgRm9ybSBFbmdpbmUuXG4gKiBQcm92aWRlcyBuYXZpZ2F0aW9uIGJldHdlZW4gRm9ybXMsIFN1Ym1pc3Npb25zLCBBbmFseXRpY3MsIGFuZCBUZW1wbGF0ZXMgdmlld3MuXG4gKi9cbmV4cG9ydCBjb25zdCBEZmVEYXNoYm9hcmQ6IFJlYWN0LkZDPERmZURhc2hib2FyZFByb3BzPiA9ICh7XG4gIGNvbmZpZyxcbiAgb25Gb3JtRWRpdCxcbiAgb25Gb3JtQ3JlYXRlLFxufSkgPT4ge1xuICBjb25zdCBbY3VycmVudFZpZXcsIHNldEN1cnJlbnRWaWV3XSA9IHVzZVN0YXRlPERhc2hib2FyZFZpZXc+KCdmb3JtcycpXG5cbiAgY29uc3QgbmF2SXRlbXM6IEFycmF5PHsgaWQ6IERhc2hib2FyZFZpZXc7IGxhYmVsOiBzdHJpbmc7IGljb246IHN0cmluZyB9PiA9IFtcbiAgICB7IGlkOiAnZm9ybXMnLCBsYWJlbDogJ0Zvcm1zJywgaWNvbjogJ/Cfk4snIH0sXG4gICAgeyBpZDogJ3N1Ym1pc3Npb25zJywgbGFiZWw6ICdTdWJtaXNzaW9ucycsIGljb246ICfwn5OdJyB9LFxuICAgIHsgaWQ6ICdhbmFseXRpY3MnLCBsYWJlbDogJ0FuYWx5dGljcycsIGljb246ICfwn5OKJyB9LFxuICAgIHsgaWQ6ICd0ZW1wbGF0ZXMnLCBsYWJlbDogJ1RlbXBsYXRlcycsIGljb246ICfwn5OmJyB9LFxuICBdXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgaGVpZ2h0OiAnMTAwdmgnLCBmb250RmFtaWx5OiAnc3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBzYW5zLXNlcmlmJyB9fT5cbiAgICAgIHsvKiBTaWRlYmFyIE5hdmlnYXRpb24gKi99XG4gICAgICA8YXNpZGVcbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICB3aWR0aDogJzIyMHB4JyxcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjMWExYTFhJyxcbiAgICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICAgIHBhZGRpbmc6ICcyMHB4JyxcbiAgICAgICAgICBib3JkZXJSaWdodDogJzFweCBzb2xpZCAjMzMzJyxcbiAgICAgICAgICBvdmVyZmxvd1k6ICdhdXRvJyxcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAgPGRpdiBzdHlsZT17eyBmb250U2l6ZTogJzE2cHgnLCBmb250V2VpZ2h0OiAnYm9sZCcsIG1hcmdpbkJvdHRvbTogJzMwcHgnIH19PlxuICAgICAgICAgIERGRSBEYXNoYm9hcmRcbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPG5hdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc4cHgnIH19PlxuICAgICAgICAgIHtuYXZJdGVtcy5tYXAoKGl0ZW0pID0+IChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAga2V5PXtpdGVtLmlkfVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRDdXJyZW50VmlldyhpdGVtLmlkKX1cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMTBweCAxMnB4JyxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGN1cnJlbnRWaWV3ID09PSBpdGVtLmlkID8gJyMwMDY2Y2MnIDogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnYmFja2dyb3VuZC1jb2xvciAwLjJzJyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VmlldyAhPT0gaXRlbS5pZCkge1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjMzMzJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VmlldyAhPT0gaXRlbS5pZCkge1xuICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtpdGVtLmljb259IHtpdGVtLmxhYmVsfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvbmF2PlxuICAgICAgPC9hc2lkZT5cblxuICAgICAgey8qIE1haW4gQ29udGVudCBBcmVhICovfVxuICAgICAgPG1haW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjZjVmNWY1JyxcbiAgICAgICAgICBvdmVyZmxvd1k6ICdhdXRvJyxcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAgey8qIEhlYWRlciAqL31cbiAgICAgICAgPGhlYWRlclxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBwYWRkaW5nOiAnMjBweCAzMHB4JyxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgYm9yZGVyQm90dG9tOiAnMXB4IHNvbGlkICNlMGUwZTAnLFxuICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJyxcbiAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICA8aDEgc3R5bGU9e3sgbWFyZ2luOiAwLCBmb250U2l6ZTogJzI0cHgnLCBjb2xvcjogJyMxYTFhMWEnIH19PlxuICAgICAgICAgICAge25hdkl0ZW1zLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IGN1cnJlbnRWaWV3KT8ubGFiZWx9XG4gICAgICAgICAgPC9oMT5cblxuICAgICAgICAgIHtjdXJyZW50VmlldyA9PT0gJ2Zvcm1zJyAmJiBvbkZvcm1DcmVhdGUgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBvbkNsaWNrPXtvbkZvcm1DcmVhdGV9XG4gICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogJzhweCAxNnB4JyxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjMDA2NmNjJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzZweCcsXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcbiAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiAnNjAwJyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgQ3JlYXRlIEZvcm1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvaGVhZGVyPlxuXG4gICAgICAgIHsvKiBWaWV3IENvbnRlbnQgKi99XG4gICAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogJzMwcHgnLCBmbGV4OiAxLCBvdmVyZmxvdzogJ2F1dG8nIH19PlxuICAgICAgICAgIHtjdXJyZW50VmlldyA9PT0gJ2Zvcm1zJyAmJiAoXG4gICAgICAgICAgICA8Rm9ybXNMaXN0IGNvbmZpZz17Y29uZmlnfSBvbkZvcm1FZGl0PXtvbkZvcm1FZGl0fSAvPlxuICAgICAgICAgICl9XG4gICAgICAgICAge2N1cnJlbnRWaWV3ID09PSAnc3VibWlzc2lvbnMnICYmIDxTdWJtaXNzaW9uc0xpc3QgY29uZmlnPXtjb25maWd9IC8+fVxuICAgICAgICAgIHtjdXJyZW50VmlldyA9PT0gJ2FuYWx5dGljcycgJiYgPEFuYWx5dGljc1BhbmVsIGNvbmZpZz17Y29uZmlnfSAvPn1cbiAgICAgICAgICB7Y3VycmVudFZpZXcgPT09ICd0ZW1wbGF0ZXMnICYmIDxUZW1wbGF0ZUdhbGxlcnkgLz59XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9tYWluPlxuICAgIDwvZGl2PlxuICApXG59XG4iXX0=