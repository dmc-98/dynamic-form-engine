import { v7 as uuidv7 } from 'uuid'

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
export function generateId(): string {
  return uuidv7()
}
