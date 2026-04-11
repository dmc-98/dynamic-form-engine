"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
const uuid_1 = require("uuid");
/**
 * Generate a UUIDv7 (time-ordered UUID).
 *
 * UUIDv7 is preferred over v4 for database primary keys because:
 * - Time-ordered: sorts chronologically, good for B-tree indexes
 * - Monotonic: generated IDs in the same millisecond are ordered
 * - Unique: still cryptographically unique like v4
 *
 * @returns A UUIDv7 string (e.g., "0190a5b2-3c4d-7e5f-8a1b-2c3d4e5f6a7b")
 */
function generateId() {
    return (0, uuid_1.v7)();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXVpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV1aWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFZQSxnQ0FFQztBQWRELCtCQUFtQztBQUVuQzs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFnQixVQUFVO0lBQ3hCLE9BQU8sSUFBQSxTQUFNLEdBQUUsQ0FBQTtBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdjcgYXMgdXVpZHY3IH0gZnJvbSAndXVpZCdcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIFVVSUR2NyAodGltZS1vcmRlcmVkIFVVSUQpLlxuICpcbiAqIFVVSUR2NyBpcyBwcmVmZXJyZWQgb3ZlciB2NCBmb3IgZGF0YWJhc2UgcHJpbWFyeSBrZXlzIGJlY2F1c2U6XG4gKiAtIFRpbWUtb3JkZXJlZDogc29ydHMgY2hyb25vbG9naWNhbGx5LCBnb29kIGZvciBCLXRyZWUgaW5kZXhlc1xuICogLSBNb25vdG9uaWM6IGdlbmVyYXRlZCBJRHMgaW4gdGhlIHNhbWUgbWlsbGlzZWNvbmQgYXJlIG9yZGVyZWRcbiAqIC0gVW5pcXVlOiBzdGlsbCBjcnlwdG9ncmFwaGljYWxseSB1bmlxdWUgbGlrZSB2NFxuICpcbiAqIEByZXR1cm5zIEEgVVVJRHY3IHN0cmluZyAoZS5nLiwgXCIwMTkwYTViMi0zYzRkLTdlNWYtOGExYi0yYzNkNGU1ZjZhN2JcIilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgcmV0dXJuIHV1aWR2NygpXG59XG4iXX0=