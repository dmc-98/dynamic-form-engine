"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseDatabaseAdapter = exports.InMemoryModelStore = void 0;
const dfe_server_1 = require("@dmc-98/dfe-server");
// ─── In-Memory Model Store (for API Contract execution) ─────────────────────
/**
 * Simple in-memory model store for dynamic resource operations.
 * This is used by the adapter to execute API contracts that create/update
 * resources via the form engine.
 *
 * For production use, extend this with a real database or replace
 * executeApiContract with your own implementation.
 */
class InMemoryModelStore {
    constructor() {
        this.store = new Map();
    }
    get(resource, id) {
        var _a;
        return (_a = this.store.get(resource)) === null || _a === void 0 ? void 0 : _a.get(id);
    }
    set(resource, id, data) {
        if (!this.store.has(resource)) {
            this.store.set(resource, new Map());
        }
        this.store.get(resource).set(id, data);
    }
    getAll(resource) {
        const map = this.store.get(resource);
        return map ? Array.from(map.values()) : [];
    }
    clear() {
        this.store.clear();
    }
}
exports.InMemoryModelStore = InMemoryModelStore;
/**
 * Mongoose implementation of the DatabaseAdapter interface.
 *
 * Manages Form, FormVersion, and Submission collections in MongoDB.
 *
 * @example
 * ```ts
 * import mongoose from 'mongoose'
 * import { MongooseDatabaseAdapter } from '@dmc-98/dfe-mongoose'
 *
 * const conn = await mongoose.connect('mongodb://localhost/dfe')
 * const db = new MongooseDatabaseAdapter(conn)
 * ```
 */
