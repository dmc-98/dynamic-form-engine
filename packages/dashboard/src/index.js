"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateGallery = exports.AnalyticsPanel = exports.SubmissionsList = exports.FormsList = exports.DfeDashboard = exports.useDashboardApi = void 0;
// Hooks
var useDashboardApi_1 = require("./hooks/useDashboardApi");
Object.defineProperty(exports, "useDashboardApi", { enumerable: true, get: function () { return useDashboardApi_1.useDashboardApi; } });
// Components
var DfeDashboard_1 = require("./components/DfeDashboard");
Object.defineProperty(exports, "DfeDashboard", { enumerable: true, get: function () { return DfeDashboard_1.DfeDashboard; } });
var FormsList_1 = require("./components/FormsList");
Object.defineProperty(exports, "FormsList", { enumerable: true, get: function () { return FormsList_1.FormsList; } });
var SubmissionsList_1 = require("./components/SubmissionsList");
Object.defineProperty(exports, "SubmissionsList", { enumerable: true, get: function () { return SubmissionsList_1.SubmissionsList; } });
var AnalyticsPanel_1 = require("./components/AnalyticsPanel");
Object.defineProperty(exports, "AnalyticsPanel", { enumerable: true, get: function () { return AnalyticsPanel_1.AnalyticsPanel; } });
var TemplateGallery_1 = require("./components/TemplateGallery");
Object.defineProperty(exports, "TemplateGallery", { enumerable: true, get: function () { return TemplateGallery_1.TemplateGallery; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxRQUFRO0FBQ1IsMkRBQXlEO0FBQWhELGtIQUFBLGVBQWUsT0FBQTtBQUV4QixhQUFhO0FBQ2IsMERBQXdEO0FBQS9DLDRHQUFBLFlBQVksT0FBQTtBQUdyQixvREFBa0Q7QUFBekMsc0dBQUEsU0FBUyxPQUFBO0FBR2xCLGdFQUE4RDtBQUFyRCxrSEFBQSxlQUFlLE9BQUE7QUFHeEIsOERBQTREO0FBQW5ELGdIQUFBLGNBQWMsT0FBQTtBQUd2QixnRUFBOEQ7QUFBckQsa0hBQUEsZUFBZSxPQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVHlwZXNcbmV4cG9ydCB0eXBlIHsgRGFzaGJvYXJkQ29uZmlnLCBGb3JtU3VtbWFyeSwgU3VibWlzc2lvblN1bW1hcnksIEFuYWx5dGljc0RhdGEsIERhc2hib2FyZFZpZXcgfSBmcm9tICcuL3R5cGVzJ1xuXG4vLyBIb29rc1xuZXhwb3J0IHsgdXNlRGFzaGJvYXJkQXBpIH0gZnJvbSAnLi9ob29rcy91c2VEYXNoYm9hcmRBcGknXG5cbi8vIENvbXBvbmVudHNcbmV4cG9ydCB7IERmZURhc2hib2FyZCB9IGZyb20gJy4vY29tcG9uZW50cy9EZmVEYXNoYm9hcmQnXG5leHBvcnQgdHlwZSB7IERmZURhc2hib2FyZFByb3BzIH0gZnJvbSAnLi9jb21wb25lbnRzL0RmZURhc2hib2FyZCdcblxuZXhwb3J0IHsgRm9ybXNMaXN0IH0gZnJvbSAnLi9jb21wb25lbnRzL0Zvcm1zTGlzdCdcbmV4cG9ydCB0eXBlIHsgRm9ybXNMaXN0UHJvcHMgfSBmcm9tICcuL2NvbXBvbmVudHMvRm9ybXNMaXN0J1xuXG5leHBvcnQgeyBTdWJtaXNzaW9uc0xpc3QgfSBmcm9tICcuL2NvbXBvbmVudHMvU3VibWlzc2lvbnNMaXN0J1xuZXhwb3J0IHR5cGUgeyBTdWJtaXNzaW9uc0xpc3RQcm9wcyB9IGZyb20gJy4vY29tcG9uZW50cy9TdWJtaXNzaW9uc0xpc3QnXG5cbmV4cG9ydCB7IEFuYWx5dGljc1BhbmVsIH0gZnJvbSAnLi9jb21wb25lbnRzL0FuYWx5dGljc1BhbmVsJ1xuZXhwb3J0IHR5cGUgeyBBbmFseXRpY3NQYW5lbFByb3BzIH0gZnJvbSAnLi9jb21wb25lbnRzL0FuYWx5dGljc1BhbmVsJ1xuXG5leHBvcnQgeyBUZW1wbGF0ZUdhbGxlcnkgfSBmcm9tICcuL2NvbXBvbmVudHMvVGVtcGxhdGVHYWxsZXJ5J1xuIl19