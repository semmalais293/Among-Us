import { PrismaClient, Role, EventStatus, SubmissionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data for idempotency
  await prisma.score.deleteMany()
  await prisma.judgeAssignment.deleteMany()
  await prisma.rubricCriterion.deleteMany()
  await prisma.rubric.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.prize.deleteMany()
  await prisma.track.deleteMany()
  await prisma.event.deleteMany()
  await prisma.session.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('Password123!', 10)

  // 1. Users
  console.log('👤 Creating users...')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dogfood.test',
      name: 'System Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  })

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@dogfood.test',
      name: 'Sarah Organizer',
      passwordHash,
      role: Role.ORGANIZER,
    },
  })

  const judge1 = await prisma.user.create({
    data: {
      email: 'judge1@dogfood.test',
      name: 'Dr. Evelyn Reed',
      passwordHash,
      role: Role.JUDGE,
    },
  })

  const judge2 = await prisma.user.create({
    data: {
      email: 'judge2@dogfood.test',
      name: 'Marcus Vance',
      passwordHash,
      role: Role.JUDGE,
    },
  })

  const alice = await prisma.user.create({
    data: {
      email: 'alice@dogfood.test',
      name: 'Alice Cooper',
      passwordHash,
      role: Role.PARTICIPANT,
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@dogfood.test',
      name: 'Bob Martin',
      passwordHash,
      role: Role.PARTICIPANT,
    },
  })

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@dogfood.test',
      name: 'Charlie Day',
      passwordHash,
      role: Role.PARTICIPANT,
    },
  })

  const diana = await prisma.user.create({
    data: {
      email: 'diana@dogfood.test',
      name: 'Diana Prince',
      passwordHash,
      role: Role.PARTICIPANT,
    },
  })

  // 2. Event
  console.log('🏆 Creating event...')
  const now = new Date()
  const startsAt = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
  const endsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 2 days from now
  const submissionDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day from now

  const event = await prisma.event.create({
    data: {
      name: 'Dogfood 72h Hackathon 2026',
      description: 'The premier offline-capable hackathon platform dogfooding challenge. Build self-hostable, rock-solid tools.',
      startsAt,
      endsAt,
      submissionDeadline,
      status: EventStatus.ACTIVE,
    },
  })

  // 3. Tracks
  console.log('🛣️ Creating tracks...')
  const fullstackTrack = await prisma.track.create({
    data: {
      eventId: event.id,
      name: 'Full-Stack Dev',
      description: 'End-to-end web applications with modern architecture and exceptional UX.',
    },
  })

  const infraTrack = await prisma.track.create({
    data: {
      eventId: event.id,
      name: 'Infra & DevOps',
      description: 'Self-hosted, air-gapped, and resilient infrastructure solutions.',
    },
  })

  const aiTrack = await prisma.track.create({
    data: {
      eventId: event.id,
      name: 'AI & Tooling',
      description: 'Local and privacy-preserving developer productivity tools.',
    },
  })

  // 4. Prizes
  console.log('🎁 Creating prizes...')
  await prisma.prize.createMany({
    data: [
      {
        eventId: event.id,
        title: '1st Place - Grand Champion',
        amount: '$5,000',
        description: 'Highest overall score across all evaluation criteria.',
      },
      {
        eventId: event.id,
        title: '2nd Place - Runner Up',
        amount: '$2,500',
        description: 'Second highest overall score across all criteria.',
      },
      {
        eventId: event.id,
        title: 'Best Offline Experience',
        amount: '$1,500',
        description: 'Exemplary zero-network architecture and resilience.',
      },
    ],
  })

  // 5. Rubric & Criteria
  console.log('⚖️ Creating rubric and criteria...')
  const rubric = await prisma.rubric.create({
    data: {
      eventId: event.id,
      name: 'Dogfood Standard Evaluation Rubric',
    },
  })

  const criterion1 = await prisma.rubricCriterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Technical Execution & Architecture',
      weight: 0.35,
      maxScore: 10,
    },
  })

  const criterion2 = await prisma.rubricCriterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Impact & Dogfood Usefulness',
      weight: 0.25,
      maxScore: 10,
    },
  })

  const criterion3 = await prisma.rubricCriterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Design & User Experience',
      weight: 0.20,
      maxScore: 10,
    },
  })

  const criterion4 = await prisma.rubricCriterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Innovation & Creativity',
      weight: 0.20,
      maxScore: 10,
    },
  })

  // 6. Teams & Members
  console.log('👥 Creating teams...')
  const team1 = await prisma.team.create({
    data: {
      eventId: event.id,
      name: 'The Impostors',
      inviteCode: 'IMPOSTOR2026',
    },
  })

  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: alice.id },
      { teamId: team1.id, userId: bob.id },
    ],
  })

  const team2 = await prisma.team.create({
    data: {
      eventId: event.id,
      name: 'Crewmates Collective',
      inviteCode: 'CREWMATE2026',
    },
  })

  await prisma.teamMember.createMany({
    data: [
      { teamId: team2.id, userId: charlie.id },
      { teamId: team2.id, userId: diana.id },
    ],
  })

  // 7. Submissions
  console.log('🚀 Creating submissions...')
  const submission1 = await prisma.submission.create({
    data: {
      eventId: event.id,
      teamId: team1.id,
      trackId: fullstackTrack.id,
      title: 'Among-Us Self-Hostable Hackathon Portal',
      description: 'Fully self-contained, air-gapped hackathon platform built with Next.js App Router, Prisma, and PostgreSQL. Features zero external service dependencies, custom bcrypt auth, weighted rubrics, and judge score normalization.',
      repoUrl: 'https://github.com/semmalais293/Among-Us',
      demoUrl: 'http://localhost:3000',
      status: SubmissionStatus.SUBMITTED,
    },
  })

  const submission2 = await prisma.submission.create({
    data: {
      eventId: event.id,
      teamId: team2.id,
      trackId: infraTrack.id,
      title: 'Radar: Air-Gapped Service Monitor',
      description: 'Lightweight daemon and dashboard for monitoring Docker Compose service health, logs, and database connectivity without external telemetry or SaaS agents.',
      repoUrl: 'https://github.com/crewmates/radar',
      demoUrl: 'http://localhost:3000/radar-preview',
      status: SubmissionStatus.SUBMITTED,
    },
  })

  // 8. Judge Assignments & Sample Scores
  console.log('📝 Creating judge assignments & scores...')
  const assignment1 = await prisma.judgeAssignment.create({
    data: {
      judgeId: judge1.id,
      submissionId: submission1.id,
    },
  })

  await prisma.score.createMany({
    data: [
      { assignmentId: assignment1.id, criterionId: criterion1.id, value: 9.5, notes: 'Exceptional architectural isolation and offline readiness.' },
      { assignmentId: assignment1.id, criterionId: criterion2.id, value: 9.0, notes: 'Directly solves self-hosted hackathon challenges.' },
      { assignmentId: assignment1.id, criterionId: criterion3.id, value: 8.5, notes: 'Clean dark mode and responsive layout.' },
      { assignmentId: assignment1.id, criterionId: criterion4.id, value: 9.0, notes: 'Very thoughtful role isolation.' },
    ],
  })

  const assignment2 = await prisma.judgeAssignment.create({
    data: {
      judgeId: judge2.id,
      submissionId: submission1.id,
    },
  })

  await prisma.score.createMany({
    data: [
      { assignmentId: assignment2.id, criterionId: criterion1.id, value: 9.0, notes: 'Solid TypeScript and clean service layer.' },
      { assignmentId: assignment2.id, criterionId: criterion2.id, value: 8.5, notes: 'Extremely practical.' },
      { assignmentId: assignment2.id, criterionId: criterion3.id, value: 8.5, notes: 'Looks very polished.' },
      { assignmentId: assignment2.id, criterionId: criterion4.id, value: 8.5, notes: 'Impressive 72h effort.' },
    ],
  })

  const assignment3 = await prisma.judgeAssignment.create({
    data: {
      judgeId: judge1.id,
      submissionId: submission2.id,
    },
  })

  await prisma.score.createMany({
    data: [
      { assignmentId: assignment3.id, criterionId: criterion1.id, value: 8.0, notes: 'Effective docker socket integration.' },
      { assignmentId: assignment3.id, criterionId: criterion2.id, value: 8.5, notes: 'Great for air-gapped monitoring.' },
      { assignmentId: assignment3.id, criterionId: criterion3.id, value: 7.5, notes: 'Functional terminal UI.' },
      { assignmentId: assignment3.id, criterionId: criterion4.id, value: 8.0, notes: 'Clever design.' },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log(`
  Demo Credentials (Password for all: Password123!):
  - Admin:       admin@dogfood.test
  - Organizer:   organizer@dogfood.test
  - Judge 1:     judge1@dogfood.test
  - Judge 2:     judge2@dogfood.test
  - Participant: alice@dogfood.test (Team: The Impostors)
  - Participant: charlie@dogfood.test (Team: Crewmates Collective)
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
