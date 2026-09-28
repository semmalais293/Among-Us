import { describe, it, expect } from 'vitest'
import { isSubmissionWindowOpen } from '../src/services/events'
import { EventStatus } from '@prisma/client'

describe('Events Service & Deadline Logic', () => {
  it('returns true when deadline is in the future and event is active', () => {
    const futureDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h
    const isOpen = isSubmissionWindowOpen({
      submissionDeadline: futureDeadline,
      status: EventStatus.ACTIVE,
    })

    expect(isOpen).toBe(true)
  })

  it('returns false when deadline is in the past', () => {
    const pastDeadline = new Date(Date.now() - 1000) // 1 second ago
    const isOpen = isSubmissionWindowOpen({
      submissionDeadline: pastDeadline,
      status: EventStatus.ACTIVE,
    })

    expect(isOpen).toBe(false)
  })

  it('returns false when event status is CLOSED regardless of deadline', () => {
    const futureDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const isOpen = isSubmissionWindowOpen({
      submissionDeadline: futureDeadline,
      status: EventStatus.CLOSED,
    })

    expect(isOpen).toBe(false)
  })
})
