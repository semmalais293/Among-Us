# Judging System Specification & Documentation (Tier 2)

**Owner:** Person C (`src/services/assignment*`, `src/services/scoring*`, `src/services/normalization*`, `src/services/export*`, `src/app/judge/**`, `src/app/api/judge/**`, `tests/judging/**`)

---

## 1. Executive Summary

The Judging Subsystem provides an evaluation pipeline for the hackathon platform. It is engineered with **pure functional service cores**, **strict backend role isolation**, and **zero external network dependencies**, ensuring full offline operation for the 72h hackathon.

---

## 2. Assignment Strategy

### 2.1 Pure Balanced Load Distribution Algorithm
The automated assignment engine (`src/services/assignment.ts: assign`) allocates submissions to judges with the following guarantees:
1. **Equal Load ($\pm 1$ Project)**: For $S$ submissions, $J$ judges, and $k$ judges per submission, the total assignment slots are $S \times k$. The base workload per judge is $\lfloor (S \times k) / J \rfloor$, with at most $(S \times k) \pmod J$ judges receiving $\text{base} + 1$ assignments. Thus, $\max(\text{load}) - \min(\text{load}) \le 1$.
2. **No Duplicate Evaluations**: A judge is never assigned the same project more than once.
3. **Deterministic Selection**: Uses current workload as primary sort criterion and judge ID as secondary sort criterion for deterministic execution across restarts.
4. **Manual Assignment Option**: Supports manual assignment creation (`manualAssign`) and revocation (`removeAssignment`), preventing accidental duplicates.

---

## 3. Scoring Formula & Rubric Validation

### 3.1 Mathematical Formula
Each submission is evaluated against an event rubric consisting of criteria $C = \{c_1, \dots, c_k\}$. Each criterion has weight $w_i > 0$ and maximum allowable score $M_i > 0$. The raw score given is $v_i \in [0, M_i]$.

$$\text{Weighted Score Percentage} = \frac{\sum_{i=1}^{k} \left( \frac{v_i}{M_i} \times w_i \right)}{\sum_{i=1}^{k} w_i} \times 100$$

### 3.2 Boundary & Integrity Checks
- **Strict Range Validation**: $0 \le v_i \le M_i$. Any value outside this range immediately throws an explicit boundary error.
- **Criteria Membership**: Every evaluated criterion must belong to the rubric of the event.
- **Weights Integrity**: All criterion weights must be strictly positive.

---

## 4. Normalization Method & Why

### 4.1 The Problem: Inter-Judge Grading Bias
Judges exhibit substantial cognitive and grading divergence:
- **Harsh Judges**: Average score $\mu \approx 40\%$, high bar, top projects receive $\approx 65\%$.
- **Lenient Judges**: Average score $\mu \approx 90\%$, generous bar, lowest projects receive $\approx 80\%$.

Under raw arithmetic averaging:
- A mediocre project evaluated by lenient judges receives **80%**.
- An exceptional project evaluated by harsh judges receives **65%**.
- **Result**: The mediocre project wins unfairly due to judge assignment lottery.

### 4.2 The Solution: Z-Score Standardization with Fallback
For each judge $j$, we compute their sample mean $\mu_j$ and sample standard deviation $\sigma_j$ (using Bessel's correction with $N-1$ denominator):

$$\mu_j = \frac{1}{N_j} \sum_{i=1}^{N_j} x_{i,j}, \quad \sigma_j = \sqrt{\frac{1}{N_j - 1} \sum_{i=1}^{N_j} (x_{i,j} - \mu_j)^2}$$

#### Transformation:
1. **Standard Z-Score ($N_j \ge 2$ and $\sigma_j > 0$)**:
   $$Z_{i,j} = \frac{x_{i,j} - \mu_j}{\sigma_j}$$
   Normalized score calibrated to target scale ($\mu_{\text{target}} = 75, \sigma_{\text{target}} = 15$):
   $$\text{Score}_{\text{norm}} = \mu_{\text{target}} + Z_{i,j} \times \sigma_{\text{target}}$$
2. **Fallback to Mean-Centering ($N_j < 2$ or $\sigma_j = 0$)**:
   When sample size is too small to estimate variance, or the judge gave identical scores to all submissions, division by zero is avoided by falling back to mean-centering:
   $$Z_{i,j} = x_{i,j} - \mu_j = 0, \quad \text{Score}_{\text{norm}} = \mu_{\text{target}} + (x_{i,j} - \mu_j)$$
3. **Submission Final Ranking**:
   Normalized scores from all judges assigned to submission $s$ are averaged:
   $$\text{FinalScore}(s) = \frac{1}{|J_s|} \sum_{j \in J_s} \text{Score}_{\text{norm}}(j, s)$$

Submissions are then ranked descending by `FinalScore`.

---

## 5. Known Limitations

1. **Very Small Sample Sizes per Judge ($N < 2$)**: Judges who only evaluate a single project cannot establish a variance curve. They fall back to mean-centering ($Z=0$), relying on other judges' evaluations for calibration.
2. **Small Judge Overlap**: If disjoint sets of judges evaluate disjoint sets of submissions, normalization aligns the judges' subjective distributions, but true cross-cluster calibration benefits from random round-robin assignment.
3. **Extreme Outliers**: If a judge scores four projects at 50% and one at 99%, sample variance will be skewed by the single outlier. A trimmed mean or larger minimum assignment quota ($\ge 3$ projects per judge) is recommended.

---

## 6. Role Isolation & Backend Access Control

Authorization is strictly verified on the backend for all API endpoints:

| Action | Participant | Judge | Organizer | Admin |
|:---|:---:|:---:|:---:|:---:|
| Read Assigned Submissions | ❌ 403 Forbidden | ✅ (Only own assignments) | ✅ (All) | ✅ (All) |
| Read Assignment Scores | ❌ 403 Forbidden | ✅ (Only own scores) | ✅ (All) | ✅ (All) |
| Submit / Modify Score | ❌ 403 Forbidden | ✅ (Only assigned projects) | ❌ 403 Forbidden | ✅ |
| View Normalized Standings | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ (Aggregates) | ✅ (Aggregates) |
| Export CSVs | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ | ✅ |

---

## 7. CSV Export Endpoints (RFC 4180)

All CSV files include UTF-8 BOM (`\uFEFF`) for seamless rendering in Excel and comply with RFC 4180 field quoting:
1. `GET /api/judge/export?type=assignments`: Dumps all judge allocations and completion statuses.
2. `GET /api/judge/export?type=details`: Dumps line-item rubric criteria scores per judge and project.
3. `GET /api/judge/export?type=leaderboard`: Dumps final rankings with raw averages and normalized calibrated scores.

---

## 8. Definition of Done & Test Suite Verification

All tests run completely offline with zero database dependencies:

```bash
node tests/judging/run.js
```

### Verified Test Suites:
- `tests/judging/normalization.test.ts`: Proves mathematically that harsh judge vs lenient judge fixture inverts biased raw rankings. Validates mean-centering fallbacks.
- `tests/judging/assignment.test.ts`: Proves load balancing ($\pm 1$ project across all judges) and guarantees no duplicate judge per submission.
- `tests/judging/scoring.test.ts`: Proves weighted rubric formula and boundary enforcement (rejects $<0$ or $> \text{maxScore}$).
- `tests/judging/role-isolation.test.ts`: Proves 403 Forbidden enforcement when judges attempt to read/write other judges' data, or participants attempt to access judging.
- `tests/judging/export.test.ts`: Proves RFC 4180 compliant escaping and UTF-8 BOM generation.
