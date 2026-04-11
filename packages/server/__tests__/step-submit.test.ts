import { describe, it, expect, vi } from 'vitest'
import {
  resolveEndpoint,
  buildContractBody,
  propagateContext,
  executeStepSubmit,
} from '../src/step-submit'
import type { StepApiContract, FormRuntimeContext } from '@dmc-98/dfe-core'
import type { DatabaseAdapter, FormVersionRecord } from '../src/adapters'

describe('resolveEndpoint', () => {
  it('replaces placeholders with context values', () => {
    const result = resolveEndpoint('/api/employees/{employeeId}', {
      userId: 'u1',
      employeeId: '123',
    })
    expect(result).toBe('/api/employees/123')
  })

  it('throws for missing context values', () => {
    expect(() =>
      resolveEndpoint('/api/{missing}', { userId: 'u1' })
    ).toThrow('Missing context value')
  })
})

describe('buildContractBody', () => {
  it('maps field values and context to body', () => {
    const contract: StepApiContract = {
      resourceName: 'Employee',
      endpoint: '/api/employees',
      method: 'POST',
      fieldMapping: { first_name: 'firstName', email: 'email' },
      contextToBody: { orgId: 'organizationId' },
    }

    const body = buildContractBody(
      contract,
      { first_name: 'Alice', email: 'alice@example.com', extra: 'ignored' },
      { userId: 'u1', orgId: 'org-1' },
    )

    expect(body).toEqual({
      firstName: 'Alice',
      email: 'alice@example.com',
      organizationId: 'org-1',
    })
  })
})

describe('propagateContext', () => {
  it('extracts response values into context', () => {
    const contract: StepApiContract = {
      resourceName: 'Employee',
      endpoint: '/api/employees',
      method: 'POST',
      fieldMapping: {},
      responseToContext: { id: 'employeeId' },
    }

    const updated = propagateContext(
      contract,
      { id: 'emp-123', name: 'Alice' },
      { userId: 'u1' },
    )

    expect(updated).toEqual({ userId: 'u1', employeeId: 'emp-123' })
  })
})

describe('executeStepSubmit', () => {
  const mockForm: FormVersionRecord = {
    id: 'form-1',
    slug: 'test',
    title: 'Test',
    versionId: 'v1',
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        id: 'step1',
        versionId: 'v1',
        title: 'Step 1',
        order: 1,
        config: {
          apiContracts: [{
            resourceName: 'Employee',
            endpoint: '/api/employees',
            method: 'POST' as const,
            fieldMapping: { name: 'name', email: 'email' },
            responseToContext: { id: 'employeeId' },
          }],
        },
      },
    ],
    fields: [
      {
        id: 'f1', versionId: 'v1', key: 'name', label: 'Name',
        type: 'SHORT_TEXT', required: true, order: 1, stepId: 'step1',
        config: {},
      },
      {
        id: 'f2', versionId: 'v1', key: 'email', label: 'Email',
        type: 'EMAIL', required: true, order: 2, stepId: 'step1',
        config: {},
      },
    ],
  }

  it('executes API contracts and propagates context', async () => {
    const mockDb: Partial<DatabaseAdapter> = {
      executeApiContract: vi.fn().mockResolvedValue({ id: 'emp-42' }),
      updateSubmission: vi.fn().mockResolvedValue({}),
    }

    const result = await executeStepSubmit({
      form: mockForm,
      stepId: 'step1',
      payload: {
        values: { name: 'Bob', email: 'bob@test.com' },
        context: { userId: 'u1' },
      },
      db: mockDb as DatabaseAdapter,
      submissionId: 'sub-1',
    })

    expect(result.success).toBe(true)
    expect(result.context.employeeId).toBe('emp-42')
    expect(mockDb.executeApiContract).toHaveBeenCalledWith(
      expect.objectContaining({ resourceName: 'Employee' }),
      { name: 'Bob', email: 'bob@test.com' },
    )
  })

  it('returns validation errors for missing required fields', async () => {
    const mockDb: Partial<DatabaseAdapter> = {
      executeApiContract: vi.fn(),
      updateSubmission: vi.fn(),
    }

    const result = await executeStepSubmit({
      form: mockForm,
      stepId: 'step1',
      payload: {
        values: { name: '', email: 'not-an-email' },
        context: { userId: 'u1' },
      },
      db: mockDb as DatabaseAdapter,
      submissionId: 'sub-1',
    })

    expect(result.success).toBe(false)
    expect(Object.keys(result.errors ?? {}).length).toBeGreaterThan(0)
    expect(mockDb.executeApiContract).not.toHaveBeenCalled()
  })

  it('returns error for unknown step', async () => {
    const mockDb: Partial<DatabaseAdapter> = {
      executeApiContract: vi.fn(),
    }

    const result = await executeStepSubmit({
      form: mockForm,
      stepId: 'nonexistent',
      payload: { values: {}, context: { userId: 'u1' } },
      db: mockDb as DatabaseAdapter,
      submissionId: 'sub-1',
    })

    expect(result.success).toBe(false)
    expect(result.errors?._step).toContain('not found')
  })
})
