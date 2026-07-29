# Figma Design Compiler — Pilot 03B

This is a deliberately small Figma Development Plugin that validates two paths:

`design-system/*.json` → plugin build → native Figma Variables, Components, and Variants.

`design-system/screens/pending-tasks.json` → existing Components → native Figma
Instances in a Screen Frame.

Pilot 03A adds in-place Design System sync and idempotency checks. Pilot 03B adds
in-place sync for one top-level Screen and its direct managed children. It does
not implement file import, localhost/runtime file loading, nested Screen diffing,
or a general diff engine.

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

The UI shows the Brand and Radius values from the schema embedded in the bundle
that is actually running. Because esbuild statically bundles `tokens.json`, every
schema edit requires this exact lifecycle:

1. Run `npm.cmd run build`.
2. Close the currently running Figma plugin UI.
3. Start **Figma Design Compiler** again from **Plugins → Development**.
4. Confirm the UI Brand/Radius summary before clicking Sync.

Rebuilding does not hot-replace JavaScript in an already running plugin instance.
The completion notification repeats the actual bundled Brand and Radius values.

The plugin creates missing Pilot objects and updates existing ones in place: one
`Pilot Design System` local variable collection, five local variables, a
four-variant `Button` component set, a two-variant `Badge` component set, and one
`Card` component.

To sync the Pilot Screen, keep those generated components in the file and click
**Sync Pilot Screen**. The plugin locates components, the Screen Frame, and its
managed direct children by shared plugin data rather than display names.

## Pilot Screen sync

- The Screen Frame uses `screenId`; each managed direct child uses
  `screenChildId`.
- Missing Screen/children are created. Existing Text and Instance nodes are
  updated in place. Managed children removed from the schema are removed
  individually.
- Instance updates verify the stable ID of the current main Component or
  Component Set before applying Variant values with `setProperties`.
- Managed children are moved to the beginning of the Frame in schema order.
  Unmanaged direct children are retained after them in their existing relative
  order.
- Existing node IDs are checked after update, so retained Screen children cannot
  be replaced during an ordinary property or Variant update.
- Frames created before Pilot 03B have no `screenId` and are not adopted by name.
  The first Pilot 03B sync creates one tagged Screen; subsequent syncs update that
  Frame.

## Pilot boundary

- Repeated **Sync Design System** runs reuse stable Variable and Component identities.
- Existing Variable values and current Pilot variable bindings are updated in place.
- Every controlled fill is canonicalized on Sync, including fills already bound to
  the correct Variable. The token color replaces a stale base color while
  `figma.util.solidPaint(color, existingPaint)` preserves non-color paint properties;
  first-create paints also come directly from the current token schema.
- After sync, the plugin checks structure counts plus each controlled SolidPaint's
  base color, specific color binding, and resolved consumer value for Primary Button,
  Pending Badge, Card, and Card text.
- Variables are resolved by stable `tokenId` plugin data. For the existing Pilot 02
  file only, an untagged variable can be claimed by its exact schema name inside the
  single `Pilot Design System` collection, then receives its stable token ID.
- Existing Components and Component Sets are never deleted and recreated during sync,
  so their Instances keep their main-component association.
- Pilot 03B does not sync nested Screen trees, migrate child types or component
  identities, rename stable identities, or add/remove design-system variants.
- The Screen Builder stops if a required stable component ID is missing or duplicated.
- Components created before Pilot 02 do not contain stable component IDs and are not
  adopted by display name; legacy untagged nodes are outside Pilot 03A.
- `Done` badge green, borders, and inverse text are fixed visual values because the
  Pilot 01 schema intentionally contains only five variables.
- Automated checks can verify schemas, typings, and build output. Final behavior in
  the Figma desktop app requires the manual acceptance checklist in the delivery
  report.
