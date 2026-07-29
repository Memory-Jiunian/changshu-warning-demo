# Design QA: “我的待办”Pilot Page

## Sources

- Structure reference: `C:\Users\18668\AppData\Local\Temp\codex-clipboard-1d6618f9-cfaf-432a-b06d-d2b171327059.png`
- Structure reference dimensions: 804 x 1756 px, interpreted as a 2x image for a 402 px mobile viewport.
- Visual baseline: `C:\Users\18668\Downloads\完整基准 Export\design-system-export-2026-07-29T05-10-35-203Z.zip`
- Auxiliary audit exports:
  - `design-system-export-2026-07-29T05-09-39-985Z.zip`
  - `design-system-export-2026-07-29T05-10-46-785Z.zip`
- Implemented route: `#/feedback/tasks`

The low-fidelity image is used only for information structure. Current Repository data remains authoritative for teacher name, task count, student names, content, deadline state, and click behavior.

## Component Mapping

| Page element | Existing code primitive | Exported Design System baseline |
|---|---|---|
| Todo surface | `Card` | Card / Default |
| Task status | `Badge` | Badge / Default |
| View action | `Button` | Button / Primary / MD |
| Page hierarchy | Feature typography | PageTitle, Title, Body, Caption |

No new global Todo component or parallel visual token system was created.

## Token Verification

- Color: Text Primary, Text Secondary, Brand Primary, Danger, Surface Page, Surface Card.
- Typography: PageTitle 22/30, Title 18/26, Body 14/22, Caption 12/20.
- Spacing: 4, 8, 12, 16, 24, 32.
- Radius: Card 16, Badge 4, Button 8.
- Shadow: Card `0 4px 24px rgba(0, 0, 0, 0.04)`.

## Responsive Evidence

Temporary screenshots:

- `C:\tmp\changshu-pilot-qa\pending-tasks-375.png`
- `C:\tmp\changshu-pilot-qa\pending-tasks-402.png`
- `C:\tmp\changshu-pilot-qa\pending-tasks-440.png`

| Width | Cards rendered | Horizontal overflow | Detail action |
|---|---:|---|---|
| 375 px | 3 | none | opens existing task Sheet |
| 402 px | 3 | none | opens existing task Sheet |
| 440 px | 3 | none | opens existing task Sheet |

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: none blocking the pilot.
- Design System gap: the export does not contain PageHeader or TodoItem. The page therefore composes the existing Card, Badge, Button, and typography tokens without creating a new global component.
- Design System gap: the repository's global UI primitive styles predate the supplied export. This pilot uses scoped overrides so unrelated screens are not changed before visual approval.

## Regression

- Current mock content and task count are unchanged.
- Overdue remains a derived display state.
- `markTaskRead`, route updates, and Feedback Sheet behavior are unchanged.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run verify:factual-feedback`: passed, 9 checks.
- `npm.cmd run build`: passed.

final result: passed
