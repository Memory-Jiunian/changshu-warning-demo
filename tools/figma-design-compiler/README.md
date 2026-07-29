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
5. Click **Sync Design System**.

The plugin creates missing Pilot objects and updates existing ones in place: one
`Pilot Design System` local variable collection, five local variables, a
four-variant `Button` component set, a two-variant `Badge` component set, and one
`Card` component.

To validate Pilot 02, keep those generated components in the file and click
**Build Pilot Screen**. The plugin locates them by shared plugin data rather than
their display names and creates `Pending Tasks Pilot` from native instances.

## Pilot boundary

- Repeated **Sync Design System** runs reuse stable Variable and Component identities.
- Existing Variable values and current Pilot variable bindings are updated in place.
- Variables are resolved by stable `tokenId` plugin data. For the existing Pilot 02
  file only, an untagged variable can be claimed by its exact schema name inside the
  single `Pilot Design System` collection, then receives its stable token ID.
- Existing Components and Component Sets are never deleted and recreated during sync,
  so their Instances keep their main-component association.
- Pilot 03A does not sync Screens, delete removed schema items, rename identities,
  migrate arbitrary structures, or add/remove component variants.
- The Screen Builder stops if a required stable component ID is missing or duplicated.
- Components created before Pilot 02 do not contain stable component IDs and are not
  adopted by display name; legacy untagged nodes are outside Pilot 03A.
- `Done` badge green, borders, and inverse text are fixed visual values because the
  Pilot 01 schema intentionally contains only five variables.
- Automated checks can verify schemas, typings, and build output. Final behavior in
  the Figma desktop app requires the manual acceptance checklist in the delivery
  report.
