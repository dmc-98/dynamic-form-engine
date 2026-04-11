"use strict";
// Observability and tracing utilities
// Optional express types - middleware is generic enough to work with any Node.js web framework
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTracer = createTracer;
exports.createTracingMiddleware = createTracingMiddleware;
/**
 * Create a tracer for distributed tracing and observability.
 * Tracks spans (operations) with timing and attributes for debugging and monitoring.
 */
function createTracer() {
    const traces = [];
    const spanStack = [];
    return {
        startSpan(name, attributes) {
            const span = {
                name,
                startTime: Date.now(),
                attributes: attributes !== null && attributes !== void 0 ? attributes : {},
                status: 'ok',
                children: [],
            };
            // If there's a current span, add this as a child
            const parentSpan = spanStack[spanStack.length - 1];
            if (parentSpan) {
                parentSpan.children.push(span);
            }
            else {
                // Root span
                traces.push(span);
            }
            spanStack.push(span);
            return span;
        },
        endSpan(span) {
            span.endTime = Date.now();
            // Pop from stack
            const topIdx = spanStack.length - 1;
            if (topIdx >= 0 && spanStack[topIdx] === span) {
                spanStack.pop();
            }
        },
        getTraces() {
            return traces;
        },
        clearTraces() {
            traces.length = 0;
            spanStack.length = 0;
        },
    };
}
/**
 * Create Express middleware that traces requests and responses.
 * Automatically creates spans for request duration and captures request/response metadata.
 *
 * @example
 * ```ts
 * import express from 'express'
 * import { createTracer, createTracingMiddleware } from '@dmc-98/dfe-server'
 *
 * const app = express()
 * const tracer = createTracer()
 * app.use(createTracingMiddleware(tracer))
 * ```
 */
