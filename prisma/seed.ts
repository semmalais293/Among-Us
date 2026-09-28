import { PrismaClient, SubmissionStatus, UserRole } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const userRecords = [
    {
      email: "admin@dogfood.local",
      name: "Avery Admin",
      role: UserRole.ADMIN,
      password: "AdminPass123!",
    },
    {
      email: "organizer@dogfood.local",
      name: "Morgan Organizer",
      role: UserRole.ORGANIZER,
      password: "OrganizerPass123!",
    },
    {
      email: "judge1@dogfood.local",
      name: "Jordan Judge",
      role: UserRole.JUDGE,
      password: "JudgePass123!",
    },
    {
      email: "judge2@dogfood.local",
      name: "Casey Judge",
      role: UserRole.JUDGE,
      password: "JudgePass123!",
    },
    {
      email: "judge3@dogfood.local",
      name: "Riley Judge",
      role: UserRole.JUDGE,
      password: "JudgePass123!",
    },
    ...Array.from({ length: 12 }, (_, index) => ({
      email: `participant${index + 1}@dogfood.local`,
      name: `Participant ${index + 1}`,
      role: UserRole.PARTICIPANT,
      password: "ParticipantPass123!",
    })),
  ];

  for (const record of userRecords) {
    await prisma.user.upsert({
      where: { email: record.email },
      update: { name: record.name, role: record.role },
      create: {
        email: record.email,
        name: record.name,
        role: record.role,
        passwordHash: hashSync(record.password, 12),
      },
    });
  }

  const event = await prisma.event.upsert({
    where: { id: "event-seed" },
    update: {},
    create: {
      id: "event-seed",
      name: "Dogfood 72h Hackathon",
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
      submissionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      status: "OPEN",
    },
  });

  const tracks = await Promise.all([
    prisma.track.upsert({
      where: { eventId_name: { eventId: event.id, name: "AI & Automation" } },
      update: {},
      create: {
        eventId: event.id,
        name: "AI & Automation",
        description: "AI systems and workflow automation.",
      },
    }),
    prisma.track.upsert({
      where: {
        eventId_name: { eventId: event.id, name: "Developer Experience" },
      },
      update: {},
      create: {
        eventId: event.id,
        name: "Developer Experience",
        description: "Developer tooling and productivity improvements.",
      },
    }),
  ]);

  const prizes = await Promise.all([
    prisma.prize.upsert({
      where: { eventId_name: { eventId: event.id, name: "Best Overall" } },
      update: {},
      create: { eventId: event.id, name: "Best Overall", amount: "$1,500" },
    }),
    prisma.prize.upsert({
      where: { eventId_name: { eventId: event.id, name: "Most Useful" } },
      update: {},
      create: { eventId: event.id, name: "Most Useful", amount: "$750" },
    }),
  ]);

  const teamNames = [
    "North Star",
    "Signal Forge",
    "Pixel Harbor",
    "Quiet Labs",
  ];
  const teams = [] as { id: string; name: string; inviteCode: string }[];

  for (const [index, teamName] of teamNames.entries()) {
    const team = await prisma.team.upsert({
      where: { eventId_name: { eventId: event.id, name: teamName } },
      update: {},
      create: {
        eventId: event.id,
        name: teamName,
        inviteCode: `invite-${index + 1}`,
      },
    });
    teams.push(team);
  }

  const participantUsers = await prisma.user.findMany({
    where: { role: UserRole.PARTICIPANT },
    orderBy: { email: "asc" },
  });

  for (const [index, team] of teams.entries()) {
    const members = participantUsers.slice(index * 3, index * 3 + 3);
    for (const member of members) {
      await prisma.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: member.id,
          },
        },
        update: {},
        create: {
          teamId: team.id,
          userId: member.id,
        },
      });
    }
  }

  const rubric = await prisma.rubric.upsert({
    where: { eventId_name: { eventId: event.id, name: "Default Rubric" } },
    update: {},
    create: { eventId: event.id, name: "Default Rubric" },
  });

  const criteria = [
    { name: "Idea & Originality", weight: 0.25, maxScore: 10 },
    { name: "Technical Execution", weight: 0.3, maxScore: 10 },
    { name: "UX & Presentation", weight: 0.2, maxScore: 10 },
    { name: "Impact & Scalability", weight: 0.25, maxScore: 10 },
  ];

  for (const criterion of criteria) {
    await prisma.rubricCriterion.upsert({
      where: { rubricId_name: { rubricId: rubric.id, name: criterion.name } },
      update: {},
      create: {
        rubricId: rubric.id,
        name: criterion.name,
        weight: criterion.weight,
        maxScore: criterion.maxScore,
      },
    });
  }

  const judgeUsers = await prisma.user.findMany({
    where: { role: UserRole.JUDGE },
    orderBy: { email: "asc" },
  });

  const submissions: {
    id: string;
    title: string;
    teamId: string;
    trackId: string;
  }[] = [];

  for (const [index, team] of teams.entries()) {
    const projectOffsets = index < 2 ? [0, 1, 2] : [0, 1];
    for (const offset of projectOffsets) {
      const slug = team.name.toLowerCase().replace(/\s+/g, "-");
      const submission = await prisma.submission.upsert({
        where: { id: `submission-${slug}-${offset}` },
        update: {},
        create: {
          id: `submission-${slug}-${offset}`,
          teamId: team.id,
          eventId: event.id,
          trackId: tracks[(index + offset) % tracks.length].id,
          title: `${team.name} ${offset === 0 ? "Prototype" : "Launch"}`,
          description: `A project built by ${team.name} for the hackathon.`,
          repoUrl: `https://github.com/dogfood/${slug}-${offset}`,
          demoUrl: `https://demo.local/${slug}-${offset}`,
          status: SubmissionStatus.SUBMITTED,
        },
      });
      submissions.push({
        id: submission.id,
        title: submission.title,
        teamId: submission.teamId,
        trackId: submission.trackId,
      });
    }
  }

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubricId: rubric.id },
  });

  for (const [index, submission] of submissions.entries()) {
    const judge = judgeUsers[index % judgeUsers.length];
    const assignment = await prisma.judgeAssignment.upsert({
      where: {
        judgeId_submissionId: {
          judgeId: judge.id,
          submissionId: submission.id,
        },
      },
      update: {},
      create: {
        judgeId: judge.id,
        submissionId: submission.id,
      },
    });

    for (const criterion of rubricCriteria) {
      const scoreValue = 8 + ((index + criterion.maxScore) % 2);
      await prisma.score.upsert({
        where: {
          assignmentId_criterionId: {
            assignmentId: assignment.id,
            criterionId: criterion.id,
          },
        },
        update: {},
        create: {
          assignmentId: assignment.id,
          criterionId: criterion.id,
          value: scoreValue * (criterion.weight / 0.25),
          scoredByUserId: judge.id,
        },
      });
    }
  }

  console.log("Seeded Dogfood Hackathon portal");
  console.table([
    { email: "admin@dogfood.local", password: "AdminPass123!", role: "ADMIN" },
    {
      email: "organizer@dogfood.local",
      password: "OrganizerPass123!",
      role: "ORGANIZER",
    },
    { email: "judge1@dogfood.local", password: "JudgePass123!", role: "JUDGE" },
    {
      email: "participant1@dogfood.local",
      password: "ParticipantPass123!",
      role: "PARTICIPANT",
    },
  ]);
  console.log(`Event: ${event.name}`);
  console.log(`Tracks: ${tracks.map((track) => track.name).join(", ")}`);
  console.log(`Prizes: ${prizes.map((prize) => prize.name).join(", ")}`);
  console.log(`Teams: ${teams.length}, Submissions: ${submissions.length}`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
