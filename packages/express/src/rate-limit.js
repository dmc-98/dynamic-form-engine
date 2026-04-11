"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = createRateLimiter;
/**
 * Create a token-bucket rate limiter middleware.
 * Uses in-memory token buckets to track request rates per client.
 *
 * @example
 * ```ts
 * app.use(createRateLimiter({
 *   windowMs: 60000, // 1 minute
 *   maxRequests: 100,
 *   keyExtractor: (req) => req.user?.id ?? req.ip,
 * }))
 * ```
 */
function createRateLimiter(options) {
    const { windowMs, maxRequests, keyExtractor = (req) => { var _a; return (_a = req.ip) !== null && _a !== void 0 ? _a : 'unknown'; }, onLimitReached, statusCode = 429, message = 'Too many requests, please try again later', } = options;
    // In-memory store of token buckets
    const buckets = new Map();
    // Cleanup stale buckets every minute
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, state] of buckets.entries()) {
            if (now > state.resetAt + windowMs) {
                buckets.delete(key);
            }
        }
    }, 60000);
    return (req, res, next) => {
        try {
            const key = keyExtractor(req);
            const now = Date.now();
            // Get or create bucket
            let bucket = buckets.get(key);
            if (!bucket) {
                bucket = { tokens: maxRequests, resetAt: now + windowMs };
                buckets.set(key, bucket);
            }
            // Reset if window has passed
            if (now > bucket.resetAt) {
                bucket.tokens = maxRequests;
                bucket.resetAt = now + windowMs;
            }
            // Check if we have tokens
            if (bucket.tokens > 0) {
                bucket.tokens--;
                next();
            }
            else {
                onLimitReached === null || onLimitReached === void 0 ? void 0 : onLimitReached(req, res);
                res.status(statusCode).json({ error: message });
            }
        }
        catch (err) {
            // On error, allow the request to proceed
            next();
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF0ZS1saW1pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJhdGUtbGltaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFtQ0EsOENBc0RDO0FBbkVEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLE9BQXlCO0lBQ3pELE1BQU0sRUFDSixRQUFRLEVBQ1IsV0FBVyxFQUNYLFlBQVksR0FBRyxDQUFDLEdBQVksRUFBRSxFQUFFLFdBQUMsT0FBQSxNQUFBLEdBQUcsQ0FBQyxFQUFFLG1DQUFJLFNBQVMsQ0FBQSxFQUFBLEVBQ3BELGNBQWMsRUFDZCxVQUFVLEdBQUcsR0FBRyxFQUNoQixPQUFPLEdBQUcsMkNBQTJDLEdBQ3RELEdBQUcsT0FBTyxDQUFBO0lBRVgsbUNBQW1DO0lBQ25DLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFBO0lBRW5ELHFDQUFxQztJQUNyQyxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUN0QixLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7WUFDN0MsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNyQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUVULE9BQU8sQ0FBQyxHQUFZLEVBQUUsR0FBYSxFQUFFLElBQWtCLEVBQUUsRUFBRTtRQUN6RCxJQUFJLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBRXRCLHVCQUF1QjtZQUN2QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzdCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDWixNQUFNLEdBQUcsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLENBQUE7Z0JBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQzFCLENBQUM7WUFFRCw2QkFBNkI7WUFDN0IsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN6QixNQUFNLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQTtnQkFDM0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFBO1lBQ2pDLENBQUM7WUFFRCwwQkFBMEI7WUFDMUIsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUE7Z0JBQ2YsSUFBSSxFQUFFLENBQUE7WUFDUixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sY0FBYyxhQUFkLGNBQWMsdUJBQWQsY0FBYyxDQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDMUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUNqRCxDQUFDO1FBQ0gsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYix5Q0FBeUM7WUFDekMsSUFBSSxFQUFFLENBQUE7UUFDUixDQUFDO0lBQ0gsQ0FBQyxDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgUmVxdWVzdCwgUmVzcG9uc2UsIE5leHRGdW5jdGlvbiB9IGZyb20gJ2V4cHJlc3MnXG5cbmV4cG9ydCBpbnRlcmZhY2UgUmF0ZUxpbWl0T3B0aW9ucyB7XG4gIC8qKiBUaW1lIHdpbmRvdyBpbiBtaWxsaXNlY29uZHMgKi9cbiAgd2luZG93TXM6IG51bWJlclxuICAvKiogTWF4aW11bSBudW1iZXIgb2YgcmVxdWVzdHMgcGVyIHdpbmRvdyAqL1xuICBtYXhSZXF1ZXN0czogbnVtYmVyXG4gIC8qKiBGdW5jdGlvbiB0byBleHRyYWN0IGEga2V5IGZyb20gdGhlIHJlcXVlc3QgKGRlZmF1bHQ6IHJlcS5pcCkgKi9cbiAga2V5RXh0cmFjdG9yPzogKHJlcTogUmVxdWVzdCkgPT4gc3RyaW5nXG4gIC8qKiBDYWxsYmFjayB3aGVuIHJhdGUgbGltaXQgaXMgcmVhY2hlZCAqL1xuICBvbkxpbWl0UmVhY2hlZD86IChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHZvaWRcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgdG8gcmV0dXJuIHdoZW4gbGltaXQgZXhjZWVkZWQgKGRlZmF1bHQ6IDQyOSkgKi9cbiAgc3RhdHVzQ29kZT86IG51bWJlclxuICAvKiogTWVzc2FnZSB0byByZXR1cm4gd2hlbiBsaW1pdCBleGNlZWRlZCAqL1xuICBtZXNzYWdlPzogc3RyaW5nXG59XG5cbmludGVyZmFjZSBUb2tlbkJ1Y2tldFN0YXRlIHtcbiAgdG9rZW5zOiBudW1iZXJcbiAgcmVzZXRBdDogbnVtYmVyXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdG9rZW4tYnVja2V0IHJhdGUgbGltaXRlciBtaWRkbGV3YXJlLlxuICogVXNlcyBpbi1tZW1vcnkgdG9rZW4gYnVja2V0cyB0byB0cmFjayByZXF1ZXN0IHJhdGVzIHBlciBjbGllbnQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBhcHAudXNlKGNyZWF0ZVJhdGVMaW1pdGVyKHtcbiAqICAgd2luZG93TXM6IDYwMDAwLCAvLyAxIG1pbnV0ZVxuICogICBtYXhSZXF1ZXN0czogMTAwLFxuICogICBrZXlFeHRyYWN0b3I6IChyZXEpID0+IHJlcS51c2VyPy5pZCA/PyByZXEuaXAsXG4gKiB9KSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmF0ZUxpbWl0ZXIob3B0aW9uczogUmF0ZUxpbWl0T3B0aW9ucykge1xuICBjb25zdCB7XG4gICAgd2luZG93TXMsXG4gICAgbWF4UmVxdWVzdHMsXG4gICAga2V5RXh0cmFjdG9yID0gKHJlcTogUmVxdWVzdCkgPT4gcmVxLmlwID8/ICd1bmtub3duJyxcbiAgICBvbkxpbWl0UmVhY2hlZCxcbiAgICBzdGF0dXNDb2RlID0gNDI5LFxuICAgIG1lc3NhZ2UgPSAnVG9vIG1hbnkgcmVxdWVzdHMsIHBsZWFzZSB0cnkgYWdhaW4gbGF0ZXInLFxuICB9ID0gb3B0aW9uc1xuXG4gIC8vIEluLW1lbW9yeSBzdG9yZSBvZiB0b2tlbiBidWNrZXRzXG4gIGNvbnN0IGJ1Y2tldHMgPSBuZXcgTWFwPHN0cmluZywgVG9rZW5CdWNrZXRTdGF0ZT4oKVxuXG4gIC8vIENsZWFudXAgc3RhbGUgYnVja2V0cyBldmVyeSBtaW51dGVcbiAgY29uc3QgY2xlYW51cEludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KClcbiAgICBmb3IgKGNvbnN0IFtrZXksIHN0YXRlXSBvZiBidWNrZXRzLmVudHJpZXMoKSkge1xuICAgICAgaWYgKG5vdyA+IHN0YXRlLnJlc2V0QXQgKyB3aW5kb3dNcykge1xuICAgICAgICBidWNrZXRzLmRlbGV0ZShrZXkpXG4gICAgICB9XG4gICAgfVxuICB9LCA2MDAwMClcblxuICByZXR1cm4gKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGtleSA9IGtleUV4dHJhY3RvcihyZXEpXG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG5cbiAgICAgIC8vIEdldCBvciBjcmVhdGUgYnVja2V0XG4gICAgICBsZXQgYnVja2V0ID0gYnVja2V0cy5nZXQoa2V5KVxuICAgICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0geyB0b2tlbnM6IG1heFJlcXVlc3RzLCByZXNldEF0OiBub3cgKyB3aW5kb3dNcyB9XG4gICAgICAgIGJ1Y2tldHMuc2V0KGtleSwgYnVja2V0KVxuICAgICAgfVxuXG4gICAgICAvLyBSZXNldCBpZiB3aW5kb3cgaGFzIHBhc3NlZFxuICAgICAgaWYgKG5vdyA+IGJ1Y2tldC5yZXNldEF0KSB7XG4gICAgICAgIGJ1Y2tldC50b2tlbnMgPSBtYXhSZXF1ZXN0c1xuICAgICAgICBidWNrZXQucmVzZXRBdCA9IG5vdyArIHdpbmRvd01zXG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgdG9rZW5zXG4gICAgICBpZiAoYnVja2V0LnRva2VucyA+IDApIHtcbiAgICAgICAgYnVja2V0LnRva2Vucy0tXG4gICAgICAgIG5leHQoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb25MaW1pdFJlYWNoZWQ/LihyZXEsIHJlcylcbiAgICAgICAgcmVzLnN0YXR1cyhzdGF0dXNDb2RlKS5qc29uKHsgZXJyb3I6IG1lc3NhZ2UgfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIE9uIGVycm9yLCBhbGxvdyB0aGUgcmVxdWVzdCB0byBwcm9jZWVkXG4gICAgICBuZXh0KClcbiAgICB9XG4gIH1cbn1cbiJdfQ==