class MongooseDatabaseAdapter {
    constructor(conn, options) {
        this.modelStore = new InMemoryModelStore();
        this.conn = conn;
        this.customExecute = options === null || options === void 0 ? void 0 : options.executeApiContract;
        // Initialize models
        this.formModel = this.getOrCreateModel('DfeForm', this.getFormSchema());
        this.formVersionModel = this.getOrCreateModel('DfeFormVersion', this.getFormVersionSchema());
        this.fieldOptionModel = this.getOrCreateModel('DfeFieldOption', this.getFieldOptionSchema());
        this.submissionModel = this.getOrCreateModel('DfeSubmission', this.getSubmissionSchema());
    }
    // ── Schema Definitions ──────────────────────────────────────────────────────
    getFormSchema() {
        // Schema is returned as a plain object to allow lazy initialization
        return {
            id: { type: String, required: true, unique: true },
            slug: { type: String, required: true, unique: true, index: true },
            title: { type: String, required: true },
            description: { type: String, default: null },
            createdAt: { type: Date, default: () => new Date() },
            updatedAt: { type: Date, default: () => new Date() },
        };
    }
    getFormVersionSchema() {
        return {
            id: { type: String, required: true, unique: true },
            formId: { type: String, required: true, index: true },
            version: { type: Number, required: true },
            status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
            steps: [{
                    id: String,
                    versionId: String,
                    title: String,
                    description: String,
                    order: Number,
                    conditions: {},
                    config: {},
                }],
            fields: [{
                    id: String,
                    versionId: String,
                    stepId: String,
                    sectionId: String,
                    parentFieldId: String,
                    key: String,
                    label: String,
                    description: String,
                    type: String,
                    required: Boolean,
                    order: Number,
                    config: {},
                    conditions: {},
                }],
            createdAt: { type: Date, default: () => new Date() },
            updatedAt: { type: Date, default: () => new Date() },
        };
    }
    getFieldOptionSchema() {
        return {
            id: { type: String, required: true, unique: true },
            fieldId: { type: String, required: true, index: true },
            label: { type: String, required: true },
            value: { type: String, required: true },
            order: { type: Number, default: 0 },
            meta: {},
        };
    }
    getSubmissionSchema() {
        return {
            id: { type: String, required: true, unique: true },
            formId: { type: String, required: true, index: true },
            versionId: { type: String, required: true },
            userId: { type: String, required: true },
            status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'], default: 'IN_PROGRESS' },
            currentStepId: { type: String, default: null },
            context: { type: Object, default: {} },
            createdAt: { type: Date, default: () => new Date(), index: true },
            updatedAt: { type: Date, default: () => new Date() },
        };
    }
    getOrCreateModel(name, schema) {
        try {
            return this.conn.model(name);
        }
        catch (_a) {
            // Model doesn't exist, create it with schema
            // We need to create a schema object if we have Mongoose available
            const schemaObj = this.buildMongooseSchema(schema);
            return this.conn.model(name, schemaObj);
        }
    }
    buildMongooseSchema(schemaObj) {
        // This would use mongoose.Schema in a real implementation
        // For now, return the schema definition
        // The actual Mongoose integration will handle this
        return schemaObj;
    }
    // ── Form Definitions ──────────────────────────────────────────────────────
    async getFormBySlug(slug) {
        const form = await this.formModel.findOne({ slug }).lean();
        if (!form)
            return null;
        const version = await this.formVersionModel.findOne({
            formId: form.id,
            status: 'PUBLISHED',
        }).sort({ version: -1 }).lean();
        if (!version)
            return null;
        return this.mapToFormVersion(form, version);
    }
    async getFormById(id) {
        const form = await this.formModel.findOne({ id }).lean();
        if (!form)
            return null;
        const version = await this.formVersionModel.findOne({
            formId: form.id,
            status: 'PUBLISHED',
        }).sort({ version: -1 }).lean();
        if (!version)
            return null;
        return this.mapToFormVersion(form, version);
    }
    async listForms(params) {
        var _a, _b, _c;
        const pageSize = (_a = params === null || params === void 0 ? void 0 : params.pageSize) !== null && _a !== void 0 ? _a : 20;
        const query = {};
        if (params === null || params === void 0 ? void 0 : params.search) {
            query.$or = [
                { title: { $regex: params.search, $options: 'i' } },
                { slug: { $regex: params.search, $options: 'i' } },
            ];
        }
        // Handle cursor-based pagination
        let skip = 0;
        if (params === null || params === void 0 ? void 0 : params.cursor) {
            const cursorDoc = await this.formModel.findOne({ id: params.cursor }).lean();
            if (cursorDoc) {
                skip = 1;
            }
        }
        const forms = await this.formModel
            .find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(pageSize + 1)
            .lean();
        const hasMore = forms.length > pageSize;
        const items = (hasMore ? forms.slice(0, -1) : forms).map((f) => {
            var _a, _b;
            return ({
                id: f.id,
                slug: f.slug,
                title: f.title,
                description: f.description,
                versionId: (_a = f.versionId) !== null && _a !== void 0 ? _a : '',
                status: (_b = f.status) !== null && _b !== void 0 ? _b : 'DRAFT',
                createdAt: f.createdAt,
                updatedAt: f.updatedAt,
            });
        });
        return {
            items,
            nextCursor: hasMore ? (_c = (_b = items[items.length - 1]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null : null,
        };
    }
    // ── Submissions ───────────────────────────────────────────────────────────
    async createSubmission(data) {
        const submission = await this.submissionModel.create({
            id: (0, dfe_server_1.generateId)(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return submission.toObject();
    }
    async getSubmission(id) {
        const submission = await this.submissionModel.findOne({ id }).lean();
        return submission;
    }
    async updateSubmission(id, data) {
        const submission = await this.submissionModel.findOneAndUpdate({ id }, { ...data, updatedAt: new Date() }, { new: true }).lean();
        return submission;
    }
    // ── Dynamic Resource Operations ──────────────────────────────────────────
    async executeApiContract(contract, body) {
        var _a;
        // Use custom executor if provided
        if (this.customExecute) {
            return this.customExecute(contract, body);
        }
        // Default: in-memory model store
        const id = (_a = body.id) !== null && _a !== void 0 ? _a : (0, dfe_server_1.generateId)();
        const record = { id, ...body, updatedAt: new Date().toISOString() };
        if (contract.method === 'POST') {
            record.createdAt = new Date().toISOString();
        }
        this.modelStore.set(contract.resourceName, id, record);
        return record;
    }
    // ── Dynamic Options ───────────────────────────────────────────────────────
    async fetchFieldOptions(fieldId, params) {
        var _a, _b;
        const pageSize = params.pageSize;
        const query = { fieldId };
        if (params.search) {
            query.label = { $regex: params.search, $options: 'i' };
        }
        let skip = 0;
        if (params.cursor) {
            const cursorDoc = await this.fieldOptionModel.findOne({ id: params.cursor }).lean();
            if (cursorDoc) {
                skip = 1;
            }
        }
        const options = await this.fieldOptionModel
            .find(query)
            .sort({ order: 1 })
            .skip(skip)
            .limit(pageSize + 1)
            .lean();
        const hasMore = options.length > pageSize;
        const items = (hasMore ? options.slice(0, -1) : options).map((o) => ({
            label: o.label,
            value: o.value,
            meta: o.meta,
        }));
        return {
            items,
            nextCursor: hasMore ? (_b = (_a = options[options.length - 2]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null : null,
        };
    }
    // ── Private Helpers ────────────────────────────────────────────────────────
    mapToFormVersion(form, version) {
        var _a, _b;
        return {
            id: form.id,
            slug: form.slug,
            title: form.title,
            description: form.description,
            versionId: version.id,
            status: version.status,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
            steps: ((_a = version.steps) !== null && _a !== void 0 ? _a : []).map((s) => ({
                id: s.id,
                versionId: s.versionId,
                title: s.title,
                description: s.description,
                order: s.order,
                conditions: s.conditions,
                config: s.config,
            })),
            fields: ((_b = version.fields) !== null && _b !== void 0 ? _b : []).map((f) => {
                var _a;
                return ({
                    id: f.id,
                    versionId: f.versionId,
                    stepId: f.stepId,
                    sectionId: f.sectionId,
                    parentFieldId: f.parentFieldId,
                    key: f.key,
                    label: f.label,
                    description: f.description,
                    type: f.type,
                    required: f.required,
                    order: f.order,
                    config: (_a = f.config) !== null && _a !== void 0 ? _a : {},
                    conditions: f.conditions,
                });
            }),
        };
    }
}
exports.MongooseDatabaseAdapter = MongooseDatabaseAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFRQSxzREFBa0Q7QUFhbEQsK0VBQStFO0FBRS9FOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLGtCQUFrQjtJQUEvQjtRQUNVLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQTtJQXFCekUsQ0FBQztJQW5CQyxHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFVOztRQUM5QixPQUFPLE1BQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDBDQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0lBRUQsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBVSxFQUFFLElBQTZCO1FBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDckMsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDekMsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFnQjtRQUNyQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNwQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBQzVDLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUNwQixDQUFDO0NBQ0Y7QUF0QkQsZ0RB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TSxtQ0FBSSxFQUFFO29CQUN0QixVQUFVLEVBQUUsQ0FBQyxDQUFDLFVBQVU7aUJBQ3pCLENBQUMsQ0FBQTthQUFBLENBQUM7U0FDSixDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBMVVELDBEQTBVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgRm9ybUZpZWxkLCBGb3JtU3RlcCwgU2VsZWN0T3B0aW9uLCBTdGVwQXBpQ29udHJhY3QsXG4gIEZvcm1SdW50aW1lQ29udGV4dCxcbn0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcbmltcG9ydCB0eXBlIHtcbiAgRGF0YWJhc2VBZGFwdGVyLCBQYWdpbmF0aW9uUGFyYW1zLCBQYWdpbmF0ZWRSZXN1bHQsXG4gIEZvcm1EZWZpbml0aW9uUmVjb3JkLCBGb3JtVmVyc2lvblJlY29yZCwgRm9ybVN1Ym1pc3Npb25SZWNvcmQsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLXNlcnZlcidcbmltcG9ydCB7IGdlbmVyYXRlSWQgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1zZXJ2ZXInXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyBmb3IgTW9uZ29vc2UgQ29ubmVjdGlvbiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBNaW5pbWFsIE1vbmdvb3NlIGNvbm5lY3Rpb24gaW50ZXJmYWNlIHRvIGF2b2lkIGhhcmQgZGVwZW5kZW5jeSBvbiBtb25nb29zZS5cbiAqIFlvdXIgTW9uZ29vc2UgbW9kZWxzIHdpbGwgc2F0aXNmeSB0aGlzIGludGVyZmFjZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb25nb29zZUxpa2Uge1xuICBtb2RlbChuYW1lOiBzdHJpbmcsIHNjaGVtYT86IGFueSk6IGFueVxuICBjb25uZWN0aW9uOiBhbnlcbn1cblxuLy8g4pSA4pSA4pSAIEluLU1lbW9yeSBNb2RlbCBTdG9yZSAoZm9yIEFQSSBDb250cmFjdCBleGVjdXRpb24pIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIFNpbXBsZSBpbi1tZW1vcnkgbW9kZWwgc3RvcmUgZm9yIGR5bmFtaWMgcmVzb3VyY2Ugb3BlcmF0aW9ucy5cbiAqIFRoaXMgaXMgdXNlZCBieSB0aGUgYWRhcHRlciB0byBleGVjdXRlIEFQSSBjb250cmFjdHMgdGhhdCBjcmVhdGUvdXBkYXRlXG4gKiByZXNvdXJjZXMgdmlhIHRoZSBmb3JtIGVuZ2luZS5cbiAqXG4gKiBGb3IgcHJvZHVjdGlvbiB1c2UsIGV4dGVuZCB0aGlzIHdpdGggYSByZWFsIGRhdGFiYXNlIG9yIHJlcGxhY2VcbiAqIGV4ZWN1dGVBcGlDb250cmFjdCB3aXRoIHlvdXIgb3duIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgSW5NZW1vcnlNb2RlbFN0b3JlIHtcbiAgcHJpdmF0ZSBzdG9yZSA9IG5ldyBNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4+KClcblxuICBnZXQocmVzb3VyY2U6IHN0cmluZywgaWQ6IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5zdG9yZS5nZXQocmVzb3VyY2UpPy5nZXQoaWQpXG4gIH1cblxuICBzZXQocmVzb3VyY2U6IHN0cmluZywgaWQ6IHN0cmluZywgZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc3RvcmUuaGFzKHJlc291cmNlKSkge1xuICAgICAgdGhpcy5zdG9yZS5zZXQocmVzb3VyY2UsIG5ldyBNYXAoKSlcbiAgICB9XG4gICAgdGhpcy5zdG9yZS5nZXQocmVzb3VyY2UpIS5zZXQoaWQsIGRhdGEpXG4gIH1cblxuICBnZXRBbGwocmVzb3VyY2U6IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W10ge1xuICAgIGNvbnN0IG1hcCA9IHRoaXMuc3RvcmUuZ2V0KHJlc291cmNlKVxuICAgIHJldHVybiBtYXAgPyBBcnJheS5mcm9tKG1hcC52YWx1ZXMoKSkgOiBbXVxuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgdGhpcy5zdG9yZS5jbGVhcigpXG4gIH1cbn1cblxuLy8g4pSA4pSA4pSAIE1vbmdvb3NlIERhdGFiYXNlIEFkYXB0ZXIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9uZ29vc2VBZGFwdGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBDdXN0b20gQVBJIGNvbnRyYWN0IGV4ZWN1dG9yLlxuICAgKiBJZiBub3QgcHJvdmlkZWQsIHVzZXMgYW4gaW4tbWVtb3J5IG1vZGVsIHN0b3JlLlxuICAgKiBPdmVycmlkZSB0aGlzIGZvciBwcm9kdWN0aW9uIHRvIHdyaXRlIHRvIHlvdXIgYWN0dWFsIGRhdGFiYXNlIGNvbGxlY3Rpb25zLlxuICAgKi9cbiAgZXhlY3V0ZUFwaUNvbnRyYWN0PzogKFxuICAgIGNvbnRyYWN0OiBTdGVwQXBpQ29udHJhY3QsXG4gICAgYm9keTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICkgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj5cbn1cblxuLyoqXG4gKiBNb25nb29zZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgRGF0YWJhc2VBZGFwdGVyIGludGVyZmFjZS5cbiAqXG4gKiBNYW5hZ2VzIEZvcm0sIEZvcm1WZXJzaW9uLCBhbmQgU3VibWlzc2lvbiBjb2xsZWN0aW9ucyBpbiBNb25nb0RCLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJ1xuICogaW1wb3J0IHsgTW9uZ29vc2VEYXRhYmFzZUFkYXB0ZXIgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1tb25nb29zZSdcbiAqXG4gKiBjb25zdCBjb25uID0gYXdhaXQgbW9uZ29vc2UuY29ubmVjdCgnbW9uZ29kYjovL2xvY2FsaG9zdC9kZmUnKVxuICogY29uc3QgZGIgPSBuZXcgTW9uZ29vc2VEYXRhYmFzZUFkYXB0ZXIoY29ubilcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTW9uZ29vc2VEYXRhYmFzZUFkYXB0ZXIgaW1wbGVtZW50cyBEYXRhYmFzZUFkYXB0ZXIge1xuICBwcml2YXRlIGNvbm46IE1vbmdvb3NlTGlrZVxuICBwcml2YXRlIG1vZGVsU3RvcmUgPSBuZXcgSW5NZW1vcnlNb2RlbFN0b3JlKClcbiAgcHJpdmF0ZSBjdXN0b21FeGVjdXRlPzogKFxuICAgIGNvbnRyYWN0OiBTdGVwQXBpQ29udHJhY3QsXG4gICAgYm9keTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICkgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj5cblxuICBwcml2YXRlIGZvcm1Nb2RlbDogYW55XG4gIHByaXZhdGUgZm9ybVZlcnNpb25Nb2RlbDogYW55XG4gIHByaXZhdGUgZmllbGRPcHRpb25Nb2RlbDogYW55XG4gIHByaXZhdGUgc3VibWlzc2lvbk1vZGVsOiBhbnlcblxuICBjb25zdHJ1Y3Rvcihjb25uOiBNb25nb29zZUxpa2UsIG9wdGlvbnM/OiBNb25nb29zZUFkYXB0ZXJPcHRpb25zKSB7XG4gICAgdGhpcy5jb25uID0gY29ublxuICAgIHRoaXMuY3VzdG9tRXhlY3V0ZSA9IG9wdGlvbnM/LmV4ZWN1dGVBcGlDb250cmFjdFxuXG4gICAgLy8gSW5pdGlhbGl6ZSBtb2RlbHNcbiAgICB0aGlzLmZvcm1Nb2RlbCA9IHRoaXMuZ2V0T3JDcmVhdGVNb2RlbCgnRGZlRm9ybScsIHRoaXMuZ2V0Rm9ybVNjaGVtYSgpKVxuICAgIHRoaXMuZm9ybVZlcnNpb25Nb2RlbCA9IHRoaXMuZ2V0T3JDcmVhdGVNb2RlbCgnRGZlRm9ybVZlcnNpb24nLCB0aGlzLmdldEZvcm1WZXJzaW9uU2NoZW1hKCkpXG4gICAgdGhpcy5maWVsZE9wdGlvbk1vZGVsID0gdGhpcy5nZXRPckNyZWF0ZU1vZGVsKCdEZmVGaWVsZE9wdGlvbicsIHRoaXMuZ2V0RmllbGRPcHRpb25TY2hlbWEoKSlcbiAgICB0aGlzLnN1Ym1pc3Npb25Nb2RlbCA9IHRoaXMuZ2V0T3JDcmVhdGVNb2RlbCgnRGZlU3VibWlzc2lvbicsIHRoaXMuZ2V0U3VibWlzc2lvblNjaGVtYSgpKVxuICB9XG5cbiAgLy8g4pSA4pSAIFNjaGVtYSBEZWZpbml0aW9ucyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBwcml2YXRlIGdldEZvcm1TY2hlbWEoKTogYW55IHtcbiAgICAvLyBTY2hlbWEgaXMgcmV0dXJuZWQgYXMgYSBwbGFpbiBvYmplY3QgdG8gYWxsb3cgbGF6eSBpbml0aWFsaXphdGlvblxuICAgIHJldHVybiB7XG4gICAgICBpZDogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlLCB1bmlxdWU6IHRydWUgfSxcbiAgICAgIHNsdWc6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSwgdW5pcXVlOiB0cnVlLCBpbmRleDogdHJ1ZSB9LFxuICAgICAgdGl0bGU6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgZGVzY3JpcHRpb246IHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiBudWxsIH0sXG4gICAgICBjcmVhdGVkQXQ6IHsgdHlwZTogRGF0ZSwgZGVmYXVsdDogKCkgPT4gbmV3IERhdGUoKSB9LFxuICAgICAgdXBkYXRlZEF0OiB7IHR5cGU6IERhdGUsIGRlZmF1bHQ6ICgpID0+IG5ldyBEYXRlKCkgfSxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEZvcm1WZXJzaW9uU2NoZW1hKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUsIHVuaXF1ZTogdHJ1ZSB9LFxuICAgICAgZm9ybUlkOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUsIGluZGV4OiB0cnVlIH0sXG4gICAgICB2ZXJzaW9uOiB7IHR5cGU6IE51bWJlciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgIHN0YXR1czogeyB0eXBlOiBTdHJpbmcsIGVudW06IFsnRFJBRlQnLCAnUFVCTElTSEVEJywgJ0FSQ0hJVkVEJ10sIGRlZmF1bHQ6ICdEUkFGVCcgfSxcbiAgICAgIHN0ZXBzOiBbe1xuICAgICAgICBpZDogU3RyaW5nLFxuICAgICAgICB2ZXJzaW9uSWQ6IFN0cmluZyxcbiAgICAgICAgdGl0bGU6IFN0cmluZyxcbiAgICAgICAgZGVzY3JpcHRpb246IFN0cmluZyxcbiAgICAgICAgb3JkZXI6IE51bWJlcixcbiAgICAgICAgY29uZGl0aW9uczoge30sXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICB9XSxcbiAgICAgIGZpZWxkczogW3tcbiAgICAgICAgaWQ6IFN0cmluZyxcbiAgICAgICAgdmVyc2lvbklkOiBTdHJpbmcsXG4gICAgICAgIHN0ZXBJZDogU3RyaW5nLFxuICAgICAgICBzZWN0aW9uSWQ6IFN0cmluZyxcbiAgICAgICAgcGFyZW50RmllbGRJZDogU3RyaW5nLFxuICAgICAgICBrZXk6IFN0cmluZyxcbiAgICAgICAgbGFiZWw6IFN0cmluZyxcbiAgICAgICAgZGVzY3JpcHRpb246IFN0cmluZyxcbiAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICByZXF1aXJlZDogQm9vbGVhbixcbiAgICAgICAgb3JkZXI6IE51bWJlcixcbiAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgY29uZGl0aW9uczoge30sXG4gICAgICB9XSxcbiAgICAgIGNyZWF0ZWRBdDogeyB0eXBlOiBEYXRlLCBkZWZhdWx0OiAoKSA9PiBuZXcgRGF0ZSgpIH0sXG4gICAgICB1cGRhdGVkQXQ6IHsgdHlwZTogRGF0ZSwgZGVmYXVsdDogKCkgPT4gbmV3IERhdGUoKSB9LFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0RmllbGRPcHRpb25TY2hlbWEoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSwgdW5pcXVlOiB0cnVlIH0sXG4gICAgICBmaWVsZElkOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUsIGluZGV4OiB0cnVlIH0sXG4gICAgICBsYWJlbDogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICB2YWx1ZTogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICBvcmRlcjogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSxcbiAgICAgIG1ldGE6IHt9LFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3VibWlzc2lvblNjaGVtYSgpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlLCB1bmlxdWU6IHRydWUgfSxcbiAgICAgIGZvcm1JZDogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlLCBpbmRleDogdHJ1ZSB9LFxuICAgICAgdmVyc2lvbklkOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgIHVzZXJJZDogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICBzdGF0dXM6IHsgdHlwZTogU3RyaW5nLCBlbnVtOiBbJ0lOX1BST0dSRVNTJywgJ0NPTVBMRVRFRCcsICdBQkFORE9ORUQnXSwgZGVmYXVsdDogJ0lOX1BST0dSRVNTJyB9LFxuICAgICAgY3VycmVudFN0ZXBJZDogeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6IG51bGwgfSxcbiAgICAgIGNvbnRleHQ6IHsgdHlwZTogT2JqZWN0LCBkZWZhdWx0OiB7fSB9LFxuICAgICAgY3JlYXRlZEF0OiB7IHR5cGU6IERhdGUsIGRlZmF1bHQ6ICgpID0+IG5ldyBEYXRlKCksIGluZGV4OiB0cnVlIH0sXG4gICAgICB1cGRhdGVkQXQ6IHsgdHlwZTogRGF0ZSwgZGVmYXVsdDogKCkgPT4gbmV3IERhdGUoKSB9LFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3JDcmVhdGVNb2RlbChuYW1lOiBzdHJpbmcsIHNjaGVtYTogYW55KTogYW55IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMuY29ubi5tb2RlbChuYW1lKVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gTW9kZWwgZG9lc24ndCBleGlzdCwgY3JlYXRlIGl0IHdpdGggc2NoZW1hXG4gICAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhIHNjaGVtYSBvYmplY3QgaWYgd2UgaGF2ZSBNb25nb29zZSBhdmFpbGFibGVcbiAgICAgIGNvbnN0IHNjaGVtYU9iaiA9IHRoaXMuYnVpbGRNb25nb29zZVNjaGVtYShzY2hlbWEpXG4gICAgICByZXR1cm4gdGhpcy5jb25uLm1vZGVsKG5hbWUsIHNjaGVtYU9iailcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkTW9uZ29vc2VTY2hlbWEoc2NoZW1hT2JqOiBhbnkpOiBhbnkge1xuICAgIC8vIFRoaXMgd291bGQgdXNlIG1vbmdvb3NlLlNjaGVtYSBpbiBhIHJlYWwgaW1wbGVtZW50YXRpb25cbiAgICAvLyBGb3Igbm93LCByZXR1cm4gdGhlIHNjaGVtYSBkZWZpbml0aW9uXG4gICAgLy8gVGhlIGFjdHVhbCBNb25nb29zZSBpbnRlZ3JhdGlvbiB3aWxsIGhhbmRsZSB0aGlzXG4gICAgcmV0dXJuIHNjaGVtYU9ialxuICB9XG5cbiAgLy8g4pSA4pSAIEZvcm0gRGVmaW5pdGlvbnMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgYXN5bmMgZ2V0Rm9ybUJ5U2x1ZyhzbHVnOiBzdHJpbmcpOiBQcm9taXNlPEZvcm1WZXJzaW9uUmVjb3JkIHwgbnVsbD4ge1xuICAgIGNvbnN0IGZvcm0gPSBhd2FpdCB0aGlzLmZvcm1Nb2RlbC5maW5kT25lKHsgc2x1ZyB9KS5sZWFuKClcblxuICAgIGlmICghZm9ybSkgcmV0dXJuIG51bGxcblxuICAgIGNvbnN0IHZlcnNpb24gPSBhd2FpdCB0aGlzLmZvcm1WZXJzaW9uTW9kZWwuZmluZE9uZSh7XG4gICAgICBmb3JtSWQ6IGZvcm0uaWQsXG4gICAgICBzdGF0dXM6ICdQVUJMSVNIRUQnLFxuICAgIH0pLnNvcnQoeyB2ZXJzaW9uOiAtMSB9KS5sZWFuKClcblxuICAgIGlmICghdmVyc2lvbikgcmV0dXJuIG51bGxcblxuICAgIHJldHVybiB0aGlzLm1hcFRvRm9ybVZlcnNpb24oZm9ybSwgdmVyc2lvbilcbiAgfVxuXG4gIGFzeW5jIGdldEZvcm1CeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPEZvcm1WZXJzaW9uUmVjb3JkIHwgbnVsbD4ge1xuICAgIGNvbnN0IGZvcm0gPSBhd2FpdCB0aGlzLmZvcm1Nb2RlbC5maW5kT25lKHsgaWQgfSkubGVhbigpXG5cbiAgICBpZiAoIWZvcm0pIHJldHVybiBudWxsXG5cbiAgICBjb25zdCB2ZXJzaW9uID0gYXdhaXQgdGhpcy5mb3JtVmVyc2lvbk1vZGVsLmZpbmRPbmUoe1xuICAgICAgZm9ybUlkOiBmb3JtLmlkLFxuICAgICAgc3RhdHVzOiAnUFVCTElTSEVEJyxcbiAgICB9KS5zb3J0KHsgdmVyc2lvbjogLTEgfSkubGVhbigpXG5cbiAgICBpZiAoIXZlcnNpb24pIHJldHVybiBudWxsXG5cbiAgICByZXR1cm4gdGhpcy5tYXBUb0Zvcm1WZXJzaW9uKGZvcm0sIHZlcnNpb24pXG4gIH1cblxuICBhc3luYyBsaXN0Rm9ybXMocGFyYW1zPzogUGFnaW5hdGlvblBhcmFtcyk6IFByb21pc2U8UGFnaW5hdGVkUmVzdWx0PEZvcm1EZWZpbml0aW9uUmVjb3JkPj4ge1xuICAgIGNvbnN0IHBhZ2VTaXplID0gcGFyYW1zPy5wYWdlU2l6ZSA/PyAyMFxuICAgIGNvbnN0IHF1ZXJ5OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge31cblxuICAgIGlmIChwYXJhbXM/LnNlYXJjaCkge1xuICAgICAgcXVlcnkuJG9yID0gW1xuICAgICAgICB7IHRpdGxlOiB7ICRyZWdleDogcGFyYW1zLnNlYXJjaCwgJG9wdGlvbnM6ICdpJyB9IH0sXG4gICAgICAgIHsgc2x1ZzogeyAkcmVnZXg6IHBhcmFtcy5zZWFyY2gsICRvcHRpb25zOiAnaScgfSB9LFxuICAgICAgXVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSBjdXJzb3ItYmFzZWQgcGFnaW5hdGlvblxuICAgIGxldCBza2lwID0gMFxuICAgIGlmIChwYXJhbXM/LmN1cnNvcikge1xuICAgICAgY29uc3QgY3Vyc29yRG9jID0gYXdhaXQgdGhpcy5mb3JtTW9kZWwuZmluZE9uZSh7IGlkOiBwYXJhbXMuY3Vyc29yIH0pLmxlYW4oKVxuICAgICAgaWYgKGN1cnNvckRvYykge1xuICAgICAgICBza2lwID0gMVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGZvcm1zID0gYXdhaXQgdGhpcy5mb3JtTW9kZWxcbiAgICAgIC5maW5kKHF1ZXJ5KVxuICAgICAgLnNvcnQoeyB1cGRhdGVkQXQ6IC0xIH0pXG4gICAgICAuc2tpcChza2lwKVxuICAgICAgLmxpbWl0KHBhZ2VTaXplICsgMSlcbiAgICAgIC5sZWFuKClcblxuICAgIGNvbnN0IGhhc01vcmUgPSBmb3Jtcy5sZW5ndGggPiBwYWdlU2l6ZVxuICAgIGNvbnN0IGl0ZW1zID0gKGhhc01vcmUgPyBmb3Jtcy5zbGljZSgwLCAtMSkgOiBmb3JtcykubWFwKChmOiBhbnkpID0+ICh7XG4gICAgICBpZDogZi5pZCxcbiAgICAgIHNsdWc6IGYuc2x1ZyxcbiAgICAgIHRpdGxlOiBmLnRpdGxlLFxuICAgICAgZGVzY3JpcHRpb246IGYuZGVzY3JpcHRpb24sXG4gICAgICB2ZXJzaW9uSWQ6IGYudmVyc2lvbklkID8/ICcnLFxuICAgICAgc3RhdHVzOiBmLnN0YXR1cyA/PyAnRFJBRlQnLFxuICAgICAgY3JlYXRlZEF0OiBmLmNyZWF0ZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogZi51cGRhdGVkQXQsXG4gICAgfSkpXG5cbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXMsXG4gICAgICBuZXh0Q3Vyc29yOiBoYXNNb3JlID8gaXRlbXNbaXRlbXMubGVuZ3RoIC0gMV0/LmlkID8/IG51bGwgOiBudWxsLFxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgCBTdWJtaXNzaW9ucyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBhc3luYyBjcmVhdGVTdWJtaXNzaW9uKGRhdGE6IHtcbiAgICBmb3JtSWQ6IHN0cmluZ1xuICAgIHZlcnNpb25JZDogc3RyaW5nXG4gICAgdXNlcklkOiBzdHJpbmdcbiAgICBjb250ZXh0OiBGb3JtUnVudGltZUNvbnRleHRcbiAgfSk6IFByb21pc2U8Rm9ybVN1Ym1pc3Npb25SZWNvcmQ+IHtcbiAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgdGhpcy5zdWJtaXNzaW9uTW9kZWwuY3JlYXRlKHtcbiAgICAgIGlkOiBnZW5lcmF0ZUlkKCksXG4gICAgICAuLi5kYXRhLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgIH0pXG4gICAgcmV0dXJuIHN1Ym1pc3Npb24udG9PYmplY3QoKVxuICB9XG5cbiAgYXN5bmMgZ2V0U3VibWlzc2lvbihpZDogc3RyaW5nKTogUHJvbWlzZTxGb3JtU3VibWlzc2lvblJlY29yZCB8IG51bGw+IHtcbiAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgdGhpcy5zdWJtaXNzaW9uTW9kZWwuZmluZE9uZSh7IGlkIH0pLmxlYW4oKVxuICAgIHJldHVybiBzdWJtaXNzaW9uXG4gIH1cblxuICBhc3luYyB1cGRhdGVTdWJtaXNzaW9uKGlkOiBzdHJpbmcsIGRhdGE6IFBhcnRpYWw8e1xuICAgIGN1cnJlbnRTdGVwSWQ6IHN0cmluZyB8IG51bGxcbiAgICBzdGF0dXM6ICdJTl9QUk9HUkVTUycgfCAnQ09NUExFVEVEJyB8ICdBQkFORE9ORUQnXG4gICAgY29udGV4dDogRm9ybVJ1bnRpbWVDb250ZXh0XG4gIH0+KTogUHJvbWlzZTxGb3JtU3VibWlzc2lvblJlY29yZD4ge1xuICAgIGNvbnN0IHN1Ym1pc3Npb24gPSBhd2FpdCB0aGlzLnN1Ym1pc3Npb25Nb2RlbC5maW5kT25lQW5kVXBkYXRlKFxuICAgICAgeyBpZCB9LFxuICAgICAgeyAuLi5kYXRhLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkgfSxcbiAgICAgIHsgbmV3OiB0cnVlIH1cbiAgICApLmxlYW4oKVxuICAgIHJldHVybiBzdWJtaXNzaW9uXG4gIH1cblxuICAvLyDilIDilIAgRHluYW1pYyBSZXNvdXJjZSBPcGVyYXRpb25zIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGFzeW5jIGV4ZWN1dGVBcGlDb250cmFjdChcbiAgICBjb250cmFjdDogU3RlcEFwaUNvbnRyYWN0LFxuICAgIGJvZHk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gICAgLy8gVXNlIGN1c3RvbSBleGVjdXRvciBpZiBwcm92aWRlZFxuICAgIGlmICh0aGlzLmN1c3RvbUV4ZWN1dGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1c3RvbUV4ZWN1dGUoY29udHJhY3QsIGJvZHkpXG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdDogaW4tbWVtb3J5IG1vZGVsIHN0b3JlXG4gICAgY29uc3QgaWQgPSAoYm9keS5pZCBhcyBzdHJpbmcpID8/IGdlbmVyYXRlSWQoKVxuICAgIGNvbnN0IHJlY29yZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7IGlkLCAuLi5ib2R5LCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9XG5cbiAgICBpZiAoY29udHJhY3QubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgIHJlY29yZC5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9XG5cbiAgICB0aGlzLm1vZGVsU3RvcmUuc2V0KGNvbnRyYWN0LnJlc291cmNlTmFtZSwgaWQsIHJlY29yZClcbiAgICByZXR1cm4gcmVjb3JkXG4gIH1cblxuICAvLyDilIDilIAgRHluYW1pYyBPcHRpb25zIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGFzeW5jIGZldGNoRmllbGRPcHRpb25zKFxuICAgIGZpZWxkSWQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IFBhZ2luYXRpb25QYXJhbXMsXG4gICk6IFByb21pc2U8UGFnaW5hdGVkUmVzdWx0PFNlbGVjdE9wdGlvbj4+IHtcbiAgICBjb25zdCBwYWdlU2l6ZSA9IHBhcmFtcy5wYWdlU2l6ZVxuICAgIGNvbnN0IHF1ZXJ5OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0geyBmaWVsZElkIH1cblxuICAgIGlmIChwYXJhbXMuc2VhcmNoKSB7XG4gICAgICBxdWVyeS5sYWJlbCA9IHsgJHJlZ2V4OiBwYXJhbXMuc2VhcmNoLCAkb3B0aW9uczogJ2knIH1cbiAgICB9XG5cbiAgICBsZXQgc2tpcCA9IDBcbiAgICBpZiAocGFyYW1zLmN1cnNvcikge1xuICAgICAgY29uc3QgY3Vyc29yRG9jID0gYXdhaXQgdGhpcy5maWVsZE9wdGlvbk1vZGVsLmZpbmRPbmUoeyBpZDogcGFyYW1zLmN1cnNvciB9KS5sZWFuKClcbiAgICAgIGlmIChjdXJzb3JEb2MpIHtcbiAgICAgICAgc2tpcCA9IDFcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBvcHRpb25zID0gYXdhaXQgdGhpcy5maWVsZE9wdGlvbk1vZGVsXG4gICAgICAuZmluZChxdWVyeSlcbiAgICAgIC5zb3J0KHsgb3JkZXI6IDEgfSlcbiAgICAgIC5za2lwKHNraXApXG4gICAgICAubGltaXQocGFnZVNpemUgKyAxKVxuICAgICAgLmxlYW4oKVxuXG4gICAgY29uc3QgaGFzTW9yZSA9IG9wdGlvbnMubGVuZ3RoID4gcGFnZVNpemVcbiAgICBjb25zdCBpdGVtcyA9IChoYXNNb3JlID8gb3B0aW9ucy5zbGljZSgwLCAtMSkgOiBvcHRpb25zKS5tYXAoKG86IGFueSkgPT4gKHtcbiAgICAgIGxhYmVsOiBvLmxhYmVsLFxuICAgICAgdmFsdWU6IG8udmFsdWUsXG4gICAgICBtZXRhOiBvLm1ldGEsXG4gICAgfSkpXG5cbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXMsXG4gICAgICBuZXh0Q3Vyc29yOiBoYXNNb3JlID8gb3B0aW9uc1tvcHRpb25zLmxlbmd0aCAtIDJdPy5pZCA/PyBudWxsIDogbnVsbCxcbiAgICB9XG4gIH1cblxuICAvLyDilIDilIAgUHJpdmF0ZSBIZWxwZXJzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIHByaXZhdGUgbWFwVG9Gb3JtVmVyc2lvbihmb3JtOiBhbnksIHZlcnNpb246IGFueSk6IEZvcm1WZXJzaW9uUmVjb3JkIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGZvcm0uaWQsXG4gICAgICBzbHVnOiBmb3JtLnNsdWcsXG4gICAgICB0aXRsZTogZm9ybS50aXRsZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBmb3JtLmRlc2NyaXB0aW9uLFxuICAgICAgdmVyc2lvbklkOiB2ZXJzaW9uLmlkLFxuICAgICAgc3RhdHVzOiB2ZXJzaW9uLnN0YXR1cyxcbiAgICAgIGNyZWF0ZWRBdDogZm9ybS5jcmVhdGVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IGZvcm0udXBkYXRlZEF0LFxuICAgICAgc3RlcHM6ICh2ZXJzaW9uLnN0ZXBzID8/IFtdKS5tYXAoKHM6IGFueSk6IEZvcm1TdGVwID0+ICh7XG4gICAgICAgIGlkOiBzLmlkLFxuICAgICAgICB2ZXJzaW9uSWQ6IHMudmVyc2lvbklkLFxuICAgICAgICB0aXRsZTogcy50aXRsZSxcbiAgICAgICAgZGVzY3JpcHRpb246IHMuZGVzY3JpcHRpb24sXG4gICAgICAgIG9yZGVyOiBzLm9yZGVyLFxuICAgICAgICBjb25kaXRpb25zOiBzLmNvbmRpdGlvbnMsXG4gICAgICAgIGNvbmZpZzogcy5jb25maWcsXG4gICAgICB9KSksXG4gICAgICBmaWVsZHM6ICh2ZXJzaW9uLmZpZWxkcyA/PyBbXSkubWFwKChmOiBhbnkpOiBGb3JtRmllbGQgPT4gKHtcbiAgICAgICAgaWQ6IGYuaWQsXG4gICAgICAgIHZlcnNpb25JZDogZi52ZXJzaW9uSWQsXG4gICAgICAgIHN0ZXBJZDogZi5zdGVwSWQsXG4gICAgICAgIHNlY3Rpb25JZDogZi5zZWN0aW9uSWQsXG4gICAgICAgIHBhcmVudEZpZWxkSWQ6IGYucGFyZW50RmllbGRJZCxcbiAgICAgICAga2V5OiBmLmtleSxcbiAgICAgICAgbGFiZWw6IGYubGFiZWwsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBmLmRlc2NyaXB0aW9uLFxuICAgICAgICB0eXBlOiBmLnR5cGUsXG4gICAgICAgIHJlcXVpcmVkOiBmLnJlcXVpcmVkLFxuICAgICAgICBvcmRlcjogZi5vcmRlcixcbiAgICAgICAgY29uZmlnOiBmLmNvbmZpZyA/PyB7fSxcbiAgICAgICAgY29uZGl0aW9uczogZi5jb25kaXRpb25zLFxuICAgICAgfSkpLFxuICAgIH1cbiAgfVxufVxuIl19