# Figma Design Compiler — Pilot 03B + V2 Slice 01

This is a deliberately small Figma Development Plugin that validates two paths:

`design-system/*.json` → plugin build → native Figma Variables, Components, and Variants.

`design-system/screens/pending-tasks.json` → existing Components → native Figma
Instances in a Screen Frame.

Pilot 03A adds in-place Design System sync and idempotency checks. Pilot 03B adds
in-place sync for one top-level Screen and its direct managed children. It does
not implement file import, localhost/runtime file loading, nested Screen diffing,
or a general diff engine.

V2 Slice 01 adds one isolated, statically bundled consumer for
`design-packages/tasklify-dashboard-v2.1-slice01`. It creates a Tasklify-scoped
Variable collection, five native Components/Component Sets, and deterministic
Desktop/Tablet renders without changing the verified Pilot paths.

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

For Tasklify, confirm the bundled Package summary in the same UI, then click
**Sync Tasklify V2 Slice 01**. Package edits require the same rebuild → close
Plugin UI → restart Plugin lifecycle.

## Tasklify V2 Slice 01

Supported V2.1 subset:

- Primitive `COLOR`/`FLOAT` Variables for color, spacing, and radius.
- Semantic `COLOR`/`FLOAT` aliases using native Figma Variable aliases.
- `figmaRepresentation.kind = variable` only.
- Native `Icon`, `Button`, and `Badge` Component Sets plus `Stat Card` and
  `Task Card` Components. `Icon` is a deterministic, offline, Slice-local SVG
  subset with `Name × Size (SM/MD/LG) × Tone (Default/Inverse)` Variants; it is
  not a general icon library.
- Contract-derived Component descriptions, Auto Layout, Semantic Variable
  bindings, Button/Badge Variant Properties, nested Badge reuse, and
  `Type × Size (SM/MD)` Badge Variants.
- Slice-managed single-color fills and strokes are canonicalized to one visible,
  fully opaque, normal-blend SolidPaint before binding the target Variable.
- One controlled `screen.tasklify.dashboard-overview` renderer with Desktop
  `975 × 694` and Tablet `834 × 1112` outputs.

Tasklify identity is always the tuple `designSystemId + stable object id`.
Collections, Variables, Components, Instances, and Screen renders use
`design-system.tasklify.reference`; Pilot objects have no matching Tasklify
design-system identity and are never adopted or overwritten.

The two Screen Frames share the Source `screenId` but use OUTPUT identities:

- `screen.tasklify.dashboard-overview@desktop`
- `screen.tasklify.dashboard-overview@tablet-834`

Existing render Frames and managed direct/nested Slice nodes are updated in place.
Only nodes tagged with the Tasklify design-system identity, matching `renderId`,
and a Slice-managed node ID can be removed. Untagged user-created children are
retained. Tablet uses a 72px icon rail, a 2×2 KPI layout, and a clipped,
readable-width Kanban stage representing horizontal-scroll semantics.

Before any Variable, Component, Desktop, or Tablet write, the Plugin runs a
read-only preflight. It rejects duplicate scoped Collections, Variables,
Components, renders, or managed node identities; managed type mismatches; and
tagged Instance/main-component identity mismatches. This is fail-before-mutation
for predictable identity conflicts, not a transaction or rollback system.

A fresh node made with a Figma creation tool has no Tasklify plugin data and is
unmanaged, so Sync retains it. Duplicating an existing Compiler-managed node also
copies its shared plugin data; that copy is therefore a managed identity collision.
Remove/detach the duplicate or create a fresh node instead. The Plugin does not
silently guess which duplicate is authoritative.

Not supported in Slice 01:

- text/effect styles, composite/none representation handling;
- ZIP/runtime import, localhost, file watching, Audit/Profile execution;
- Code/Data Mapping runtime or Interaction runtime;
- generic Pattern, recursive Screen tree diff, responsive, or layout-rhythm engines;
- mobile output, drag behavior, rotated Task Card Variant, or a Kanban Column
  Component;
- Export for Codex or handoff-manifest generation.

Unsupported Foundation representation kinds fail explicitly. Runtime behavior and
visual fidelity remain manual Figma acceptance items; static verification does not
claim `figma-ready`.

### Tasklify manual acceptance

After rebuilding and restarting the Plugin:

1. Run **Sync Tasklify V2 Slice 01** three times in the same Figma file.
2. Confirm one Tasklify Foundations collection, stable Variable IDs, and native
   Semantic aliases to Primitive Variables.
3. Confirm Icon/Button/Badge Component Sets and Stat Card/Task Card Components
   are native, scoped to Tasklify, documented, Auto Layout based, and Variable
   bound.
4. Confirm existing Pilot Variables, Components, and Screen remain unchanged.
5. Confirm one Desktop render at `975 × 694` and one Tablet render at `834 × 1112`;
   record each Frame node ID before the second/third Sync and verify it is stable.
6. Confirm Desktop uses a 187px sidebar, four KPI columns, four Kanban columns,
   and Component Instances.
7. Confirm Tablet uses an approximately 72px icon rail, 2×2 KPI cards, a readable
   fixed-width Kanban stage with horizontal-overflow semantics, and the primary
   topbar action.
8. Confirm repeated Sync creates no duplicate Collection, Variable, Component,
   Desktop render, or Tablet render and does not drift aliases, bindings, Variants,
   layout, or Instance main-component associations.
9. With the Figma Text Tool, create a fresh `TEST MANUAL NODE`; confirm it has no
   `designSystemId`, `renderId`, or `sliceNodeId`, then Sync and confirm it remains.
10. Duplicate the managed `summary.heading`, record a visible value or node ID
    elsewhere, then Sync. Confirm preflight reports `Duplicate Tasklify managed
    identity: summary.heading` and no Variable, Component, Desktop, or Tablet
    object was modified.
11. Confirm Button has exactly two visible, non-overlapping, positive-size
    Variants inside compact Set bounds; Icon has 114 (`19 × 3 × 2`) and Badge
    has 14 (`7 × 2`) with the same guarantees.
12. Confirm Task Card uses Link/Calendar/Comment Icon Instances, a separate due
    surface, Content group, avatar placeholders, comment count/divider/activity
    hierarchy, and no resized Icon Instance. Confirm Stat Card uses a black 28px
    icon surface, inverse MD icon, and SM View Details chevron.
13. Record the node ID of `Badge / Type=urgent, Size=SM`, set its `paddingTop`
    manually to `40`, and run a normal Sync. Confirm `paddingTop` returns to the
    Variable-bound Contract value while the Variant node ID remains unchanged.
    This verifies Component recovery; it is separate from identity preflight and
    must not delete/recreate the Component or Component Set.

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
