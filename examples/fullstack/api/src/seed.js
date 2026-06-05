"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed script: Creates an example "Employee Onboarding" form.
 * Run with: pnpm --filter dfe-example-api db:seed
 */
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding DFE example data...');
    // Create form
    const form = await prisma.dfeForm.create({
        data: {
            slug: 'employee-onboarding',
            title: 'Employee Onboarding',
            description: 'New hire onboarding form with personal info, job details, and review.',
        },
    });
    // Create version
    const version = await prisma.dfeFormVersion.create({
        data: {
            formId: form.id,
            version: 1,
            status: 'PUBLISHED',
        },
    });
    // Create steps
    const step1 = await prisma.dfeStep.create({
        data: {
            versionId: version.id,
            title: 'Personal Information',
            order: 1,
            config: {
                apiContracts: [{
                        resourceName: 'Employee',
                        endpoint: '/api/employees',
                        method: 'POST',
                        fieldMapping: {
                            first_name: 'firstName',
                            last_name: 'lastName',
                            email: 'email',
                            phone: 'phone',
                        },
                        responseToContext: { id: 'employeeId' },
                    }],
            },
        },
    });
    const step2 = await prisma.dfeStep.create({
        data: {
            versionId: version.id,
            title: 'Job Details',
            order: 2,
            config: {
                apiContracts: [{
                        resourceName: 'JobAssignment',
                        endpoint: '/api/job-assignments',
                        method: 'POST',
                        fieldMapping: {
                            department: 'departmentId',
                            role: 'role',
                            start_date: 'startDate',
                        },
                        contextToBody: { employeeId: 'employeeId' },
                    }],
            },
        },
    });
    const step3 = await prisma.dfeStep.create({
        data: {
            versionId: version.id,
            title: 'Review & Submit',
            order: 3,
            config: {
                review: { editMode: 'navigate' },
            },
        },
    });
    // Create fields — Step 1: Personal Info
    await prisma.dfeField.createMany({
        data: [
            {
                versionId: version.id,
                stepId: step1.id,
                key: 'first_name',
                label: 'First Name',
                type: 'SHORT_TEXT',
                required: true,
                order: 1,
                config: { placeholder: 'Enter first name' },
            },
            {
                versionId: version.id,
                stepId: step1.id,
                key: 'last_name',
                label: 'Last Name',
                type: 'SHORT_TEXT',
                required: true,
                order: 2,
                config: { placeholder: 'Enter last name' },
            },
            {
                versionId: version.id,
                stepId: step1.id,
                key: 'email',
                label: 'Email Address',
                type: 'EMAIL',
                required: true,
                order: 3,
                config: { placeholder: 'you@company.com' },
            },
            {
                versionId: version.id,
                stepId: step1.id,
                key: 'phone',
                label: 'Phone Number',
                type: 'PHONE',
                required: false,
                order: 4,
                config: { placeholder: '+1 (555) 000-0000' },
            },
        ],
    });
    // Create fields — Step 2: Job Details
    const deptField = await prisma.dfeField.create({
        data: {
            versionId: version.id,
            stepId: step2.id,
            key: 'department',
            label: 'Department',
            type: 'SELECT',
            required: true,
            order: 1,
            config: {
                mode: 'static',
                options: [
                    { label: 'Engineering', value: 'eng' },
                    { label: 'Design', value: 'design' },
                    { label: 'Marketing', value: 'marketing' },
                    { label: 'Operations', value: 'ops' },
                ],
            },
        },
    });
    await prisma.dfeField.createMany({
        data: [
            {
                versionId: version.id,
                stepId: step2.id,
                key: 'role',
                label: 'Role Title',
                type: 'SHORT_TEXT',
                required: true,
                order: 2,
                config: { placeholder: 'e.g., Senior Engineer' },
            },
            {
                versionId: version.id,
                stepId: step2.id,
                key: 'start_date',
                label: 'Start Date',
                type: 'DATE',
                required: true,
                order: 3,
                config: {},
            },
            {
                versionId: version.id,
                stepId: step2.id,
                key: 'needs_equipment',
                label: 'Needs Equipment?',
                type: 'CHECKBOX',
                required: false,
                order: 4,
                config: {},
            },
            {
                versionId: version.id,
                stepId: step2.id,
                key: 'equipment_notes',
                label: 'Equipment Notes',
                type: 'LONG_TEXT',
                required: false,
                order: 5,
                config: { placeholder: 'Specify laptop, monitor, etc.' },
                conditions: {
                    action: 'SHOW',
                    operator: 'and',
                    rules: [{ fieldKey: 'needs_equipment', operator: 'eq', value: true }],
                },
            },
        ],
    });
    console.log('✅ Seed complete!');
    console.log(`   Form: ${form.title} (slug: ${form.slug})`);
    console.log(`   Steps: ${step1.title}, ${step2.title}, ${step3.title}`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7O0dBR0c7QUFDSCwyQ0FBNkM7QUFFN0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxxQkFBWSxFQUFFLENBQUE7QUFFakMsS0FBSyxVQUFVLElBQUk7SUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO0lBRTdDLGNBQWM7SUFDZCxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ3ZDLElBQUksRUFBRTtZQUNKLElBQUksRUFBRSxxQkFBcUI7WUFDM0IsS0FBSyxFQUFFLHFCQUFxQjtZQUM1QixXQUFXLEVBQUUsdUVBQXVFO1NBQ3JGO0tBQ0YsQ0FBQyxDQUFBO0lBRUYsaUJBQWlCO0lBQ2pCLE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7UUFDakQsSUFBSSxFQUFFO1lBQ0osTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ2YsT0FBTyxFQUFFLENBQUM7WUFDVixNQUFNLEVBQUUsV0FBVztTQUNwQjtLQUNGLENBQUMsQ0FBQTtJQUVGLGVBQWU7SUFDZixNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ3hDLElBQUksRUFBRTtZQUNKLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNyQixLQUFLLEVBQUUsc0JBQXNCO1lBQzdCLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSxFQUFFO2dCQUNOLFlBQVksRUFBRSxDQUFDO3dCQUNiLFlBQVksRUFBRSxVQUFVO3dCQUN4QixRQUFRLEVBQUUsZ0JBQWdCO3dCQUMxQixNQUFNLEVBQUUsTUFBTTt3QkFDZCxZQUFZLEVBQUU7NEJBQ1osVUFBVSxFQUFFLFdBQVc7NEJBQ3ZCLFNBQVMsRUFBRSxVQUFVOzRCQUNyQixLQUFLLEVB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QUE7QUFDekUsQ0FBQztBQUVELElBQUksRUFBRTtLQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0tBQ3BCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU2VlZCBzY3JpcHQ6IENyZWF0ZXMgYW4gZXhhbXBsZSBcIkVtcGxveWVlIE9uYm9hcmRpbmdcIiBmb3JtLlxuICogUnVuIHdpdGg6IHBucG0gLS1maWx0ZXIgZGZlLWV4YW1wbGUtYXBpIGRiOnNlZWRcbiAqL1xuaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnXG5cbmNvbnN0IHByaXNtYSA9IG5ldyBQcmlzbWFDbGllbnQoKVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zb2xlLmxvZygn8J+MsSBTZWVkaW5nIERGRSBleGFtcGxlIGRhdGEuLi4nKVxuXG4gIC8vIENyZWF0ZSBmb3JtXG4gIGNvbnN0IGZvcm0gPSBhd2FpdCBwcmlzbWEuZGZlRm9ybS5jcmVhdGUoe1xuICAgIGRhdGE6IHtcbiAgICAgIHNsdWc6ICdlbXBsb3llZS1vbmJvYXJkaW5nJyxcbiAgICAgIHRpdGxlOiAnRW1wbG95ZWUgT25ib2FyZGluZycsXG4gICAgICBkZXNjcmlwdGlvbjogJ05ldyBoaXJlIG9uYm9hcmRpbmcgZm9ybSB3aXRoIHBlcnNvbmFsIGluZm8sIGpvYiBkZXRhaWxzLCBhbmQgcmV2aWV3LicsXG4gICAgfSxcbiAgfSlcblxuICAvLyBDcmVhdGUgdmVyc2lvblxuICBjb25zdCB2ZXJzaW9uID0gYXdhaXQgcHJpc21hLmRmZUZvcm1WZXJzaW9uLmNyZWF0ZSh7XG4gICAgZGF0YToge1xuICAgICAgZm9ybUlkOiBmb3JtLmlkLFxuICAgICAgdmVyc2lvbjogMSxcbiAgICAgIHN0YXR1czogJ1BVQkxJU0hFRCcsXG4gICAgfSxcbiAgfSlcblxuICAvLyBDcmVhdGUgc3RlcHNcbiAgY29uc3Qgc3RlcDEgPSBhd2FpdCBwcmlzbWEuZGZlU3RlcC5jcmVhdGUoe1xuICAgIGRhdGE6IHtcbiAgICAgIHZlcnNpb25JZDogdmVyc2lvbi5pZCxcbiAgICAgIHRpdGxlOiAnUGVyc29uYWwgSW5mb3JtYXRpb24nLFxuICAgICAgb3JkZXI6IDEsXG4gICAgICBjb25maWc6IHtcbiAgICAgICAgYXBpQ29udHJhY3RzOiBbe1xuICAgICAgICAgIHJlc291cmNlTmFtZTogJ0VtcGxveWVlJyxcbiAgICAgICAgICBlbmRwb2ludDogJy9hcGkvZW1wbG95ZWVzJyxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBmaWVsZE1hcHBpbmc6IHtcbiAgICAgICAgICAgIGZpcnN0X25hbWU6ICdmaXJzdE5hbWUnLFxuICAgICAgICAgICAgbGFzdF9uYW1lOiAnbGFzdE5hbWUnLFxuICAgICAgICAgICAgZW1haWw6ICdlbWFpbCcsXG4gICAgICAgICAgICBwaG9uZTogJ3Bob25lJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3BvbnNlVG9Db250ZXh0OiB7IGlkOiAnZW1wbG95ZWVJZCcgfSxcbiAgICAgICAgfV0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0pXG5cbiAgY29uc3Qgc3RlcDIgPSBhd2FpdCBwcmlzbWEuZGZlU3RlcC5jcmVhdGUoe1xuICAgIGRhdGE6IHtcbiAgICAgIHZlcnNpb25JZDogdmVyc2lvbi5pZCxcbiAgICAgIHRpdGxlOiAnSm9iIERldGFpbHMnLFxuICAgICAgb3JkZXI6IDIsXG4gICAgICBjb25maWc6IHtcbiAgICAgICAgYXBpQ29udHJhY3RzOiBbe1xuICAgICAgICAgIHJlc291cmNlTmFtZTogJ0pvYkFzc2lnbm1lbnQnLFxuICAgICAgICAgIGVuZHBvaW50OiAnL2FwaS9qb2ItYXNzaWdubWVudHMnLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGZpZWxkTWFwcGluZzoge1xuICAgICAgICAgICAgZGVwYXJ0bWVudDogJ2RlcGFydG1lbnRJZCcsXG4gICAgICAgICAgICByb2xlOiAncm9sZScsXG4gICAgICAgICAgICBzdGFydF9kYXRlOiAnc3RhcnREYXRlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRleHRUb0JvZHk6IHsgZW1wbG95ZWVJZDogJ2VtcGxveWVlSWQnIH0sXG4gICAgICAgIH1dLFxuICAgICAgfSxcbiAgICB9LFxuICB9KVxuXG4gIGNvbnN0IHN0ZXAzID0gYXdhaXQgcHJpc21hLmRmZVN0ZXAuY3JlYXRlKHtcbiAgICBkYXRhOiB7XG4gICAgICB2ZXJzaW9uSWQ6IHZlcnNpb24uaWQsXG4gICAgICB0aXRsZTogJ1JldmlldyAmIFN1Ym1pdCcsXG4gICAgICBvcmRlcjogMyxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICByZXZpZXc6IHsgZWRpdE1vZGU6ICduYXZpZ2F0ZScgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSlcblxuICAvLyBDcmVhdGUgZmllbGRzIOKAlCBTdGVwIDE6IFBlcnNvbmFsIEluZm9cbiAgYXdhaXQgcHJpc21hLmRmZUZpZWxkLmNyZWF0ZU1hbnkoe1xuICAgIGRhdGE6IFtcbiAgICAgIHtcbiAgICAgICAgdmVyc2lvbklkOiB2ZXJzaW9uLmlkLFxuICAgICAgICBzdGVwSWQ6IHN0ZXAxLmlkLFxuICAgICAgICBrZXk6ICdmaXJzdF9uYW1lJyxcbiAgICAgICAgbGFiZWw6ICdGaXJzdCBOYW1lJyxcbiAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgIGNvbmZpZzogeyBwbGFjZWhvbGRlcjogJ0VudGVyIGZpcnN0IG5hbWUnIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB2ZXJzaW9uSWQ6IHZlcnNpb24uaWQsXG4gICAgICAgIHN0ZXBJZDogc3RlcDEuaWQsXG4gICAgICAgIGtleTogJ2xhc3RfbmFtZScsXG4gICAgICAgIGxhYmVsOiAnTGFzdCBOYW1lJyxcbiAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDIsXG4gICAgICAgIGNvbmZpZzogeyBwbGFjZWhvbGRlcjogJ0VudGVyIGxhc3QgbmFtZScgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHZlcnNpb25JZDogdmVyc2lvbi5pZCxcbiAgICAgICAgc3RlcElkOiBzdGVwMS5pZCxcbiAgICAgICAga2V5OiAnZW1haWwnLFxuICAgICAgICBsYWJlbDogJ0VtYWlsIEFkZHJlc3MnLFxuICAgICAgICB0eXBlOiAnRU1BSUwnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDMsXG4gICAgICAgIGNvbmZpZzogeyBwbGFjZWhvbGRlcjogJ3lvdUBjb21wYW55LmNvbScgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHZlcnNpb25JZDogdmVyc2lvbi5pZCxcbiAgICAgICAgc3RlcElkOiBzdGVwMS5pZCxcbiAgICAgICAga2V5OiAncGhvbmUnLFxuICAgICAgICBsYWJlbDogJ1Bob25lIE51bWJlcicsXG4gICAgICAgIHR5cGU6ICdQSE9ORScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IDQsXG4gICAgICAgIGNvbmZpZzogeyBwbGFjZWhvbGRlcjogJysxICg1NTUpIDAwMC0wMDAwJyB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9KVxuXG4gIC8vIENyZWF0ZSBmaWVsZHMg4oCUIFN0ZXAgMjogSm9iIERldGFpbHNcbiAgY29uc3QgZGVwdEZpZWxkID0gYXdhaXQgcHJpc21hLmRmZUZpZWxkLmNyZWF0ZSh7XG4gICAgZGF0YToge1xuICAgICAgdmVyc2lvbklkOiB2ZXJzaW9uLmlkLFxuICAgICAgc3RlcElkOiBzdGVwMi5pZCxcbiAgICAgIGtleTogJ2RlcGFydG1lbnQnLFxuICAgICAgbGFiZWw6ICdEZXBhcnRtZW50JyxcbiAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICBvcmRlcjogMSxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgIHsgbGFiZWw6ICdFbmdpbmVlcmluZycsIHZhbHVlOiAnZW5nJyB9LFxuICAgICAgICAgIHsgbGFiZWw6ICdEZXNpZ24nLCB2YWx1ZTogJ2Rlc2lnbicgfSxcbiAgICAgICAgICB7IGxhYmVsOiAnTWFya2V0aW5nJywgdmFsdWU6ICdtYXJrZXRpbmcnIH0sXG4gICAgICAgICAgeyBsYWJlbDogJ09wZXJhdGlvbnMnLCB2YWx1ZTogJ29wcycgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSlcblxuICBhd2FpdCBwcmlzbWEuZGZlRmllbGQuY3JlYXRlTWFueSh7XG4gICAgZGF0YTogW1xuICAgICAge1xuICAgICAgICB2ZXJzaW9uSWQ6IHZlcnNpb24uaWQsXG4gICAgICAgIHN0ZXBJZDogc3RlcDIuaWQsXG4gICAgICAgIGtleTogJ3JvbGUnLFxuICAgICAgICBsYWJlbDogJ1JvbGUgVGl0bGUnLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICBvcmRlcjogMixcbiAgICAgICAgY29uZmlnOiB7IHBsYWNlaG9sZGVyOiAnZS5nLiwgU2VuaW9yIEVuZ2luZWVyJyB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdmVyc2lvbklkOiB2ZXJzaW9uLmlkLFxuICAgICAgICBzdGVwSWQ6IHN0ZXAyLmlkLFxuICAgICAgICBrZXk6ICdzdGFydF9kYXRlJyxcbiAgICAgICAgbGFiZWw6ICdTdGFydCBEYXRlJyxcbiAgICAgICAgdHlwZTogJ0RBVEUnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDMsXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB2ZXJzaW9uSWQ6IHZlcnNpb24uaWQsXG4gICAgICAgIHN0ZXBJZDogc3RlcDIuaWQsXG4gICAgICAgIGtleTogJ25lZWRzX2VxdWlwbWVudCcsXG4gICAgICAgIGxhYmVsOiAnTmVlZHMgRXF1aXBtZW50PycsXG4gICAgICAgIHR5cGU6ICdDSEVDS0JPWCcsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IDQsXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB2ZXJzaW9uSWQ6IHZlcnNpb24uaWQsXG4gICAgICAgIHN0ZXBJZDogc3RlcDIuaWQsXG4gICAgICAgIGtleTogJ2VxdWlwbWVudF9ub3RlcycsXG4gICAgICAgIGxhYmVsOiAnRXF1aXBtZW50IE5vdGVzJyxcbiAgICAgICAgdHlwZTogJ0xPTkdfVEVYVCcsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IDUsXG4gICAgICAgIGNvbmZpZzogeyBwbGFjZWhvbGRlcjogJ1NwZWNpZnkgbGFwdG9wLCBtb25pdG9yLCBldGMuJyB9LFxuICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgYWN0aW9uOiAnU0hPVycsXG4gICAgICAgICAgb3BlcmF0b3I6ICdhbmQnLFxuICAgICAgICAgIHJ1bGVzOiBbeyBmaWVsZEtleTogJ25lZWRzX2VxdWlwbWVudCcsIG9wZXJhdG9yOiAnZXEnLCB2YWx1ZTogdHJ1ZSB9XSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSlcblxuICBjb25zb2xlLmxvZygn4pyFIFNlZWQgY29tcGxldGUhJylcbiAgY29uc29sZS5sb2coYCAgIEZvcm06ICR7Zm9ybS50aXRsZX0gKHNsdWc6ICR7Zm9ybS5zbHVnfSlgKVxuICBjb25zb2xlLmxvZyhgICAgU3RlcHM6ICR7c3RlcDEudGl0bGV9LCAke3N0ZXAyLnRpdGxlfSwgJHtzdGVwMy50aXRsZX1gKVxufVxuXG5tYWluKClcbiAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gIC5maW5hbGx5KCgpID0+IHByaXNtYS4kZGlzY29ubmVjdCgpKVxuIl19