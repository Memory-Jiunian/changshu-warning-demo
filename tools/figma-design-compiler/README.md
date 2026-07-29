# Figma Design Compiler — Pilot 01

This is a deliberately small Figma Development Plugin that validates one path:

`design-system/*.json` → plugin build → native Figma Variables, Components, and Variants.

It does not implement screen building, file import, localhost sync, update logic, or
idempotency.

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

## Pilot boundary

- Each run creates a new collection and new component objects.
- Existing variables or components are not detected or updated.
- `Done` badge green, borders, and inverse text are fixed visual values because the
  Pilot 01 schema intentionally contains only five variables.
- Automated checks can verify schemas, typings, and build output. Final behavior in
  the Figma desktop app requires the manual acceptance checklist in the delivery
  report.
