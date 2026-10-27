# Frontend UI/UX Rules — frontend-vue

## Stack reality (don't assume otherwise)
- Vue 3 + Vite, Options/Composition API mixed in the existing codebase — match the style already used in the file you're editing.
- Styling is plain per-feature CSS files under `src/assets/` (e.g. `community.css`, `assessment.css`), imported by their matching views/components. No Tailwind, no component library installed yet. Do not introduce Tailwind, shadcn-vue, Ionic, or any new CSS framework without explicit approval — extend the existing per-feature CSS pattern instead.
- Packaged as a mobile app via Capacitor (Android/iOS, see `capacitor.config.json`). Always account for safe-area insets, touch target size (min 44x44px), and native-feeling gestures — this is not a desktop-only web app.
- i18n via `vue-i18n`, locale files under `src/locales/{en,vi}/`. Every user-facing string needs both `en` and `vi` entries — never hardcode Vietnamese or English text directly in a `.vue` file.
- Peaceflow is a mental-health / mindfulness app (assessments, journaling, community, experts, emergency support). Tone matters: calm, reassuring, never alarming — especially on emergency/crisis screens.

## Design direction
- Reuse the color tokens, spacing, and component patterns already present in the matching CSS file before inventing new ones. Check 2-3 sibling views for the established look before styling a new one.
- Avoid generic AI aesthetics: no decorative gradients, no stock-icon-in-a-circle filler, no repeated identical card grids, no meaningless filler copy.
- Favor a calm, soft, low-stimulation palette consistent with the wellness tone of the app over bold/loud SaaS-dashboard styling.
- Every interactive element needs visible states: hover (where relevant), active/pressed, disabled, loading, error.
- Support loading, empty, and error states for every screen that fetches data.

## Workflow for UI tasks
- Before building a new screen, check for a similar existing one (list/form/detail pattern) and follow its structure rather than designing from scratch.
- After implementing or changing UI, use the Playwright MCP to open the dev server in a real browser, check 375px/768px/1440px widths, and check the console for errors — don't declare a UI task done from reading code alone.
- When a change touches visual design meaningfully, use the `ui-ux` or `impeccable` skill; use `web-design-guidelines` as a final accessibility/UX pass before calling it done.

## Definition of done
- Both `en` and `vi` locale strings added.
- Checked at mobile width with Playwright, including safe-area/notch-sensitive layouts.
- No console errors/warnings introduced.
- Existing CSS file patterns respected — no stray new framework or inline style sprawl.
