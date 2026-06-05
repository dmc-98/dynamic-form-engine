/**
 * Express test app factory for API E2E tests.
 * Creates a fully wired Express app with mock database.
 */
import express from 'express';
import type { InMemoryDatabase } from './mock-db';
export interface TestAppOptions {
    db: InMemoryDatabase;
    getUserId?: (req: express.Request) => string | null;
    skipAuth?: boolean;
    prefix?: string;
    allowedOptionFilterKeys?: string[];
}
export declare function createTestApp(options: TestAppOptions): any;
