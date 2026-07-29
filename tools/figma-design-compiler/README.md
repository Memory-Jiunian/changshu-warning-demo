# Figma Design Compiler — Pilot 01

This is a deliberately small Figma Development Plugin that validates two paths:

`design-system/*.json` → plugin build → native Figma Variables, Components, and Variants.

`design-system/screens/pending-tasks.json` → existing Components → native Figma
Instances in a Screen Frame.

It does not implement file import, localhost sync, update logic, or idempotency.

## Build

From `tools/figma-design-compiler`:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

The build writes `dist/code.js` and `dist/ui.html`. The manifest stays at the plugin
root so it can be imported directly.

## Run in Figma

1. Open the Figma desktop app and a Figma Design file.
2. Open **Plugins → Development → Import plugin from manifest...**
3. Select `tools/figma-design-compiler/manifest.json`.
4. Run **Figma Design Compiler** from **Plugins → Development**.
5. Click **Build Design System**.

The plugin creates a `Pilot Design System` local variable collection, five local
variables, a four-variant `Button` component set, a two-variant `Badge` component
set, and one `Card` component.

To validate Pilot 02, keep those generated components in the file and click
**Build Pilot Screen**. The plugin locates them by shared plugin data rather than
their display names and creates `Pending Tasks Pilot` from native instances.

## Pilot boundary

- Each run creates a new collection and new component objects.
- Existing variables or components are not detected or updated.
- The Screen Builder stops if a required stable component ID is missing or duplicated.
- Pilot 01 components created by an older plugin build do not contain the new stable
  component IDs; run **Build Design System** once with this build before building the
  Pilot 02 screen.
- `Done` badge green, borders, and inverse text are fixed visual values because the
  Pilot 01 schema intentionally contains only five variables.
- Automated checks can verify schemas, typings, and build output. Final behavior in
  the Figma desktop app requires the manual acceptance checklist in the delivery
  report.
