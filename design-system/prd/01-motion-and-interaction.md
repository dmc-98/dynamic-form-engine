# PRD 01 — Motion &amp; Interaction System

Status: DRAFT. Parent: `00-master`. Aesthetic: showcase-level (approved).

## 1. Problem

The product has no shared motion language. Interactions are instant and flat;
nothing communicates continuity (where did this come from?), state changes, or
hierarchy. We want motion that feels modern and alive but stays fast, purposeful,
and accessible.

## 2. Goals / success criteria

- A documented, token-bound motion system used by every surface.
- Ships as `packages/tokens/motion.css` (keyframes + utility classes) + guidance.
- 100% reduced-motion coverage: with `prefers-reduced-motion: reduce`, all
  animations resolve instantly and nothing breaks layout or function.
- No animation longer than `--dfe-duration-slow` (240ms) for UI feedback; only
  ambient/loop effects (shimmer, spinner, hero) may run longer.
- Only GPU-friendly properties animated (`transform`, `opacity`, `filter`,
  `box-shadow`); no animating `width/height/top/left` for interactive feedback.

## 3. Motion tokens (in `tokens.css`)

- Durations: `--dfe-duration-instant 80 · fast 120 · base 160 · slow 240` ms.
- Easings: `--dfe-ease-standard` (enter/move), `--dfe-ease-out` (exit),
  `--dfe-ease-emphasized`, `--dfe-ease-spring` (overshoot for playful affordances).
- `--dfe-stagger-step` (60ms) for choreographed group reveals.
- `--dfe-ring-primary` animated focus/selection halo.

## 4. Interaction catalog (what animates, and why)

| Pattern | Motion | Token(s) | Meaning |
|---|---|---|---|
| Button hover | sheen fade + shadow raise | base / standard | affordance |
| Button press | scale 0.96 | fast / spring | tactile feedback |
| Input focus | border + animated ring | base / out | focus location |
| Field error | pop-in chip | base / spring | draw attention |
| Card hover | lift -4px + shadow | base / spring | depth, interactivity |
| List/section reveal | staggered rise on scroll | slow / spring + stagger | continuity |
| Builder drag | chip tilt + grab cursor; dropzone highlight + scale | fast/base | spatial feedback |
| Chart entrance | bars grow from baseline, staggered | slow / spring | data reveal |
| Stepper advance | active pill + index scale, color shift | base / spring | progress |
| Toast | glass pop-in bottom-right, auto-dismiss | base / spring | non-blocking notice |
| Loading | skeleton shimmer + spinner | loop | perceived performance |
| Theme switch | smooth color cross-fade | slow / standard | calm transition |
| Marketing hero | gradient mesh + scroll-driven reveals | slow | first-impression polish |

## 5. Implementation

- `motion.css` exposes keyframes (`dfe-rise`, `dfe-pop`, `dfe-grow`,
  `dfe-shimmer`, `dfe-spin`, `dfe-toast-in`) and utility classes (`.dfe-reveal`,
  `.dfe-lift`, `.dfe-skeleton`, …) all bound to motion tokens.
- A tiny shared helper (`@dmc--98/dfe-react` `useReveal`) wraps IntersectionObserver
  for staggered scroll reveals, no-op under reduced-motion.
- Global reduced-motion guard shipped in `motion.css`.

## 6. Test plan (TDD)

- Unit: assert keyframes/utilities reference only motion tokens (no magic ms);
  assert reduced-motion block present; `useReveal` returns inert state when
  `matchMedia('(prefers-reduced-motion: reduce)')` is true (mocked).
- e2e (Playwright): one normal run + one `reducedMotion: 'reduce'` run; assert
  elements reach final state in both; screenshot the builder drag and chart entrance.
- Perf smoke: no layout thrash (animate transform/opacity only) — lint rule/check.

## 7. Open questions

- Scroll-driven hero effects: cap on mobile / low-end (disable below a width)?
- Spinner vs. skeleton default for async dashboard panels?