function createTracingMiddleware(tracer) {
    return (req, res, next) => {
        const span = tracer.startSpan('http.request', {
            method: req.method,
            path: req.path,
            url: req.originalUrl,
        });
        // Capture response
        const originalJson = res.json;
        if (originalJson) {
            res.json = function (data) {
                span.attributes['http.status'] = res.statusCode;
                span.attributes['http.response_size'] = JSON.stringify(data).length;
                return originalJson.call(this, data);
            };
        }
        const originalSend = res.send;
        if (originalSend) {
            res.send = function (data) {
                span.attributes['http.status'] = res.statusCode;
                if (typeof data === 'string') {
                    span.attributes['http.response_size'] = data.length;
                }
                return originalSend.call(this, data);
            };
        }
        // End span when response finishes
        if (res.on) {
            res.on('finish', () => {
                if (!span.endTime) {
                    span.attributes['http.status'] = res.statusCode;
                    tracer.endSpan(span);
                }
            });
        }
        next();
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9ic2VydmFiaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHNDQUFzQztBQUN0QywrRkFBK0Y7O0FBc0IvRixvQ0E4Q0M7QUFnQkQsMERBeUNDO0FBM0dEOzs7R0FHRztBQUNILFNBQWdCLFlBQVk7SUFDMUIsTUFBTSxNQUFNLEdBQWMsRUFBRSxDQUFBO0lBQzVCLE1BQU0sU0FBUyxHQUFjLEVBQUUsQ0FBQTtJQUUvQixPQUFPO1FBQ0wsU0FBUyxDQUFDLElBQVksRUFBRSxVQUFvQztZQUMxRCxNQUFNLElBQUksR0FBWTtnQkFDcEIsSUFBSTtnQkFDSixTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDckIsVUFBVSxFQUFFLFVBQVUsYUFBVixVQUFVLGNBQVYsVUFBVSxHQUFJLEVBQUU7Z0JBQzVCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFFBQVEsRUFBRSxFQUFFO2FBQ2IsQ0FBQTtZQUVELGlEQUFpRDtZQUNqRCxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUNsRCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNmLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixZQUFZO2dCQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDbkIsQ0FBQztZQUVELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDcEIsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO1FBRUQsT0FBTyxDQUFDLElBQWE7WUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7WUFFekIsaUJBQWlCO1lBQ2pCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO1lBQ25DLElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzlDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUNqQixDQUFDO1FBQ0gsQ0FBQztRQUVELFNBQVM7WUFDUCxPQUFPLE1BQU0sQ0FBQTtRQUNmLENBQUM7UUFFRCxXQUFXO1lBQ1QsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7WUFDakIsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7UUFDdEIsQ0FBQztLQUNGLENBQUE7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILFNBQWdCLHVCQUF1QixDQUFDLE1BQWlCO0lBQ3ZELE9BQU8sQ0FBQyxHQUFRLEVBQUUsR0FBUSxFQUFFLElBQVMsRUFBRSxFQUFFO1FBQ3ZDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFO1lBQzVDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtZQUNsQixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7WUFDZCxHQUFHLEVBQUUsR0FBRyxDQUFDLFdBQVc7U0FDckIsQ0FBQyxDQUFBO1FBRUYsbUJBQW1CO1FBQ25CLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUE7UUFDN0IsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNqQixHQUFHLENBQUMsSUFBSSxHQUFHLFVBQVUsSUFBYTtnQkFDaEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFBO2dCQUMvQyxJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUE7Z0JBQ25FLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDdEMsQ0FBQyxDQUFBO1FBQ0gsQ0FBQztRQUVELE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUE7UUFDN0IsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNqQixHQUFHLENBQUMsSUFBSSxHQUFHLFVBQVUsSUFBYTtnQkFDaEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFBO2dCQUMvQyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtnQkFDckQsQ0FBQztnQkFDRCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3RDLENBQUMsQ0FBQTtRQUNILENBQUM7UUFFRCxrQ0FBa0M7UUFDbEMsSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDWCxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQTtvQkFDL0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDdEIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELElBQUksRUFBRSxDQUFBO0lBQ1IsQ0FBQyxDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIE9ic2VydmFiaWxpdHkgYW5kIHRyYWNpbmcgdXRpbGl0aWVzXG4vLyBPcHRpb25hbCBleHByZXNzIHR5cGVzIC0gbWlkZGxld2FyZSBpcyBnZW5lcmljIGVub3VnaCB0byB3b3JrIHdpdGggYW55IE5vZGUuanMgd2ViIGZyYW1ld29ya1xuXG5leHBvcnQgaW50ZXJmYWNlIERmZVNwYW4ge1xuICBuYW1lOiBzdHJpbmdcbiAgc3RhcnRUaW1lOiBudW1iZXJcbiAgZW5kVGltZT86IG51bWJlclxuICBhdHRyaWJ1dGVzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICBzdGF0dXM6ICdvaycgfCAnZXJyb3InXG4gIGNoaWxkcmVuOiBEZmVTcGFuW11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZmVUcmFjZXIge1xuICBzdGFydFNwYW4obmFtZTogc3RyaW5nLCBhdHRyaWJ1dGVzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBEZmVTcGFuXG4gIGVuZFNwYW4oc3BhbjogRGZlU3Bhbik6IHZvaWRcbiAgZ2V0VHJhY2VzKCk6IERmZVNwYW5bXVxuICBjbGVhclRyYWNlcygpOiB2b2lkXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdHJhY2VyIGZvciBkaXN0cmlidXRlZCB0cmFjaW5nIGFuZCBvYnNlcnZhYmlsaXR5LlxuICogVHJhY2tzIHNwYW5zIChvcGVyYXRpb25zKSB3aXRoIHRpbWluZyBhbmQgYXR0cmlidXRlcyBmb3IgZGVidWdnaW5nIGFuZCBtb25pdG9yaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhY2VyKCk6IERmZVRyYWNlciB7XG4gIGNvbnN0IHRyYWNlczogRGZlU3BhbltdID0gW11cbiAgY29uc3Qgc3BhblN0YWNrOiBEZmVTcGFuW10gPSBbXVxuXG4gIHJldHVybiB7XG4gICAgc3RhcnRTcGFuKG5hbWU6IHN0cmluZywgYXR0cmlidXRlcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogRGZlU3BhbiB7XG4gICAgICBjb25zdCBzcGFuOiBEZmVTcGFuID0ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBzdGFydFRpbWU6IERhdGUubm93KCksXG4gICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMgPz8ge30sXG4gICAgICAgIHN0YXR1czogJ29rJyxcbiAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSdzIGEgY3VycmVudCBzcGFuLCBhZGQgdGhpcyBhcyBhIGNoaWxkXG4gICAgICBjb25zdCBwYXJlbnRTcGFuID0gc3BhblN0YWNrW3NwYW5TdGFjay5sZW5ndGggLSAxXVxuICAgICAgaWYgKHBhcmVudFNwYW4pIHtcbiAgICAgICAgcGFyZW50U3Bhbi5jaGlsZHJlbi5wdXNoKHNwYW4pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSb290IHNwYW5cbiAgICAgICAgdHJhY2VzLnB1c2goc3BhbilcbiAgICAgIH1cblxuICAgICAgc3BhblN0YWNrLnB1c2goc3BhbilcbiAgICAgIHJldHVybiBzcGFuXG4gICAgfSxcblxuICAgIGVuZFNwYW4oc3BhbjogRGZlU3Bhbik6IHZvaWQge1xuICAgICAgc3Bhbi5lbmRUaW1lID0gRGF0ZS5ub3coKVxuXG4gICAgICAvLyBQb3AgZnJvbSBzdGFja1xuICAgICAgY29uc3QgdG9wSWR4ID0gc3BhblN0YWNrLmxlbmd0aCAtIDFcbiAgICAgIGlmICh0b3BJZHggPj0gMCAmJiBzcGFuU3RhY2tbdG9wSWR4XSA9PT0gc3Bhbikge1xuICAgICAgICBzcGFuU3RhY2sucG9wKClcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0VHJhY2VzKCk6IERmZVNwYW5bXSB7XG4gICAgICByZXR1cm4gdHJhY2VzXG4gICAgfSxcblxuICAgIGNsZWFyVHJhY2VzKCk6IHZvaWQge1xuICAgICAgdHJhY2VzLmxlbmd0aCA9IDBcbiAgICAgIHNwYW5TdGFjay5sZW5ndGggPSAwXG4gICAgfSxcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBFeHByZXNzIG1pZGRsZXdhcmUgdGhhdCB0cmFjZXMgcmVxdWVzdHMgYW5kIHJlc3BvbnNlcy5cbiAqIEF1dG9tYXRpY2FsbHkgY3JlYXRlcyBzcGFucyBmb3IgcmVxdWVzdCBkdXJhdGlvbiBhbmQgY2FwdHVyZXMgcmVxdWVzdC9yZXNwb25zZSBtZXRhZGF0YS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG4gKiBpbXBvcnQgeyBjcmVhdGVUcmFjZXIsIGNyZWF0ZVRyYWNpbmdNaWRkbGV3YXJlIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtc2VydmVyJ1xuICpcbiAqIGNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuICogY29uc3QgdHJhY2VyID0gY3JlYXRlVHJhY2VyKClcbiAqIGFwcC51c2UoY3JlYXRlVHJhY2luZ01pZGRsZXdhcmUodHJhY2VyKSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhY2luZ01pZGRsZXdhcmUodHJhY2VyOiBEZmVUcmFjZXIpIHtcbiAgcmV0dXJuIChyZXE6IGFueSwgcmVzOiBhbnksIG5leHQ6IGFueSkgPT4ge1xuICAgIGNvbnN0IHNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCdodHRwLnJlcXVlc3QnLCB7XG4gICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICBwYXRoOiByZXEucGF0aCxcbiAgICAgIHVybDogcmVxLm9yaWdpbmFsVXJsLFxuICAgIH0pXG5cbiAgICAvLyBDYXB0dXJlIHJlc3BvbnNlXG4gICAgY29uc3Qgb3JpZ2luYWxKc29uID0gcmVzLmpzb25cbiAgICBpZiAob3JpZ2luYWxKc29uKSB7XG4gICAgICByZXMuanNvbiA9IGZ1bmN0aW9uIChkYXRhOiB1bmtub3duKSB7XG4gICAgICAgIHNwYW4uYXR0cmlidXRlc1snaHR0cC5zdGF0dXMnXSA9IHJlcy5zdGF0dXNDb2RlXG4gICAgICAgIHNwYW4uYXR0cmlidXRlc1snaHR0cC5yZXNwb25zZV9zaXplJ10gPSBKU09OLnN0cmluZ2lmeShkYXRhKS5sZW5ndGhcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsSnNvbi5jYWxsKHRoaXMsIGRhdGEpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgb3JpZ2luYWxTZW5kID0gcmVzLnNlbmRcbiAgICBpZiAob3JpZ2luYWxTZW5kKSB7XG4gICAgICByZXMuc2VuZCA9IGZ1bmN0aW9uIChkYXRhOiB1bmtub3duKSB7XG4gICAgICAgIHNwYW4uYXR0cmlidXRlc1snaHR0cC5zdGF0dXMnXSA9IHJlcy5zdGF0dXNDb2RlXG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBzcGFuLmF0dHJpYnV0ZXNbJ2h0dHAucmVzcG9uc2Vfc2l6ZSddID0gZGF0YS5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3JpZ2luYWxTZW5kLmNhbGwodGhpcywgZGF0YSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFbmQgc3BhbiB3aGVuIHJlc3BvbnNlIGZpbmlzaGVzXG4gICAgaWYgKHJlcy5vbikge1xuICAgICAgcmVzLm9uKCdmaW5pc2gnLCAoKSA9PiB7XG4gICAgICAgIGlmICghc3Bhbi5lbmRUaW1lKSB7XG4gICAgICAgICAgc3Bhbi5hdHRyaWJ1dGVzWydodHRwLnN0YXR1cyddID0gcmVzLnN0YXR1c0NvZGVcbiAgICAgICAgICB0cmFjZXIuZW5kU3BhbihzcGFuKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIG5leHQoKVxuICB9XG59XG4iXX0=