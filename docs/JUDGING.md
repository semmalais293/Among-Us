# Judging System Specification & Architecture (Tier 2)

**Owner:** Person C (`src/services/assignment*`, `src/services/scoring*`, `src/services/normalization*`, `src/services/export*`, `src/app/judge/**`, `src/app/api/judge/**`, `tests/judging/**`)

---

## 1. Executive Summary

The Judging Subsystem provides an end-to-end evaluation pipeline for the hackathon platform. It is designed to be **100% offline-capable, self-contained, deterministic, and secure**.

Core capabilities:
1. **Judge Assignment**: Automated load-balanced round-robin assignment and manual assignment, with strict conflict-of-interest enforcement (a judge cannot evaluate a submission from their own team).
2. **Weighted Rubric Scoring**: Multi-criterion scoring with dynamic weights and max score boundaries. Calculates weighted percentages and absolute scores.
3. **Role Isolation**: Strict backend enforcement. Judges can only see and score submissions explicitly assigned to them. Only Organizers and Admins can view normalized cross-judge results, rankings, and trigger CSV exports.
4. **Cross-Judge Score Normalization**: Mathematical calibration (Z-Score standardization + global rescaling, Min-Max, and Trimmed Mean) to neutralize judge bias (harsh vs. lenient judges).
5. **CSV Export**: RFC 4180 compliant CSV generation for final standings, criterion-level breakdowns, and judging progress.

---

## 2. Architecture Chain & Role Isolation

```
Browser UI (src/app/judge/**)
       │
       ▼  (HTTP POST/GET with Session Cookie)
API Route (src/app/api/judge/**)
       │
       ▼  Backend Auth Guard
requireRole(["JUDGE", "ORGANIZER", "ADMIN"]) (src/lib/permissions)
       │
       ▼  Business Logic & Validation
Judging Services (src/services/assignment|scoring|normalization|export)
       │
       ▼  Database Access
Prisma Client (src/lib/db) -> PostgreSQL
```

### Role Access Matrix

| Operation | Participant | Judge | Organizer | Admin |
|:---|:---:|:---:|:---:|:---:|
| View Assigned Submissions | ❌ | ✅ (Assigned only) | ✅ (All) | ✅ (All) |
| Submit/Edit Assignment Score | ❌ | ✅ (Assigned only) | ❌ | ✅ |
| View Raw Scores of Other Judges | ❌ | ❌ | ✅ | ✅ |
| View Normalized Leaderboard | ❌ | ❌ (During judging) | ✅ | ✅ |
| Auto-Assign / Reassign Judges | ❌ | ❌ | ✅ | ✅ |
| Export CSVs | ❌ | ❌ | ✅ | ✅ |

---

## 3. Mathematical Specifications

### 3.1 Weighted Rubric Scoring

For a submission $s$ scored by judge $j$ across criteria $C = \{c_1, c_2, \dots, c_k\}$:
- Each criterion $c_i$ has weight $w_i > 0$ and maximum allowable score $M_i > 0$.
- The raw score given for criterion $c_i$ is $v_{i} \in [0, M_i]$.

**Normalized Percentage Score ($S_{j,s} \in [0, 100]$):**
$$S_{j,s} = \frac{\sum_{i=1}^{k} \left( \frac{v_i}{M_i} \times w_i \right)}{\sum_{i=1}^{k} w_i} \times 100$$

**Weighted Raw Points ($P_{j,s}$):**
$$P_{j,s} = \sum_{i=1}^{k} (v_i \times w_i)$$

Both metrics are computed and persisted.

### 3.2 Cross-Judge Score Normalization (Z-Score Standardization)

Judges naturally calibrate differently:
- **Lenient Judges:** High mean ($\mu \approx 90$), low spread.
- **Harsh Judges:** Low mean ($\mu \approx 55$), high spread.
- **Variable Judges:** High standard deviation ($\sigma$).

Without normalization, a team evaluated by harsh judges is penalized unfairly compared to a team evaluated by lenient judges.

#### The Z-Score Model:
1. For each judge $j$, compute their scoring mean $\mu_j$ and sample standard deviation $\sigma_j$ across all completed assignments:
   $$\mu_j = \frac{1}{N_j} \sum_{s=1}^{N_j} S_{j,s}$$
   $$\sigma_j = \sqrt{\frac{1}{N_j - 1} \sum_{s=1}^{N_j} (S_{j,s} - \mu_j)^2}$$
2. Compute the standard score (Z-score) for each submission $s$ evaluated by judge $j$:
   $$Z_{j,s} = \begin{cases} \frac{S_{j,s} - \mu_j}{\sigma_j} & \text{if } \sigma_j > 0 \\ 0 & \text{if } \sigma_j = 0 \text{ or } N_j \le 1 \end{cases}$$
3. Rescale $Z_{j,s}$ onto a calibrated 0–100 scale using the target scale $\mu_{target} = 75, \sigma_{target} = 15$:
   $$S'_{j,s} = \text{clamp}\left( \mu_{target} + Z_{j,s} \times \sigma_{target}, 0, 100 \right)$$
4. Final normalized score for submission $s$ is the mean of calibrated scores from all assigned judges $J_s$:
   $$\text{FinalScore}(s) = \frac{1}{|J_s|} \sum_{j \in J_s} S'_{j,s}$$

---

## 4. Formal Contract Request to Person A (Prisma & Libs)

Person C requires the following models and methods to be available from Person A:

### 4.1 Prisma Schema Models (`prisma/schema.prisma`)
```prisma
model Rubric {
  id        String            @id @default(uuid())
  eventId   String            @unique
  event     Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  criteria  RubricCriterion[]
  createdAt DateTime          @default(now())
}

model RubricCriterion {
  id       String   @id @default(uuid())
  rubricId String
  rubric   Rubric   @relation(fields: [rubricId], references: [id], onDelete: Cascade)
  name     String
  weight   Float    @default(1.0)
  maxScore Float    @default(10.0)
  scores   Score[]
}

model JudgeAssignment {
  id           String     @id @default(uuid())
  judgeId      String
  judge        User       @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  submissionId String
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  isCompleted  Boolean    @default(false)
  scores       Score[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([judgeId, submissionId])
}

model Score {
  id           String          @id @default(uuid())
  assignmentId String
  assignment   JudgeAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  criterionId  String
  criterion    RubricCriterion @relation(fields: [criterionId], references: [id], onDelete: Cascade)
  value        Float
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@unique([assignmentId, criterionId])
}

model AuditLog {
  id        String   @id @default(uuid())
  actorId   String
  action    String
  entity    String
  entityId  String
  details   String?
  createdAt DateTime @default(now())
}
```

---

## 5. CSV Export Specifications

All exports conform to RFC 4180:
- Fields with commas, quotes, or newlines are quoted with double quotes (`"`).
- Double quotes inside values are escaped by doubling them (`""`).
- Files are prefixed with UTF-8 BOM (`\uFEFF`) for proper Excel UTF-8 display.
