"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDashboardApi = useDashboardApi;
const react_1 = require("react");
/**
 * Hook for interacting with the Dynamic Form Engine dashboard API.
 * Provides methods to fetch forms, submissions, and analytics data.
 */
function useDashboardApi(config) {
    const fetchFn = config.fetchFn || (typeof fetch !== 'undefined' ? fetch : undefined);
    const makeRequest = (0, react_1.useCallback)(async (endpoint) => {
        if (!fetchFn)
            throw new Error('fetch is not available');
        const url = new URL(endpoint, config.baseUrl).toString();
        const response = await fetchFn(url, {
            headers: {
                'Content-Type': 'application/json',
                ...config.headers,
            },
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return response.json();
    }, [config, fetchFn]);
    /**
     * Fetch list of all forms with summaries
     */
    const listForms = (0, react_1.useCallback)(async () => {
        try {
            const result = await makeRequest('/api/forms');
            return { data: result, loading: false, error: null };
        }
        catch (err) {
            return { data: null, loading: false, error: err };
        }
    }, [makeRequest]);
    /**
     * Fetch a specific form by ID
     */
    const getForm = (0, react_1.useCallback)(async (formId) => {
        try {
            const result = await makeRequest(`/api/forms/${formId}`);
            return { data: result, loading: false, error: null };
        }
        catch (err) {
            return { data: null, loading: false, error: err };
        }
    }, [makeRequest]);
    /**
     * Fetch list of submissions, optionally filtered by form
     */
    const listSubmissions = (0, react_1.useCallback)(async (formId) => {
        try {
            const endpoint = formId ? `/api/submissions?formId=${formId}` : '/api/submissions';
            const result = await makeRequest(endpoint);
            return { data: result, loading: false, error: null };
        }
        catch (err) {
            return { data: null, loading: false, error: err };
        }
    }, [makeRequest]);
    /**
     * Fetch a specific submission by ID
     */
    const getSubmission = (0, react_1.useCallback)(async (submissionId) => {
        try {
            const result = await makeRequest(`/api/submissions/${submissionId}`);
            return { data: result, loading: false, error: null };
        }
        catch (err) {
            return { data: null, loading: false, error: err };
        }
    }, [makeRequest]);
    /**
     * Fetch analytics data for the dashboard
     */
    const getAnalytics = (0, react_1.useCallback)(async () => {
        try {
            const result = await makeRequest('/api/analytics');
            return { data: result, loading: false, error: null };
        }
        catch (err) {
            return { data: null, loading: false, error: err };
        }
    }, [makeRequest]);
    return {
        listForms,
        getForm,
        listSubmissions,
        getSubmission,
        getAnalytics,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlRGFzaGJvYXJkQXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidXNlRGFzaGJvYXJkQXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBYUEsMENBcUdDO0FBbEhELGlDQUFtQztBQVNuQzs7O0dBR0c7QUFDSCxTQUFnQixlQUFlLENBQUMsTUFBdUI7SUFDckQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVwRixNQUFNLFdBQVcsR0FBRyxJQUFBLG1CQUFXLEVBQzdCLEtBQUssRUFBTSxRQUFnQixFQUFxQixFQUFFO1FBQ2hELElBQUksQ0FBQyxPQUFPO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO1FBRXZELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ2xDLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyxHQUFHLE1BQU0sQ0FBQyxPQUFPO2FBQ2xCO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQTtRQUMvRCxDQUFDO1FBRUQsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFnQixDQUFBO0lBQ3RDLENBQUMsRUFDRCxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FDbEIsQ0FBQTtJQUVEOztPQUVHO0lBQ0gsTUFBTSxTQUFTLEdBQUcsSUFBQSxtQkFBVyxFQUFDLEtBQUssSUFB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LEVBQUUsQ0FBQTtRQUN0RCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQVksRUFBRSxDQUFBO1FBQzVELENBQUM7SUFDSCxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFBO0lBRWpCLE9BQU87UUFDTCxTQUFTO1FBQ1QsT0FBTztRQUNQLGVBQWU7UUFDZixhQUFhO1FBQ2IsWUFBWTtLQUNiLENBQUE7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgRGFzaGJvYXJkQ29uZmlnLCBGb3JtU3VtbWFyeSwgU3VibWlzc2lvblN1bW1hcnksIEFuYWx5dGljc0RhdGEgfSBmcm9tICcuLi90eXBlcydcblxuaW50ZXJmYWNlIEFwaVJlc3BvbnNlPFQ+IHtcbiAgZGF0YTogVCB8IG51bGxcbiAgbG9hZGluZzogYm9vbGVhblxuICBlcnJvcjogRXJyb3IgfCBudWxsXG59XG5cbi8qKlxuICogSG9vayBmb3IgaW50ZXJhY3Rpbmcgd2l0aCB0aGUgRHluYW1pYyBGb3JtIEVuZ2luZSBkYXNoYm9hcmQgQVBJLlxuICogUHJvdmlkZXMgbWV0aG9kcyB0byBmZXRjaCBmb3Jtcywgc3VibWlzc2lvbnMsIGFuZCBhbmFseXRpY3MgZGF0YS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZURhc2hib2FyZEFwaShjb25maWc6IERhc2hib2FyZENvbmZpZykge1xuICBjb25zdCBmZXRjaEZuID0gY29uZmlnLmZldGNoRm4gfHwgKHR5cGVvZiBmZXRjaCAhPT0gJ3VuZGVmaW5lZCcgPyBmZXRjaCA6IHVuZGVmaW5lZClcblxuICBjb25zdCBtYWtlUmVxdWVzdCA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jIDxULD4oZW5kcG9pbnQ6IHN0cmluZyk6IFByb21pc2U8VCB8IG51bGw+ID0+IHtcbiAgICAgIGlmICghZmV0Y2hGbikgdGhyb3cgbmV3IEVycm9yKCdmZXRjaCBpcyBub3QgYXZhaWxhYmxlJylcblxuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChlbmRwb2ludCwgY29uZmlnLmJhc2VVcmwpLnRvU3RyaW5nKClcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hGbih1cmwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgLi4uY29uZmlnLmhlYWRlcnMsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIHJlcXVlc3QgZmFpbGVkOiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKSBhcyBQcm9taXNlPFQ+XG4gICAgfSxcbiAgICBbY29uZmlnLCBmZXRjaEZuXVxuICApXG5cbiAgLyoqXG4gICAqIEZldGNoIGxpc3Qgb2YgYWxsIGZvcm1zIHdpdGggc3VtbWFyaWVzXG4gICAqL1xuICBjb25zdCBsaXN0Rm9ybXMgPSB1c2VDYWxsYmFjayhhc3luYyAoKTogUHJvbWlzZTxBcGlSZXNwb25zZTxGb3JtU3VtbWFyeVtdPj4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtYWtlUmVxdWVzdDxGb3JtU3VtbWFyeVtdPignL2FwaS9mb3JtcycpXG4gICAgICByZXR1cm4geyBkYXRhOiByZXN1bHQsIGxvYWRpbmc6IGZhbHNlLCBlcnJvcjogbnVsbCB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4geyBkYXRhOiBudWxsLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IGVyciBhcyBFcnJvciB9XG4gICAgfVxuICB9LCBbbWFrZVJlcXVlc3RdKVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhIHNwZWNpZmljIGZvcm0gYnkgSURcbiAgICovXG4gIGNvbnN0IGdldEZvcm0gPSB1c2VDYWxsYmFjayhcbiAgICBhc3luYyAoZm9ybUlkOiBzdHJpbmcpOiBQcm9taXNlPEFwaVJlc3BvbnNlPEZvcm1TdW1tYXJ5Pj4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWFrZVJlcXVlc3Q8Rm9ybVN1bW1hcnk+KGAvYXBpL2Zvcm1zLyR7Zm9ybUlkfWApXG4gICAgICAgIHJldHVybiB7IGRhdGE6IHJlc3VsdCwgbG9hZGluZzogZmFsc2UsIGVycm9yOiBudWxsIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4geyBkYXRhOiBudWxsLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IGVyciBhcyBFcnJvciB9XG4gICAgICB9XG4gICAgfSxcbiAgICBbbWFrZVJlcXVlc3RdXG4gIClcblxuICAvKipcbiAgICogRmV0Y2ggbGlzdCBvZiBzdWJtaXNzaW9ucywgb3B0aW9uYWxseSBmaWx0ZXJlZCBieSBmb3JtXG4gICAqL1xuICBjb25zdCBsaXN0U3VibWlzc2lvbnMgPSB1c2VDYWxsYmFjayhcbiAgICBhc3luYyAoZm9ybUlkPzogc3RyaW5nKTogUHJvbWlzZTxBcGlSZXNwb25zZTxTdWJtaXNzaW9uU3VtbWFyeVtdPj4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZW5kcG9pbnQgPSBmb3JtSWQgPyBgL2FwaS9zdWJtaXNzaW9ucz9mb3JtSWQ9JHtmb3JtSWR9YCA6ICcvYXBpL3N1Ym1pc3Npb25zJ1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtYWtlUmVxdWVzdDxTdWJtaXNzaW9uU3VtbWFyeVtdPihlbmRwb2ludClcbiAgICAgICAgcmV0dXJuIHsgZGF0YTogcmVzdWx0LCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IG51bGwgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiB7IGRhdGE6IG51bGwsIGxvYWRpbmc6IGZhbHNlLCBlcnJvcjogZXJyIGFzIEVycm9yIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFttYWtlUmVxdWVzdF1cbiAgKVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhIHNwZWNpZmljIHN1Ym1pc3Npb24gYnkgSURcbiAgICovXG4gIGNvbnN0IGdldFN1Ym1pc3Npb24gPSB1c2VDYWxsYmFjayhcbiAgICBhc3luYyAoc3VibWlzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPEFwaVJlc3BvbnNlPFN1Ym1pc3Npb25TdW1tYXJ5Pj4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWFrZVJlcXVlc3Q8U3VibWlzc2lvblN1bW1hcnk+KGAvYXBpL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbklkfWApXG4gICAgICAgIHJldHVybiB7IGRhdGE6IHJlc3VsdCwgbG9hZGluZzogZmFsc2UsIGVycm9yOiBudWxsIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4geyBkYXRhOiBudWxsLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IGVyciBhcyBFcnJvciB9XG4gICAgICB9XG4gICAgfSxcbiAgICBbbWFrZVJlcXVlc3RdXG4gIClcblxuICAvKipcbiAgICogRmV0Y2ggYW5hbHl0aWNzIGRhdGEgZm9yIHRoZSBkYXNoYm9hcmRcbiAgICovXG4gIGNvbnN0IGdldEFuYWx5dGljcyA9IHVzZUNhbGxiYWNrKGFzeW5jICgpOiBQcm9taXNlPEFwaVJlc3BvbnNlPEFuYWx5dGljc0RhdGE+PiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1ha2VSZXF1ZXN0PEFuYWx5dGljc0RhdGE+KCcvYXBpL2FuYWx5dGljcycpXG4gICAgICByZXR1cm4geyBkYXRhOiByZXN1bHQsIGxvYWRpbmc6IGZhbHNlLCBlcnJvcjogbnVsbCB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4geyBkYXRhOiBudWxsLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IGVyciBhcyBFcnJvciB9XG4gICAgfVxuICB9LCBbbWFrZVJlcXVlc3RdKVxuXG4gIHJldHVybiB7XG4gICAgbGlzdEZvcm1zLFxuICAgIGdldEZvcm0sXG4gICAgbGlzdFN1Ym1pc3Npb25zLFxuICAgIGdldFN1Ym1pc3Npb24sXG4gICAgZ2V0QW5hbHl0aWNzLFxuICB9XG59XG4iXX0=