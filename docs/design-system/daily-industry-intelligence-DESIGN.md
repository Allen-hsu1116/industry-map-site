---
version: alpha
name: Daily Industry Intelligence
description: Human editorial financial intelligence for daily market focus, industry-chain maps, and evidence-backed company research.
colors:
  primary: "#24211D"
  secondary: "#6D665C"
  tertiary: "#B75E3A"
  neutral: "#F5F1E8"
  ink: "#24211D"
  inkMuted: "#6D665C"
  paper: "#F5F1E8"
  surface: "#FFFAF2"
  surfaceRaised: "#FFFDF8"
  border: "#DED4C5"
  accentClay: "#B75E3A"
  accentClayDark: "#7E3C26"
  gradeA: "#24724B"
  gradeB: "#34699A"
  gradeC: "#7A5412"
  gradeD: "#6F6A62"
  gradeF: "#9B3935"
  research: "#7457A6"
  official: "#34699A"
  derived: "#5F5AA2"
  warning: "#7A5412"
  successSurface: "#E7F0E9"
  warningSurface: "#F3E8D0"
  dangerSurface: "#F1DCD8"
typography:
  h1:
    fontFamily: Noto Serif TC
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  h2:
    fontFamily: Noto Serif TC
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h3:
    fontFamily: Noto Sans TC
    fontSize: 1.125rem
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: Noto Sans TC
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
  bodyLarge:
    fontFamily: Noto Sans TC
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: Noto Sans TC
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
  small:
    fontFamily: Noto Sans TC
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 6px
  md: 12px
  lg: 18px
  xl: 24px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  page-shell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary}"
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFAF2"
    rounded: "{rounded.lg}"
    padding: 12px
  secondary-action:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 12px
  editorial-card:
    backgroundColor: "{colors.surfaceRaised}"
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: 24px
  evidence-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.inkMuted}"
    rounded: "{rounded.lg}"
    padding: 8px
  grade-a-chip:
    backgroundColor: "{colors.successSurface}"
    textColor: "{colors.gradeA}"
    rounded: "{rounded.lg}"
    padding: 8px
  grade-c-chip:
    backgroundColor: "{colors.warningSurface}"
    textColor: "{colors.gradeC}"
    rounded: "{rounded.lg}"
    padding: 8px
  grade-b-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.gradeB}"
    rounded: "{rounded.lg}"
    padding: 8px
  grade-d-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.gradeD}"
    rounded: "{rounded.lg}"
    padding: 8px
  grade-f-chip:
    backgroundColor: "{colors.dangerSurface}"
    textColor: "{colors.gradeF}"
    rounded: "{rounded.lg}"
    padding: 8px
  research-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.research}"
    rounded: "{rounded.lg}"
    padding: 8px
  official-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.official}"
    rounded: "{rounded.lg}"
    padding: 8px
  derived-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.derived}"
    rounded: "{rounded.lg}"
    padding: 8px
  warning-chip:
    backgroundColor: "{colors.warningSurface}"
    textColor: "{colors.warning}"
    rounded: "{rounded.lg}"
    padding: 8px
---

## Overview

Daily Industry Intelligence is a calm, evidence-backed financial intelligence design system. It combines a human editorial reading experience with structured market data, source metadata, and company/topic research depth.

The product should feel like a good analyst briefing connected to an interactive industry map. It should not feel like JSON rendered into cards, a generic purple AI dashboard, or a stock screener with decorative prose.

Primary user flow:

`Daily Focus → Topic Overview → Industry Chain Map → Company Detail → Evidence / Sources`

## Colors

- **Ink (`#24211D`)** is the primary reading color. It carries research-note seriousness without using cold dashboard black.
- **Paper (`#F5F1E8`)** and **Surface (`#FFFAF2`)** create the approved Human Editorial direction.
- **Accent Clay (`#B75E3A`)** is the main interaction and emphasis color. Use it sparingly for links, section markers, and active states.
- **Grade colors** are semantic, not decorative:
  - A: `gradeA` emerald for high-conviction candidates.
  - B: `gradeB` blue/cyan for strong watchlist.
  - C: `gradeC` amber for observation.
  - D: `gradeD` muted gray for weak/noisy signal.
  - F: `gradeF` red for insufficient/blocked.
- **Research (`#7457A6`)** is reserved for external research direction and AI-derived synthesis. It must not visually overpower recommendation grades.
- **Official (`#34699A`)** identifies official exchange/MOPS/company sources.
- **Derived (`#5F5AA2`)** identifies mappings or summaries derived by rules/AI.

Color must never be the only state indicator. Grade, confidence, freshness, and source type require text labels.

## Typography

Use Traditional Chinese readability as the primary constraint.

- Headings use **Noto Serif TC** to support the editorial/research-note feel.
- Body, labels, navigation, tables, and data-heavy areas use **Noto Sans TC** for legibility.
- Use one `h1` per page. Section hierarchy must be semantic: `h1 → h2 → h3`.
- Avoid tiny, low-contrast financial metadata. If a label changes user interpretation, it must be readable.

Default reading hierarchy:
1. Human thesis sentence.
2. Decision tier or lens.
3. Why-now explanation.
4. Company/topic context.
5. Evidence/source metadata.

## Layout

### Product shell

