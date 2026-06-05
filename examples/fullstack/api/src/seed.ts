/**
 * Seed script: Creates an example "Employee Onboarding" form.
 * Run with: pnpm --filter dfe-example-api db:seed
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding DFE example data...')
  const tenantId = process.env.DFE_TENANT_ID ?? 'demo-tenant'

  const existingForm = await prisma.dfeForm.findFirst({
    where: {
      tenantId,
      slug: 'employee-onboarding',
    },
  })

  if (existingForm) {
    await prisma.dfeSubmission.deleteMany({
      where: { formId: existingForm.id },
    })
    await prisma.dfeForm.delete({
      where: { id: existingForm.id },
    })
  }

  // Create form
  const form = await prisma.dfeForm.create({
    data: {
      tenantId,
      slug: 'employee-onboarding',
      title: 'Employee Onboarding',
      description: 'New hire onboarding form with personal info, job details, and review.',
    },
  })

  // Create version
  const version = await prisma.dfeFormVersion.create({
    data: {
      formId: form.id,
      version: 1,
      status: 'PUBLISHED',
    },
  })

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
  })

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
  })

  const step3 = await prisma.dfeStep.create({
    data: {
      versionId: version.id,
      title: 'Review & Submit',
      order: 3,
      config: {
        review: { editMode: 'navigate' },
      },
    },
  })

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
        config: {
          placeholder: 'Enter first name',
          dataClassification: 'pii',
          compliance: {
            protected: true,
            encryptAtRest: true,
            allowAnalytics: false,
            redactInAuditLogs: true,
            retentionDays: 30,
          },
        },
      },
      {
        versionId: version.id,
        stepId: step1.id,
        key: 'last_name',
        label: 'Last Name',
        type: 'SHORT_TEXT',
        required: true,
        order: 2,
        config: {
          placeholder: 'Enter last name',
          dataClassification: 'pii',
          compliance: {
            protected: true,
            encryptAtRest: true,
            allowAnalytics: false,
            redactInAuditLogs: true,
            retentionDays: 30,
          },
        },
      },
      {
        versionId: version.id,
        stepId: step1.id,
        key: 'email',
        label: 'Email Address',
        type: 'EMAIL',
        required: true,
        order: 3,
        config: {
          placeholder: 'you@company.com',
          dataClassification: 'pii',
          compliance: {
            protected: true,
            encryptAtRest: true,
            allowAnalytics: false,
            redactInAuditLogs: true,
            retentionDays: 30,
          },
        },
      },
      {
        versionId: version.id,
        stepId: step1.id,
        key: 'phone',
        label: 'Phone Number',
        type: 'PHONE',
        required: false,
        order: 4,
        config: {
          placeholder: '+1 (555) 000-0000',
          dataClassification: 'pii',
          compliance: {
            protected: true,
            encryptAtRest: true,
            allowAnalytics: false,
            redactInAuditLogs: true,
            retentionDays: 30,
          },
        },
      },
    ],
  })

  // Create fields — Step 2: Job Details
  const departmentField = await prisma.dfeField.create({
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
  })

  const teamField = await prisma.dfeField.create({
    data: {
      versionId: version.id,
      stepId: step2.id,
      key: 'team',
      label: 'Team',
      type: 'SELECT',
      required: false,
      order: 2,
      config: {
        mode: 'dynamic',
        dataSource: {
          endpoint: '',
          cursorParam: 'cursor',
          pageSize: 10,
          searchParam: 'q',
          labelKey: 'label',
          valueKey: 'value',
          dependsOnField: 'department',
          dependsOnParam: 'department',
        },
      },
    },
  })

  await prisma.dfeField.update({
    where: { id: teamField.id },
    data: {
      config: {
        mode: 'dynamic',
        dataSource: {
          endpoint: `/dfe/fields/${teamField.id}/options`,
          cursorParam: 'cursor',
          pageSize: 10,
          searchParam: 'q',
          labelKey: 'label',
          valueKey: 'value',
          dependsOnField: 'department',
          dependsOnParam: 'department',
        },
      },
    },
  })

  await prisma.dfeFieldOption.createMany({
    data: [
      {
        fieldId: teamField.id,
        label: 'Platform Engineering',
        value: 'platform',
        order: 1,
        meta: { department: 'eng' },
      },
      {
        fieldId: teamField.id,
        label: 'Infrastructure',
        value: 'infrastructure',
        order: 2,
        meta: { department: 'eng' },
      },
      {
        fieldId: teamField.id,
        label: 'Design Systems',
        value: 'design-systems',
        order: 3,
        meta: { department: 'design' },
      },
      {
        fieldId: teamField.id,
        label: 'Brand Studio',
        value: 'brand-studio',
        order: 4,
        meta: { department: 'design' },
      },
      {
        fieldId: teamField.id,
        label: 'Lifecycle',
        value: 'lifecycle',
        order: 5,
        meta: { department: 'marketing' },
      },
      {
        fieldId: teamField.id,
        label: 'People Operations',
        value: 'people-ops',
        order: 6,
        meta: { department: 'ops' },
      },
    ],
  })

  await prisma.dfeField.createMany({
    data: [
      {
        versionId: version.id,
        stepId: step2.id,
        key: 'role',
        label: 'Role Title',
        type: 'SHORT_TEXT',
        required: true,
        order: 3,
        config: { placeholder: 'e.g., Senior Engineer' },
      },
      {
        versionId: version.id,
        stepId: step2.id,
        key: 'start_date',
        label: 'Start Date',
        type: 'DATE',
        required: true,
        order: 4,
        config: {},
      },
      {
        versionId: version.id,
        stepId: step2.id,
        key: 'needs_equipment',
        label: 'Needs Equipment?',
        type: 'CHECKBOX',
        required: false,
        order: 5,
        config: {},
      },
      {
        versionId: version.id,
        stepId: step2.id,
        key: 'equipment_notes',
        label: 'Equipment Notes',
        type: 'LONG_TEXT',
        required: false,
        order: 6,
        config: { placeholder: 'Specify laptop, monitor, etc.' },
        conditions: {
          action: 'SHOW',
          operator: 'and',
          rules: [{ fieldKey: 'needs_equipment', operator: 'eq', value: true }],
        },
      },
    ],
  })

  const experiment = await prisma.dfeExperiment.create({
    data: {
      formId: form.id,
      tenantId,
      name: 'Onboarding hero copy',
      status: 'ACTIVE',
    },
  })

  await prisma.dfeExperimentVariant.createMany({
    data: [
      {
        experimentId: experiment.id,
        key: 'control',
        label: 'Standard welcome',
        weight: 1,
        overrides: {
          eyebrow: 'Standard onboarding',
          headline: 'Everything you need to get started',
          body: 'Complete a few essentials and we will take care of the rest.',
        },
      },
      {
        experimentId: experiment.id,
        key: 'guided',
        label: 'Guided ramp-up',
        weight: 1,
        overrides: {
          eyebrow: 'Guided onboarding',
          headline: 'A faster path to day one readiness',
          body: 'We will use your answers to tailor equipment and team setup before you arrive.',
        },
      },
    ],
  })

  console.log('✅ Seed complete!')
  console.log(`   Form: ${form.title} (slug: ${form.slug})`)
  console.log(`   Steps: ${step1.title}, ${step2.title}, ${step3.title}`)
  console.log(`   Tenant: ${tenantId}`)
  console.log(`   Experiment: ${experiment.name}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
