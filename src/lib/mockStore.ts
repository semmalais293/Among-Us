import bcrypt from 'bcryptjs'
import { Role, EventStatus, SubmissionStatus } from '@prisma/client'

// Pre-computed bcrypt hash for 'Password123!'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10)

export interface MockUser {
  id: string
  email: string
  passwordHash: string
  name: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface MockSession {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export interface MockEvent {
  id: string
  name: string
  description?: string | null
  startsAt: Date
  endsAt: Date
  submissionDeadline: Date
  status: EventStatus
  createdAt: Date
  updatedAt: Date
}

export interface MockTrack {
  id: string
  eventId: string
  name: string
  description?: string | null
}

export interface MockPrize {
  id: string
  eventId: string
  title: string
  description?: string | null
  amount?: string | null
}

export interface MockTeam {
  id: string
  eventId: string
  name: string
  inviteCode: string
  createdAt: Date
  updatedAt: Date
}

export interface MockTeamMember {
  id: string
  teamId: string
  userId: string
  joinedAt: Date
}

export interface MockSubmission {
  id: string
  teamId: string
  eventId: string
  trackId?: string | null
  title: string
  description: string
  repoUrl?: string | null
  demoUrl?: string | null
  status: SubmissionStatus
  createdAt: Date
  updatedAt: Date
}

// In-memory singleton state
class MockDataStore {
  users: MockUser[] = []
  sessions: MockSession[] = []
  events: MockEvent[] = []
  tracks: MockTrack[] = []
  prizes: MockPrize[] = []
  teams: MockTeam[] = []
  teamMembers: MockTeamMember[] = []
  submissions: MockSubmission[] = []
  auditLogs: any[] = []

  constructor() {
    this.reset()
  }

  reset() {
    const now = new Date()

    this.users = [
      { id: 'usr-admin', email: 'admin@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'System Admin', role: Role.ADMIN, createdAt: now, updatedAt: now },
      { id: 'usr-org', email: 'organizer@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'Sarah Organizer', role: Role.ORGANIZER, createdAt: now, updatedAt: now },
      { id: 'usr-j1', email: 'judge1@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'Dr. Evelyn Reed', role: Role.JUDGE, createdAt: now, updatedAt: now },
      { id: 'usr-j2', email: 'judge2@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'Marcus Vance', role: Role.JUDGE, createdAt: now, updatedAt: now },
      { id: 'usr-alice', email: 'alice@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'Alice Cooper', role: Role.PARTICIPANT, createdAt: now, updatedAt: now },
      { id: 'usr-bob', email: 'bob@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'Bob Martin', role: Role.PARTICIPANT, createdAt: now, updatedAt: now },
      { id: 'usr-charlie', email: 'charlie@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'Charlie Day', role: Role.PARTICIPANT, createdAt: now, updatedAt: now },
      { id: 'usr-diana', email: 'diana@dogfood.test', passwordHash: DEFAULT_PASSWORD_HASH, name: 'Diana Prince', role: Role.PARTICIPANT, createdAt: now, updatedAt: now },
    ]

    const eventId = 'evt-dogfood-2026'
    this.events = [
      {
        id: eventId,
        name: 'Dogfood 72h Hackathon 2026',
        description: 'The premier offline-capable hackathon platform dogfooding challenge. Build self-hostable, rock-solid tools.',
        startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
        endsAt: new Date(now.getTime() + 48 * 3600 * 1000),
        submissionDeadline: new Date(now.getTime() + 24 * 3600 * 1000),
        status: EventStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
    ]

    this.tracks = [
      { id: 'trk-1', eventId, name: 'Full-Stack Dev', description: 'End-to-end web applications with modern architecture and exceptional UX.' },
      { id: 'trk-2', eventId, name: 'Infra & DevOps', description: 'Self-hosted, air-gapped, and resilient infrastructure solutions.' },
      { id: 'trk-3', eventId, name: 'AI & Tooling', description: 'Local and privacy-preserving developer productivity tools.' },
    ]

    this.prizes = [
      { id: 'prz-1', eventId, title: '1st Place - Grand Champion', amount: '$10,000', description: 'Top overall submission evaluated across impact, execution, and UX.' },
      { id: 'prz-2', eventId, title: '2nd Place - Reserve Winner', amount: '$5,000', description: 'Outstanding runner-up project displaying deep technical mastery.' },
      { id: 'prz-3', eventId, title: 'Best Offline Tooling', amount: '$2,500', description: 'Special prize for zero-cloud and air-gapped engineering.' },
    ]

    const team1Id = 'team-impostors'
    const team2Id = 'team-crewmates'

    this.teams = [
      { id: team1Id, eventId, name: 'The Impostors', inviteCode: 'IMPOSTOR2026', createdAt: now, updatedAt: now },
      { id: team2Id, eventId, name: 'Crewmates Collective', inviteCode: 'CREWMATE2026', createdAt: now, updatedAt: now },
    ]

    this.teamMembers = [
      { id: 'tm-1', teamId: team1Id, userId: 'usr-alice', joinedAt: now },
      { id: 'tm-2', teamId: team1Id, userId: 'usr-bob', joinedAt: now },
      { id: 'tm-3', teamId: team2Id, userId: 'usr-charlie', joinedAt: now },
      { id: 'tm-4', teamId: team2Id, userId: 'usr-diana', joinedAt: now },
    ]

    this.submissions = [
      {
        id: 'sub-impostors',
        teamId: team1Id,
        eventId,
        trackId: 'trk-1',
        title: 'Among-Us Air-Gap Protocol',
        description: 'A high-performance peer-to-peer data synchronization engine designed specifically for air-gapped hackathon venues. Features end-to-end verification and offline consensus without external cloud dependencies.',
        repoUrl: 'https://github.com/dogfood/air-gap-protocol',
        demoUrl: 'http://localhost:3000/gallery',
        status: SubmissionStatus.SUBMITTED,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sub-crewmates',
        teamId: team2Id,
        eventId,
        trackId: 'trk-2',
        title: 'TaskMaster Offline',
        description: 'Offline task coordinator with distributed conflict-free replicated data types (CRDTs). Work-in-progress draft entry.',
        repoUrl: 'https://github.com/dogfood/taskmaster',
        demoUrl: 'http://localhost:3000/participant',
        status: SubmissionStatus.DRAFT,
        createdAt: now,
        updatedAt: now,
      },
    ]

    this.sessions = []
    this.auditLogs = []
  }
}

const globalForMock = globalThis as unknown as { mockStoreInstance: MockDataStore | undefined }
export const mockStore = globalForMock.mockStoreInstance ?? new MockDataStore()
if (process.env.NODE_ENV !== 'production') {
  globalForMock.mockStoreInstance = mockStore
}

export function createMockPrisma() {
  return {
    user: {
      findUnique: async (args: any) => {
        if (args.where?.id) return mockStore.users.find((u) => u.id === args.where.id) || null
        if (args.where?.email) return mockStore.users.find((u) => u.email.toLowerCase() === args.where.email.toLowerCase()) || null
        return null
      },
      findFirst: async (args: any) => {
        if (args?.where?.email) return mockStore.users.find((u) => u.email.toLowerCase() === args.where.email.toLowerCase()) || null
        return mockStore.users[0] || null
      },
      create: async (args: any) => {
        const id = 'usr-' + Math.random().toString(36).substring(2, 9)
        const user: MockUser = {
          id,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          name: args.data.name,
          role: args.data.role || Role.PARTICIPANT,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockStore.users.push(user)
        return user
      },
    },

    session: {
      create: async (args: any) => {
        const id = 'sess-' + Math.random().toString(36).substring(2, 9)
        const session: MockSession = {
          id,
          userId: args.data.userId,
          token: args.data.token,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
        }
        mockStore.sessions.push(session)
        return session
      },
      findUnique: async (args: any) => {
        const s = mockStore.sessions.find((sess) => sess.token === args.where?.token)
        if (!s) return null
        if (args.include?.user) {
          const user = mockStore.users.find((u) => u.id === s.userId)
          return { ...s, user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null }
        }
        return s
      },
      delete: async (args: any) => {
        const idx = mockStore.sessions.findIndex((sess) => sess.token === args.where?.token)
        if (idx !== -1) mockStore.sessions.splice(idx, 1)
        return { success: true }
      },
    },

    event: {
      findFirst: async (args?: any) => {
        const event = mockStore.events[0]
        if (!event) return null
        return populateEvent(event, args?.include)
      },
      findMany: async (args?: any) => {
        return mockStore.events.map((e) => populateEvent(e, args?.include))
      },
      findUnique: async (args: any) => {
        const event = mockStore.events.find((e) => e.id === args.where?.id)
        if (!event) return null
        return populateEvent(event, args?.include)
      },
      create: async (args: any) => {
        const id = 'evt-' + Math.random().toString(36).substring(2, 9)
        const event: MockEvent = {
          id,
          name: args.data.name,
          description: args.data.description,
          startsAt: args.data.startsAt,
          endsAt: args.data.endsAt,
          submissionDeadline: args.data.submissionDeadline,
          status: args.data.status || EventStatus.UPCOMING,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockStore.events.push(event)

        if (args.data.tracks?.create) {
          for (const t of args.data.tracks.create) {
            mockStore.tracks.push({
              id: 'trk-' + Math.random().toString(36).substring(2, 9),
              eventId: id,
              name: t.name,
              description: t.description,
            })
          }
        }

        if (args.data.prizes?.create) {
          for (const p of args.data.prizes.create) {
            mockStore.prizes.push({
              id: 'prz-' + Math.random().toString(36).substring(2, 9),
              eventId: id,
              title: p.title,
              amount: p.amount,
              description: p.description,
            })
          }
        }

        return populateEvent(event, args?.include)
      },
      update: async (args: any) => {
        const event = mockStore.events.find((e) => e.id === args.where?.id)
        if (!event) throw new Error('Event not found')
        Object.assign(event, args.data)
        event.updatedAt = new Date()

        if (args.data.tracks?.create) {
          for (const t of args.data.tracks.create) {
            mockStore.tracks.push({
              id: 'trk-' + Math.random().toString(36).substring(2, 9),
              eventId: event.id,
              name: t.name,
              description: t.description,
            })
          }
        }

        if (args.data.prizes?.create) {
          for (const p of args.data.prizes.create) {
            mockStore.prizes.push({
              id: 'prz-' + Math.random().toString(36).substring(2, 9),
              eventId: event.id,
              title: p.title,
              amount: p.amount,
              description: p.description,
            })
          }
        }

        return populateEvent(event, args?.include)
      },
    },

    track: {
      findFirst: async (args: any) => {
        return mockStore.tracks.find((t) => t.id === args.where?.id) || null
      },
      findMany: async (args?: any) => {
        let tracks = [...mockStore.tracks]
        if (args?.where?.eventId) {
          tracks = tracks.filter((t) => t.eventId === args.where.eventId)
        }
        return tracks
      },
      create: async (args: any) => {
        const id = 'trk-' + Math.random().toString(36).substring(2, 9)
        const track: MockTrack = {
          id,
          eventId: args.data.eventId,
          name: args.data.name,
          description: args.data.description,
        }
        mockStore.tracks.push(track)
        return track
      },
      delete: async (args: any) => {
        const idx = mockStore.tracks.findIndex((t) => t.id === args.where?.id)
        if (idx !== -1) {
          const [removed] = mockStore.tracks.splice(idx, 1)
          return removed
        }
        throw new Error('Track not found')
      },
    },

    prize: {
      findMany: async (args?: any) => {
        let prizes = [...mockStore.prizes]
        if (args?.where?.eventId) {
          prizes = prizes.filter((p) => p.eventId === args.where.eventId)
        }
        return prizes
      },
      create: async (args: any) => {
        const id = 'prz-' + Math.random().toString(36).substring(2, 9)
        const prize: MockPrize = {
          id,
          eventId: args.data.eventId,
          title: args.data.title,
          amount: args.data.amount,
          description: args.data.description,
        }
        mockStore.prizes.push(prize)
        return prize
      },
      delete: async (args: any) => {
        const idx = mockStore.prizes.findIndex((p) => p.id === args.where?.id)
        if (idx !== -1) {
          const [removed] = mockStore.prizes.splice(idx, 1)
          return removed
        }
        throw new Error('Prize not found')
      },
    },

    team: {
      findUnique: async (args: any) => {
        let team = null
        if (args.where?.id) team = mockStore.teams.find((t) => t.id === args.where.id)
        if (args.where?.inviteCode) team = mockStore.teams.find((t) => t.inviteCode.toUpperCase() === args.where.inviteCode.toUpperCase())
        if (!team) return null
        return populateTeam(team, args?.include)
      },
      findFirst: async (args: any) => {
        const team = mockStore.teams[0] || null
        if (!team) return null
        return populateTeam(team, args?.include)
      },
      findMany: async (args?: any) => {
        let teams = [...mockStore.teams]
        if (args?.where?.eventId) {
          teams = teams.filter((t) => t.eventId === args.where.eventId)
        }
        return teams.map((t) => populateTeam(t, args?.include))
      },
      create: async (args: any) => {
        const id = 'team-' + Math.random().toString(36).substring(2, 9)
        const team: MockTeam = {
          id,
          eventId: args.data.eventId,
          name: args.data.name,
          inviteCode: args.data.inviteCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockStore.teams.push(team)

        if (args.data.members?.create) {
          const creatorUserId = args.data.members.create.userId
          mockStore.teamMembers.push({
            id: 'tm-' + Math.random().toString(36).substring(2, 9),
            teamId: id,
            userId: creatorUserId,
            joinedAt: new Date(),
          })
        }

        return populateTeam(team, args?.include)
      },
    },

    teamMember: {
      findUnique: async (args: any) => {
        if (args.where?.teamId_userId) {
          const { teamId, userId } = args.where.teamId_userId
          return mockStore.teamMembers.find((tm) => tm.teamId === teamId && tm.userId === userId) || null
        }
        return null
      },
      findFirst: async (args: any) => {
        const { userId, team } = args.where || {}
        let members = mockStore.teamMembers.filter((tm) => tm.userId === userId)
        if (team?.eventId) {
          members = members.filter((tm) => {
            const t = mockStore.teams.find((item) => item.id === tm.teamId)
            return t?.eventId === team.eventId
          })
        }
        const found = members[0]
        if (!found) return null
        if (args.include?.team) {
          const t = mockStore.teams.find((item) => item.id === found.teamId)
          return {
            ...found,
            team: t ? populateTeam(t, args.include.team.include) : null,
          }
        }
        return found
      },
      create: async (args: any) => {
        const id = 'tm-' + Math.random().toString(36).substring(2, 9)
        const tm: MockTeamMember = {
          id,
          teamId: args.data.teamId,
          userId: args.data.userId,
          joinedAt: new Date(),
        }
        mockStore.teamMembers.push(tm)
        return tm
      },
    },

    submission: {
      findUnique: async (args: any) => {
        const sub = mockStore.submissions.find((s) => s.id === args.where?.id)
        if (!sub) return null
        return populateSubmission(sub, args?.include)
      },
      findFirst: async (args: any) => {
        const { teamId, eventId } = args.where || {}
        const sub = mockStore.submissions.find(
          (s) => (!teamId || s.teamId === teamId) && (!eventId || s.eventId === eventId)
        )
        if (!sub) return null
        return populateSubmission(sub, args?.include)
      },
      findMany: async (args?: any) => {
        let subs = [...mockStore.submissions]
        const where = args?.where
        if (where?.status) {
          subs = subs.filter((s) => s.status === where.status)
        }
        if (where?.eventId) {
          subs = subs.filter((s) => s.eventId === where.eventId)
        }
        if (where?.trackId) {
          subs = subs.filter((s) => s.trackId === where.trackId)
        }
        if (where?.OR && Array.isArray(where.OR)) {
          subs = subs.filter((s) => {
            const team = mockStore.teams.find((t) => t.id === s.teamId)
            return where.OR.some((clause: any) => {
              if (clause.title?.contains) return s.title.toLowerCase().includes(clause.title.contains.toLowerCase())
              if (clause.description?.contains) return s.description.toLowerCase().includes(clause.description.contains.toLowerCase())
              if (clause.team?.name?.contains && team) return team.name.toLowerCase().includes(clause.team.name.contains.toLowerCase())
              return false
            })
          })
        }
        return subs.map((s) => populateSubmission(s, args?.include))
      },
      create: async (args: any) => {
        const id = 'sub-' + Math.random().toString(36).substring(2, 9)
        const sub: MockSubmission = {
          id,
          teamId: args.data.teamId,
          eventId: args.data.eventId,
          trackId: args.data.trackId || null,
          title: args.data.title,
          description: args.data.description,
          repoUrl: args.data.repoUrl || null,
          demoUrl: args.data.demoUrl || null,
          status: args.data.status || SubmissionStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockStore.submissions.push(sub)
        return populateSubmission(sub, args?.include)
      },
      update: async (args: any) => {
        const sub = mockStore.submissions.find((s) => s.id === args.where?.id)
        if (!sub) throw new Error('Submission not found')
        Object.assign(sub, args.data)
        sub.updatedAt = new Date()
        return populateSubmission(sub, args?.include)
      },
    },

    auditLog: {
      create: async (args: any) => {
        const log = { id: 'log-' + Math.random().toString(36).substring(2, 9), ...args.data, createdAt: new Date() }
        mockStore.auditLogs.push(log)
        return log
      },
    },
  }
}

function populateEvent(event: MockEvent, include?: any) {
  const result: any = { ...event }
  if (include?.tracks) {
    result.tracks = mockStore.tracks.filter((t) => t.eventId === event.id)
  }
  if (include?.prizes) {
    result.prizes = mockStore.prizes.filter((p) => p.eventId === event.id)
  }
  if (include?.teams) {
    result.teams = mockStore.teams
      .filter((t) => t.eventId === event.id)
      .map((t) => populateTeam(t, include.teams?.include))
  }
  if (include?.submissions) {
    result.submissions = mockStore.submissions
      .filter((s) => s.eventId === event.id)
      .map((s) => populateSubmission(s, include.submissions?.include))
  }
  if (include?._count) {
    result._count = {
      teams: mockStore.teams.filter((t) => t.eventId === event.id).length,
      submissions: mockStore.submissions.filter((s) => s.eventId === event.id).length,
    }
  }
  return result
}

function populateTeam(team: MockTeam, include?: any) {
  const result: any = { ...team }
  if (include?.event) {
    result.event = mockStore.events.find((e) => e.id === team.eventId) || null
  }
  if (include?.members) {
    result.members = mockStore.teamMembers
      .filter((tm) => tm.teamId === team.id)
      .map((tm) => {
        const user = mockStore.users.find((u) => u.id === tm.userId)
        return {
          ...tm,
          user: user
            ? { id: user.id, name: user.name, email: user.email, role: user.role }
            : null,
        }
      })
  }
  if (include?.submissions) {
    result.submissions = mockStore.submissions
      .filter((s) => s.teamId === team.id)
      .map((s) => populateSubmission(s, include.submissions?.include))
  }
  return result
}

function populateSubmission(sub: MockSubmission, include?: any) {
  const result: any = { ...sub }
  if (include?.team) {
    const team = mockStore.teams.find((t) => t.id === sub.teamId)
    result.team = team ? populateTeam(team, include.team?.include || { members: true }) : null
  }
  if (include?.track) {
    result.track = mockStore.tracks.find((t) => t.id === sub.trackId) || null
  }
  if (include?.event) {
    const event = mockStore.events.find((e) => e.id === sub.eventId)
    result.event = event ? { id: event.id, name: event.name, status: event.status } : null
  }
  if (include?._count) {
    result._count = {
      judgeAssignments: 1,
    }
  }
  return result
}
