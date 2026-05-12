# Changelog

## 0.3.3

- Tightened the full app shell spacing across the header, sidebars, tabs, report views, file tree, and editor.
- Added reduced-motion-safe microinteractions for cards, controls, upload drag state, score bars, and notices.
- Reworked file tabs to remove nested clickable controls and improve horizontal overflow behavior.
- Improved overview hierarchy with a clearer next-action panel and visible validation coverage.
- Improved findings, score, section, and file-risk cards with consistent borders, actions, and status treatment.
- Added editor issue-line chips for faster line jumps and strengthened focused-line highlighting.

## 0.3.2

- Restored visibility for every validator section in the left sidebar.
- Added a `Sections checked` coverage grid to the overview.
- Kept attention sections prioritized while leaving passed sections visible and muted.

## 0.3.1

- Moved workspace tabs into the center panel only.
- Kept report navigation as a persistent left sidebar.
- Kept the file tree as a persistent right-side IDE explorer.
- Added `ReportSidebar.tsx` to separate report navigation from report content.
- Preserved Ctrl+S / Cmd+S local save and live validation behavior in the editor.

## 0.3.0

- Converted the previous side-workspace prototype into a pinned report tab plus IDE-style file tabs.
- Added persistent right-side file tree with issue indicators.
- Added editable file tabs with Ctrl+S / Cmd+S local save + validation rerun.
- Kept live revalidation on file edits.
- Split the monolithic `App.tsx` into validator, domain, and component modules.
- Moved the validation engine into `src/validator/validateSkill.ts`.
- Added issue-to-file navigation helpers and quick-fix plumbing.
- Retained AI fix prompt generation and updated ZIP export.
