# AGENTS.md

## Project Context

This project is a mobile-first UI demo for a UX portfolio.
The product is a campus mental-health mini-program used after a formal risk warning has been reviewed by a psychological counselor.

The mini-program is not a student assessment product, not a chatbot product, and not a simple notification tool.
Its role is to support mobile collaboration, task distribution, observation feedback, progress tracking, clue reporting, and closed-loop handling after a formal warning has been created.

## Main Goal

Build a presentable frontend demo that helps communicate the designer's product thinking in a UX portfolio.

The demo should clearly show:

1. How AI-generated risk clues become formal warnings only after counselor review.
2. How different school roles collaborate after a warning is confirmed.
3. How the system protects sensitive psychological information.
4. How warning follow-up moves from task distribution to feedback, intervention, review, and closure.
5. How the mini-program supports mobile collaboration instead of replacing the professional management system.

## Required Documents

Before implementing or modifying UI, read these files:

1. `DESIGN.md`
   Use it as the visual reference and token source.

2. `requirements/miniapp-requirements.md`
   Use it as the product requirement source.

## Design Direction

Use `DESIGN.md` as visual inspiration, but do not copy it blindly.

The uploaded design system has a black-and-white, austere, SpaceX-inspired visual style.
For this mental-health mini-program, adapt the style into a serious, restrained, readable, and trustworthy mobile interface.

Follow these principles:

* Mobile-first layout, target viewport width around 375px.
* Clear information hierarchy.
* Calm and restrained visual tone.
* Avoid excessive decoration.
* Avoid making the product look like a space, rocket, or marketing website.
* Use black, white, gray, and restrained semantic status colors only when necessary.
* Keep Chinese text readable and natural.
* Prioritize task clarity over visual drama.

## Product Rules

The product flow should reflect:

AI-generated risk clue
→ counselor review
→ formal warning
→ task distribution
→ teacher observation feedback
→ counselor confirmation
→ follow-up intervention
→ retest / continued attention / closure / referral

Do not design the system as if AI directly determines a student's psychological risk level.

Do not expose full psychological assessment results, original sensitive answers, or raw AI judgment to non-professional roles.

Different roles should see different levels of information:

* Counselor: can see warning summary, follow-up records, collaboration timeline, and intervention progress.
* Homeroom teacher: can see assigned observation tasks, behavior focus, feedback form, and non-sensitive student context.
* Grade director or school manager: can see task progress and closed-loop status, but not private psychological details.

## Required Pages

Implement or maintain these core pages:

1. Warning Collaboration Dashboard
2. Warning Task Detail
3. Follow-up Record Form
4. Collaboration Clue Report
5. Handling Progress / Closure Detail

Use mock data. Do not build a real backend unless explicitly requested.

## Component Expectations

Create reusable components where possible:

* `MobileShell`
* `TaskCard`
* `StatusBadge`
* `AttentionLevelTag`
* `Timeline`
* `FormField`
* `BottomActionBar`
* `PermissionNotice`
* `EmptyState`

## Implementation Rules

* Use the existing project structure and technology stack if one already exists.
* If no project exists, use React + TypeScript + Vite.
* Keep styles centralized.
* Prefer reusable components over one-off page styling.
* Use semantic names for components and mock data.
* Make reasonable assumptions when details are missing and document them in the final summary.
* Run build or lint commands if they exist.
* After changes, summarize:

  * implemented pages
  * changed files
  * key assumptions
  * any unresolved issues

## Portfolio Priority

This demo is for a UX portfolio.
Every screen should help explain product logic, role collaboration, risk handling, privacy protection, and closed-loop design.

Do not add features just to make the product look complete.
Prioritize the few pages that best prove the design judgment.
