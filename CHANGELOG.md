# Changelog

## 0.3.9

- Fixed drag-and-drop uploads after lazy-loading package parsing by snapshotting dropped files and browser directory entries before the asynchronous importer runs.
- Added a safe fallback from directory-entry parsing to the captured `DataTransfer.files` list when browser drag data entries are unavailable.
- Kept the validator checking mechanism unchanged.

## 0.3.8

- Lazy-load validator and archive handling so the landing page bundle stays lightweight.
- Added direct sidebar access for token budget and fix recommendations.
- Moved upload/archive normalization into lighter domain modules to avoid pulling validation dependencies into initial load.
- Added a dependency-free quality lint gate and unified typecheck/build scripts.
- Cleaned environment configuration, GitHub repo settings, and SEO metadata.
- Removed generated build artifacts and local OS metadata from the source handoff.


## 0.3.7

- Unified the post-landing workspace with the landing page design system.
- Replaced the report/editor shell palette with the same cream paper, zinc ink, lime accent, rounded surfaces, and subtle grid atmosphere used on the landing page.
- Retuned header actions, report panels, file tree, tabs, score bars, status pills, and editor chrome for visual continuity while preserving readability.
- Validator checking behavior remains unchanged.

## 0.3.6

- Redesigned the landing page using the frontend-design direction with a clearer editorial validation-bench aesthetic.
- Reworked the upload panel, hero, trust bar, checks section, workflow, and sources section for better readability and navigation.
- Kept validator checking behavior unchanged.

## 0.3.5

- Reworked post-upload typography for readability: switched dense tool surfaces to a native UI font stack, reduced overly heavy font weights, and softened letter spacing.
- Increased sidebar, file tree, tab, header metadata, and editor text sizing where the previous redesign felt compressed.
- Preserved the validator checking mechanism and existing report/editor functionality.

## 0.3.4

- Rebuilt the post-upload review workspace with a compact audit queue and reduced visual density.
- Redesigned report overview, findings, score, section, file-risk, editor, file tree, tabs, and header surfaces for clearer navigation and alignment.
- Added finding filters for actionable, error, warning, fixable, and all issue states without changing the validator checking mechanism.
- Preserved live revalidation, file navigation, suggested fixes, AI prompt copy, JSON export, and repaired ZIP export.


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
