# Data Model

The PostgreSQL schema is defined in `prisma/schema.prisma` and initialized by the checked-in Prisma migration.

- `User` stores unique email, password hash, display name, and one of the four roles.
- `Session` belongs to a user, stores a unique opaque token, and expires at a timestamp.
- `Event` has start, end, submission-deadline, and status fields. It owns tracks, prizes, teams, submissions, and rubrics.
- `Track` and `Prize` belong to an event. Names are unique within their event.
- `Team` belongs to an event and has a globally unique invite code. `TeamMember` joins users to teams with a unique `(teamId, userId)` pair.
- `Submission` belongs to a team, event, and track and stores title, description, optional repository/demo URLs, status, and timestamps.
- `Rubric` belongs to an event and owns `RubricCriterion` records with weight and maximum score.
- `JudgeAssignment` links a judge user to a submission, unique per judge/submission pair. `Score` links an assignment to a criterion and is unique per assignment/criterion pair.
- `AuditLog` stores an optional actor, action, entity, entity ID, and creation time.

The seed creates sample users and event-related records for local foundation testing. The schema defines these records; it does not imply that team, submission, or judging workflows are implemented.
