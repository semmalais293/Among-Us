import { describe, it, expect } from 'vitest'
import { isSubmissionWindowOpen } from '../src/services/events'
import { EventStatus } from '@prisma/client'

describe('Submissions Service Validation', () => {
  it('correctly guards submission window using event deadline', () => {
    const expiredEvent = {
      submissionDeadline: new Date(Date.now() - 60000), // 1 min ago
      status: EventStatus.ACTIVE,
    }

    const openEvent = {
      submissionDeadline: new Date(Date.now() + 60000), // 1 min in future
      status: EventStatus.ACTIVE,
    }

    expect(isSubmissionWindowOpen(expiredEvent)).toBe(false)
    expect(isSubmissionWindowOpen(openEvent)).toBe(true)
  })

  it('rejects submissions if event is in VOTING or CLOSED stage', () => {
    const closedEvent = {
      submissionDeadline: new Date(Date.now() + 60000),
      status: EventStatus.CLOSED,
    }

    expect(isSubmissionWindowOpen(closedEvent)).toBe(false)
  })
})
