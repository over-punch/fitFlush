# Active Context

## Current focus
Initial bootstrap of fit-flush as a new submodule under type-tools. v0.0.1.

## Recent changes
- 2026-04-10: Created `Liiift-Studio/fitFlush` GitHub repo (auto-README)
- 2026-04-10: Added as submodule at `type-tools/fitFlush`
- 2026-04-10: Scaffolded full repo — src (core + react), tests, configs, site stub, agent memory, README, PROCESS.md
- 2026-04-10: Stack decision — dropped Vite/Vitest in favour of `tsc` for library build and Jest + `@happy-dom/jest-environment` + `@swc/jest` for tests, matching the "Next.js only" stack direction

## Next steps
1. `npm install` inside `fitFlush/` (pending user approval per CLAUDE.md safety rules)
2. `npm run typecheck` — verify TypeScript strict passes
3. `npm run test` — run the Jest suite
4. `npm run build` — verify `dist/` output contains `index.js` + `index.d.ts`
5. Flesh out `site/` demo in a follow-up session (currently a stub landing page)
6. Lighthouse audit before v1.0.0
7. `npm publish --access public` once the above all pass and site is live

## Open questions
- Should `mode: 'width'` auto-fallback to binary search if analytical prediction overshoots more than once? (Currently: single corrective bisection, then return.)
- Rich-inline HTML preservation — worth a v0.1.0 addition?
- Should animated-transition mode be a separate function (`fitFlushAnimated`) or a flag on the existing one?