The shell has five primary destinations:
- Daily Focus.
- Topic Overview.
- Industry Map.
- Company Database.
- AI Analysis.

The layout must support URL state for topic, active tab, filters, and company drawer.

### Daily Focus layout

Daily Focus starts with:
1. Date and freshness.
2. One-sentence market thesis.
3. “Today’s story” paragraph.
4. Daily focus cards linking to topics, stages, and companies.
5. Candidate / observation cards.
6. Compact evidence/source strips.

Do not start the page with a dense score grid.

### Industry Map layout

Industry map uses progressive disclosure:
1. Industry universe cards.
2. Topic cluster groups.
3. Value-chain lanes.
4. Representative company cards.
5. “Show all” table/list mode.

Default stage display: maximum 3–6 representative companies per stage.

A giant all-company graph is not the canonical view. Graph view can exist only as a secondary exploratory lens.

### Company Detail layout

Company detail has a concise summary first, then tabs/sections:
- Overview.
- Daily AI Analysis.
- Fundamentals.
- Technicals.
- Chip / Ownership.
- News / Events.
- Products.
- Topic Roles.
- SWOT.
- Sources.

Above the fold should answer:
- What changed today?
- What is the long-term role?
- What is the biggest risk?
- What should be watched next?

## Elevation & Depth

Use subtle depth only. Cards may use a soft shadow such as `0 18px 50px rgba(70,45,22,.10)`, but do not create a heavy layered dashboard.

Depth hierarchy:
- Page background: paper.
- Section cards: surface / surfaceRaised.
- Drawers / popovers: raised surface with stronger border.
- Source metadata: quiet chips or expandable strips.

## Shapes

Use consistent radii:
- `sm` for tiny tags and inline controls.
- `md` for table rows and compact cards.
- `lg` for chips and buttons.
- `xl` for editorial panels and major cards.

Avoid “rounded everything” slop. Radii should convey hierarchy.

## Components

### Daily Focus Card

Purpose: summarize one daily event or market signal and link it to topics/stages/companies.

Must include:
- Human headline.
- Short explanation of why it matters.
- Related topic chips.
- Related stage chips when available.
- Related company links when evidence-backed.
- Derived/source status if the mapping is not official.

### Industry Universe Card

Purpose: show parent industries without flooding users with companies.

Must include:
- Industry name.
- Today activity level.
- Topic count.
- Tracked company count.
- Latest data date/freshness.
- One current thesis sentence if available.

### Value-Chain Stage Lane

Purpose: explain the structure of a topic.

Must include:
- Stage name.
- Plain-language stage explanation.
- Representative verified companies.
- “Show all” link for full list/table.
- Narrative-only label for stages that are demand/context but not canonical company bindings.

### Company Role Card

Purpose: explain what the company does in a topic.

Must include:
- Company code/name.
- Role label.
- Directness: direct / indirect / peripheral / narrative-only.
- Confidence: verified / partial / insufficient.
- Last verified date.
- Evidence/source chips.

### Company Summary Drawer

Purpose: let users inspect a company without losing map context.

Must include:
- Company identity and current relevance.
- One human thesis sentence.
- Four-lens summary: fundamentals, technicals, chip/ownership, news/events.
- Product/topic-role/SWOT coverage snapshot.
- Link to full company detail.

### Evidence Strip

Purpose: keep trust metadata visible but secondary.

Must include:
- Source type.
- Freshness date.
- Confidence.
- Derived/official/manual label.
- Missing/partial warning when it affects conclusions.

### SWOT Evidence Card

Purpose: prevent fallback/generated SWOT from looking canonical.

Must include:
- Statement.
- Category: S/W/O/T.
- Confidence.
- Rationale.
- Evidence chips.
- Last verified date.
- Explicit fallback label when not canonical.

## Do's and Don'ts

### Do

- Lead with human-readable judgment.
- Use staged progressive disclosure for large data.
- Keep source/freshness/confidence attached to analysis claims.
- Label derived mappings clearly.
- Provide table/list fallback for large topic/company sets.
- Use URL-state for shareable filters and selected panels.
- Make empty, partial, stale, and insufficient states explicit.
- Keep Daily Focus, Industry Map, and Company Detail visually consistent.

### Don't

- Do not render hundreds of companies in one default graph.
- Do not let AI prose invent facts, sources, products, topic roles, or SWOT.
- Do not make `verified`, `partial`, `coverage`, or pipeline metadata dominate the first screen.
- Do not show D/F as recommendations.
- Do not treat narrative-only demand stages as stock bindings.
- Do not copy proprietary report content into public artifacts.
- Do not use generic AI-dashboard visuals: purple gradients, huge metric walls, glowing cards, or debug labels.
- Do not show missing numeric data as zero.

## Accessibility

- Normal text contrast should target WCAG AA at minimum.
- All map/company cards that behave as actions must be real links or buttons.
- Keyboard users must be able to move from industry → topic → stage → company → detail.
- Table/list fallback is mandatory for large maps so screen readers and keyboard users are not trapped in visual-only exploration.
- Empty and partial states must use text, not only icons/colors.

## Implementation Notes

- Build pure typed view-model adapters before React components.
- Unit-test stage ordering, topic binding, company de-duplication, and narrative-only stages.
- Keep design tokens in shared CSS/Tailwind primitives before migrating pages.
- Browser-smoke representative routes at desktop and mobile widths.
