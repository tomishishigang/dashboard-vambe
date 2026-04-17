---
name: repo-review
description: Full repository code review with multi-agent analysis. Reviews all source files for SOLID, DRY, YAGNI, clean architecture, reliability, testing, and maintainability issues.
user_invocable: true
---

# Full Repository Review

Run a comprehensive code review of the entire repository using parallel specialized agents and manual file analysis.

## Steps

1. **Discover source files:**
   ```bash
   find src/ -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' | sort
   ```
   Exclude generated files, `node_modules/`, and UI primitive libraries (e.g., `src/components/ui/`).

2. **Launch review agents in parallel.** Use the Agent tool to spawn these specialized reviewers concurrently on the full codebase:

   - **Code Reviewer** — Review code for adherence to project guidelines, CLAUDE.md conventions, and layer architecture. Check dependency direction, TypeScript best practices, naming, and unnecessary complexity.
   - **Silent Failure Hunter** — Hunt for silent failures: swallowed errors, empty catch blocks, unguarded `readFileSync`/`writeFileSync`, missing null checks, `JSON.parse` without try/catch, promises without error handling, type assertions that mask runtime mismatches.
   - **Test Analyzer** — Analyze test coverage: find test files, check vitest/jest config, identify modules with business logic that lack tests, and assess what test cases should exist.
   - **Type Design Analyzer** — Review types/interfaces: precision (string vs enum), interface segregation, type duplication that could be derived, `any` usage in production code, optional fields correctness. Skip if the codebase has very few custom types.
   - **Comment Analyzer** — Check comment accuracy, find comment rot, stale TODOs, commented-out code, and verify that prompts/schemas stay in sync. Skip if the codebase has very few comments.

   Pass each agent a description of the project architecture (from CLAUDE.md or README) and the list of files to review. Run them in the background while you continue with step 3.

3. **Read every source file** in full (not just diffs) to understand context. Skip UI primitive files.

4. **Analyze each file** against the criteria below. For every issue found, report it with a severity color:
   - 🔴 **Critical** — Must fix (bugs, security flaws, data loss risk, broken logic)
   - 🟠 **Major** — Should fix (SOLID violations, poor maintainability, missing error handling)
   - 🟡 **Minor** — Nice to fix (naming, small readability improvements, minor style issues)
   - 🔵 **Suggestion** — Optional improvement (alternative approaches, performance ideas)

## Review Criteria

### SOLID Principles
- **S** Single Responsibility: Does each class/function do one thing?
- **O** Open/Closed: Can behavior be extended without modifying existing code?
- **L** Liskov Substitution: Do subtypes/implementations honor their contracts?
- **I** Interface Segregation: Are interfaces focused or do they force unused methods?
- **D** Dependency Inversion: Are high-level modules depending on abstractions, not concretions?

### DRY (Don't Repeat Yourself)
- Duplicated logic that should be a shared function?
- Copy-pasted blocks across files?
- Constants or magic values repeated instead of defined once?

### YAGNI (You Aren't Gonna Need It)
- Code solving hypothetical future requirements?
- Unused parameters, methods, or interfaces added "just in case"?
- Unnecessary abstractions or indirection?

### Clean Architecture
- Are layers properly separated? (data access / business logic / presentation)
- Does business logic leak into controllers, routes, or components?
- Are external dependencies isolated behind interfaces or wrappers?
- Is the dependency direction correct? (inner layers never import from outer layers)

### Maintainability
- Is the code easy to understand without excessive comments?
- Are names clear and consistent with codebase conventions?
- Is there unnecessary complexity or premature abstraction?
- Is `any` avoided in production code?

### Testing
- Do modules with business logic have corresponding test files?
- Are pure functions tested for happy path, error cases, and edge cases?
- Is there a test runner configured (vitest, jest, etc.)?
- Do bug-prone areas (retry logic, parsing, validation) have coverage?

### Reliability
- Are error cases handled appropriately?
- Are edge cases covered (null, empty, boundary values)?
- Do async operations handle failures without silent swallowing?
- Are file/network operations wrapped in try/catch where needed?

### Scalability
- Are there N+1 patterns or unbounded loops/queries?
- Will the code work with larger datasets?

### Documentation
- Do changes to architecture require updating CLAUDE.md or README?
- Are new environment variables documented?

5. **Collect agent findings.** Once agents complete, incorporate their findings. Merge with your own analysis, deduplicating where both flagged the same issue. Tag agent-sourced findings with `[toolkit]`.

## Output Format

### Report each finding as:

```
<severity> <category> | <file>:<line> — <description>
```

Example:
```
🔴 Reliability | src/db/client.ts:102 — writeFileSync has no try/catch; disk failure corrupts the database
🟠 Clean Architecture | src/db/client.ts:2 — DB layer imports from extraction layer, creating lateral dependency
🟡 Maintainability | src/hooks/filter.ts:12 — FilterKey union manually maintained; derive from LeadRow for compile-time safety
🔵 Suggestion | src/lib/analytics.ts:46 — DashboardData could use a mapped type to reduce repetition
🟠 Reliability [toolkit] | src/app/api/route.ts:4 — API route has no error handling; throws crash the server
```

### Summary Table

After all findings, output:

```
| Category            | 🔴 | 🟠 | 🟡 | 🔵 |
|---------------------|-----|-----|-----|-----|
| SOLID               |     |     |     |     |
| DRY                 |     |     |     |     |
| YAGNI               |     |     |     |     |
| Clean Architecture  |     |     |     |     |
| Maintainability     |     |     |     |     |
| Testing             |     |     |     |     |
| Reliability         |     |     |     |     |
| Scalability         |     |     |     |     |
| Documentation       |     |     |     |     |
```

### Verdict

- **0 critical and 0 major** → **LGTM**
- **Only major issues** → **Request Changes** (list them)
- **Critical issues** → **Blocked** (list them)

Always end with a clear **LGTM**, **Request Changes**, or **Blocked** verdict.
