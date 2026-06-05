"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validate_1 = require("@dmc--98/dfe-cli/src/commands/validate");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const dfe_core_1 = require("@dmc--98/dfe-core");
(0, vitest_1.describe)('CLI Commands', () => {
    const tmpDir = (0, node_path_1.join)(__dirname, '.tmp-cli-test');
    (0, vitest_1.beforeEach)(() => {
        (0, node_fs_1.mkdirSync)(tmpDir, { recursive: true });
    });
    (0, vitest_1.afterEach)(() => {
        if ((0, node_fs_1.existsSync)(tmpDir)) {
            (0, node_fs_1.rmSync)(tmpDir, { recursive: true });
        }
    });
    (0, vitest_1.it)('should validate a correct config file as valid with no errors', () => {
        const config = {
            fields: [
                {
                    id: 'field-1',
                    key: 'name',
                    type: 'TEXT',
                    label: 'Name',
                    required: true,
                },
                {
                    id: 'field-2',
                    key: 'email',
                    type: 'EMAIL',
                    label: 'Email',
                    required: true,
                },
            ],
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'valid-config.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.issues).toHaveLength(0);
    });
    (0, vitest_1.it)('should report error when both fields and steps are missing', () => {
        const config = {
            title: 'Empty Form',
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'no-fields-steps.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('fields') ||
            issue.message.toLowerCase().includes('steps'))).toBe(true);
    });
    (0, vitest_1.it)('should report error for duplicate field IDs', () => {
        const config = {
            fields: [
                {
                    id: 'field-1',
                    key: 'name',
                    type: 'TEXT',
                    label: 'Name',
                },
                {
                    id: 'field-1',
                    key: 'email',
                    type: 'EMAIL',
                    label: 'Email',
                },
            ],
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'duplicate-ids.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('duplicate') ||
            issue.message.toLowerCase().includes('field-1'))).toBe(true);
    });
    (0, vitest_1.it)('should report error for duplicate field keys', () => {
        const config = {
            fields: [
                {
                    id: 'field-1',
                    key: 'username',
                    type: 'TEXT',
                    label: 'Username',
                },
                {
                    id: 'field-2',
                    key: 'username',
                    type: 'TEXT',
                    label: 'User Name',
                },
            ],
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'duplicate-keys.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('duplicate') ||
            issue.message.toLowerCase().includes('key'))).toBe(true);
    });
    (0, vitest_1.it)('should report error for self-referencing condition', () => {
        const config = {
            fields: [
                {
                    id: 'field-1',
                    key: 'field1',
                    type: 'CHECKBOX',
                    label: 'Agree',
                    conditions: {
                        rules: [
                            {
                                fieldKey: 'field1',
                                operator: 'equals',
                                value: true,
                            },
                        ],
                    },
                },
            ],
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'self-reference.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('self') ||
            issue.message.toLowerCase().includes('reference'))).toBe(true);
    });
    (0, vitest_1.it)('should report error for non-existent file', () => {
        const nonExistentPath = (0, node_path_1.join)(tmpDir, 'does-not-exist.json');
        const result = (0, validate_1.validateFormConfig)(nonExistentPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('not found') ||
            issue.message.toLowerCase().includes('no such file'))).toBe(true);
    });
    (0, vitest_1.it)('should report error for invalid JSON syntax', () => {
        const configPath = (0, node_path_1.join)(tmpDir, 'invalid-json.json');
        (0, node_fs_1.writeFileSync)(configPath, '{ invalid json content ]');
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('json') ||
            issue.message.toLowerCase().includes('parse'))).toBe(true);
    });
    (0, vitest_1.it)('should report error when field references non-existent step', () => {
        const config = {
            fields: [
                {
                    id: 'field-1',
                    key: 'name',
                    type: 'TEXT',
                    label: 'Name',
                    stepId: 'non-existent-step',
                },
            ],
            steps: [
                {
                    id: 'step-1',
                    title: 'Step 1',
                    fields: ['field-1'],
                },
            ],
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'invalid-step-ref.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('step') ||
            issue.message.toLowerCase().includes('non-existent'))).toBe(true);
    });
    (0, vitest_1.it)('should validate exported template form as valid', () => {
        const template = (0, dfe_core_1.getTemplate)('contact-form');
        const config = {
            fields: template.fields,
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'template-export.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(true);
    });
    (0, vitest_1.it)('should report error when API contract is missing required endpoint', () => {
        const config = {
            fields: [
                {
                    id: 'field-1',
                    key: 'name',
                    type: 'TEXT',
                    label: 'Name',
                },
            ],
            steps: [
                {
                    id: 'step-1',
                    title: 'Submit',
                    config: {
                        apiContracts: [
                            {
                                resourceName: 'user',
                                endpoint: '',
                                fieldMapping: {},
                            },
                        ],
                    },
                },
            ],
        };
        const configPath = (0, node_path_1.join)(tmpDir, 'missing-endpoint.json');
        (0, node_fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2));
        const result = (0, validate_1.validateFormConfig)(configPath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(issue => issue.message.toLowerCase().includes('endpoint') ||
            issue.message.toLowerCase().includes('required'))).toBe(true);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWNvbW1hbmRzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjbGktY29tbWFuZHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFvRTtBQUNwRSx1RUFBNkU7QUFDN0UscUNBQXNFO0FBQ3RFLHlDQUFnQztBQUNoQyxrREFBaUQ7QUFFakQsSUFBQSxpQkFBUSxFQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7SUFDNUIsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBSSxFQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQTtJQUUvQyxJQUFBLG1CQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ2QsSUFBQSxtQkFBUyxFQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ3hDLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxrQkFBUyxFQUFDLEdBQUcsRUFBRTtRQUNiLElBQUksSUFBQSxvQkFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDdkIsSUFBQSxnQkFBTSxFQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQ3JDLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLElBQUEsV0FBRSxFQUFDLCtEQUErRCxFQUFFLEdBQUcsRUFBRTtRQUN2RSxNQUFNLE1BQU0sR0FBRztZQUNiLE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxFQUFFLEVBQUUsU0FBUztvQkFDYixHQUFHLEVBQUUsTUFBTTtvQkFDWCxJQUFJLEVBQUUsTUFBTTtvQkFDWixLQUFLLEVBQUUsTUFBTTtvQkFDYixRQUFRLEVBQUUsSUFBSTtpQkFDZjtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsU0FBUztvQkFDYixHQUFHLEVBQUUsT0FBTztvQkFDWixJQUFJLEVBQUUsT0FBTztvQkFDYixLQUFLLEVBQUUsT0FBTztvQkFDZCxRQUFRLEVBQUUsSUFBSTtpQkFDZjthQUNGO1NB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LENBQUE7UUFDeEQsSUFBQSx1QkFBYSxFQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUUxRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDZCQUFrQixFQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRTdDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDaEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDaEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQ2hELEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUNqRCxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2YsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlc2NyaWJlLCBpdCwgZXhwZWN0LCBiZWZvcmVFYWNoLCBhZnRlckVhY2ggfSBmcm9tICd2aXRlc3QnXG5pbXBvcnQgeyB2YWxpZGF0ZUZvcm1Db25maWcgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1jbGkvc3JjL2NvbW1hbmRzL3ZhbGlkYXRlJ1xuaW1wb3J0IHsgd3JpdGVGaWxlU3luYywgbWtkaXJTeW5jLCBybVN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IGdldFRlbXBsYXRlIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcblxuZGVzY3JpYmUoJ0NMSSBDb21tYW5kcycsICgpID0+IHtcbiAgY29uc3QgdG1wRGlyID0gam9pbihfX2Rpcm5hbWUsICcudG1wLWNsaS10ZXN0JylcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBta2RpclN5bmModG1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICB9KVxuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgaWYgKGV4aXN0c1N5bmModG1wRGlyKSkge1xuICAgICAgcm1TeW5jKHRtcERpciwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBhIGNvcnJlY3QgY29uZmlnIGZpbGUgYXMgdmFsaWQgd2l0aCBubyBlcnJvcnMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkLTEnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIHR5cGU6ICdURVhUJyxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZC0yJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyxcbiAgICAgICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IGpvaW4odG1wRGlyLCAndmFsaWQtY29uZmlnLmpzb24nKVxuICAgIHdyaXRlRmlsZVN5bmMoY29uZmlnUGF0aCwgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKSlcblxuICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhjb25maWdQYXRoKVxuXG4gICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZSh0cnVlKVxuICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzKS50b0hhdmVMZW5ndGgoMClcbiAgfSlcblxuICBpdCgnc2hvdWxkIHJlcG9ydCBlcnJvciB3aGVuIGJvdGggZmllbGRzIGFuZCBzdGVwcyBhcmUgbWlzc2luZycsICgpID0+IHtcbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICB0aXRsZTogJ0VtcHR5IEZvcm0nLFxuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBqb2luKHRtcERpciwgJ25vLWZpZWxkcy1zdGVwcy5qc29uJylcbiAgICB3cml0ZUZpbGVTeW5jKGNvbmZpZ1BhdGgsIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMikpXG5cbiAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoY29uZmlnUGF0aClcblxuICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGlzc3VlID0+XG4gICAgICBpc3N1ZS5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZpZWxkcycpIHx8XG4gICAgICBpc3N1ZS5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3N0ZXBzJylcbiAgICApKS50b0JlKHRydWUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXBvcnQgZXJyb3IgZm9yIGR1cGxpY2F0ZSBmaWVsZCBJRHMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkLTEnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIHR5cGU6ICdURVhUJyxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZC0xJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyxcbiAgICAgICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IGpvaW4odG1wRGlyLCAnZHVwbGljYXRlLWlkcy5qc29uJylcbiAgICB3cml0ZUZpbGVTeW5jKGNvbmZpZ1BhdGgsIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMikpXG5cbiAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoY29uZmlnUGF0aClcblxuICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpc3N1ZSA9PlxuICAgICAgaXNzdWUubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdkdXBsaWNhdGUnKSB8fFxuICAgICAgaXNzdWUubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdmaWVsZC0xJylcbiAgICApKS50b0JlKHRydWUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXBvcnQgZXJyb3IgZm9yIGR1cGxpY2F0ZSBmaWVsZCBrZXlzJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZC0xJyxcbiAgICAgICAgICBrZXk6ICd1c2VybmFtZScsXG4gICAgICAgICAgdHlwZTogJ1RFWFQnLFxuICAgICAgICAgIGxhYmVsOiAnVXNlcm5hbWUnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZC0yJyxcbiAgICAgICAgICBrZXk6ICd1c2VybmFtZScsXG4gICAgICAgICAgdHlwZTogJ1RFWFQnLFxuICAgICAgICAgIGxhYmVsOiAnVXNlciBOYW1lJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IGpvaW4odG1wRGlyLCAnZHVwbGljYXRlLWtleXMuanNvbicpXG4gICAgd3JpdGVGaWxlU3luYyhjb25maWdQYXRoLCBKU09OLnN0cmluZ2lmeShjb25maWcsIG51bGwsIDIpKVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGNvbmZpZ1BhdGgpXG5cbiAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaXNzdWUgPT5cbiAgICAgIGlzc3VlLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZHVwbGljYXRlJykgfHxcbiAgICAgIGlzc3VlLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygna2V5JylcbiAgICApKS50b0JlKHRydWUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXBvcnQgZXJyb3IgZm9yIHNlbGYtcmVmZXJlbmNpbmcgY29uZGl0aW9uJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZC0xJyxcbiAgICAgICAgICBrZXk6ICdmaWVsZDEnLFxuICAgICAgICAgIHR5cGU6ICdDSEVDS0JPWCcsXG4gICAgICAgICAgbGFiZWw6ICdBZ3JlZScsXG4gICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpZWxkS2V5OiAnZmllbGQxJyxcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogJ2VxdWFscycsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHRydWUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBqb2luKHRtcERpciwgJ3NlbGYtcmVmZXJlbmNlLmpzb24nKVxuICAgIHdyaXRlRmlsZVN5bmMoY29uZmlnUGF0aCwgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKSlcblxuICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhjb25maWdQYXRoKVxuXG4gICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGlzc3VlID0+XG4gICAgICBpc3N1ZS5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3NlbGYnKSB8fFxuICAgICAgaXNzdWUubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdyZWZlcmVuY2UnKVxuICAgICkpLnRvQmUodHJ1ZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIHJlcG9ydCBlcnJvciBmb3Igbm9uLWV4aXN0ZW50IGZpbGUnLCAoKSA9PiB7XG4gICAgY29uc3Qgbm9uRXhpc3RlbnRQYXRoID0gam9pbih0bXBEaXIsICdkb2VzLW5vdC1leGlzdC5qc29uJylcblxuICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhub25FeGlzdGVudFBhdGgpXG5cbiAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaXNzdWUgPT5cbiAgICAgIGlzc3VlLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbm90IGZvdW5kJykgfHxcbiAgICAgIGlzc3VlLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbm8gc3VjaCBmaWxlJylcbiAgICApKS50b0JlKHRydWUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXBvcnQgZXJyb3IgZm9yIGludmFsaWQgSlNPTiBzeW50YXgnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnUGF0aCA9IGpvaW4odG1wRGlyLCAnaW52YWxpZC1qc29uLmpzb24nKVxuICAgIHdyaXRlRmlsZVN5bmMoY29uZmlnUGF0aCwgJ3sgaW52YWxpZCBqc29uIGNvbnRlbnQgXScpXG5cbiAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoY29uZmlnUGF0aClcblxuICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpc3N1ZSA9PlxuICAgICAgaXNzdWUubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdqc29uJykgfHxcbiAgICAgIGlzc3VlLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygncGFyc2UnKVxuICAgICkpLnRvQmUodHJ1ZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIHJlcG9ydCBlcnJvciB3aGVuIGZpZWxkIHJlZmVyZW5jZXMgbm9uLWV4aXN0ZW50IHN0ZXAnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkLTEnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIHR5cGU6ICdURVhUJyxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgIHN0ZXBJZDogJ25vbi1leGlzdGVudC1zdGVwJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzdGVwczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdzdGVwLTEnLFxuICAgICAgICAgIHRpdGxlOiAnU3RlcCAxJyxcbiAgICAgICAgICBmaWVsZHM6IFsnZmllbGQtMSddLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWdQYXRoID0gam9pbih0bXBEaXIsICdpbnZhbGlkLXN0ZXAtcmVmLmpzb24nKVxuICAgIHdyaXRlRmlsZVN5bmMoY29uZmlnUGF0aCwgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKSlcblxuICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhjb25maWdQYXRoKVxuXG4gICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGlzc3VlID0+XG4gICAgICBpc3N1ZS5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3N0ZXAnKSB8fFxuICAgICAgaXNzdWUubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdub24tZXhpc3RlbnQnKVxuICAgICkpLnRvQmUodHJ1ZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIHZhbGlkYXRlIGV4cG9ydGVkIHRlbXBsYXRlIGZvcm0gYXMgdmFsaWQnLCAoKSA9PiB7XG4gICAgY29uc3QgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnY29udGFjdC1mb3JtJylcblxuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogdGVtcGxhdGUuZmllbGRzLFxuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBqb2luKHRtcERpciwgJ3RlbXBsYXRlLWV4cG9ydC5qc29uJylcbiAgICB3cml0ZUZpbGVTeW5jKGNvbmZpZ1BhdGgsIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMikpXG5cbiAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoY29uZmlnUGF0aClcblxuICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUodHJ1ZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIHJlcG9ydCBlcnJvciB3aGVuIEFQSSBjb250cmFjdCBpcyBtaXNzaW5nIHJlcXVpcmVkIGVuZHBvaW50JywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZC0xJyxcbiAgICAgICAgICBrZXk6ICduYW1lJyxcbiAgICAgICAgICB0eXBlOiAnVEVYVCcsXG4gICAgICAgICAgbGFiZWw6ICdOYW1lJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzdGVwczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdzdGVwLTEnLFxuICAgICAgICAgIHRpdGxlOiAnU3VibWl0JyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIGFwaUNvbnRyYWN0czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2VOYW1lOiAndXNlcicsXG4gICAgICAgICAgICAgICAgZW5kcG9pbnQ6ICcnLFxuICAgICAgICAgICAgICAgIGZpZWxkTWFwcGluZzoge30sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBqb2luKHRtcERpciwgJ21pc3NpbmctZW5kcG9pbnQuanNvbicpXG4gICAgd3JpdGVGaWxlU3luYyhjb25maWdQYXRoLCBKU09OLnN0cmluZ2lmeShjb25maWcsIG51bGwsIDIpKVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGNvbmZpZ1BhdGgpXG5cbiAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaXNzdWUgPT5cbiAgICAgIGlzc3VlLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZW5kcG9pbnQnKSB8fFxuICAgICAgaXNzdWUubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdyZXF1aXJlZCcpXG4gICAgKSkudG9CZSh0cnVlKVxuICB9KVxufSlcbiJdfQ==