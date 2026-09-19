<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>

# Testing & Quality Gates

</div>

[← Wiki home](./README.md)

---

## Gates

A change is done when all five pass:

```bash
npx prettier --check .   # formatting
bun run lint             # eslint (incl. react-hooks, prettier integration)
bun run typecheck        # tsc --noEmit
bun test                 # unit tests
bun run test:e2e         # playwright: desktop-chrome + mobile-chrome
```

## Unit tests (Bun)

Colocated `*.test.ts`, pure-function focus:

- `src/lib/recommendations.test.ts` — recommendation depth/visit-count logic.
- `src/lib/server/guardrails.test.ts` — rate limiting, client-key extraction, bucket pruning.

Run one file: `bun test src/lib/recommendations.test.ts`. Guidance: extract pure logic (scoring, parsing, ranking) so it can be tested without a DOM; that is the project's test seam.

## E2E (Playwright)

`playwright.config.ts` starts its own dev server (reuses `E2E_BASE_URL` if set) and runs two projects: **desktop-chrome** and **mobile-chrome** (Pixel 5).

- `e2e/ui-smoke.e2e.ts`
  - Every route renders `< 500` with no "Application error".
  - No horizontal overflow on mobile.
  - Keyboard Tab reaches a visible interactive control.
- `e2e/language-switcher.e2e.ts`
  - Menu opens via ArrowDown, `aria-expanded` toggles, arrow keys move focus among `menuitemradio`s, Escape closes and returns focus.
  - Selecting नेपाली applies `lang="ne"` (and cleans up its localStorage).

First run needs browsers: `npx playwright install chromium`.

```bash
npx playwright test                          # everything
npx playwright test --project=desktop-chrome # one project
npx playwright test --grep "language"        # by name
npx playwright show-trace <trace.zip>        # debug a failure
```

## What to test for new work

| Change                                             | Expected check                          |
| -------------------------------------------------- | --------------------------------------- |
| Pure logic (scoring, parsing, validation)          | Unit test next to the module            |
| New route                                          | Add it to `routes` in `ui-smoke.e2e.ts` |
| New interactive component with a keyboard contract | An e2e spec asserting that contract     |
| Bug fix                                            | Reproduce as a test first, then fix     |

## CI notes

The full suite must stay green on `main`. Playwright traces are retained on failure (`trace: "retain-on-failure"`); artifacts land in `test-results/` (gitignored).
