# Design QA: 事实观察反馈

## Visual source

- High fidelity: `事实观察反馈-设计执行包/feedback-design-execution-kit/references/high-fidelity/`
- Prototype states: `事实观察反馈-设计执行包/feedback-design-execution-kit/references/prototype/`
- Canonical tokens: `src/features/factualFeedback/tokens.css`
- Baseline viewport: 402px
- Responsive range: 375–440px

## Coverage

| State | Evidence |
|---|---|
| Teacher pending list | `C:\tmp\factual-feedback-qa\teacher-list-402.png` |
| Empty feedback form | `C:\tmp\factual-feedback-qa\teacher-sheet-empty-402.png` |
| Filled feedback form | `C:\tmp\factual-feedback-qa\teacher-sheet-filled-402.png` |
| Required validation | `C:\tmp\factual-feedback-qa\teacher-validation-402.png` |
| Overdue and still submittable | `C:\tmp\factual-feedback-qa\teacher-overdue-402.png` |
| Submit confirmation | `C:\tmp\factual-feedback-qa\teacher-confirm-402.png` |
| Submitting state | `C:\tmp\factual-feedback-qa\teacher-submitting-402.png` |
| Success toast | `C:\tmp\factual-feedback-qa\teacher-success-toast-402.png` |
| Failure dialog | `C:\tmp\factual-feedback-qa\teacher-failure-dialog-402.png` |
| Psychologist read-only review | `C:\tmp\factual-feedback-qa\psychologist-readonly-402.png` |

Screenshots are temporary QA evidence and are not committed.

## Responsive verification

| Width | Teacher list | Empty Sheet | Horizontal overflow |
|---|---|---|---|
| 375px | captured | captured | none |
| 402px | captured | captured | none |
| 440px | captured | captured | none |

## Interaction verification

- Empty submit shows two field-level errors and scrolls to the first invalid field.
- Closing a form with content saves a user/task-scoped draft and shows `已自动保存草稿`.
- Reopening the same task restores the draft.
- Confirmation dialog contains only the submission summary.
- Submitting disables repeated actions and shows `提交中`.
- Successful submit closes the Sheet, changes the task to submitted, reduces the visible count, and shows `反馈已提交`.
- Simulated failure preserves the form and draft and exposes a retry action.
- Overdue status is visually emphasized without disabling submission.
- Psychologist review is read-only; `确认已查看` writes view metadata without changing task status.

## Visual checks

- Uses the supplied pale-blue-to-white page gradient.
- Cards use 16px radius and soft shadow.
- Inputs and buttons use 12px radius.
- Bottom Sheet uses 24px top radius.
- Primary actions use the supplied dark token; brand emphasis uses the supplied blue token.
- Sheet header and footer remain fixed while the content region scrolls independently.
- Bottom actions include safe-area padding.
- Product icons describe feedback, time, status, and review rather than copying source-domain facility icons.

## Outstanding manual check

- A real mobile device soft-keyboard pass is still recommended because headless desktop emulation cannot validate native keyboard resizing.

final result: passed
