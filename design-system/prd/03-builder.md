# PRD 03 — Builder UI revamp

Status: DRAFT. Parent: `00-master`. Surface: `packages/builder`.

## 1. Problem

The visual form builder (`FieldPalette`, `FormCanvas`, `PropertyEditor`,
`BuilderToolbar`, `FormBuilder`) is styled with ad-hoc inline `style={{}}` and
hardcoded hex (e.g. `#6366f1` selection ring). It ignores the token system, has no
dark mode, and its drag/drop interactions are functional but unanimated.

## 2. Goals / success criteria

- All builder components styled via semantic tokens (scoped CSS or token-bound
  styles); zero hardcoded brand hex/px.
- Expressive-modern look: card-based canvas, glassy toolbar, gradient primary
  actions, generous rounding, layered depth.
- Showcase motion (per PRD 01): palette chip tilt on grab, dropzone highlight +
  scale, field insert/reorder animation, selection ring transition, property-panel
  slide/expand.
- Light + dark; full keyboard a11y and focus-visible rings preserved.
- No behavioral regressions in builder state/reducer logic.

## 3. Scope

In: visual + interaction layer of all 5 builder components; selection/hover/drag
states; empty-canvas state; responsive layout. Replace `#6366f1` selection style
with `--dfe-color-primary` + animated ring.

Out: new builder *features* (condition builder, step mgmt, etc. — those are
product PRDs, not this revamp). Engine logic untouched.

## 4. Plan (TDD)

1. Snapshot current builder via Storybook stories + Playwright screenshots
   (baseline, light).
2. **Red:** Testing-Library tests asserting token classes/roles and that selection
   state applies the primary token (not `#6366f1`); reduced-motion inert test.
3. **Green:** migrate component-by-component (palette → canvas → property editor →
   toolbar → shell), behind passing behavior tests at each step.
4. **Refactor:** extract shared builder primitives (Panel, FieldCard, Chip) onto
   tokens.
5. **Proof:** vitest behavior suite green; headed Playwright e2e for
   drag-to-add, reorder, select, edit — before/after screenshots in light + dark +
   reduced-motion; attach trace.

## 5. Risks

- Inline-style sprawl is large → file-by-file, each reversible; keep diffs small.
- Drag/drop is HTML5 DnD — animations must not interfere with drop targets;
  verified via e2e.

## 6. Open questions

- Builder canvas: keep single-column or introduce multi-column/section layout
  visuals now? (Lean: single-column visual polish; layout is a feature PRD.)
