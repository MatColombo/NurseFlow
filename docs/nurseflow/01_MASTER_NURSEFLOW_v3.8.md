# NurseFlow - Product, UX and UI Specification v3.8

**Date:** 2026-10-29  
**Working name:** NurseFlow (placeholder)  
**Delivery:** GitHub Pages-hosted, installable PWA  
**Status:** PERSONAL USE; LOCAL STORAGE; **ALL PAGES 00–11 UX/UI FROZEN; ALL IMPORTED-READY POLICIES FROZEN.** Production integration, technical normalization, and cross-device verification remain pending.


**v3.8 FINAL READY IMPORT POLICY (2026-10-29; HIGHEST PRECEDENCE, USER APPROVED):** BOTH Page 11A (single/multiple procedure or library import) AND Page 11B (full backup restore) retain an imported procedure's **usable Ready** status, provided the portable package passes format/security/integrity checks, graph/reference migration, and the local structural checks necessary to load it safely. A fresh manual Check & Mark Ready is **NOT mandatory** solely because it was imported. Imported Draft remains Draft. Ready versions remain immutable; import remaps identifiers atomically while preserving references and never mutates any procedure already in the library or any active run. The warnings already defined for missing local media (W07) or a saved link to a deleted step (W08) remain nonblocking where the package is otherwise valid, and must appear to the user; W08 still interrupts navigation safely if traversed. An invalid/unsafe/incompatible package is rejected before commit, rather than automatically converted into Ready. The UI may indicate Imported and allow an optional user-initiated recheck, but must not imply medical endorsement. This user choice REPLACES the prior proposed 11A/11B hybrid and resolves the last open functional decision in §19.3. Settings-only imports contain no procedures and hence no Ready state. ALL PAGE UX/UI and this policy are frozen; technical implementation and QA are next.

**v3.7 USER FREEZE (2026-10-29; HIGHEST PRECEDENCE):** The user explicitly approves and FREEZES Page 11A (`Procedure e libreria` / `Procedures & Library`) and Page 11B (`Backup app e impostazioni` / `App Backup & Settings`) as designed in authoritative §18 of v3.6. All Page **00–11 UX/UI screens are FROZEN**, including the two separate Settings navigation rows. Page 11A has selection from actual procedure/library content, one or several procedure exports, whole-group and visible-result selection, local keyword/group/label filters, direct full-library export, multiple import files, initially all importable procedures selected, individual read-only preview before confirmation, wrong-scope file refusal with route to 11B, and additive-only procedure/library imports. Page 11B handles settings-only and complete backup scopes, with optional Settings replacement only after current-vs-imported comparison and explicit separate confirmation. Graph/media/Ready snapshots and ongoing sessions must retain reference integrity, and imported procedure/library files NEVER mutate existing library records. §18 is now FROZEN except for the explicitly outstanding imported Ready activation policy. This freeze is for UX/UI design and data behavior, NOT a claim that the standalone HTML demo is a production app or that device testing has been completed. **Imported Ready activation policy remains OPEN**, as the prior discussion explicitly reserved it; see §19.3. Historical `PROPOSED` labels in §18 and older change logs are superseded by this header. §19 contains the whole-product cross-screen audit, release gates and one outstanding product decision.

**v3.6 HIGHEST-PRECEDENCE USER DIRECTION (2026-10-29):** Split Page 10's prior single `Backup & Restore` navigation row into TWO independent Settings rows: **`Procedure e libreria`** (Page 11A) and **`Backup app e impostazioni`** (Page 11B). Page 11A is a library-aware interface: **Export** shows the actual current procedure list; full-text search and group/label filters; select one/many procedures or entire group(s), persistent selection when filters change, inline procedure preview, and a direct `Export entire library` shortcut. **Import** accepts MULTIPLE procedure/library files in one batch, verifies packages, combines procedure candidates, begins with ALL procedure candidates SELECTED, supports the SAME search and filters plus per-procedure and per-group deselection, and provides a genuine read-only detailed procedure preview BEFORE a final additive import confirmation. Settings-only or Complete-backup files given to 11A are REJECTED without mutation, with a `Go to App Backup & Settings` navigation action; conversely Page 11B rejects procedure/library files with an explanation and a `Go to Procedure & Library` action. Page 11B retains v3.5 user-approved settings/full backup import/export behavior, but removes single-procedure/full-library entries. **Never change/delete/replace any existing procedure or library content during any import**. Settings replacement is allowed only with explicit preview/warning/confirmation, and full backup does NOT replace settings by default. All four package scopes remain supported across the two separate destinations. Page 10 general settings layout and 4..48pt scale remain FROZEN; the two data navigation entry labels are a specifically requested narrow change. Page 11A/11B exact UX remains PROPOSED for user review (not frozen). See AUTHORITATIVE section 18; it supersedes all prior single-screen Page 11 navigation and four-card layout proposals. The stand-alone interactive Page 11A+11B prototype is `NurseFlow_Procedure_Libreria_v3.6.html` (DEMO ONLY; no real import/export/storage writes). The exact imported Ready activation policy remains UNDECIDED from v3.5 and must not be claimed frozen.

**v3.5 AUTHORITATIVE APPROVAL / PRECEDENCE (2026-10-29):** The user explicitly approves and FREEZES Page 10's global scale v3.4 experiment: one slider from **4 to 48 pt**, default **13 pt**, fixed additive hierarchy (page heading +4 pt, prominent step/question +3 pt, notes -1 pt, badges/metadata -2 pt), and live scaling of UI text, spacing, icons, cards, controls and containing geometry, with natural reflow and no horizontal overlap/bleeding. Decorative spacing approaches zero at minimum, while intrinsic text layout and nonzero usable hit targets remain protected. Pages **00–10 are now FROZEN**. Page 10 replaces previous Normal/Large text selection and all separate spacing/typography sliders. The previously clarified Page 11 policy remains binding: **library import ALWAYS ADD ONLY**; settings may replace only after preview and separate confirmation; a complete backup imports library/run copies additively and optionally replaces settings. **Page 11 precise layout, labels and actions are PROPOSED, not frozen**, in section 17 below. This v3.5 entry and section 17 supersede historic contradictions in sections 0–16, including old Replace All, old settings-as-inactive-profile-only, and old Page 10 status declarations. A working stand-alone UX mock `nurseflow-page11-backup-restore-prototype-v3.5.html` accompanies this specification; it does NOT perform real file backup/restore.

**v3.4 CURRENT DECISION (2026-10-29; HIGHEST PRECEDENCE):** The user clarified that ADD-ONLY/no deletion applies to IMPORTING THE PROCEDURE LIBRARY ONLY. An imported settings package may explicitly REPLACE current app settings after a before/after comparison and confirmation. Full-backup import adds library records and saved sessions as independent copies and optionally replaces settings after a separate opt-in. Old v3.3 inactive-profile-only settings import is SUPERSEDED, as is the assumption that every imported record is necessarily add-only. The earlier three independent typography/spacing sliders are also SUPERSEDED: there must be ONE global **UI scale** control. The chosen base point size drives all typography with fixed absolute point offsets and drives container padding, gaps, icons, badge dimensions, card geometry, and control height. At minimum scale the UI becomes maximally compact (except essential pointer bounds); at very large scale components wrap, stack and scroll rather than collide. The exact point offsets, slider range and responsive caps in section 15 are PROPOSED for UX testing, NOT FROZEN. Page 10's original settings layout remains FROZEN. Existing frozen Pages 01/03 behaviors remain intact; their appearance responds adaptively to the global scale. Section 15 and section 16 in THIS v3.4 file supersede historical settings/import rules in sections 0-14. A self-contained browser prototype with three scaled screen previews and simulated import settings confirmation is bundled as `nurseflow-ui-scaling-preview-v3.4.html`.

**HISTORICAL v3.3 (SUPERSEDED BY v3.4):** The user explicitly approves the Page 10 settings layout, requests four distinct scopes (one procedure, all library procedures, app settings only, complete backup), and requires **ALL IMPORTS TO ADD ONLY, NEVER TO REPLACE OR MODIFY EXISTING RECORDS**. Application settings imports are named INACTIVE preference profiles; activating a profile is a distinct explicit action. A complete backup includes library + settings + locally persisted active runs; it excludes caches and browser-granted permissions. Requested typography is very broad from 4 pt to accessibility-scale text; proposed independent controls: procedure content 4–48 pt (default 14 pt), chrome 7–28 pt (default 12 pt), and density spacing 0–20 CSS px (default 8 px), all subject to hands-on testing and approval. At spacing 0, ornamental whitespace may approach zero but never text line height, focus indicators, keyboard access, minimum touch targets, or critical warning visibility. User asked to try different values; a standalone v3.3 HTML preview is bundled. Page 10 base layout is FROZEN, but the newly added exact ranges/density details and Page 11 complete design are NOT FROZEN until reviewed. See sections **15 and 16**, which take precedence over conflicting earlier drafts.

**v3.2 PAGE 09 FREEZE + PAGE 10 SETTINGS PROPOSAL (2026-10-29; CURRENT PRECEDENCE):** The user explicitly APPROVES and FREEZES Page 09's compact Problems/Warnings UI, 12 Problem and 8 Warning checks as revised in v3.1, and the new early-stop and activity-completion authoring behavior. A missing local image reference remains **W07**; a previously connected deleted/missing node remains **W08** with explicit `Path unavailable` behavior, not an automatic End or new unassigned connection. An authored but never connected outlet is still a blocking Problem. `Create next step` and `End procedure here` make new destination nodes automatically, without selecting an existing step; `Finish this activity` is explicit; `Stop entire procedure` is an exceptional authored Stopped/Escalation exit that never silently marks unfinished activities complete. The implicit multitask completion gate has NO visible Join label. Page 10 is now a compact Settings screen with row-based pickers for Language, Text size, Theme, photo compression, and new-media soft Add limit, plus local-only storage status, backup navigation, updates, and guarded destructive controls. Page 10 is **NOT YET FROZEN**, nor is Page 11. This v3.2 declaration and the expanded Page 10 specification override conflicting older/current-status text and historical proposals below.

**v3.1 Page 09 UI acceptance and validation revision (2026-10-29; CURRENT PRECEDENCE):** The user ACCEPTS the Page 09 layout and controls (two counts, grouped issues, direct Fix/Inspect, Draft Preview, and Mark Ready confirmation). The severity matrix is UNDER REVIEW and revised as follows: a *missing local image Blob* is warning W07; a *saved edge that targets a deleted/missing graph node* is warning W08; both remain visible and nonblocking. A newly authored UNASSIGNED path is still blocking P02/P04. A dangling link is never silently interpreted as an intentional End: if followed at runtime, show a non-terminal `Path unavailable` interruption with Back, Map and confirmed Exit, preserving pinned-session history. When W08 is present, the Ready confirmation prominently states that an affected path could be interrupted. Intentionally terminating an OR outcome must use an explicit End node, created from the contextual `End procedure here` action. This clarification requires no preexisting step; `Create next step` also creates and attaches a new step atomically. Within Multitask activities, distinguish `Finish this activity` (internal implicit gate; no visible join node) and an **explicitly declared** `Stop entire procedure` (Stopped/Escalation, exceptional termination of unfinished activities). This last authoring/run-engine exception and the change from implicit dead-end arm completion to an explicit Finish action are PROPOSALS pending the user's approval. Page 07 and Page 08 frozen layouts remain intact; these are narrowly scoped authoring affordances. The complete current rule matrix and UX contract are in sections 07.12 and 09.2, which override earlier historical proposals.

**v3.0 Page 09 validation classification (2026-10-29; PROPOSAL, NOT FROZEN; PRECEDENCE OVER v2.9 FOR ISSUE SEVERITIES):** Define *Problem* as a blocking graph-completeness/consistency or data-integrity failure; define *Warning* as nonblocking usability/accessibility/offline/storage risk. These labels do not assess clinical correctness. Unreachable authored nodes are nonblocking impact feedback during editing but are Problems at Check because the Ready graph must be fully connected. Remote URLs with acceptable HTTPS syntax are allowed even if offline, unavailable, or returning an HTTP error; malformed/unsafe URLs and missing local image Blobs are structural/data-integrity Problems. Different Decision outcomes may correctly share a destination and are not automatically warnings. Proposed rule catalogue and tests appear under section 09.2. Pages 00–08 remain FROZEN; Page 09 is still pending approval.

**v2.9 Page 08 FULL FREEZE and Page 09 design proposal (2026-10-28; CURRENT PRECEDENCE):** The user approves and FREEZES Page 08's complete Step Editor as revised in v2.8: compact step-content editing, independent notes, phases, Decision outcomes edited in a focused sheet, `Arrange answers` as a separate display-order action, path read-only summary plus Page 07 tap-on-graph destination selection, and previously frozen local/remote media galleries with real-time preview. There is no large Next-step dropdown; changing one outcome path does not affect other outcomes. Page 07 and Pages 00-06 remain frozen. **Page 09 Check & Mark Ready is proposed below and NOT YET FROZEN.** It validates structural completeness offline, displays blocking problems and advisory warnings, deep-links Fix to the exact node/edge, and marks a separate immutable Ready revision only after explicit personal review confirmation. Neither structural validation nor marking Ready certifies clinical correctness.

**v2.8 Page 08 outcome/path clarity revision (2026-10-28; PROPOSED, NOT FROZEN; OVERRIDES v2.7 PAGE 08 OUTCOME SHEET):** The user questioned the confusing `Move up` / `Move down` controls and a `Next step` dropdown that would require browsing potentially hundreds of existing graph steps. The full Page 08 layout remains under review. Proposed fix: move outcome-order controls out of each Outcome Editor into one `Arrange answers` action on the Decision outcomes section. Reordering changes only the display sequence of a Decision's mutually exclusive answer choices, **not** step order, multitask activity order, destination edge IDs, notes, or clinical logic. The Outcome Editor contains only `Answer/outcome name`, `Outcome note`, and a compact read-only `Path: [destination or Not connected]` summary with `Change path` / `Set path`; no long target select. Tapping Change path launches Page 07's exact-outlet Graph target-picking mode, showing the source decision/outcome and the current route; tap a graph node to select its destination, with pan/zoom, focus current, optional find-on-graph search (which locates/highlights an item rather than forcing an unbounded list), preview of before/after/unchanged routes, and Confirm/Cancel. `Create next step` at the selected outcome automatically links the newly created node. Editing an existing **branch's final continuation** uses that branch's last node rather than changing the decision's first destination. Do not silently delete abandoned nodes. The picker uses the same Page 07 engine and validation; it is not a separate graph data model. Existing frozen Page 07 topology, Page 03 consultations, and Page 08 media behavior remain unchanged.

**v2.7 FINAL Page 07 freeze and Page 08 full-page proposal (2026-10-28; PRECEDENCE OVER HISTORICAL VERSIONS):** The user explicitly approves and **FREEZES Page 07 as a whole** with its v2.5/v2.6 Outline and Graph editors, graph/edge-scoped actions, copy/paste, persistent undo/redo, and **safe pending Cut**. Both Decision and Multitask activities support **2–32** authored outcomes/activities in Ready graphs (Drafts may be incomplete). Each Decision outcome chooses precisely one explicit next destination. A Multitask activities set requires every activity to finish, in any order, before its shared continuation. In Graph View, convergent arrows end **directly at the canonical downstream node**, with no intermediate `+` circle, pseudo-node, Merge label, `Shared following step`, ALL-complete badge, or visible Join node. A `+` insertion button is allowed only at a real empty outlet/selected connection. Existing Step Editor **media tools** remain frozen; the **full Page 08 Step Editor screen** and its content/outcome editing interactions are presented below as a NEW PROPOSAL, NOT YET FROZEN. All prior frozen pages remain unchanged.

**v2.6 Page 07 convergence + clipboard/undo revision (2026-10-27; partially confirmed, Page 07 NOT FROZEN):** The user requests (1) removal of the visible `Shared following step` label from Graph View, replacing it with actual **separate incoming arrows** converging at the one canonical downstream node, and (2) **Copy / Cut / Paste / Undo / Redo** in the Builder. These requirements are **USER-CONFIRMED**. The exact safe command behavior and control layout below are proposed for freeze. Undo/Redo remain visible in the top mode toolbar; Copy/Cut appear on selected node/activity; Paste appears on an exact open continuation or selected connector/edge. Copy creates independent new graph IDs (unlike `Go to existing step`, which links to the same node). Cut is a **pending atomic move** to prevent accidental partial rewiring; no original node is removed until Paste commits after scope/impact validation. Actions apply identically in Outline and Graph and do not change frozen pages. Page 07 numerical maximum outcomes/activities remains unapproved. See new section **07.10** for detailed UX, command contracts, accessibility and QA.

**v2.5 Page 07 Builder freeze candidate (2026-10-27; PROPOSED, NOT FROZEN):** The previously approved labels `Make a decision` / `Prendi una decisione` and `Multitask activities` / `Attività multitasking` remain FROZEN. Page 07 is now specified with separate phone-first `Outline` and `Graph` views, direct outcome chips and scoped edge actions, contextual mobile bottom sheets, an existing-step picker with route-impact preview, and compact task-set focus + searchable activity list. This version **proposes** 2–32 authored outcomes per Decision and 2–32 required activities per multitask group as practical bounds; user has not yet approved those numerical maxima. More than 8 items triggers a legible compact/focus treatment, not an artificial split or a change in semantics. All earlier page and media freezes remain unchanged. See section 07.9 for button contracts, large-graph behavior, destructive scope and test cases.

**v2.4 naming freeze (2026-10-27):** User explicitly APPROVED and FROZE the two human-centered authoring concepts. The precise **English UI labels** are `Make a decision` (picker), `Decision` (node), and `Multitask activities` (picker and grouped activities node). The precise **Italian UI labels** are `Prendi una decisione`, `Decisione`, and **`Attività multitasking`**. A `Decision` requires selection of exactly one authored outcome; `Multitask activities` requires completion of every independently resumable activity in any order before the shared continuation unlocks. This is **not** optional work and does **not** alter the runtime's `choose_one` / `complete_all` semantics. Page 03 copy uses `Switch activity`, `Activity 2/3`, `Activities in progress`, `Reopen activity` (IT `Cambia attività`, `Attività 2/3`, `Attività in corso`, `Riapri attività`); control positions, previous-step cues, saved progress, and confirmations remain as already frozen. Page 05 Map/List and Page 07 Graph/Outline use the same new names. Historical wording below (`OR`, `AND`, `Tasks in any order`) is retained in change history only. **The naming and terminology are FROZEN; the entire Page 07 Builder screen, its layout/details and numerical maximum of activities/outcomes are still NOT FROZEN.**

**Historical v2.3 naming proposal (2026-10-27; SUPERSEDED by frozen v2.4 labels):** The user requests language that describes the clinical activity instead of programmer-oriented OR/AND, emphasizing a Decision as assessment with one observed outcome and parallel work as several required independent tasks done in any order, with pause/resume between them. **Page 07 wording and cross-screen terminology are PROPOSED, NOT FROZEN.** Preferred authoring labels are `Make a decision` and `Tasks in any order`, with graph/outline labels `Decision` and `Tasks in any order`. Page 03 would display `Switch task`, `Task 2/3` and `1 of 3 tasks done` in the previously approved branch-selector positions, with the same persistence and branch-state semantics. This is a narrowly scoped **proposed copy and semantic-presentation change** to an otherwise frozen Page 03 layout; it requires explicit approval before superseding its previously frozen `Switch branch` / `B 2/3` labels. The invisible completion gate and single post-tasks continuation remain unchanged; the Graph View must not show `ALL complete`, `Automatic`, or `Join-All`. Internally the execution modes remain `choose_one` and `complete_all`, not a change of logic. Historical OR/AND wording below remains as a technical/decision-history alias and must not be carried into production UI. Note that BPMN's formal inclusive OR is not the same as exactly-one choice: label this behavior as `Decision`, not OR, in the UI.

**v2.2 precedence and approvals (2026-10-27):** The user's latest input approves the previous interactive prototype direction and **confirms implicit AND authoring joins**, with an important visual correction: remove the `ALL complete` / `Automatic · Not editable` label from the Builder graph. The user has **not approved the Page 07 OR authoring/connect semantics** and asks for concrete consequences when editing a selected OR outcome, and for a scalable many-arm parallel graph UI. The earlier OR example conflated changing an outcome's immediate destination with converging at the end of a branch; this version corrects that. An OR executes **exactly one** selected path; an AND executes **all required arms**; either construct can reach one canonical shared downstream node. When the author changes `No → Resolve missing items` to `No → Final review`, `Yes` stays unchanged and `Resolve missing items` is not deleted but may become unreachable. To converge **after** resolving missing items, edit the `Next` outlet of `Resolve missing items`, not the original decision's No outlet. Page 07 uses context-specific `Create next step`, `Go to existing step…` (for empty outcomes), `Continue at existing step…` (at a path end), and `Change first step…` (for already-linked outcome), with a before/after impact preview. Large AND blocks switch between a compact grouped overview and focused arms; 32 arms is a **stress-test scenario, not an approved cap**. Page 07 remains **NOT FROZEN**. Frozen Pages 00–06 and Page 03/Page 08 media and branch controls are unchanged. The `v2.2` standalone local HTML interaction prototype illustrates these refined distinctions; it is not the real editor.

**v2.1 precedence and approvals (2026-10-27):** Pages 00–06 and the Page 03 dual-gallery and Page 08 media-management components retain their prior explicit freezes. The user's latest feedback requests greater clarity on the Page 07 graphical editing interactions and asks for **implicit parallel joins**. The revised **Page 07 proposal is NOT frozen**. In Graph View, every OR outcome is a distinct labeled outgoing connection with its own tappable destination; an empty outcome offers **Create new step** or **Use existing step**, while an assigned outcome offers **Change destination / Insert on this path / Disconnect**. A shared convergence node is stored once. In the AND authoring UI, the user creates a `Parallel · All required` block and authors its arms, then edits `After all arms`; the completion join is an **automatically generated internal gate**, not a visible, separately created, manually wired graph step. The runtime's requirement to wait for all required arms remains unchanged. The frozen Page 05 Map/List may visualize this convergence but cannot edit it. An offline standalone graph interaction prototype accompanies v2.1 (`nurseflow-page07-graph-prototype-v2.1.html`); it is a UX demo, not the application. Older v2.0 Page 07 wording that required manually connecting arms to Join-All is superseded by this version.

## 0. Purpose and product boundary

NurseFlow is a **personal** flowchart builder and step-by-step procedure reference for nurses. Each user authors their own flowcharts and consults them on their own device. The application has no accounts, server-side database, collaboration, remote analytics, cloud sync, or data upload. It is not a repository of institutionally verified protocols. A `Ready` label confirms only that structural validation passed and the user chose to use that revision for personal reference; it is **not** a statement of clinical accuracy or regulatory certification.

The app is not designed as a patient record. It does not ask for patient names, identifiers, or encounter references; it does store the **active run state**, including visited nodes and chosen outcomes, on the device in IndexedDB so the nurse can resume after closure, reload, or device restart. The app does not automatically retain a completed-run history or generate clinical recommendations or dose calculations. These locally stored choices could still be sensitive in context; no cloud service is used, and deleting local storage can remove them.

**Approved by user (2026-10-26):** personal self-authored graphs, on-device local data, persistent-storage requests where supported, offline portable backups, easy export, compact/copy-light UI, and the First Launch screen. Page 00 is frozen. The Library feature requirements include collapsible groups, searchable labels/metadata, a 20-item recent-history overflow, customizable color/icon ribbons, and three priority levels. The latest refinement specifies **3 directly visible recent procedures**, a **20% maximum** of the post-toolbar browse height for Recent, and **at least 80%** for Library (more when the strip uses less space). Recent must be a single compact row with no group or other metadata on the tiles; fuller context appears only in the 20-item overflow. Page 01 was explicitly approved and frozen in its v0.6 configuration (three compact Recent shortcuts, maximum 20% Recent height, minimum 80% Library). Page 02 was explicitly approved and frozen in its v0.8 configuration (compact identity/metadata, Start/Map/Edit, revision-specific behavior and More menu). Page 03 was explicitly approved and frozen in its v1.0 configuration (guided context and route-aware counts, previous-step cue, phase, step/outcome notes, one-tap branching, persistent sessions, immutable graph snapshots, and always-confirm Exit). Page 04 was explicitly approved and frozen in its v1.2 configuration (authored End types, clear terminal content, preserved terminal session, Back, confirmed Restart and direct Return to Library). Page 05 graphical Map and List View are both explicitly FROZEN: read-only, graph-aware, with complete node inspection and canonical shared-node references. The user approved OR-exclusive decisions, convergence, and true AND-parallel Fork-All/Join-All support for the first release. The Page 03 parallel selector and passive `B n/m` branch marker were subsequently approved and frozen on 2026-10-27. Page 03's one-step-at-a-time approved card remains frozen; the context-dependent branch switcher is approved and frozen. Page 06 New Procedure and Page 01 Group dialogs were explicitly approved and FROZEN on 2026-10-27. The Page 03 parallel-only visual affordances are frozen by explicit approval on 2026-10-27. Page 03 dual media layout and Page 08 media management tools are additionally frozen by explicit user approval on 2026-10-27. Page 07 has a detailed design proposal in v2.0, not yet approved; Pages 07–11 as whole pages remain not frozen.

## 1. Decision register

| ID | Decision | Status |
|---|---|---|
| D-01 | Personal application; each nurse creates/consults their own graphs; no institutional roles or approval flow | CONFIRMED |
| D-02 | Application data stored locally on the device; no account, cloud database or automatic sync | CONFIRMED |
| D-03 | Request persistent browser storage if supported; show whether permission was granted | CONFIRMED |
| D-04 | Provide downloadable whole-library and single-procedure backups, plus restore/import | CONFIRMED |
| D-05 | Host static PWA on GitHub Pages; no backend | CONFIRMED from initial brief |
| D-06 | Separate **Consult** (guided) and **Build** (edit) experiences | PROPOSED |
| D-07 | Normal startup opens Library directly; no splash | CONFIRMED with Page 00 |
| D-08 | Consult one instruction/decision at a time, with Map as optional alternative view | PROPOSED |
| D-09 | Draft -> Check -> Ready; `Ready` is local structural status, not independent clinical approval | PROPOSED |
| D-10 | Editing a Ready procedure creates a new working draft; last Ready revision remains unchanged until replacement | PROPOSED |
| D-11 | Italiano / English UI language is a global app setting (Page 00 and Settings); no per-procedure language field, language tag, or content-language switcher; authored content stays as written | **CONFIRMED v1.6** |
| D-12 | No patient identifiers or completed-run history in MVP; active run path and selected outcomes are stored locally for crash/reload recovery | USER-REQUESTED / CONFIRMED |
| D-13 | Explicit outcome-to-node links, no implicit `else`, no graph cycles in MVP | PROPOSED |
| D-14 | List-based mobile builder; lazy-loaded graphical editor on larger screens | PROPOSED |
| D-15 | Bundled/local-only fonts, scripts and localization; no trackers/CDNs; user-authored remote media URLs are an explicit opt-in exception and may contact their external hosts | PROPOSED (exception requested v1.8) |
| D-16 | App shell updates never force-reload during editing or a guided run | PROPOSED |
| D-17 | Backup reminder is local-only, dismissible, and based on time since last completed export | PROPOSED |
| D-18 | Minimal, dense, useful UI: remove marketing/tutorial copy, no redundant navigation, no status noise when healthy | CONFIRMED |
| D-19 | Page 00 First Launch: logo/name, language, Start, Import Backup; persistent-storage request folded into Start | FROZEN |
| D-20 | Page 01 uses no bottom nav; Create in header and Backup/Settings in overflow menu | FROZEN |
| D-21 | Personal, collapsible user-created groups organize procedures | REQUESTED / REQUIREMENT CONFIRMED |
| D-22 | Search by labels/tags and useful metadata; quick filtering | REQUESTED / REQUIREMENT CONFIRMED |
| D-23 | Show 3 most recently accessed procedures inline; Recent overflow lists up to 20 | REQUESTED / REQUIREMENT CONFIRMED |
| D-24 | Per-procedure left ribbon with customizable color and symbol | REQUESTED / REQUIREMENT CONFIRMED |
| D-25 | Priority levels 0, 1, 2; visible as blank / `!` / `!!`; optional priority sorting | REQUESTED / REQUIREMENT CONFIRMED |
| D-26 | One group per procedure, multiple tags; global priority mode uses flat list, group mode uses accordions | FROZEN |
| D-27 | `Recent` means most recently **opened** procedures (Details, Builder or Run), not merely edited metadata | FROZEN |
| D-28 | Allocate no more than 20% of post-toolbar browse height to Recent; Library receives at least 80%, including unused Recent space | REQUESTED / REQUIREMENT CONFIRMED |
| D-29 | Three ultra-compact, one-line shortcut tiles in one row; identity marker + abbreviated/truncated title only; details in Recent 20 | FROZEN |
| D-30 | Page 02 uses a compact heading, priority/group/tags, one primary action, Map/Edit secondaries, and a More menu for metadata and file/destructive actions | FROZEN |
| D-31 | Page 02 actions distinguish Ready, Draft-only and Ready-with-working-Draft; an existing Ready graph is never silently replaced by editing | FROZEN |
| D-32 | Page 03 shows one authored step plus compact step position, phase (macro-category), and last visited step context | FROZEN (Page 03 v1.0) |
| D-33 | Each decision shows one full-width >=56 px button per authored outcome; one tap follows the corresponding explicit edge, with no default | FROZEN (Page 03 v1.0) |
| D-34 | Step position shows `n / N` when remaining paths share a length, or `n / min-max` when branches lead to differing path lengths; Start not counted | FROZEN (Page 03 v1.0) |
| D-35 | Back restores actual visited node; changed decision atomically truncates downstream path and saves new route | FROZEN (Page 03 v1.0) |
| D-36 | Save active session to IndexedDB on each navigation event and resume after app reload/OS termination; delete on confirmed Exit or completion | FROZEN (Page 03 v1.0) |
| D-37 | End node automatically transitions to Page 04; Map is read-only and never selects a branch | FROZEN (Page 03 v1.0) |
| D-38 | Alert text and blocking errors are visible without opening optional notes; no implicit recovery branch | FROZEN (Page 03 v1.0) |
| D-39 | Exit run ALWAYS displays confirmation, including before the first step is traversed | FROZEN (Page 03 v1.0) |
| D-40 | Every visible graph step may have a localized note; each decision outcome may have an independently localized note | FROZEN (Page 03 v1.0) |
| D-41 | Each graph node may belong to a user-authored procedure phase; phase is distinct from Library group/tags | FROZEN (Page 03 v1.0) |
| D-42 | Compact read-only previous-step cue shows actual immediately preceding visited step and selected outcome, not possible next steps | FROZEN (Page 03 v1.0) |
| D-43 | One active run per procedure + mode/revision; session pins immutable graph snapshot so edits cannot alter in-progress navigation | FROZEN (Page 03 v1.0) |
| D-44 | A full backup includes active sessions only if user explicitly opts in; never include a session in single-procedure export without explicit choice | PROPOSED v1.0 |
| D-45 | End nodes can declare neutral, completed, escalation, or stopped outcome presentation; never infer clinical success from reaching an End | FROZEN (Page 04 v1.2) |
| D-46 | Page 04 displays authored terminal content, optional note, actual route length, phase and preceding step without inventing clinical summaries | FROZEN (Page 04 v1.2) |
| D-47 | Page 04 Back returns to actual preceding visited step; Map is read-only; Library clears just this completed session after successful deletion | FROZEN (Page 04 v1.2) |
| D-48 | Page 04 Restart requests confirmation and starts the same pinned graph revision from its first meaningful step | FROZEN (Page 04 v1.2) |
| D-49 | Page 05 is strictly read-only; map inspection, zoom, pan and List View never advance or alter a run | FROZEN (Page 05 v1.3; confirmed v1.5) |
| D-50 | Map opened from Details uses the Details revision; from Page 03 or 04 uses the active run's immutable pinned snapshot | FROZEN (Page 05 v1.3; confirmed v1.5) |
| D-51 | In run context, highlight the actual visited route, selected branch edges, and the current/terminal node; do not treat unselected paths as visited | FROZEN (Page 05 v1.3; confirmed v1.5) |
| D-52 | Map uses compact header, full remaining viewport for canvas, a small contextual navigation toolbar, and an accessible topologically ordered List View | FROZEN (Page 05 v1.3; confirmed v1.5) |
| D-53 | Tapping a node opens a read-only detail sheet with full text, phase, step note and labeled decision outcomes with individual notes | FROZEN (Page 05 v1.3; confirmed v1.5) |
| D-54 | Fit / Current / zoom / pan do not write to ActiveRun; authoring positions are revision-scoped with local deterministic layout fallback | FROZEN (Page 05 v1.3; confirmed v1.5) |
| D-55 | Page 05 **List View** is a compact, tree-like, read-only **DAG outline** with expandable decisions and references to canonical shared nodes | **FROZEN (Page 05 List v1.4)** |
| D-56 | List shows each graph node once, outcome labels and destinations explicitly; converging routes link to shared node references instead of duplicating the node | **FROZEN (Page 05 List v1.4)** |
| D-57 | List chevrons expand/collapse branches; row body inspects node; edge note info opens edge note; a cross-reference scrolls/focuses the canonical node, never changes the run | **FROZEN (Page 05 List v1.4)** |
| D-58 | In run context, List marks Current, Visited and truly Pending nodes, and offers Jump to Current; all view interactions remain read-only and ephemeral | **FROZEN (Page 05 List v1.4)** |
| D-59 | Linear, exclusive divergence and exclusive-path convergence are compatible with existing DAG graph model; cycles still excluded from MVP | CONFIRMED COMPATIBILITY; no new run semantics |
| D-60 | True AND-parallel is included from first release: explicit Fork-All/Join-All, persisted pending branch states, join gates, and branch-aware Page 03 runtime | **CONFIRMED; UI FROZEN v1.7** |
| D-61 | Map visualization of fork/join and shared nodes uses stable layered layout where possible; frozen read-only List works even if graph layout fails | FROZEN Page 05 behavior |
| D-62 | Parallel fork means **all** outgoing branches are required; a paired join releases exactly once only after each required branch token arrives; exclusive decisions still choose exactly one | CONFIRMED graph behavior |
| D-63 | Execution remains one focused step at a time; pending branches are independently resumable with user-controlled focus, with no automatic choice of an OR outcome | CONFIRMED; switcher UI FROZEN v1.7 |
| D-64 | Run state is persisted as graph revision + tokenized branch progress + navigation events; no branch completion or focus switch may discard other required branches | CONFIRMED architecture |
| D-65 | Graph must validate balanced/nested fork-join pairs, all required branches, convergent and exclusive routes, and terminal reachability; reject unstructured crossings, unsatisfiable joins and cycles | CONFIRMED validator requirement |
| D-66 | Parallel progress counts every required branch's actionable steps; show exact total or feasible min-max range, excluding structural fork/join/start/end | CONFIRMED progress semantics; visual placement subject to Page 03 switcher review |
| D-67 | Page 06 creation is a single compact form, without language or topology selection; Draft graph may combine OR and AND | **FROZEN 2026-10-27** |
| D-68 | Page 01 `+ Group` opens a compact new-group dialog; group header `···` manages rename/reorder/delete without changing Library geometry | **FROZEN 2026-10-27** |
| D-69 | Page 06 Group picker offers `Ungrouped`, existing groups, and inline `+ New group`; newly created group is selected without losing form data | **FROZEN 2026-10-27** |
| D-70 | Page 03 AND-only full-width **`Switch branch`** button immediately below STEP/phase; whole button opens the switcher sheet and never activates an outcome | **FROZEN 2026-10-27** |
| D-71 | Switching branches saves focus without completing or skipping work; reopening a completed branch is a separate confirmed action and invalidates only dependent completion | **FROZEN 2026-10-27** |
| D-72 | Page 03 inside active AND branch displays a narrow, **noninteractive** left-side vertical branch marker (e.g., `B 2/3`), adjacent to current step content and independent of the switch button | **FROZEN 2026-10-27** |
| D-73 | Page 07 is where a user **builds the graph** via structured editing, explicit links and optional graphical canvas; Page 08 authors node content and edges; Page 09 validates and marks Ready | CLARIFIED architecture; detailed authoring UX PROPOSED for Page 07 review |


| D-74 | Page 03 parallel `Switch branch` control, sheet, and passive `B n/m` vertical marker are approved, not just proposed | **FROZEN 2026-10-27** |
| D-75 | Store up to **32 total step-level media references across both media sections**, with local image assets and remote image/GIF URLs; no forced two-item schema cap | **USER-CONFIRMED; v1.9** |
| D-76 | A global **soft media-add limit**, enabled by default at 2 (configurable from 1 to 32 or disabled), applies to **new Add actions across both media sections combined**; changing it does not delete/hide/remove existing media | **USER-CONFIRMED; v1.9** |
| D-77 | A single step may contain **both** `before-note` and `after-note` media sections concurrently, separated by the step-note block; each section independently controls `stacked thumbnails` / `side by side` / `full width` and image-space preset; Page 08 immediately previews both sections in the Page 03 renderer | **FROZEN 2026-10-27 (Page 03 media layout + Page 08 corresponding controls)** |
| D-78 | Local phone images can be resized/re-encoded before local save, with Medium default (max width 1280 px; typical 150-300 KB only a target, not a strict guarantee); keep higher quality/original available for legibility | **FROZEN MEDIA TOOLING 2026-10-27** |
| D-79 | Remote HTTPS image/GIF URLs remain links without offline guarantee; broken/offline media displays a nonblocking placeholder and never blocks step navigation, regardless of which media section contains the link | **USER-CONFIRMED; v1.9** |
| D-80 | Local media stored as device Blobs linked by stable asset IDs; export/backup includes embedded assets plus captions and media presentation; remote exports include URL only; active pinned revisions preserve asset references until unused | **PROPOSED IMPLEMENTATION; APPROVED MEDIA FUNCTIONALITY** |
| D-81 | Moving an image from Before Note to After Note (or vice versa) preserves its asset ID and counts as reordering, **not** adding an image; it remains available even if the current soft add-limit is exceeded | **FROZEN MEDIA DETAIL 2026-10-27** |
| D-82 | A collapsed optional step note still leaves its disclosure row between the two galleries; no empty gallery placeholders are shown if one/both sections have no media | **FROZEN MEDIA DETAIL 2026-10-27** |


| D-83 | Page 03 **dual-gallery rendering** and Page 08 media upload/link/reorder/compress/preview controls approved in their v1.9 behavior | **FROZEN 2026-10-27** |
| D-84 | Page 07 uses two editable views of **the same** draft DAG: Outline (mobile default) and Graph Canvas; no duplicate graph object | **FROZEN PAGE 07 v2.7** |
| D-85 | Every action targets an exact outlet or connection. Use `Create next step`, `Go to existing step…`, `Continue at existing step…`, and scoped `Insert step here`; do not expose an ambiguous global Connect action | **FROZEN PAGE 07 v2.7** |
| D-86 | A Decision (OR) starts with two editable outcome slots; every outcome is its own labeled, uniquely identified link to one destination; never infer ELSE or auto-select a destination | **FROZEN PAGE 07 v2.7** |
| D-87 | Parallel (AND) uses named required arms and one `After all arms` continuation; the completion gate is generated internally without a manually created/wired Join-All or visible `ALL complete` explanatory chip in the Builder | **FROZEN PAGE 07 v2.7** |
| D-88 | OR convergence points multiple distinct outcome edges to one canonical shared node; changing or inserting on one edge never changes other edges | **FROZEN PAGE 07 v2.7** |
| D-89 | Graph Canvas shows tappable decision outcome chips and explicit link sheets; pan/zoom/auto-layout remain available, but drawing or dragging a line is never required on a phone | **FROZEN PAGE 07 v2.7** |
| D-90 | Preview Draft and Check remain clearly available; autosave/Undo/Redo, structural validation, phase management and safe deletion are first-class Builder actions | **FROZEN PAGE 07 v2.7** |
| D-91 | A shared node is one canonical object, but edge edits are scoped to the selected outcome; node deletion warns when multiple incoming paths would be affected | **FROZEN PAGE 07 v2.7** |
| D-92 | Builder never invents clinical instructions, decision outcomes, or branches. Validation checks topology/completeness only, not medical accuracy | **FROZEN PAGE 07 v2.7** |
| D-93 | Graph View: select an exact outcome or path-end outlet; empty = Create next step / Go to existing step; assigned = View / Insert before / Change first step / Disconnect. The selected edge is the only one rewired; preview impact before destructive change | **FROZEN PAGE 07 v2.7** |
| D-94 | OR outcome identity is stable, with exactly one active target; two or more outcomes may reference the same canonical target | **FROZEN PAGE 07 v2.7** |
| D-95 | Replace generic `Use existing step` with location-specific labels: `Go to existing step…` for an empty OR outcome and `Continue at existing step…` at the end of an existing route | **FROZEN PAGE 07 v2.7** |
| D-96 | AND authoring join is implicit: a stable derived internal join gate is synthesized and validated, without draggable/manual Join-All or a visible ALL-complete explanatory label in Page 07 | **FROZEN PAGE 07 v2.7** |
| D-97 | Each nonempty AND arm's terminal continuation routes automatically to its hidden gate; `After all arms` is the single shared next-step slot | **FROZEN PAGE 07 v2.7** |
| D-98 | In an AND arm, OR outcomes still require explicit destinations, including an option to `Complete this arm` where logically valid; empty arms/unspecified options fail validation | **FROZEN PAGE 07 v2.7** |

| D-99 | OR chooses one outcome; AND requires all arms, independently of whether their paths share one Final review or other common step | **FROZEN PAGE 07 v2.7** |
| D-100 | Change first step on an OR outcome changes only that outcome's destination; other outcomes' edges and shared target content remain unchanged | **FROZEN PAGE 07 v2.7** |
| D-101 | A route can converge by linking the `Next` outlet of its last authored step to an existing shared node; do not incorrectly replace the OR outcome's first step to achieve this | **FROZEN PAGE 07 v2.7** |
| D-102 | Preview direct effects and secondary unreachable-node warnings before changing an assigned outcome; do not auto-delete bypassed steps | **FROZEN PAGE 07 v2.7** |
| D-103 | Ready graph bounds: Decision has 2–32 explicit outcomes; Multitask activities has 2–32 required activities. Drafts may be structurally incomplete. Dense cases use focused view and searchable full list, not tiny nodes. | **FROZEN PAGE 07 v2.7** |
| D-104 | Graph View for large AND regions: compact region card with total/completeness, legible focus on up to three arms, searchable View all arms panel and one After-all continuation; full overview remains available | **FROZEN PAGE 07 v2.7** |
| D-105 | Builder displays arm-edge convergence directly into the After-all continuation; omit the `ALL complete` and `Automatic · Not editable` texts and don't expose a manual join node | **FROZEN PAGE 07 v2.7** |

| D-106 | Page 07 authoring picker names `Make a decision` and `Multitask activities` (Italian `Prendi una decisione` / `Attività multitasking`); no Boolean OR/AND, Fork/Join or Parallel in everyday UI | **FROZEN PAGE 07 v2.7** |
| D-107 | Decision means precisely one selected outcome; each outcome has a stable destination edge; shared later steps do not imply completion of all alternatives | **FROZEN PAGE 07 v2.7** |
| D-108 | Multitask activities means all required activities are independently resumable in any order; only after ALL complete does the single shared continuation unlock | **FROZEN PAGE 07 v2.7** |
| D-109 | Page 03 wording on frozen parallel-only controls: `Switch activity`, passive `Activity 2/3`, `1 of 3 complete`, `Activities in progress`, `Reopen activity`; IT `Cambia attività`, `Attività 2/3`, `1 di 3 completate`, `Attività in corso`, `Riapri attività`. Preserve all previously frozen positions and actions | **FROZEN PAGE 07 v2.7** |
| D-110 | Page 07 graphical presentation distinguishes Decision with labeled outcome arrows from Multitask activities as a bounded set of independently completable named activities with one common continuation; no exposed join node | **FROZEN PAGE 07 v2.7** |
| D-111 | Add-picker provides one-line concise subtitles to distinguish selection of one outcome versus completion of every activity; no tutorial copy on normal screens. Only genuinely order-independent work belongs in a Multitask activities group | **FROZEN PAGE 07 v2.7** |


| D-112 | Page 07 uses `Outline` (default phone) and `Graph` (pan/zoom, selectable node/outcome/edge) to edit one revision, with no touch-only connector dragging | **FROZEN PAGE 07 v2.7** |
| D-113 | Tap a node to open node actions; tap an outcome chip to open only that outcome's connection actions; tap an edge to open edge actions. Use mobile bottom sheets / desktop inspector | **FROZEN PAGE 07 v2.7** |
| D-114 | Decision: `Create next step` / `Go to existing step…` on an empty outcome; `View first step` / `Insert before` / `Change first step…` / `Disconnect` on a linked outcome | **FROZEN PAGE 07 v2.7** |
| D-115 | Single target picker uses search and excludes invalid cycles/cross-task links; changing one destination previews before/after and unaffected outcomes, and never auto-deletes orphaned steps | **FROZEN PAGE 07 v2.7** |
| D-116 | Multitask group shows named activities with one shared following step, no exposed gate; compact 3-lane focused graph and searchable `Browse activities` for large groups | **FROZEN PAGE 07 v2.7** |
| D-117 | Ready requires 2–32 outcomes per Decision and 2–32 required activities per multitask group; Draft may contain incomplete or empty entries, but Page 09 blocks Ready until valid | **FROZEN PAGE 07 v2.7** |
| D-118 | At eight or more outcomes/activities, switch graph to compact/focused presentation, retain full list and accessible keyboard actions; no user-facing gate labels | **FROZEN PAGE 07 v2.7** |
| D-119 | Mobile action surfaces are contextual with safe destructive confirmation; `Preview` and `Check` remain the only Builder bottom actions; all edits autosave transactionally | **FROZEN PAGE 07 v2.7** |
| D-120 | Graph convergence is drawn as **distinct directional arrows ending directly at one canonical downstream node**. No junction circle (`+` or otherwise), Merge pseudo-node or `Shared following step` label. `+` exists only at genuine insertable outlets or edges. | **FROZEN PAGE 07 v2.7** |
| D-121 | Page 07 Builder supports **Copy, Cut, Paste, Undo and Redo** in Outline and Graph; Undo/Redo stay in top toolbar while clipboard actions are contextual | **FROZEN PAGE 07 v2.7** |
| D-122 | Copy + Paste creates a distinct step/subgraph with newly generated IDs; `Go to existing step` links to the old stored ID instead; copying does not automatically copy external route links | **FROZEN PAGE 07 v2.7** |
| D-123 | Cut is a **safe pending move**, leaving the original graph intact until a validated, explicitly selected Paste destination is confirmed as one atomic, undoable transaction. Shared-node impacts are previewed. | **FROZEN PAGE 07 v2.7** |
| D-124 | Paste into a selected connection inserts content on that connection alone; Paste into an empty outlet attaches there; show scoped preview + potential unreachable/dangling warnings before commit | **FROZEN PAGE 07 v2.7** |
| D-125 | Structural Undo/Redo is separate from native text-field undo and records committed graph edits (not mere Copy); store undo history locally with Draft; support standard desktop shortcuts without intercepting text editing | **FROZEN PAGE 07 v2.7** |
| D-126 | Page 07 fully frozen: both Outline and Graph, stable edge-scoped edits, Copy/Paste/Undo/Redo and safe pending Cut; 2–32 Decision outcomes and 2–32 multitask activities in Ready graphs | **FROZEN 2026-10-28 v2.7** |
| D-127 | In Graph, distinct convergence arrows connect **directly to the canonical downstream node**; no `+` circle or intermediate visual merge marker | **FROZEN 2026-10-28 v2.7** |
| D-128 | Page 08 full editor: one scrollable compact content form, contextual Decision outcomes sheet, notes/phase, two frozen galleries and live Page 03 preview | **FROZEN 2026-10-28 v2.9** |
| D-129 | Step type change lives in More and requires scope/impact preview; Done waits for IndexedDB autosave and returns to selected Builder node | **FROZEN 2026-10-28 v2.9** |
| D-130 | Page 08 Decision Outcome sheet edits answer label/note and presents read-only Path summary; Change path invokes Page 07 graph-target picking, not a long destination dropdown. Answer reordering lives under separate Arrange action | **FROZEN 2026-10-28 v2.9** |
| D-131 | Page 09 two counters, grouped Problems/Warnings, scoped Fix/Inspect, draft Preview, and confirmed Mark Ready; revised P01–P12 and W01–W08 catalogue | **FROZEN 2026-10-29 v3.2** |
| D-132 | Page 09 Mark Ready requires zero blocking problems, latest durably saved/revalidated Draft, personal-review checkbox, atomic immutable Ready snapshot; preserves former Ready and pinned runs | **FROZEN 2026-10-29 v3.2** |
| D-133 | Saved deleted-target reference → W08, missing local image → W07; warnings do not block Ready, but W08 shows conspicuous interruption risk | **FROZEN 2026-10-29 v3.2** |
| D-134 | Newly unassigned path blocks Ready; intentional early End is valid; complete a multitask activity explicitly; exceptional entire-procedure stop is authored Stopped/Escalation | **FROZEN 2026-10-29 v3.2** |
| D-135 | Settings use compact row-based pickers with immediate durable local save; no global Save button | PROPOSED PAGE 10 v3.2 |
| D-136 | Application language changes UI only, not authored step/note text; English/Italian offline bundles | PROPOSED PAGE 10 v3.2 |
| D-137 | Global new-media soft limit defaults On=2, configurable 1–32 or Off; media schema maximum 32; existing assets unaffected | EXISTING MEDIA RULE FROZEN; SETTINGS UI PROPOSED |
| D-138 | Photo import quality defaults Medium; each photo may override; change affects future imports only | PROPOSED PAGE 10 v3.2 |
| D-139 | Storage status reflects actual browser persistence and approximate quota; backup shortcut opens Page 11; no false durability or backup-completed claim | PROPOSED PAGE 10 v3.2 |
| D-140 | App updates deferred during active editing/run; Advanced Clear Data requires confirmation and offers export beforehand | PROPOSED PAGE 10 v3.2 |

## 2. Core user journeys

1. **Create:** Library -> New Procedure -> Builder -> Step Editor -> Check -> Mark Ready -> Library.
2. **Consult:** Library -> Procedure Details -> Start/Resume -> Select answers or Continue -> persistent current step -> End -> Library.
3. **Revise:** Details -> Edit -> Draft revision -> Validate -> Replace current Ready revision.
4. **Save external backup:** Library backup shortcut or Settings -> Backup & Restore -> Export All -> device file/share sheet.
5. **Restore:** First Launch or Settings -> Backup & Restore -> Import File -> preview -> add copies or replace selected data -> confirm.
6. **Move to another device:** Export file from device A; transfer by user's chosen offline method; import on device B. NurseFlow never uploads a file.
7. **Organize:** Library > `+ Group` > name > create; in New Procedure or Edit Info choose a group, tag labels, ribbon icon/color, and priority 0–2.
8. **Recall:** Library opens with the three most recently accessed procedures as single-row compact shortcuts (Recent capped at 20% of browse height); the overflow opens a detailed flat list of up to 20. Selecting a shortcut opens Details in one tap.
9. **Locate:** Type in Search, or select favorite/draft and advanced group/tag/priority filters; choose `Priority` view to see a single globally sorted high-to-low list.
10. **Resume:** Close/reload/restart the app during a guided run; reopen the procedure and choose Resume to continue from the last successfully saved node and branch history.


## 3. Navigation map

```
00 Welcome / First Launch
01 Library
   |- 02 Procedure Details
   |     |- 03 Guided Run -> 04 End
   |     |    `- 05 Flowchart Map (read-only, return to exact step / End)
   |     |- 05 Flowchart Map (from Details)
   |     '- 07 Builder (new draft revision)
   |- 06 New Procedure -> 07 Builder -> 08 Step Editor
   |                                      '- 09 Check & Mark Ready
   |- 01A Group Management sheet (create / rename / reorder / delete group)
   |- 01B Recent 20 sheet (mobile) / popover (desktop)
   |- 01C Filters sheet (groups / labels / priority / status)
   |- 11 Backup & Restore
   '- 10 Settings -> 11 Backup & Restore
```

**Navigation proposal for Page 01:** no permanent bottom bar. Library header has a labelled `+ New` action and `More` (Backup & Restore / Settings / Archived). The `Library` section has its own smaller `+ Group` contextual action (creates a **group**, not another procedure) and a view/sort selector. `Recent ···` opens a 20-item selection sheet; group headers expand/collapse in place. Subscreens use Back. Page 01 is frozen in the approved v0.6 layout and button behavior.

## 4. Visual and interaction system

### 4.1 Approved global UI density and copy rules (FROZEN)

- **Functional text only.** Normal screens should contain only necessary titles, input labels, procedure text, status, and actions. Remove taglines, onboarding tutorials, reassurance paragraphs, decorative footnotes and repeated app capabilities.
- **No redundant controls.** Do not render the same command in both a top bar and a bottom bar. Each screen has one clear primary action.
- **No healthy-state noise.** Do not show permanent `Offline-ready`, `No account`, `All saved`, `Data is local`, `Works offline` or similar badges. Surface failed saves, unavailable storage, incomplete imports, and updates only when actionable.
- **Use space efficiently.** Compact but readable 1–2-line list rows, tighter spacing, no empty decorative hero cards, and no persistent navigation elements that do not justify their height.
- **Never hide safety-critical content.** User-authored alerts and warnings, active validation errors, failed saves, language mismatches, deletion confirmations, and backup-loss risks remain explicit when relevant. This is not a license to hide clinically pertinent procedure content.
- **Accessibility is nonnegotiable.** Compact means economical copy/spacing, not tiny touch targets: touch controls remain >=48 CSS px, and decision buttons >=56 px.
- Store advanced explanation and storage specifics in Settings / Help as optional pull content, not in first-launch or normal library screens.

### 4.2 Interaction and visual metrics (proposed)

- Mobile-first: usable at 320 CSS px wide, designed around 360–430 px widths, with tablet/desktop responsive layouts.
- Major controls at least 48 x 48 CSS px; guided decision options at least 56 px tall, full-width, single column.
- System UI font, minimum 16 px content text; adjustable Normal/Large settings; support OS text scaling.
- Light-first, high contrast. Primary action in a single consistent position; danger colors only for warnings, never as the only signal.
- No startup animation; cached application shell; no UI blocking network request.
- Explicit labels. Never use an icon as the only accessible name. Keyboard, reduced motion, and screen readers supported; aim for WCAG 2.2 AA.
- Keep content editable via forms/list on phones; graph manipulation is never required to complete a workflow.
- Autosave in IndexedDB, silent on successful writes; provide a transient saving cue only for writes taking perceptibly long and a persistent, actionable error if saving fails.
- No automatic branch choice and no preselected outcome; no percentage-complete indicator on a branch-dependent path.

## 5. Screen-by-screen specifications

### Page 00 — First Launch (`/#/setup`) — **FROZEN**

**Purpose:** One-time language selection and entry to a new library or restored backup. No tour, marketing copy or explainer paragraphs.

**Visible layout:** Small centered logo and `NurseFlow`, `Language` compact segmented choice (`Italiano` / `English`), primary `Start`, secondary `Import Backup`. Everything fits on a short phone viewport without scrolling under normal text size.

**Explicitly removed:** `Your procedures. On your device.`, `Your procedures are stored on this device. Nothing is automatically uploaded or synchronized.`, `No account required · Works offline after setup`, `Protect local storage` as a separate button, and `How storage works` as a visible tutorial link.

| Button/control | Action | Notes/edge cases |
|---|---|---|
| `Italiano` / `English` | Immediately switch UI language, store preference | Initially choose a supported browser locale; otherwise use English. Does not translate procedure content |
| `Start` | Initialize/open IndexedDB, mark first launch complete, open Library | Request `navigator.storage.persist()` where supported **without blocking navigation** on permission outcome; report result in Settings, not with a success toast |
| `Import Backup` | Open local file picker and enter Page 11 restore preview | User can restore on first launch; no data is replaced without confirmation |

**Error handling:** If IndexedDB is unavailable, display a blocking error with `Retry` and concise reason. If the persistence request is denied/unsupported, continue normally and expose request status/Retry in Settings. Explicitly show failures that prevent storage rather than silently behaving as if it works.

**Acceptance:** no account, tutorial, privacy promise, storage paragraph, redundant action, or unnecessary status label is visible. Normal subsequent launches go straight to Page 01.

### Page 01 — Library (`/#/library`) — **FROZEN**

**Purpose:** Get a recently used procedure in one tap, find any procedure by text/labels, and browse user-organized collapsible groups without sacrificing a compact mobile layout.

#### Proposed mobile vertical composition

1. **Header (48 px touch targets):** `Procedures` | `+ New` | `...` (app menu).
2. **Search line:** `Search procedures` text field with clear control and one Filters icon. Immediate offline indexed search, flat results.
3. **Quick filters:** `All` / `Favorites` / `Drafts`.
4. **Recent (maximum 20% of remaining browse height):** a minimal heading `Recent` with collapse chevron and its own `...` button. Show exactly the **last three** accessed procedures (or fewer if unavailable) as **three equal compact tiles in one horizontal row**. Each tile uses a narrow colored rail or small icon plus a **single-line truncated title only**; no group label, category, status, priority, secondary row, timestamp, star, or duplicate text. Entire tile is a >=48 CSS px-high tap target, opens Details. If a complete title does not fit, truncate visually, expose the full title in the accessible name, and show its full name in the 20-item overflow. `...` opens a **scrollable bottom sheet on phones / anchored popover on desktop** with up to 20 recent procedures, including these three, grouped only by chronology (never by group).
5. **Library (at least 80% of remaining browse height):** heading `Library` | `+ Group` contextual action | `View: Groups`. This pane gets all leftover height and scrolls independently. Default group view uses collapsible groups and richer procedure rows, including identity ribbons, titles, status/labels when useful, priority, and favorites. No permanent bottom bar.

**Space strategy:** The 20/80 allocation is a **maximum/minimum ratio** for browse area *after* header/search/filter controls, not a fixed split and not a percentage of total viewport height. Do not insert blank padding to make Recent fill 20%; its heading plus one tile row may use less, so Library automatically receives more than 80%. Aim for ~22-28 px compact heading + 48 px single-row shortcut band + minimal gap/divider at standard text size. The one-row strip must never become three stacked rows. On narrow or zoomed screens, maintain >=48 px-high touch areas, allow horizontal scrolling of the three tiles with clear partial-next affordance when necessary, and do not shrink text below accessible minimums to force fitting. If the user searches, activates nondefault advanced filters, chooses Library view `Recent`, or collapses Recent, free **all** of its height for Library/results. If no procedures were ever opened, hide Recent entirely. The Recent section does not scroll vertically; the Library list scrolls independently. The on-screen keyboard cannot obscure focused search results.

#### Procedure row and metadata

- **Left identity ribbon:** full Library rows use a ~40 px zone with a narrow color rail and centered icon/symbol. Recent shortcuts use a narrower version of the **same** color/symbol identity to conserve width. Each procedure has its own chosen accessible color and bundled icon. Default: neutral color and generic icon. Keep the identity consistent across Recent, Library, Search, Details, and the recent-20 popup. No uploaded logos or remote icons in MVP; never rely on color alone.
- **Title:** full Library rows show 1–2 lines; Recent shortcuts show **one line** and an accessible full title for assistive technology. **Metadata:** full rows may show `Ready`/`Draft` and one tag (`+N` for additional tags), or group name in flat results rather than repeating it under the group. The compact Recent tiles show **identity marker + one-line truncated title only**. Never show group names or metadata beneath the tile: the full label, group, status, priority and last-access info are in the 20-item popup.
- **Priority:** level **0** shows no punctuation; level **1** shows `!`; level **2** shows `!!`. Display near the trailing edge with stable reserved width so row titles do not jitter. Screen-reader accessible name is `Priority 0/1/2`, but punctuation is not announced as a clinical warning. Priority is organizational, **not patient acuity, triage severity, or clinical escalation logic**.
- **Favorite:** a star control appears at the far right of full Library rows. For 320 px screens, maintain >=48 px favorite hit area; **all compact Recent shortcuts omit the star** so the entire tile remains a single predictable tap target. Editing ribbon/priority/tags is from Procedure Details > Edit Info, not from accidental row swipes or long-press gestures.
- **Grouping:** each procedure belongs to **zero or one** user-created group. Groups can be empty. Procedures may have **many** labels/tags, not constrained by group. `Ungrouped` is a virtual group, not a user-created record. No nested group trees in MVP.

#### Library View / Sort selector

| View option | What appears | Ordering |
|---|---|---|
| `Groups` **default** | Collapsible group sections (plus Ungrouped when nonempty) | Groups in user-set order; procedures A–Z within each group |
| `Priority` | **Flat list** across all groups | Level 2 (`!!`) first, then 1 (`!`), then 0; tie by last access descending, then title |
| `Recent` | Flat list across all groups | Last accessed descending, never-accessed last |
| `A–Z` | Flat list across all groups | Locale-aware title ascending |

A flat Priority view is intentional: a high-priority procedure should not be hidden inside a collapsed group when the user explicitly requests priority ranking. Changing the view does **not** alter a procedure's priority or group. The compact Recent 3 remains above Library in unfiltered normal view for Groups, Priority and A–Z. It disappears temporarily for active text search, non-default filters, or Library View = Recent (to avoid duplicating the same items). The Library pane then expands to 100% of the browse region.

#### Search and quick filtering

- Search matches **title, group name, tags/labels, manually entered aliases/keywords, description**, and optionally step text when `Include step content` is enabled from the Filters sheet. All matching runs on device, offline; no network calls or cloud search.
- Match is case- and diacritic-insensitive where supported; multiple query terms must all be present across indexed fields. Rank title > label/group > alias > description > step text. Keep query and selected filters on returning from Details.
- Filters sheet supports **Group (multi-select), Labels/Tags (multi-select), Priority (`Any`, `0`, `!`, `!!`, `! or !!`), and Status (`All`, `Ready`, `Draft`)**. Favorited and Drafts quick tabs remain at the top. Within a facet, multiple selected values match **any**; across different facets, conditions match **all**. Unselected facet = no restriction.
- A visible tag on a full row, if rendered as an actionable chip, can set the tag filter immediately. If narrow layout turns it into plain metadata text, do not pretend it is clickable.
- On text search or non-default facet filters, show a **flat results list**, ordered by current sort choice (default Group view uses title order). Hide the Recent 3 to devote space to results. Show `No matches` + `Clear filters` when appropriate.
- Filtering and sorting never modify underlying group assignments, star state, priority, or recent-access timestamps.

#### Button-level contract

| Control | Behavior | Edge cases and constraints |
|---|---|---|
| Header `+ New` | Open Page 06 New Procedure | The only global create-procedure button on Library |
| Header `···` | Menu: Backup & Restore; Settings; Archived | No second `+ New` or duplicate group management command |
| Search field | Immediate local search in specified metadata | No network; results flat, no accidental branch execution |
| Clear `×` | Clear text, retain facet/quick filters | `Clear filters` explicitly resets everything |
| `All` / `Favorites` / `Drafts` | Change quick scope | `Drafts` includes working revisions; `Favorites` includes Ready or Draft |
| Filters icon | Open Page 01C filter sheet | Changes take effect immediately; `Reset` restores defaults |
| Recent heading chevron | Collapse / expand the three recent shortcut tiles | Persist collapsed state locally; when collapsed, Library expands; hide section entirely if there is no history |
| Recent `···` | Open last 20 list; phone scrollable modal sheet, desktop popover | Includes the top 3 shortcuts, in descending last-access order; up to 20, not 20 placeholders |
| Recent shortcut tile | Open Page 02 Details for that procedure | Entire tile is one >=48 px tap target; no independent star or group action; no accidental direct run; preserve Library position on return |
| `+ Group` | Open single-field New Group dialog | Trim name; detect duplicates case-insensitively; create locally; focus new group |
| Group header / chevron | Expand or collapse that group in Group view | Persist collapse state; tapping group `···` does not toggle accordion |
| Group `···` | Rename; Move Up; Move Down; Delete Group | Deleting group moves its procedures to Ungrouped, **never deletes procedures**; confirm if not empty |
| View selector | Choose Groups / Priority / Recent / A–Z | Priority view is global, flat descending 2→0 |
| Library procedure row | Open Page 02 Details | Ribbon zone is part of row tap target, not a separately misleading button |
| Favorite star | Toggle favorite without entering Details | Report/save error; keep its own ≥48 px touch target |
| Tag chip (when shown as control) | Apply tag filter and show results | Normalizes label matching; screen reader gets label name |
| `No matches` Clear filters | Reset text, facet selections, and quick tab | Leave stored data unchanged |

#### Page 01A — Group dialogs and group management (same Library, no new route; **FROZEN v1.7**)

The frozen Library already contains `+ Group` in the Library heading and `···` in each group header. **Do not add another visible toolbar or route.** All management happens in small dialogs or mobile sheets over Page 01.

**`+ Group` -> create dialog:** Compact modal/sheet, not a full page: `New group` heading, single autofocus `Group name` input, `Cancel` secondary, `Create` primary. `Create` is disabled for empty/whitespace-only names and for duplicates after casefold/space normalization; show one inline error for a duplicate. Pressing Enter submits if valid. New group is persisted locally, inserted at the end of the custom order and expanded; returning to Library focuses its heading. All groups, including empty ones, remain visible in Group view.

**Group header `···` -> menu:** `Rename`, `Move up`, `Move down`, `Delete group`, in that order. `Rename` opens the same compact form prefilled with the current name. The group ID and procedure membership stay unchanged. Move commands immediately reorder groups locally and are disabled at the respective limits; no drag-only operation. `Delete group` ALWAYS opens a confirmation, including for empty groups. For members, text says `Delete [Group]? N procedures will move to Ungrouped.` Buttons `Cancel` / `Delete group`. If there are no members, say `Delete [Group]?` only. Never delete member procedures. Persist the group deletion and procedure reassignment atomically.

**Page 06 `Group` selector:** A single compact list/sheet titled `Choose group`: `Ungrouped` first, followed by existing groups in custom order, then `+ New group` as the last fixed item. Selected row has a check. Selecting a group closes the sheet and fills the field. `+ New group` opens the same single-input form; after successful creation, select the new group and close both sheets. Cancel returns to the picker, then to Page 06 without clearing title, labels, or optional detail values. All list rows have >=48 CSS px hit height.

**Procedure membership:** Assign or change one group at a time via Page 06 creation or Page 02 > `···` > Edit Details. Group search/filters update after every rename/membership change without needing a reload. `Ungrouped` is virtual and cannot be renamed or deleted. No nested folders in v1.

**Error handling:** On storage failure keep form content and group membership unchanged and offer `Retry`. Group creation within Page 06 never implicitly saves the procedure Draft. Group rename/delete must not corrupt prior backups or active run snapshots; those link to stable group IDs or carry their own procedure metadata.

#### Page 01B — Recent 20 sheet

- Header `Recent (20)` or the actual available count; accessible scrollable list, each row >=48 px with the color/symbol ribbon, **fuller title, group shown as a label rather than a subheading, Ready/Draft, priority (`!` / `!!`), and optional relative last-access time**. The richer popup remains a flat chronological list with no collapsible groups. No repeated procedure cards or nested group navigation.
- `Close` or swipe-down (phones) dismisses without navigation. Esc/outside click works on wide screen. Selecting an item closes sheet then opens its Details page.
- Recency timestamp `lastAccessedAt` updates on opening Details, Builder, Preview or Run, and when a new procedure opens in Builder. It does **not** change when filtering, starring, changing priority, changing labels, importing, or background autosaving. The list reorders on the next Library return rather than jumping during an on-screen selection.
- Archived procedures are excluded. Recent items that are later deleted are removed. If fewer than 3/20 exist show only available items in the strip/sheet respectively.

#### Page 01C — Filters sheet

- Controls: group multi-select; label multi-select (searchable tag names); priority segmented `Any / 0 / ! / !! / ≥!`; status `All / Ready / Draft`; optional `Include step content`; `Reset` and `Done`.
- While text search or active facets apply, show flat matches with group identified in row metadata as space permits. Avoid permanently rendering every filter control under Search.
- Filter state persists on return from Details and can be cleared explicitly; it is a view preference, not procedure data.

#### Empty, error, responsive states

- Empty library: show `No procedures`; keep `+ New` and `+ Group` available. Empty group: show its header and `0`, with no placeholder explanation.
- Empty recent: omit section; do not show fake examples. A newly created procedure appears in recent once its Builder is opened.
- Save failure on star/group/ribbon/priority/metadata edits: revert the displayed mutation or mark failure and offer Retry; never show a false successful save. Invalid imported group/ribbon/icon gracefully falls back to an `Ungrouped`/neutral identity and reports nonfatal import issues.
- On narrow screens and large font sizes, full Library procedure rows use a single column and wrap as needed. The three Recent tiles remain one horizontal row; permit horizontal scrolling at narrow widths or large text to preserve accessible touch targets and the <=20% Recent height cap. Do not hide priority `!!` under a trailing control in full Library rows. Full procedure names remain accessible on Details and via accessible labels for truncated shortcuts.
- At 1,000 procedures, group filtering and search updates should aim for about 100 ms on a representative mid-range phone, with virtualization only where measurements justify it.

**Acceptance:** On representative normal-height phones, show at most three most-recent shortcut tiles at once, sorted newest first, in a single row with no group labels or other secondary text. Recent uses **no more than 20%** of the available browse-region height, and Library receives **at least 80%** (more if Recent uses less). Each tile remains >=48 px high; at narrow widths, all three are reachable by horizontal scroll or the overflow without vertical tile stacking. Recent `...` opens a richer, correctly ordered flat top-20 bottom sheet/popover that includes group as a label, not nested grouping. Collapsing Recent, searching, or filtering allocates its space to Library/results. Verify group management; local metadata and optional step-text search; priority 0/1/2 sort; visual ribbon preservation across views/backups; no bottom navigation, duplicate actions, or tutorial text. **Page 01 FROZEN by explicit user approval on 2026-10-26.**

### Page 02 — Procedure Details (`/#/procedure/:id`) — **FROZEN; approved 2026-10-26**

**Purpose:** A compact handoff from Library to Consult/Build. Show enough identity and revision context to avoid opening the wrong version, without tutorial text or a full metadata form.

#### Default mobile composition (Ready-only example)

1. **Header:** left `‹` (Back to Library); right `☆` (Favorite toggle) and `···` (procedure actions). Do not repeat the procedure title in the header; do not add bottom navigation.
2. **Identity:** a small left color rail + bundled symbol matching the Library; full procedure title, wrapping up to 3 lines if required; optional `!` / `!!` at the trailing edge (priority 0 has no mark). Ribbon and symbol are informational, not separate tap targets.
3. **Compact metadata:** single-line `Ready · vN` (no language code); group label on the next line when present; short label/tag chips below, wrapping only as required. Up to 3 chips are displayed with `+N` for extras; tapping `+N` expands inline. Aliases and dates are not shown on the default view. If there is a short author-written description, show no more than 2 lines and an `Expand` affordance when more text exists; if absent, omit the area entirely.
4. **Action cluster:** one full-width primary action, `Start` when Ready exists. One compact row of secondary actions `View Map` and `Edit Graph`. Avoid title repetition, tertiary call-to-action cards, permanent privacy/offline badges, or duplicated Edit commands. For dual revision state use the behavior below.
5. **Viewport strategy:** No artificial hero area, illustration, or empty metadata placeholders. Only content and available actions consume height. On a normal mobile viewport, the primary action remains visible without scrolling for a typical one- or two-line title and 1–3 labels. If very long content pushes it below the fold, use natural vertical scrolling without covering labels or actions. All tappable controls remain >=48 CSS px (main action >=56 px).

#### State-specific command layout

| Data state | Compact status | Primary (large) | Secondary row | Exact revision target |
|---|---|---|---|---|
| **Ready only** | `Ready · vN` | `Start` | `View Map` / `Edit Graph` | Start and Map use immutable Ready revision; Edit opens Builder using a working copy; persist a new Draft only after the first real graph change |
| **Draft only** | `Draft` | `Edit Graph` | `Preview Draft` / `View Map` | All three act on working Draft; Preview is visibly marked `DRAFT PREVIEW` throughout Page 03 |
| **Ready + working Draft** | `Ready · vN` plus visible compact `Draft in progress` line | `Start Ready` | `View Map` / `Continue Editing` | Start Ready and Map use Ready; Continue Editing opens working Draft. Draft preview is available from Builder |
| **Archived** | `Archived` | `Restore` | `Export` (optional) | Opened only from Archived list; not shown in normal Library/Recent |
| **Unavailable or corrupt data** | Actionable error, not Ready | No Start/Preview | `Back` and `Export Recovery Copy` if possible | Never guess a path or silently switch to another revision |

**Rationale for dual-revision state:** `Start Ready` explicitly identifies the safe-to-consult *existing personal Ready snapshot*, even while the user edits a replacement. `Continue Editing` replaces the normal Edit secondary button to avoid duplicate actions. `View Map` always uses the same revision as the visible Start action. Editing metadata does not silently modify graph content.

#### Button and interaction contract

| Control | Action | Conditions / edge cases |
|---|---|---|
| Header `‹` | Back to original Library context | Preserve search text, quick/facet filters, selected view/sort, group collapse, recent-strip collapse, and scroll position. If arrived from Recent 20, return to Library; do not reopen popup automatically |
| Header `☆` / `★` | Toggle favorite, immediately write to IndexedDB | Preserve previous state or display a Retry action on write failure; star has accessible `Add to favorites` / `Remove from favorites` label |
| Header `···` | Open anchored action menu (phone: compact bottom sheet if menu cannot fit) | Exact actions below; no duplicate `Start`, `View Map`, or main Edit Graph command |
| Identity rail / icon | Display configured color + icon only | Same choice as Page 01; not a separate action; color never the sole identifier |
| Priority `!` / `!!` | Display organization priority 1/2 | Level 0 displays no punctuation; accessible name `Priority one/two`; not a clinical severity or triage mark |
| Group label | Open Library with this group filtered | Hide clickable affordance if no group. This is navigation, not a group edit; preserve return origin when subsequently backing out |
| Tag chip `#label` | Open Library with that label filter applied | This reuses Page 01 search facets and replaces the previous tag filter; tag filtering never mutates data |
| Tag `+N` | Expand hidden tag chips within Page 02 | Toggles to `Less`; do not navigate or change data |
| Description `More` / `Less` | Expand or collapse author-provided description | Render only if author wrote a description and it exceeds 2 lines; do not include tutorial text |
| **Start** | Open Page 03 at Start node of Ready snapshot | Ready-only; graph integrity checked locally before entering. If missing/corrupt, stop with specific recovery/edit action; no implicit branch |
| **Start Ready** | Same as Start, explicitly selects Ready revision | Visible only with an independent working Draft present. Do not accidentally start the Draft |
| **Edit Graph** | Create/open Page 07 working Draft | In Ready-only state open a working copy of Ready in Builder, but do not persist a Draft until the first actual graph change (entering and immediately leaving Builder leaves Ready-only status unchanged). In Draft-only open the existing Draft. Every graph change must be saved successfully before it is presented as persisted |
| **Continue Editing** | Open Page 07 existing working Draft | Ready+Draft state; never edit immutable Ready snapshot in place |
| **Preview Draft** | Open Page 03 against working Draft with `DRAFT PREVIEW` persistent label | Only for Draft-only state on this page. If the graph has broken paths, preview stops at them with a clear error instead of choosing an edge |
| **View Map** | Open read-only Page 05 on the revision named by current state | Ready-only and Ready+Draft -> Ready; Draft-only -> Draft and visually identified as draft. Graph renderer lazy-loads only on this action |
| Archived `Restore` | Unarchive without changing content | After confirmed write, return to Details in its appropriate Ready/Draft layout |

#### Procedure `···` menu, in this exact order

| Menu item | Action / safeguard |
|---|---|
| **Edit Details** | Open a compact metadata sheet: title, group selector, labels/tags, search aliases, description, priority `0 / ! / !!`, ribbon color, icon. Does **not** mutate graph nodes or Ready snapshot structure. Autosave locally; failure remains visible |
| **Duplicate** | Clone title/tags/ribbon/graph into a NEW procedure ID as a working Draft; append a localized `copy` suffix to title, then open its Builder. Group copied unless user changes it |
| **Export** | Export this one procedure as a portable, versioned JSON file, including its revisions and metadata. User-initiated local save/share; no automatic uploads |
| **Archive** | Confirm `Archive procedure?`; remove from normal Library, Recent and search, but retain it in local storage; available from Archived list |
| divider | Separate reversible actions from destructive action visually |
| **Delete** | Confirm permanent deletion, show affected title, offer `Export first` and `Cancel` (and explicit `Delete`). Never delete via swipe or implicit back action |

#### Empty, error, and responsiveness

- If no Group, omit the group label rather than showing `Ungrouped` if it only adds noise. If no Tags or Description, omit the corresponding line entirely; never insert instructional placeholders.
- A long localized procedure title must remain legible in Details, unlike truncated Recent tiles. Wrap, do not horizontally overflow; do not force clinically important metadata or warning content to fit on one line.
- User-authored descriptions are supplementary but can be clinically relevant; show the beginning, with expand affordance. Critical procedure alerts must appear in the relevant guided step, **never only inside a collapsed description**.
- A procedure without a Ready snapshot is **never** shown with a Start button. No published or institutionally approved claims are made by `Ready`.
- Opening Details updates `lastAccessedAt` for the 3/20 recent lists (only when navigation actually occurs). Starring, expanding description/tags, filtering and editing metadata do not update recency. Return to Library retains current viewport context.
- Back and menu dismiss work with native OS back, keyboard Escape and screen-reader semantics where relevant; no data is lost by opening/closing menus or info sheets.
- The page must work fully offline, including metadata saves, graph entry and single-procedure export, after initial PWA installation.

**Page 03 persistence compatibility (Page 02, no layout change):** The existing primary Start/Start Ready control reads `Resume` if a matching locally saved session exists. Restarting an active run is a secondary menu action with confirmation. This is a state-specific behavior required by the newly requested persistence, not a redesign of Page 02 geometry.

**Page 02 acceptance test (FROZEN):** Open a Ready procedure from a Recent shortcut and verify Full title / group / labels / priority / identity ribbon. Star without entering a menu. Start correct Ready revision in one tap, return and view Map, open Edit Graph, make one edit, and verify an independent working Draft is saved; opening and leaving without changes must not create a new Draft. Return to Details: page now shows `Start Ready` + `Continue Editing`, and Start still consults unchanged Ready. Verify Draft-only gives Edit Graph and Preview Draft but never Start. Test labels and group navigation to Library filters; `···` duplicate/export/archive/delete; long title; save failure; archive recovery; correct recent ordering; small phones, large text, touch/keyboard labels; offline. **Page 02 explicitly frozen by user approval on 2026-10-26.**

### Page 03 - Guided Procedure (`/#/run/:id`) - **FROZEN (approved UX v1.0)**

**Purpose:** Present exactly one authored instruction, decision, or alert at a time while retaining enough route context for safe orientation: current step / potential total length, current macro-category (phase), and the immediately previous visited step. Run state is saved on this device after each navigation action. Do not auto-generate or infer clinical instructions.

#### Mobile layout (compact, content-first)

1. **Header:** 48px Back target on the left; one-line procedure title in the center; `Map` and `Exit` actions on the right (>=48px hit areas). `DRAFT PREVIEW` remains visible when applicable. No bottom navigation, tutorial or decorative progress bar.
2. **Context row:** `STEP 3 / 8` if all possible continuations have the same total visible-step length; `STEP 3 / 8-11` if potential path lengths differ. Display the named current phase/macro-category on the same row or immediately underneath (`PREPARATION`). Phase is an author-created grouping of **steps within this procedure**, not the procedure's Library group.
3. **Left-aligned previous cue:** a low-contrast, read-only strip such as `PREVIOUS  Check materials - Yes`. It identifies the *last actually visited* step and, if it was a decision, the chosen outcome. It does **not** preview possible next steps or guess graph parents. At the first step it is absent. Truncate visually on mobile with accessible full text; do not let it crowd the current question. On tablet/desktop it can occupy a narrow left-side rail; on phone place it left-aligned just above current content to preserve reading width.
4. **Current step content:** full visible authored instruction, question or alert, natural wrapping and accessible size. No truncation of clinical instructions. If there is a **step note**, render a small `Note` action; when opened, place the note below the step text. Avoid making a clinical warning depend solely on an optional closed note.
5. **Decision options:** 2-5 full-width >=56px rows. Each row has a dedicated **label/select** area and, only if the option has a note, a separately tappable **note/info** control. The note control expands inline without choosing the outcome; the option's main area follows its single explicit edge with one tap. Expanded notes never reorder the selected branch or hide other options.
6. **Instruction / Alert:** `Continue` if there is one explicit outgoing edge; an End target goes directly to Page 04. Critical alerts and mandatory guidance remain visible inline, not only in expandable notes. Structural Start is never shown as a numbered step.
7. **Adaptive layout:** Keep the context header and previous cue small; clinical content and outcome buttons get the space. Long step text and long notes can scroll naturally, never clipped; >=48px touch targets and accessible font scaling take priority over density. Notes use sanitized local rich text (plain text + safe basic lists/emphasis), no remote resources or executable HTML.

#### Determining the `n / N` context in a branching graph

- `n` = 1-based index of the *currently visited visible step* on the active navigation path. Structural Start does not count. End is displayed on Page 04, not as an extra Page 03 step.
- At the current node, compute the **minimum and maximum number of additional visible steps reachable along valid routes before an End**, including authored instruction/decision/alert nodes but excluding Start and End. For an acyclic graph, these can be precomputed deterministically per immutable graph revision.
- `minTotal = n + minRemaining`, `maxTotal = n + maxRemaining`. When equal show `STEP n / N`, otherwise `STEP n / minTotal-maxTotal`. Example: `STEP 3 / 8-11`; after selecting a branch it may become `STEP 4 / 8`.
- The count measures current run length, not the total number of graph nodes. Branch merging is supported; no automatic recombination of *previous selections*. Cycles are disallowed in MVP. If a graph is incomplete/invalid in Preview, show `STEP n / ?` rather than fabricate a total, and block navigation at an invalid link.
- No percentage/progress bar: remaining length may be uncertain until decisions are answered. Localizing digits/range punctuation should honor UI locale.

#### Macro-category / phase

- A procedure has an optional ordered list of author-defined **phases** (`phases[]`) such as `Preparation`, `Assessment`, `Follow-up`. Each graph step may reference one phase by ID. A phase may contain many nodes and branches; phases do not create links, change graph ordering, or alter the path.
- Display the current node's phase name in the context row; if unassigned, omit the phase chip/label to save space. Never use the Library group as a surrogate for this step-level macro-category.
- A phase name is user-authored procedure content. The Builder and Step Editor allow creating/renaming phases and assigning them to nodes. Changing the global UI language does not translate this content.

#### Notes: step vs. outcome

- **Step note:** attached to a `Node` and localized independently; a small `Note` control expands below current instruction/question. A note may contain multiple short paragraphs or lists, rendered offline and safely.
- **Outcome note:** attached to the decision **option/edge**, not the destination node; each outcome row gets its own information control if, and only if, that outcome has note content in the active language. Activating this control MUST NOT select the branch.
- Notes remain optional. When note text is essential to the user's decision or is a critical warning, the author must mark it `always visible`, or put it in the step/alert body. Optional supplementary notes may be collapsed. For option notes marked `always visible`, show the note under that option's label without extra tap.
- All current authored step text, outcome labels, notes, and phase names come from the pinned revision as written. Changing app UI locale changes only interface strings; the run is never given a separate content-locale setting.
- Expanded/collapsed note UI state is not required to be persisted; on resume, the **node and branch selections** must be restored. Notes can reopen collapsed by default to reduce storage writes.

#### Dual media sections in Guided Procedure — proposed v1.9 addendum (original Page 03 UX remains frozen)

- **Both locations at once:** A single step can have media in **both** `before-note` and `after-note` slots. Render the ordered blocks as **step body / always-visible critical content -> Before-note gallery (if nonempty) -> Step note disclosure plus expanded note text, if authored -> After-note gallery (if nonempty) -> decision options or Continue**. The note trigger and its expanded content form one logical divider. Decision **outcome notes remain beside their own buttons** and never move to the step-gallery regions. Critical alerts/instructions are always visible before optional galleries and not dependent on image loading.
- **No empty space:** Only render a gallery when it contains images. If no step note is authored, retain the authored before/after order but render adjacent sections without a fake empty `Step note` label. If the step note is collapsed, its disclosure control **remains between** the two galleries, so the positioning stays meaningful. No blank `Before`/`After` editorial section headings should be added in consultation mode.
- **Independent gallery settings:** Before-note and after-note sections each have their own `layout` (`stacked-thumbnails`, `side-by-side`, `full-width`) and `imageSpace` (`compact`, `medium`, `large`, `natural`). `stacked-thumbnails` uses vertically stacked compact rows; `side-by-side` uses two responsive columns; `full-width` puts one media item per row using the available content width, with no cropping. Settings affect only the target slot; changes redraw both slots in the same Page 03 live preview immediately.
- **Allocated space:** The `imageSpace` preset specifies a preview frame/maximum height for its corresponding section. Use `object-fit: contain` where a frame is capped; `natural` preserves proportional full image height. Tapping any image opens a zoomable viewer. With many assets the page scrolls; do not shrink the step text, hide options, or overlay outcome buttons. Total media count is capped at 32 **across both slots combined**, not 32 per slot.
- **Ordering and movement:** Each media item has one `slot` and a stable ordering *within that slot*. `Move to Before note` and `Move to After note` switch slots without copying asset bytes or counting as new media. Existing items remain movable and editable even when the current soft-add limit blocks new additions.
- **Thumbnails:** Show a compact count or index when useful, authored caption when present, and an unobtrusive link marker for remote assets. Only image data required for the current on-screen region should decode eagerly; offscreen items lazy-load. Keep enough reserved dimensions to avoid layout jumps when an image loads or fails.
- **Local photo:** The app obtains explicit user-selected file(s) via device photo/library picker; no automatic camera permission. Page 08 offers `Small`, `Medium` (default, max 1280px width, generally target 150–300 KB), `High`, and `Original`, with original/resized byte estimates and an author preview before save. Preserve diagram text readability; if compression is harmful, user can choose higher quality/original. Local assets load fully offline from IndexedDB.
- **Linked image/GIF:** HTTPS image URL stored as a URL, not downloaded automatically into persistent local asset store. When reachable show image or animation; when offline, forbidden, timed out, or broken show `Media unavailable` and optional `Retry`/`Open link`. Failure must never prevent interpreting text or selecting an outcome. Label a remote item subtly as linked/online-dependent; external sites may see a request and IP. Avoid executable HTML, scripts and unsafe URL schemes. Remote GIF motion must not distract from or prevent reading step instructions.
- **Relationship to parallel branches:** The `Switch branch` button stays below STEP/phase and above PREVIOUS. The **frozen passive vertical `B 2/3` rail** continues alongside the main current-step content; the media and note blocks render **inside** that same current-step column, not over or behind the rail. The bar/rail are absent outside a parallel region.
- **Node coverage:** Allow step media on authored Instruction, Decision and Alert, and optionally End with Page 04 displaying the same presentation rules; do not attach media to structural Start/Fork-All/Join-All nodes. Page 05 read-only node information sheets may inspect the same media, with no navigation or graph edits. **Step-level media only** in first release; decision-option-specific images are not in scope.
- **Pinned runs:** An active run continues to use its immutable revision's media order, presentation settings and stable asset IDs even if an editable Draft changes images. Do not garbage-collect local media blobs still referenced by Ready snapshots or active runs. Back/resume/branch switch never silently re-save, rearrange or remove media.

#### Session persistence and navigation

- Save the active run in **IndexedDB**, including `runId`, `procedureId`, mode (Ready or Draft Preview), pinned immutable graph revision/snapshot, `currentNodeId`, `cursorIndex`, visited node history with selected edge IDs, `updatedAt`, and save-state metadata. Do **not** store patient identifiers by default. Local run data is not a cloud record and does not create a completed-run history.
- The app performs an atomic IndexedDB write on every Continue, branch selection, Back navigation, or branch change; update the visible step after the transaction succeeds. For fast perceived navigation, use optimistic rendering only if rollback-on-failure is reliable; never silently lose a tap. Rapid double taps cannot cross two steps unintentionally.
- A successfully saved run survives normal page navigation, app suspension, browser/tab closure, reload, and device restart **as long as local origin storage remains intact**. Browser clearing or storage eviction can still delete it; persistent-storage requests and backups mitigate but do not eliminate loss.
- Page 02 retains its **frozen layout**. The primary Start/Start Ready action changes text to `Resume` when a matching session exists. Starting fresh while such a session exists requires a separate `Restart` command and confirmation; a procedure cannot silently replace its active run. Draft Preview sessions are independent of Ready sessions and always clearly marked.
- A run pins an immutable snapshot. Edits to a new Draft, updates or backup imports cannot mutate its currently consulted steps. If the underlying procedure is deleted, handle associated active sessions with explicit confirmation and cleanup.
- On app reload, no disruptive automatic jump from frozen Page 01 Library: when the user opens the related Page 02, the appropriate `Resume` action is displayed. Deep linking directly to the run can restore if valid, otherwise return to Details with a concise error.
- Pressing **Exit** always opens `Exit run?` with `Stay` (default focus) and `Exit run` (destructive). Stay leaves the current session untouched; confirm clears that run in IndexedDB, then returns to Details. System/browser Back on the first step also invokes the same confirmation; a browser unload cannot guarantee a confirmation or cleanup, so it simply leaves the run saved for later Resume.
- At End, automatically open Page 04. The active session remains stored while on Page 04 so a reload recovers the completion screen. `Return to Library` or confirmed `Restart` then deletes/resets the session. Completed history is not retained by default.
- Pressing Back moves the saved cursor to the **actually visited** preceding node, never a guessed incoming parent. Already traversed downstream nodes may remain in the saved path for forward traversal along the *same* selected route; `n` uses `cursorIndex + 1`, not full saved path length. When changing an earlier outcome, truncate incompatible downstream nodes/edges and save the new path and cursor in one atomic operation before displaying the new node. Browser Forward must not restore discarded branches.
- Map is read-only during a run. Returning to the run preserves the same node, revision and choices. No user-generated network request or analytics is emitted by navigation. On IndexedDB write failure, keep the user on the last securely saved step, show `Could not save progress`, and offer `Retry`, `Export recovery`, and `Stay`; never claim to have advanced successfully.

#### Page 03 button contract

| Control | Behavior | Safeguard |
|---|---|---|
| Header Back | Return to preceding visited step | Save navigation; first-step Back opens Exit confirmation instead |
| Header `Map` | Open Page 05 with current node highlighted | Read-only; returning preserves session |
| Header `Exit` | ALWAYS open `Exit run?` | `Stay` or destructive `Exit run`; no bypass |
| Previous cue | Display previous visited step + selected outcome | Informational only; not a forecast or duplicate Back control |
| Step `Note` | Expand/collapse authored step note | No navigation or branch selection |
| Outcome `info` | Expand/collapse note for exactly that outcome | Separate hit target; never selects outcome |
| Outcome main row | Select authored edge and advance | Atomically save selection and new route; no inferred edge |
| `Continue` | Follow sole explicit Instruction/Alert edge | If End, Page 04 automatically; block invalid link |
| OS/browser Back | Mirror Back, while intercepting first-step exit | Never silently discard active run |
| Resume (Page 02) | Rehydrate saved route/current node | Validate pinned snapshot; show one consistent context view |
| Restart (Page 02 or Page 04) | Explicitly discard prior route, begin at first step | Requires confirmation if session exists |
| End transition | Automatically open Page 04 | No redundant Finish button; session remains restorable until user leaves End screen |

#### Acceptance tests for Page 03 v1.0

1. Start a valid, acyclic example graph with variable route lengths. Confirm `STEP n / N` for equal-length paths and `STEP n / min-max` for varying remaining paths; after choosing an outcome, recompute counts without counting Start/End.
2. Confirm current phase/macro-category appears correctly and changes when moving between nodes; a node without phase omits the field.
3. Confirm the read-only left-aligned previous cue always shows the **actual** preceding step and its selected branch label; initial step has no cue. Truncation retains accessible full text.
4. Step note expands independently of choices. Each outcome note expands independently and NEVER triggers that outcome. Essential notes marked always-visible are shown by default. Check UI localization, wrapping and large font sizes.
5. Exit from **first** and subsequent steps always opens the confirmation; Stay retains state, Exit deletes it. Header/OS Back from first step cannot discard the run silently.
6. Choose A, traverse multiple steps, move Back to the decision, choose B; verify all incompatible A history is removed from both displayed history and IndexedDB. OS Forward cannot revive A.
7. Suspend, kill/restart, reload and reopen PWA offline. From unchanged Page 01 and Page 02 `Resume`, restore same node/path/pinned revision. The stored graph is unchanged if the author edits a new Draft.
8. Simulate failed IndexedDB write and storage eviction. Show an actionable save failure without silent advancement or false guarantee. After cleared storage, explain no local run remains; never invent recovery.
9. Confirm Map read-only, nonclinical example text, rapid double-tap protection, long note content, 320px width, 200% font scaling, touch and keyboard/screen-reader operation.
10. Reach an End: Page 04 appears automatically and survives reload until confirmed return/restart. No permanent completed-run history by default.

**Page 03 status:** FROZEN in its v1.0 UI and button behavior by explicit user approval on 2026-10-26. Pages 00-02 remain frozen. Implementation details may be refined without changing this approved interface or behavior.

#### Approved AND-parallel extension (v1.7): interaction and switcher UI FROZEN

- The original **one-step-at-a-time** card, previous-step cue, phase, authored notes, Map and always-confirm Exit remain unchanged for ordinary linear/OR cases.
- An explicit **Fork-All** activates all required outgoing branches. NurseFlow may automatically focus the first branch in the author's stable branch order, but this is *not* an exclusive choice and all other branches remain pending and visible in branch context. The focused step alone fills the existing card. The nurse must be able to switch focus to any outstanding branch without marking it done.
- A **Join-All** stays gated until all branch tokens spawned by the matching fork have arrived. Arrival in one branch never releases the join, even if other branches contain optional OR choices. Once the last token arrives, the join consumes those child tokens and the continuation becomes available once. End nodes are valid only after outstanding mandatory joins have resolved.
- **Previous step** means the last actually visited actionable step *in the focused branch*, or the fork context when the branch begins; it never displays an unrelated step in another branch. The approved `Switch branch` control and passive `B n/m` marker appear **only during AND-parallel activity**; both are frozen by the 2026-10-27 approval.
- **Step count:** `n` is the current actionable step's ordinal in the effective recorded visit order, including steps in required parallel branches; it is not a per-branch count. Pending AND branches contribute to min/max total lengths. Switching to an already visited step reuses its ordinal; entering a previously unseen step in another branch increments the visit count. Structural Start/Fork/Join/End markers do not count. If the graph is invalid, show `?` rather than fabricate a total.
- **Back and alternative change:** Back acts within the focused branch's actual history. Revising an upstream exclusive choice invalidates only descendants that depend on the changed choice; if that choice precedes a fork, cancel its spawned tokens and gated joins atomically. Preserve completed independent branches unless the changed dependency invalidates them too. This generalizes, rather than contradicts, the frozen 'never combine incompatible histories' rule.
- **Persistence:** One local ActiveRun holds all branch tokens, fork/join gates, current focus, pinned revision, and an ordered event journal. Atomic navigation transactions persist focus/choices/completions before the step changes visibly. On reload, restore *all* pending and finished branches, not just the last focused cursor. Exit/Restart/End semantics remain as already frozen.
- **Scope:** Support well-formed acyclic nested Fork-All/Join-All regions and OR decisions within them. Do not infer parallelism from multiple outgoing lines on a non-Fork node; do not auto-mark a branch completed, skip a gate, or invent joins. Unstructured cross-branch edges and graph loops fail validation for Ready.

#### Page 03 parallel-only branch navigation — **FROZEN v1.7; approved 2026-10-27**

The previous v1.6 term "branch bar" was ambiguous. There are **two separate elements** with different roles: one **clickable branch-selection button** above the previous-step cue, and one **passive vertical branch identity marker** alongside the active step. Neither exists outside an active AND-parallel region. The original frozen Page 03 header, step number, phase, previous cue, notes and one-step interaction must remain unchanged.

**A. Full-width Branch selector BUTTON (interactive).**

- **Placement:** immediately below `STEP n / possible-total` + phase, and above `PREVIOUS STEP`, at the same full available content width as the decision options. It has a border or subtle background and a >=48 CSS px touch target. The entire surface is **one accessible button**, not just its chevron, branch name or progress count.
- **Visible elements:** a fork icon; a clearly actionable label **`Switch branch`**; on the second line or compact adjacent line the **current authored branch name** (`Equipment checks`); trailing `1/3 done` and down-chevron. Screen reader: `Switch branch. Equipment checks, branch 2 of 3. One of three complete.` If space is narrow, truncate the branch name (accessible full label), never the action name. Avoid an ambiguous bare 'Equipment checks 1/3' informational strip.
- **Trigger:** tap/click/keyboard activate **anywhere on this single row** -> open branch-selection bottom sheet on mobile / anchored popover on wide screens. Merely opening/dismissing this sheet **does not** select a decision, switch branch, advance the graph, change a completion state, or persist a navigation event. This is **AND branch navigation only**, not selection of OR decision outcomes.
- **Sheet:** title `Parallel branches` (+ optional authored fork name if useful), summary `1 of 3 done`, close `×`; one >=48 px row per authored branch ordered by fork edge order; each has its name and status **Current / In progress / Not started / Done**. A previously visited uncompleted branch is `In progress`; a new branch is `Not started`.
- **Sheet row interactions:** tap a `Not started` or `In progress` row to atomically save focus and show its first/last persisted actionable step on Page 03; sheet closes. Tapping the `Current` row simply closes the sheet. A `Done` row has no normal Switch action: a dedicated `Reopen` button triggers confirmation. Closing by `×`, outside click or swipe does not change focus.
- **Branch completion:** hitting its paired Join-All completes that branch, updates `X/Y done`, and automatically focuses the next unfinished branch in authored order; no extra End screen or Finish button. After all tokens reach Join-All, continue through it exactly once and remove the switcher (unless an outer fork is active). Branch switching never infers a decision answer or completes work.
- **Reopen confirmation:** `Reopen branch?` -> `Cancel` / `Reopen`. Confirmed Reopen clears this branch's completion, restores its last actionable step, and invalidates **dependent downstream** steps/joins; unrelated completed branches are retained. If the run had already continued beyond a join, user must first navigate Back into that fork context before Reopen is available. Opening the sheet alone never reopens a Done branch.

**B. Passive vertical Branch marker (NOT a button).**

- **Placement:** within the **current step content area** only, at the left edge of the instruction/decision/alert panel. A narrow ~22-26 px column uses a **short upright `B 2/3` marker** at its top plus a thin colored vertical rail extending alongside the current step and its options. This is not a screen-wide rail, extra Back control or a tappable badge. Avoid rotated long text on small phones. The main content still occupies most of the width and all authored wording wraps naturally.
- **Meaning:** `B 2/3` = **the focused branch is the second of three authored parallel branches**, NOT step number and NOT `2/3 done`. Full accessible text is `Branch 2 of 3: Equipment checks`. The global step counter stays in the header, and the separate selector shows `X/3 done`.
- **Interaction:** strictly **noninteractive**: no `onClick`, menu, tooltip required for basic meaning, or navigation role. It stays visible while focused steps in that branch change, updates on branch switching, and disappears when leaving the parallel region. Use text/symbol plus optional color, never color alone. If nested forks exist, the marker represents the **innermost focused branch**.
- **Sizing/accessibility:** The narrow rail is decorative; only the `B 2/3` text is informational. It must not diminish step/option tap targets, obscure critical alerts or impose horizontal scrolling on 320 px phones. The step body remains full-text, flexible-width and vertically scrollable. At 200% text scaling, simplify to a small `2/3` marker with an accessible full name, rather than squeezing step text.

**Compact mobile placement sketch (not a new screen):**

```text
< Equipment readiness           Map  Exit
STEP 05 / 09-12              PREPARATION
+---------------------------------------+
| [fork] Switch branch          1/3 done |
|        Equipment checks            v   |  <- entire row is clickable
+---------------------------------------+
PREVIOUS  Check material list - Available
+---------------------------------------+
| B | Verify equipment is ready for use. |
|2/3|                                   |
| | | [Step note v]                     |  <- narrow left marker is NOT clickable
| | | [Continue]                       |
+---------------------------------------+
```

**Nested forks:** The selector shows the innermost active fork. The sheet identifies its parent scope, when any, with a compact breadcrumb. Changing branch focus persists the correct set of tokens and updates the marker. A parent switch must never erase child progress silently.

**All persistence and safety invariants stay in force:** immutable revision snapshot, atomic IndexedDB focus/history update, explicit Reopen confirmation, focused-branch Previous cue, only dependent-path invalidation, always-confirm Exit, no temporary cloud data. On a failed save, keep the old focus and display Retry instead of falsely switching.

**Approval status:** Explicitly FROZEN on 2026-10-27. Page 03's original step content, options and other frozen controls remain unchanged. The media display revision v1.8 is a separate proposed extension.


### Page 04 - Procedure End (`/#/run/:id/end`) - **FROZEN (approved 2026-10-26; UX v1.2)**

**Purpose:** Display the authored endpoint of the current procedure path, maintain meaningful context, and offer a clear way to finish or repeat the run. The application must not infer a clinical diagnosis, outcome, action taken or level of success. Reaching any End node is not automatically a clinical success.

#### Proposed mobile UI (compact)

1. **Header:** `Back` on the left, one-line procedure title, `Map` on the right. Keep hit targets >=48 CSS px and preserve `DRAFT PREVIEW` visibly when applicable. No extra Exit action is needed: Page 04 already has an explicit terminal handoff and the Page 03 Exit control remains unchanged.
2. **Route context:** Small line `END · 7 steps` (the exact number of *actually visited visible non-End steps*, not an estimated total) and optionally the End node's authored procedure phase (`PREPARATION`). At Page 04 there is no unresolved branch-length range.
3. **Previous-step cue:** Reuse the left-aligned read-only cue from frozen Page 03, displaying the last actually visited step and the selected outcome where applicable. If the path has no meaningful previous visible step, omit the cue.
4. **Terminal message:** A compact outcome-type icon and label, followed by the **full authored End message**, never truncated. If the author provides a separate End heading, place it above the message; otherwise the existing End node text is the primary message. Avoid success-themed hero graphics, automatically generated summaries, or nonessential instructional copy.
5. **End note:** If the End node has an optional note, show the same small expandable `Note` action as Page 03. Any essential alert or immediate action must remain visible in the End message (or a note authored as `always-visible`); it must not depend on opening an optional note.
6. **Actions:** The primary full-width button is `Return to Library`, labelled `Library` only if the smaller text better fits the chosen mobile layout. A less prominent `Restart` action is directly below. The existing `Map` action is in the header; do not duplicate it below. No fixed bottom navigation, unrelated metadata cards, celebration graphics or excessive empty space. Content scrolls naturally; important authored text is never clipped.

#### User-authored End type

| `endType` | Visible label | UI character | Meaning |
|---|---|---|---|
| `neutral` (default) | End | Neutral symbol and tone | Route ended; no conclusion inferred |
| `completed` | Completed | Check symbol and affirmative but restrained tone | Author marked this terminal branch as completed |
| `escalation` | Escalation | Attention icon plus explicit text | Author directs additional action or escalation; nothing is automatically contacted or recorded |
| `stopped` | Stopped | Stop symbol and explicit label | Author indicates the procedure cannot/should not continue on this branch |

- End type is a **user-authored display attribute**, not the app's inference from preceding outcomes. Label and icon must convey meaning without relying on color alone.
- `neutral` is the default for existing/imported End nodes without an explicit type. Never silently coerce them to `completed`.
- The author controls the actual End heading, mandatory message and any note. Display the complete authored message exactly as stored. If missing or invalid, show a specific preview/validation error rather than a fabricated clinical instruction.
- A previewed Draft retains a visible `DRAFT PREVIEW` label in the header and cannot look identical to a Ready run.
- These terminal labels are translations of **UI vocabulary**, distinct from manually authored End text, which is never automatically machine-translated.

#### Button-level contract

| Control | Action | Persistence and safeguard |
|---|---|---|
| Header `Back` | Reopen the actual last visited non-End step in Page 03 | Atomically save `state: active`, current prior step, and its path cursor before navigation; downstream choices are changed/truncated only if the user subsequently takes an incompatible branch |
| Header `Map` | Open Page 05 with current terminal End node highlighted | Read-only; returning to Page 04 preserves pinned snapshot and terminal session |
| End `Note` | Expand/collapse author-written note | No route change; honor `always-visible` content |
| Primary `Return to Library` | Complete handoff and open frozen Page 01 | Delete **only this exact run** from IndexedDB, then navigate after deletion succeeds; no further confirmation because the run has explicitly reached its End. Does not delete procedure, Ready revision or unrelated Ready/Draft sessions |
| Secondary `Restart` | Open `Restart procedure?` confirmation | `Cancel` keeps terminal screen. `Restart` resets current run atomically to the first meaningful node of the **same pinned revision**, then opens Page 03; never silently replace with a newly edited Ready revision |
| System/browser Back | Mirror header Back if prior visible step exists | Must not silently wipe or discard a completed session |
| No prior visible step | Hide/disable Back | `Return to Library` remains the explicit completion action; Map is still available |

**Restart confirmation copy:** Title `Restart procedure?`; optional concise body `The current path will be replaced.`; buttons `Cancel` and `Restart`. The session at End must remain intact if Cancel is chosen or the write fails. Do not create a second concurrent run for the same procedure/mode/revision.

#### Run-state lifecycle (compatibility with frozen Page 03)

1. A Page 03 choice/Continue that reaches a global End **with every required parallel join satisfied** persists `state: at-end` and `terminalNodeId: endNodeId` with the immutable revision snapshot, branch token states and actually traversed route, then automatically opens Page 04 (no Finish button).
2. Page 04 is fully restorable from IndexedDB after reload, app suspension, closure or device restart. When opening Page 02 after reopening the app, its already-frozen state-dependent `Resume` action returns to the End screen, not the previous instruction.
3. `Back` reactivates the preceding visited step. If the user returns by the same branch, show the endpoint again; if the user changes an earlier decision, apply frozen Page 03 downstream-history truncation, so abandoned routes never recombine.
4. `Return to Library` deletes only this persisted run, then navigates. If deletion fails, stay on Page 04 and show a brief actionable failure with Retry. Never announce cleanup that was not committed.
5. `Restart` requires its own confirmation; reset route and current step in a single transaction using the **same pinned revision**. A newer Ready revision must be explicitly opened later through Procedure Details.
6. Browser/tab closure, OS termination and viewing the Map do not count as leaving the completed run. There is no default completed-run log or patient history. Explicit backup settings for in-progress sessions remain governed by the not-yet-frozen Page 11 design.

#### Error and layout states

- **Unavailable localized End content:** Follow Page 03's explicit content-language selection/fallback rules; never silently mix languages or invent end text.
- **Missing End node / corrupt session:** Do not show a success state; provide a recoverable error and a safe route to Details or local recovery export if available.
- **Storage write/delete failure:** Keep current screen and persisted state if possible; offer Retry, no false completion notification.
- **Long terminal instructions and notes:** Expand naturally and scroll; do not truncate mandatory messages, reduce font below accessibility minimum, or place important text behind a fixed footer.
- **Viewport constraints:** At 320 CSS px and with large text, buttons remain >=48 px high, keyboard accessible and safely separated; only neutral context labels may truncate visually with a full accessible equivalent.
- **Screen-reader semantics:** Announce outcome type and heading, focus the main terminal heading on entry; return focus to the corresponding anchor after Map or modal dismissal. Warnings never rely solely on color.
- **Offline:** All content, save/delete operations and restart are local; no network availability is required after initial PWA setup.

#### Page 04 acceptance tests (FROZEN)

1. Create four nonclinical example End nodes, one of each `endType`; verify distinct label/icon semantics and authored message, with neutral default for legacy nodes.
2. Traverse a route with branching and return to End. Confirm `END · n steps` uses actual traversed visible nodes (excludes structural Start and End), and optional phase and preceding-step cue display correctly.
3. Open an End note; verify an expandable note does not change route. Mandatory alert text is visible without expanding optional notes.
4. Press `Back` from End: restore the actual last visited step, preserve previous choices, and allow changed earlier decision to truncate incompatible history. Verify OS Back behaves consistently.
5. Reach End, close/reopen the PWA offline, select Page 02 `Resume`, and confirm Page 04 reappears with the same pinned revision, terminal text and path. Visiting Map does not delete it.
6. `Restart` opens confirmation; Cancel preserves End. Confirm restarts exactly the pinned revision, resets saved path atomically and returns to Page 03.
7. `Return to Library` deletes only this run and returns to unchanged Page 01; subsequently entering Page 02 shows Start instead of Resume for this mode, while any independent Draft Preview session remains.
8. Simulate IndexedDB save/delete failure, malformed imported End text, 320px width, large text, long multilingual messages, keyboard, screen reader and offline operation. No fabricated success or lost state.

**Page 04 status:** FROZEN in its v1.2 UI, terminal types, and button behavior by explicit user approval on 2026-10-26. Pages 00-03 remain frozen without any UI changes.

### Page 05 — Flowchart Map (`/#/procedure/:id/map`) — **GRAPHICAL + LIST MODES FROZEN (v1.5)**

**Purpose:** Allow the nurse to understand the entire authored branching process, inspect any step or decision outcome, and visually locate the current run position. This is a **read-only reference screen**, not a second guided-run interface and not a graphical editor. The approved Pages 02, 03 and 04 retain their own buttons and state.

#### Entry points and graph revision

| Entry | Graph displayed | Initial focus | Return target |
|---|---|---|---|
| Page 02 `View Map` with Ready-only or Ready + Draft | Immutable **Ready** revision selected by frozen Page 02 | Fit whole graph | Page 02 Details; preserve scroll/favorite/filters |
| Page 02 `View Map` with Draft only | Current working Draft, clearly marked `DRAFT` | Fit whole graph | Page 02 Details |
| Page 03 header `Map` | **Pinned immutable snapshot** from current active Ready run or Draft Preview | Center and highlight **current** node at useful zoom | **Exact same Page 03 step**; do not change session |
| Page 04 header `Map` | Same pinned snapshot of the at-End session | Center and highlight current **terminal End node** | Exact same Page 04 End state |

Never substitute a newly edited Ready or Draft graph for the pinned run snapshot. The map route may identify the procedure/context, but must **not** put selected choices, step text or active path information in URL parameters. Reloading the Map in run context restores the correct view from IndexedDB. Author-created procedure wording comes from the pinned snapshot and never changes merely because the global interface language changes.

#### Mobile composition (space-efficient)

1. **Compact fixed header (~48 px):** `Back` on left, one-line ellipsized procedure title, `List` control on right. In List mode the same right control says `Map`. `Back` is context-sensitive: it returns to Details, the exact guided step, or the terminal End screen. It **does not** mean step-back or change the selected branch. Accessible label should specify `Back to step`, `Back to End`, or `Back to details`.
2. **Draft indicator only when relevant:** `DRAFT` for an unready working copy opened from Details; `DRAFT PREVIEW` for a running preview. Keep it visible as in frozen Pages 03/04; never imply that a Draft is Ready.
3. **Canvas:** Fill the rest of the safe viewport with a pannable, zoomable graph; no paragraph, legend card, second title, bottom tab bar, or vertical help panel. Long graphs can extend beyond all viewport edges. All authored nodes and branches remain available by pan/zoom or List mode.
4. **Map navigation controls:** Small floating controls near the lower edge, outside the node hit targets as far as possible: `Fit`, `Current` (only when an active/at-End run exists), `−`, `+`. Each action has at least a **48 x 48 CSS px** touch target even if the drawn icon is smaller. Do not add an always-on minimap at phone widths. Desktop/tablet may place the same toolbar at an edge with more space.
5. **Current-step cue:** In run context, the focused token node has an obvious **Current** indicator or terminal label plus a strong outline. The actually visited route is highlighted; when parallel branches are active, pending tokens are labeled Pending but never as selected exclusive edges. Do not add the Page 03 full step card, duplicate previous-step strip, or speculative next-action cue to the map.
6. **Optional node detail sheet:** Tapping one node opens a phone bottom sheet (anchored popover beside node on roomy desktop). This sheet overlays the canvas and has its own scroll. The map retains its viewport behind it. It has a visible `Close` control; swiping it away is optional, never the sole way to close.

**Initial zoom rule:** Details → Fit; run/End → Current. `Fit` may shrink a very large chart too much for text; that is acceptable as a structural overview because zoom and List expose complete text. Never shrink the underlying CSS font used in a node-detail sheet or List mode. Keep critical warning text readable on opening details; color-only encoding is prohibited.

#### Graph visuals and semantics

- **Direction:** Top to bottom by default, with visible directional arrows. Edges with decision outcomes have short authored labels (`Yes`, `No`, etc.) directly on the corresponding branch. On tight zoom, individual labels may be shortened visually; the full labels remain in the node detail sheet and List mode. Never combine two distinct branch names into an ambiguous unlabeled line.
- **Nodes:** Visually differentiate `Start`, `Instruction`, `Decision`, `Alert`, `End` using shape/icon plus text. A Decision may use a readable rectangular card with a branch icon rather than an unreadably small diamond; distinguish its multiple outgoing edges. End nodes show their author-selected terminal type (Neutral, Completed, Escalation, Stopped) by icon and label, not inferred success. Alert nodes retain conspicuous warning semantics, not optional hidden text.
- **Phase/macro-category:** Display the user-authored phase as small node metadata or subtle visual grouping where space permits. Do not confuse a procedure phase with the separate Library group or labels. Phase names are localized procedure content, not UI-controlled categories.
- **Visited route in a run:** Highlight only nodes actually visited and edges actually traversed, including exactly the chosen outgoing branch at a decision. The **current** node stands out more strongly than history. Nonvisited possibilities remain visible in a quieter neutral style. On revisiting an earlier decision, derive highlights from the **saved current path/cursor**; never show abandoned downstream choices as visited.
- **Details mode:** No current run indicator or visited path if opened from Page 02 outside a run. The graph is neutral, with any currently selected inspection node outlined distinctly from a run's Current node.
- **Notes:** A small note affordance on a node may signal supplemental text, but notes **must** be accessible through the detail sheet/List. Decision option notes belong to **edges**, not destination nodes. Important always-visible warnings appear prominently when inspecting a node; do not require opening an optional note to discover a safety-critical alert.
- **Pan/zoom:** One-finger drag to pan; two-finger pinch to zoom where supported; pointer wheel/trackpad and buttons for desktop. Dragging never changes the location of a graph node or edits its coordinates. Use a sensible bounded zoom scale, preserve graph readability, and support reduced motion. Provide keyboard-usable zoom and list-based inspection.
- **Graph merges:** If two exclusive decision branches join the same later node, show one shared node with multiple incoming arrows (a **merge/OR join**). Arriving along either valid selected path is sufficient. Map visuals never imply that mutually exclusive decisions have both been selected or combined into a single run.
- **Complex graph presentation:** Linear sequences, exclusive divergence, and reconvergence form a directed acyclic graph (DAG) and are supported by the current conceptual model. The graph viewer must not rely on strict tree-only layout. A proposed explicit **Fork-All/Join-All (AND)** pair would represent genuinely parallel required branches; showing two independent-looking arrows does **not** make the runtime execute both. The AND model remains proposed pending run-engine UX approval. Cycles/loops are outside the current MVP graph validator (D-13).

#### Node detail bottom sheet (read only)

Visible information, in order:

1. **Type + phase** (e.g., `Decision · Preparation`) and full authored step title/text, never truncated. For End, show the exact author-defined terminal type, heading/message and any required action. For Alert, essential warnings remain visible.
2. **Step note**, if present. Respect `always-visible` versus `expandable`; expandable notes use their own clearly labeled control. Display the exact authored content in the pinned revision; global interface-language settings affect only application chrome.
3. **Outgoing paths:** If this node is a Decision, list each authored outcome with its **full** label and linked destination name. For Fork-All, list every required branch destination and its current status; for Join-All, show the paired fork and required/arrived counts without allowing completion from the inspector. Each option can have a separate `info` control to read the **edge-specific** note without selecting that branch. Instruction nodes can show a short `Next: ...` reference. End nodes have no outgoing path. These lines are informational, **never route selection buttons**.
4. **Close** button: dismiss sheet, restore focus to the inspected node/list row, and leave map pan/zoom unchanged.

No `Go to this step`, `Select this branch`, `Continue`, `Edit`, `Delete`, or `Finish` control exists in this read-only sheet. The Map cannot be used to bypass authored decisions or navigate directly into a future run step.

#### List View (same Page 05) — **FROZEN v1.4**

**Identity:** A tree-*like* expandable outline of a **directed acyclic graph**, not a literal parent/child tree. The List gives a compact readable representation of the **whole** procedure, including linear segments, mutually exclusive decisions, converging paths, and explicitly authored Fork-All/Join-All parallel branches. List is read-only even during an active run.

**Layout and navigation (frozen):**

1. **Header:** compact `Back` + truncated procedure title + `Map` (switch view). No duplicate bottom navigation, marketing text or always-visible help. `Back` returns to the Page 02/03/04 entry context without changing run state.
2. **Scrollable outline:** one full-height vertical list under the header. Render each canonical node **once**, in stable topological order. List scrolls; avoid horizontal scrolling to read text. The initial expanded/collapsed state prioritizes seeing major decision/fork structure without hiding essential alerts from inspection. Phase (macro-category) appears as compact row metadata, not a rearranged hierarchy that breaks execution order.
3. **Row format:** small node-type icon, complete accessible node title (visual line-clamp allowed if inspector exposes all), optional phase, and `Current`/`Visited` state in run context. One visual node row has a minimum 48 CSS px touch target. The node inspector shows complete authored text and localized notes.
4. **Branch disclosure:** a small disclosure button (`⌄`/`›`) expands or collapses **outgoing relationships**, not a duplicate copy of every downstream node. Outcome subrows display the exact edge label (`Yes`, `No`, etc.), an arrow/reference to the destination, and an independent info button only when an authored option note exists. Keep indentation shallow (up to two readable levels); use guide lines and labels for deeper branch depth instead of consuming phone width.
5. **Shared destinations/convergence:** When paths lead to one downstream node, each branch subrow points to the **same canonical destination** (e.g. `↪ Final review · S05`). The destination node itself appears **once** elsewhere in topological order. Tapping its reference scrolls to and focuses that canonical row within List; it never navigates the active run to that step or activates the branch. `S05`-style reference markers are visual navigation IDs stable inside an immutable graph revision and are distinct from Page 03 dynamic step counts.
6. **Parallel structure (approved):** Explicit Fork-All/Join-All nodes render a branch group labeled **All branches required** and a synchronization row labeled **Wait for all**. In an active run the list displays counts such as `1/2 completed`, derived only from persisted branch token states. It never infers that an ordinary divergent decision requires all destinations. Inspection remains read-only and branch focus is controlled only in Page 03.
7. **Current/route state:** In run context, show the actual current/terminal node and visited path using icon/text plus restrained color, with `Jump to Current`/location action scrolling/focusing that canonical row. A node reached by an abandoned branch is not Visited. For parallel runs, show pending branches without confusing them with one selected exclusive decision. No Current control appears in Details context.
8. **Inspector:** tapping the **main area** of a node row opens the same read-only node information sheet as the graphical Map, including full step text, phase, step note, exact outcomes, destination references, individual outcome notes and terminal type. Tapping a disclosure chevron **only** toggles expansion. Tapping an outcome-note info button **only** reveals that note, and a destination link **only** focuses the canonical row.
9. **Return and state:** `Map` switches to the graphical canvas without changing run state; returning to List may preserve transient expand/collapse and scroll state for this visit. Closing/returning from Page 05 retains the frozen Page 03 or Page 04 step and its IndexedDB snapshot exactly. List inspect/expand/focus must not write to the ActiveRun.
10. **Accessibility/offline/performance:** keyboard and screen-reader semantics for disclosure controls and references; >=48 px actionable targets; show full content in inspector even at 200% text scale; no branch information conveyed by color alone. Render large graphs efficiently using a flattened virtualized outline when needed. List must operate offline without loading React Flow or any remote asset, and be available if the graphical renderer fails.

**List-specific button contract (frozen):**

| Control | Exact effect |
|---|---|
| Header `Back` | Return to initiating Details / exact Guided step / exact End; no run mutation |
| Header `Map` | Switch back to graphical view; no graph or run changes |
| Disclosure chevron | Expand/collapse this node's visible outgoing relationships; no run change |
| Main node row | Open read-only inspector for this node, without executing it |
| Branch destination (`↪`) | Scroll/focus the one canonical destination node in List; no branch selection |
| Outcome-note `info` | Expand only this specific edge note; no branch choice |
| Inspector `Close` | Close inspector, focus originating row/reference, preserve List scroll position |
| `Jump to Current` | In saved-run context only, scroll/focus actual current node; no navigation of the run |

**Miniature example of List topology (illustrative, not clinical content):**

```text
START
01 Check equipment                        [Preparation]
02 Materials available?                   [Decision]  v
   ├─ Yes  -> S03 Continue preparation
   └─ No   -> S04 Resolve missing items
03 Continue preparation
04 Resolve missing items
05 Final review                           [Shared: from S03, S04]
06 Parallel requirements                   [FORK ALL; all required]
   ├─ A -> S07 Document equipment
   └─ B -> S08 Verify supplies
07 Document equipment
08 Verify supplies
09 Join all required branches              [JOIN ALL; gated]
10 END
```

In a production outline, subrows are compact clickable references, not repeated copies of downstream nodes. Shared nodes, fork/join markers and full content must remain accessible. Parallel Fork-All/Join-All nodes are first-release functionality and must pass the strict pairing, reachability and join-gating validator before a graph can be marked Ready.

**Freeze scope:** The **List and graphical Map** layouts, inspection interactions and strict read-only behavior are frozen. AND-parallel execution capability is confirmed, while the new Page 03 branch-switching accessory is the only related visual control awaiting approval. The already-frozen core Page 03 step/card/navigation layout remains unchanged.

#### Button-level contract

| Control | Exact behavior | Error/safety constraint |
|---|---|---|
| Header `Back` | Return to exact initiating page/context (Details / Guided / End) | Do not call Page 03 step Back or delete session; restore original screen focus where possible |
| Header `List` / `Map` | Toggle outline ↔ graphical map | No graph or run mutation; allow List if graph renderer fails |
| `Fit` | Fit all authored nodes in available viewport with modest padding | No data writes; if graph empty/corrupt, show error, not a fake successful map |
| `Current` | Center the actual currently active or terminal node at readable zoom | Only when opened in run context; never invent a Current node when opened from Details |
| `−` / `+` | Zoom one bounded increment out / in | Disabled appropriately at limits; preserve pan focal point when possible |
| Pan / pinch / wheel | Navigate viewport only | Never move authored nodes, choose branches or accidentally invoke browser history navigation |
| Node tap / keyboard select | Open read-only node detail sheet | Does not change visited history, cursor, choice, Ready revision or draft |
| Detail `Step Note` | Expand/collapse this node's note | Distinct from outcome notes; mandatory warning never hidden |
| Detail edge `info` | Expand/collapse this specific outcome's authored note | Info target separate from any preview text; no branch selection |
| Detail `Close` | Close inspector and return focus to node | Keep current map viewport and underlying run unchanged |
| List disclosure / node row / destination ref | Expand relationships / inspect read-only details / focus canonical destination respectively | Never execute a branch, change current step, or duplicate shared nodes |
| Browser/system Back | Mirror header Back, or first close an open sheet if consistent with browser history | Must not step the run backward, clear the run or trigger Page 04 handoff |

#### Empty, invalid, responsive, and offline states

- **Graph unavailable:** If procedure/revision was removed or local data cannot be read, show `Unable to open map` with `Back` and `Retry`, plus recovery/export option when applicable. Never silently switch to a different procedure or revision.
- **Invalid Draft:** Read-only map still displays valid available nodes and flags broken or missing edges as `Unlinked`, without following them; never invent a destination. Graph validation/release occurs in Pages 07–09, not here.
- **Insufficient display space:** Keep full-height canvas and controls touchable at 320 CSS px; phase labels may compact visually, but full instructions, notes, option labels and accessible text remain in the sheet/List. Account for safe-area insets and the on-screen keyboard when accessibility uses text search elsewhere.
- **Large graph:** Render efficiently; lazily load the graphical renderer only when this view is selected (or already needed by Builder); use revision-level saved coordinates when present and a **deterministic local layout** when missing. Avoid heavy graph-layout work on Library boot or when advancing Page 03. Fit is an overview, not a promise that 200 nodes will all be legible simultaneously.
- **Offline:** All map positions, labels, phases, notes, and session route highlighting are obtained from already-local data; no external tiles, graph layout services, fonts, analytics or API calls. Inspecting the map triggers no persistence write to the active run.
- **Accessibility:** Every map action needs visible focus and accessible name; list/inspector fully operable at large text, keyboard and screen reader; every node/edge status expressed without relying on color alone. Graph manipulation gestures are optional, not a prerequisite to reading instructions.

#### Map layout metadata (implementation proposal, not a frozen Builder contract)

Store optional visual positions **per immutable graph revision**, independent of run choices, for consistent views in Pages 05 and 07. If positions are absent (legacy import), compute a stable top-to-bottom layout locally; do not mutate a pinned run snapshot just to store viewer coordinates. Proposed `Revision` extension:

```ts
layout?: {
  direction: 'TB';
  nodePositions: Record<string, { x: number; y: number }>;
  layoutVersion: number;
};
```

Coordinates are UI metadata only and should travel with the author-created procedure on export/import. Editing coordinates is a Builder concern (Page 07); Page 05 can never save position edits. The underlying node/edge IDs and branch semantics are unchanged by zoom, layout, or position.

#### Page 05 acceptance tests (List and Map frozen)

1. Details Ready, Draft-only and Ready+Draft entry each render the exact Page 02-selected revision. Map has no Start/Continue/Edit actions.
2. During a branched run, show the actual traversed route and **current** node. Select an alternative earlier outcome in Page 03 and verify abandoned edges disappear when opening Map again. Merging branches display one shared target, not combined history.
3. Open Map from End, verify the author-defined terminal type is shown, then Back and confirm the same Page 04 pinned session. Open from Page 03, Back and confirm unchanged current node/path and no extra `lastAccessedAt` update from map inspection.
4. Tap an Instruction, Decision, Alert and End; inspect complete authored text and phase; toggle step notes and independent per-outcome notes. Merely opening an outcome note must never choose an edge.
5. Test Fit, Current, +, −, pan, pinch and viewport preservation when opening/closing the node sheet; inspect nodes near all graph boundaries and at both zoom extremes.
6. Switch Map ↔ List with a long branching graph and shared downstream nodes; verify deterministic order and explicit branch destinations. Keyboard and screen reader can read every instruction, label and note without gestures.
7. Run on 320px width and at 200% text scale, including long Italian/English text, large diagrams, draft marker and terminal messages; no hidden controls or unreachable content.
8. Reload Map offline during a saved run, verify pinned snapshot route and focus; simulate failed/corrupt rendering and missing edges; offer List/Back without route changes. Confirm no network or IndexedDB run writes from inspection.

**Page 05 status:** GRAPHICAL MAP + LIST BOTH FROZEN (confirmed v1.5). AND-parallel runtime is confirmed for initial release; Page 03 branch-switcher UI is a separate pending review. Pages 00–04 remain frozen.

### Page 06 — New Procedure (`/#/new`) — **FROZEN v1.7 (approved 2026-10-27)**

**Purpose:** Create a locally stored personal procedure Draft and enter the Builder in the fewest steps. No Language field and no choice of graph topology: the UI language is an app-level setting configured in Page 00 and Settings, and a single graph can mix linear, OR, convergent, and AND-fork/join structures.

#### Compact mobile layout (FROZEN)

1. **Header:** Back `‹` + `New procedure`; no duplicate Cancel at the bottom.
2. **Procedure name (required)**: one full-width required input, no prefilled sample or extra descriptive text.
3. **Group:** full-width compact chooser displaying existing group or `Ungrouped` (default). Picker rows: `Ungrouped`, groups in user order, `+ New group`. Creation uses Page 01's one-field group dialog, without leaving New Procedure; newly created group is automatically selected.
4. **Labels:** one inline chip-entry/suggestions field, optional, with `+ Add label`; avoid a separate selection screen for ordinary labels.
5. **More details** (collapsed by default): color and bundled symbol, priority 0/! /!!, search aliases, optional description. Existing defaults require no action.
6. **Create draft:** one full-width >=52px primary action; saves procedure ID, metadata, initial Start node and empty Draft in a single IndexedDB transaction then opens Page 07 Builder.

**Approved wireframe:** `‹ New procedure`; `Procedure name* [________________]`; `Group [Ungrouped ▾]`; `Labels [ + Add label ]`; `More details  ›`; `[ Create draft ]`. Language belongs only in first launch and Settings, not next to Group.

#### Button-level contract

| Control | Behavior | Edge cases |
|---|---|---|
| Back / browser Back | Return to Library | If unsaved inputs exist, confirm `Discard draft details?` / `Keep editing` / `Discard` |
| Procedure name | Edit required title | Trim, reject empty and whitespace-only; max 120 characters; identical names allowed with distinct UUIDs |
| Group | Open group picker | `Ungrouped` default, locally stored user groups, single selection only |
| `+ New group` in picker | Open same single-field create group modal as Page 01 | Validates name; on success select newly created group and return to form without losing other inputs; failure retains form |
| Labels / `+ Add label` | Add, suggest, remove tags as compact chips | Normalize for matching, keep author display casing, no duplicate tags |
| More details | Expand/collapse optional metadata | Never creates procedure record merely by opening |
| Ribbon color / icon | Choose from local accessible presets | Both are presentation-only metadata |
| Priority 0 / ! / !! | Set organizational priority | 0 default; never a clinical danger/acuity classification |
| Search aliases / Description | Enter optional author-provided values | Stored locally, plain-text sanitized for output |
| Create draft | Atomically save then open Builder | Disabled for invalid title/while writing; on IndexedDB failure keep input and offer Retry |

**Acceptance:** Title, Group, and Labels are the only always-visible form fields. Creating a group while the form is partly filled does not lose inputs or create a procedure prematurely. Back from an edited form confirms discard. Creation and group picker work offline. Group assignment uses stable IDs. No language dropdown, graph-type chooser, or unnecessary explanatory paragraph is displayed.

### Page 07 — Flowchart Builder (`/#/build/:id`) — **REVISED PROPOSAL v2.2; NOT FROZEN**

**Purpose:** Design the actual flowchart topology using a phone-first structured Outline editor or a synchronized Graph Canvas editor. Page 06 owns procedure metadata; Page 07 owns placement and links; Page 08 owns a step's exact content, notes, phase and dual-media configuration; Page 09 checks completeness and marks a user-reviewed revision Ready. Page 05 remains strictly read-only and is NOT the editor.

#### 07.0 Human-centered terminology and interaction contract (**FROZEN v2.4**; Page 07 as a whole NOT FROZEN)

**Core rule:** An author chooses a meaningful operation, not a Boolean operator. `OR`, `AND`, `Fork`, `Join` and `Parallel` are technical-only aliases; they do not appear as everyday node or menu names. In English use the exact authoring names `Make a decision` and `Multitask activities`. In Italian use `Prendi una decisione` and `Attività multitasking`.

| Concept | Picker label (EN / IT) | Graph / Outline label (EN / IT) | Runtime result | Internal technical representation |
|---|---|---|---|---|
| Evaluate one outcome | `Make a decision` / `Prendi una decisione` | `Decision` / `Decisione`, with question and individual outcome arrows | Exactly one authored outcome is selected and its associated path followed | `kind=decision`, `executionMode=choose_one`, independent stable outcome edge IDs |
| Required independent activities | `Multitask activities` / `Attività multitasking` | `Multitask activities` / `Attività multitasking`, with author-given title and number of activities | **Every activity is required**; each can be paused and resumed in arbitrary order; the common continuation unlocks only when all complete | `kind=task_set`, `executionMode=complete_all`, activity-specific progress, internal implicit completion gate |
| Shared next step | Contextual `Continue at existing step…` / `Go to existing step…` | Multiple paths pointing to one canonical step | Shared continuation never causes other decision outcomes to execute | Shared canonical node ID; no duplicated node |

**User-facing insertion picker (English):**

```
Add to procedure
  [Instruction]             Perform one action, then continue
  [Make a decision]          Ask a question; follow one outcome
  [Multitask activities]     Complete every activity; any order
  [Alert]                   Show a critical instruction
  [End]                     Finish this route
```

Subtitles appear in the *insertion picker only*, where the distinction matters. Routine screens have the existing frozen compact density.

**Decision example:**

```
Decision: Is the equipment ready?
  Yes                 -> Continue preparation
  No                  -> Resolve missing items
  Cannot determine    -> Escalation route
  [+ Outcome]
```

Each outcome has exactly one explicitly authored immediate destination. Convergence later is independent: selecting one route never executes another. Changing one outcome link does not change any other outcome link. An impact preview is proposed for Page 07 when changing an already-used destination; the entire Builder remains under review.

**Multitask activities example:**

```
Multitask activities: Prepare equipment
3 required activities
  1. Inspect equipment       [Edit]
  2. Gather materials        [Edit]
  3. Record checks           [Edit]
  [+ Add activity]
Then: Final review
```

Each activity may contain multiple ordered steps and decisions. The nurse may switch between them; each maintains its own saved progress. The task-set node does not expose a visible JOIN / ALL complete label or require manual wiring of arm endings. The internal completion gate still exists to enforce the rule that **all three are required**. For large sets, the proposed focused Graph View shows up to three readable adjacent activities, `Browse activities`, and a single `Then` continuation; numerical maximum is still undecided.

**Approved terminology adaptation to the frozen Page 03 parallel UX (copy only):**

- Existing tappable selector: `Switch activity` / `Cambia attività`, with current activity name and completion count such as `1 of 3 complete`.
- Existing passive narrow vertical badge: `Activity 2/3` / `Attività 2/3` (compact `A 2/3` only where necessary; screen reader announces full label). The badge remains NONINTERACTIVE.
- Existing switcher sheet: `Activities in progress` / `Attività in corso`; individual statuses Not started / In progress / Done; confirmation action `Reopen activity` / `Riapri attività`.
- Current STEP counter, macro-category, previous-step cue, independent persistent activity progress, notes/media, invalidation of dependent progress, and all existing confirmations remain exactly as approved.

**Page 05 read-only Map / List naming:** Show `Decision` and authored outcomes or `Multitask activities` and named required activities. Shared nodes are represented once; no visible join controls or Boolean jargon. This is a naming update, not a change to frozen Map/List interactions.

**Modeling safeguard:** A `Multitask activities` group is appropriate only for *required and genuinely order-independent* activities. If B needs A first, place them sequentially or make B follow A inside one activity. Validation checks graph integrity, not clinical correctness.

**Acceptance examples:**

1. `Decision` → select No: Yes is not traversed. A later shared Final review is still executed only once.
2. `Multitask activities` with three activities: start one, switch to another, resume previous, complete all three; Final review remains inaccessible until all three finish.
3. Graph/Outline: decision uses outcome-labeled arrows; Multitask activities appears as a visual group with a single `Then` continuation and no manual join.
4. At 32 activities on a narrow test phone, use readable focused cards and `Browse activities`, not 32 tiny side-by-side columns. This is a **stress test**, not a frozen cap.
5. Italian and English catalogs contain the exact frozen authoring labels. Switching the global UI language updates interface terminology without changing authored flowchart text or data semantics.

#### 07.1 Page layout and responsive behavior (proposal)

- **Header (single row):** Back `‹`, truncated procedure title, contextual `···`. `Draft` is a short status near the title, not an explanatory banner. Successful autosave is silent; failed persistence is visibly actionable.
- **Mode toolbar:** `Outline | Graph` segmented toggle; `Undo` and `Redo` compact 48px accessible icon buttons; no duplicated bottom navigation. Retain last editor mode for this device, but **Outline is the initial default on phones**.
- **Editing region:** Uses all remaining height; Outline vertically scrolls; Graph has pan/zoom canvas. One editor selection at a time; both views operate on one canonical graph revision.
- **Compact action bar:** `Preview` and `Check` as one 48px+ row at the bottom while authoring; `Preview` opens the frozen Page 03 renderer in clearly labeled `DRAFT PREVIEW` mode; `Check` opens Page 09. These are editing actions, not a general bottom navigation system.
- **No permanent global `+ Add step`** for nonempty graphs. Addition always appears at the specific empty branch, explicit connection, or first-step placeholder; prevents accidental disconnected/orphaned nodes. `···` contains `Manage phases`, `Auto layout`, `Edit procedure details`, and `Export draft`.
- On tablets/desktops, Graph may use a side inspector for selected nodes. On phones, selections open a compact bottom action sheet. The same actions are always possible in Outline. No required line-drag gestures or hover-only controls.

#### 07.2 Outline editor (canonical revised v2.2 proposal)

Outline and Graph edit a single directed graph. In Outline, each Decision outcome is one author-named **outcome-to-first-step link**, not a separate simultaneous activity. Render all named outcomes and their immediate destinations. For example:

```text
02  Materials available?  [OR · choose one]
    ├ Yes → 03 Continue preparation
    │          └ Next → 05 Final review
    └ No  → 04 Resolve missing items
               └ Next → 05 Final review

05  Final review  [shared, one canonical node]
```

At runtime, the nurse executes exactly one of Yes or No, then reaches `Final review`. A shared next step is neither a mandatory join nor evidence that both paths were executed. If multiple outcomes directly target the same next step and have no differing content/notes, show an optional nonblocking `Same destination for multiple outcomes` authoring suggestion, not a graph error.

- **Empty outcome:** `+ Create next step` / `Go to existing step…`. The latter assigns that outcome's *immediate* destination only.
- **Already linked outcome:** display current immediate destination; tapping the link reveals `View step`, `Insert before`, `Change first step…` (advanced), `Disconnect`.
- **Path ending at an ordinary step:** `+ Create next step` / `Continue at existing step…`. This is the preferred way to merge *after* the branch's unique instructions have finished.
- **Shared target:** render once in canonical outline and make references scroll to it. Do not copy shared instructions or silently combine branch histories.
- The user creates labels and notes in Page 08, while Page 07 maintains explicit topology and link targets. There is no implicit ELSE, no auto-selection, and no invented nursing content.

#### 07.3 Graph Canvas visual model (revised v2.2 proposal)

Graph view is a pan/zoom **editor**, distinct from frozen Page 05's read-only map. Nodes are compact cards, with labelled outcome connection chips and arrow lines. Tap targets are large even when graph labels are short. A selected outcome opens a bottom sheet on phones (side inspector on larger screens). The user never needs to draw a connector with a finger.

**Correct OR example:**

```text
                 [Materials available? · OR]
                     /                \
                  Yes                  No
                   v                    v
        [Continue preparation]     [Resolve missing items]
                   \                    /
                    v                  v
                         [Final review]
                              v
                            [End]
```

The two outgoing arrows are **mutually exclusive alternatives**, not the two required arms of an AND block. The shared Final review node exists once in the database. Path selection happens only on Page 03; Page 07 edits the graph structure.

**Tap outcomes and existing links:**

| Target tapped | Page 07 sheet | Graph operation |
|---|---|---|
| OR outcome without target (`No +`) | `Create next step` / `Go to existing step…` | Assign `No.targetNodeId` atomically |
| OR outcome with existing target (`No → Resolve…`) | `View step` / `Insert before` / `Change first step…` / `Disconnect` | Read or explicitly rewrite this outcome's immediate first link |
| Last step of No route (`Resolve missing → Next`) | `Create next step` / `Continue at existing step…` | Add an ordinary step successor or link it to the shared Final review |
| Specific connection arrow | `Insert step here` / `Change connection` / `Disconnect` | Rewire only that selected edge, not other inbound links to a shared node |
| Shared Final review card | `Edit` / `Show incoming paths` | Editing canonical node content affects every route that legitimately reaches it; editing one inbound edge does not |

**Important edit-impact example:** With `No → Resolve missing → Final review` and `Yes → Continue preparation → Final review`, changing **No's first destination** to the existing `Final review` produces `No → Final review`. Yes remains exactly `Yes → Continue preparation → Final review`. `Resolve missing` is not deleted, but if nothing references it, it becomes unreachable and Check flags it. This is not the correct action if the author intended to preserve the No-path work and merge *after* it; in that case, edit `Resolve missing`'s Next outlet.

**Confirmation preview for a changed assigned outcome** shows:

```text
Outcome edited:    No
Before:            No -> Resolve missing -> Final review
After:             No -> Final review
Unchanged:         Yes -> Continue preparation -> Final review
Other effect:      Resolve missing may become unreachable (not deleted)
[ Cancel ]                                   [ Apply change ]
```

Every operation is validated against cycles, invalid nested/parallel crossings and unreachable nodes. Unreachable nodes are warnings/specific Check issues, not automatic deletions. Illegal structural crossings cannot be committed as Ready. Large preview diagrams may be collapsed, but summary of exact before/after links and unaffected outcomes must always be visible when replacing an assigned outcome.

Graph toolbar: select node, pan empty canvas, pinch/plus/minus zoom, Fit, focus selection, Auto-layout, and switch Outline/Graph. Drag-to-connect may be an optional desktop shortcut, never mandatory on phone. A user may select a connection line directly or its labelled outcome/Next handle. Accessibility equivalents remain in Outline.

#### 07.4 OR, AND, and shared-node semantics (revised v2.2 proposal)

| Construct | Page 03 execution | Page 07 visual semantics |
|---|---|---|
| **OR** | Select **one** authored outcome and follow its route. Other alternatives are not executed | Each named outcome has an independently assigned immediate destination |
| **AND** | Complete **every** required arm; branch focus can be switched without losing others' progress | A parallel region contains N named arms and one single `Next after all arms` outlet |
| **Convergence** | Reach shared downstream step from whichever path actually led there | Several inbound edges reference one canonical node; does not imply AND |
| **Nested OR in AND** | One outcome chosen within each required arm; all arms still need to finish | Each arm can contain its own exclusive decisions; all paths in an arm must reach its internal completion point |

One conceptual difference: if two OR outcomes point directly to the identical step with no intervening action, the decision may be structurally redundant, although the selected outcome may still be useful for notes/tracking. Do not auto-delete or fold such decisions.

#### 07.5 AND construction and implicit join, with many arms (revised v2.2 proposal)

**Approved principle:** The author creates a `Parallel · All required` region and names the required arms. Its `Next after all arms` continuation is a single editable destination. Every completed arm reaches an internally synthesized gate, but users never add, select, connect, or configure a Join-All node. Crucially, the Graph Builder **does not render** a decorative `ALL complete` / `Automatic · Not editable` chip or label. Draw the arm lines directly towards the single after-all continuation.

```text
            [Parallel · All required]
                /               \
    [Equipment checks]     [Documentation]
                \               /
                 [Final review]
                 (Next after all)
```

This layout describes AND semantics **because the parent block is marked All required**, not because edges converge. Each required arm has an implicit completion point; if its last ordinary node has no next step, it completes the arm automatically. If an OR sits inside an arm, every outcome must explicitly lead to another local step or `Complete this arm` when valid. A premature global End in an outstanding AND scope is invalid unless a separately designed abort action is introduced. Properly nested parallel blocks are supported; cross-arm shortcuts and cycles are invalid.

**Many-arm responsive authoring design:** No maximum AND-arm count has yet been approved. Use **32 required arms as a UX stress test, not as an agreed schema limit**. Do not shrink cards or font sizes to fit all arms. In focused Graph mode, draw at most two or three neighbouring arm lanes at readable widths. The region header shows `Parallel · 32 required arms`; `Browse arms` opens a searchable, scrollable list to jump directly to any arm. The selected arm can be edited normally; `Next/Previous arm` is optional on desktop. A Fit/overview mode shows the whole structure at small scale for orientation, not for text editing. Grouped/condensed arms and the Outline remain available for large procedures. Never present the three visible arms as the only three required arms; state `3 shown of 32` clearly.

At a chosen configured maximum (still TBD), `Add arm` becomes disabled with `Limit reached`; editing, reordering, renaming and removing existing arms remain available. Max limits for OR outcome count and AND required-arm count need their own subsequent product decision, rather than assuming the previous provisional five-outcome OR example or repurposing the unrelated image cap of 32.

**Validation:** Every required arm must be reachable, contain at least one valid authored action or other approved arm content, and finish at its internally matched completion gate. The after-all continuation is available once, after all arms have completed. Reopening a completed arm invalidates dependent progress in accordance with the frozen Page 03 controls.

#### 07.6 Updated interactive UX study (proposal)

`nurseflow-page07-graph-prototype-v2.2.html` is a local, self-contained HTML illustration, not production code. It has two modes: OR with two independent selectable outcomes and impact preview when No's first destination changes; and AND with 2, 5, 12 or 32 required-arm stress cases and an arm browser. The diagram deliberately distinguishes OR branch selection from shared-node convergence, and no visual Join-All chip is shown in AND. Prototype counts do not establish a hard arm cap.

#### 07.7 Editing controls and protection (revised v2.2 proposal)

| Control | Behavior | Guardrails |
|---|---|---|
| Back | Save successfully, then return to Details | On failure, Retry/Recovery, never falsely mark saved |
| Outline / Graph | Switch the same editable graph representation | Cannot change node/edge semantics |
| Undo / Redo | Revert/reapply committed graph edits | Stable IDs, local autosave; at least 30 undo steps in open session target |
| Create next step | Create new node at selected outlet | The selected edge/outcome only, atomic operation |
| Go to existing step… | Point one **empty OR outcome** to an eligible existing node | Show current outcome name; reject illegal crossings/cycles |
| Continue at existing step… | Link last step's normal Next outlet to a shared node | Preserves all earlier work in that branch |
| Change first step… | Replace an **assigned OR outcome's immediate first target** | Before/after preview, unaffected routes, unreachable warnings; explicit confirmation |
| Insert step here | Splice only the chosen edge | Do not change sibling outcomes or another inbound edge to a shared node |
| Disconnect | Remove selected single edge | Do not delete downstream content; Check identifies dangling edge and possible orphan |
| Edit node | Open Page 08 for content/phase/media | Node type/notes distinct from connections |
| Parallel region | Add/rename/reorder/remove arms, edit each arm, choose Next after all | No manual Join-All or explanatory gate chip; confirm destructive scope changes |
| Browse arms | Search and focus an arm without hiding others from the graph model | Legible even at 32 arms; visible count always grounded |
| Fit / Focus / Auto-layout | Adjust canvas viewport/positions | No graph logic change; full overview available |
| Preview / Check | Draft simulation and structural validation | Do not mark Ready on missing links, invalid AND arm scope or unresolved end |

#### 07.8 Draft/Ready, storage, and acceptance checks (proposal)

- Editing a Ready procedure creates a new working Draft; Ready and currently active runs retain pinned immutable revision/asset references. No Builder operation changes the live Ready revision until Page 09 marks a replacement Ready.
- Every successful graph transaction writes locally to IndexedDB and only then updates the screen as saved. Display no permanent `Saved` toast. On write failure, preserve in-memory edits for retry/recovery and show an actionable failure cue; never mark Ready on unsaved state.
- Draft can temporarily contain empty edges, unlabeled options and incomplete parallel arms; paired internal gates are generated automatically. These appear as concrete `Missing destination` or `Incomplete branch` placeholders, not silently linked End nodes. Check flags all incomplete paths.
- Always retain one canonical node record per ID. Shared-node edits and inserts/deletes are undoable and affect only explicitly described edges. Removing the only incoming edge flags an unreachable node for author attention; does not automatically delete it.
- Local embedded media and remote URLs are only authored on Page 08; Builder Outline shows at most a media count/indicator, keeping the tree compact. Phase names are author-written and shown as small metadata. Page 03's two-gallery component is reused by Page 08 live preview, not reimplemented in Builder.

**Acceptance scenarios:**

1. Empty START → `+ First step` → Instruction → OR with two explicit outcomes → End on each path; Undo and Redo preserve all IDs and references.
2. Two OR alternatives target one shared step; Outline renders it once, Graph shows two inbound edges; editing shared text changes both routes while changing an inbound edge affects only that route.
3. Create AND with three arms, author steps in each, observe direct convergence lines into the next-after-all destination without any visible `ALL complete` gate or manual Join wiring; test branch order and nested AND.
4. Attempt illegal cycle or cross-arm shortcut; destination selection rejects illegal edges. Delete or corrupt an internal paired gate in an imported test graph; validation identifies the error and does not silently guess a join.
5. Select an edge into a shared node and insert an Instruction; only that edge is spliced, other inbound edges remain unchanged.
6. Disconnect / delete a shared node with two incoming paths; first show scope and affected edges, then verify Cancel is nondestructive and confirmed changes are undoable.
7. Switch Outline ⇄ Graph, zoom, auto-layout, change phase, reopen offline, then confirm graph topology, current draft and embedded media references are unchanged.
8. Preview an incomplete draft and confirm a clear dead-end warning, never an implicit outcome; Check deep-links to broken graph items and marks Ready only once structurally valid and personally reviewed.
9. Test 320px screen, 200% text scale, keyboard-only, screen reader and reduced-motion; every graph-edit task remains doable without canvas dragging or hover.
10. Simulate IndexedDB write failure mid-insert; no false `Saved` state, no partial node/edge transaction, and explicit retry/recovery path.
11. With Yes → Continue → Final and No → Resolve → Final, change **No first step** to Final. Confirm Yes unchanged, No bypasses Resolve, old Resolve remains present, unreachable warning appears, and explicit Cancel/Apply works.
12. From the No-path final authored step, use **Continue at existing step** to converge onto a canonical Final node. Confirm No-specific work remains in the path and shared Final is stored only once.
13. Stress-test an AND region with 2, 5, 12, and 32 required arms: focus up to 3 readable lanes, browse/search every arm, preserve the count and each stable arm ID, and verify no manual join gate or explanatory `ALL complete` badge is displayed. The 32-arm test does not establish a hard product limit.

**Page 07 review questions for freeze (v2.2):** (a) Is the revised explicit distinction between outcome first destination vs branch-end convergence clear? (b) Does Change first step impact preview adequately protect against accidentally bypassing work? (c) Does focused 2–3 arm authoring with Browse all and Fit/overview remain usable for 32 arms? (d) Decide numerical maximum later. Page 07 remains NOT FROZEN.

#### 07.9 Page 07 complete authoring UX — **v2.5 freeze candidate; NOT YET APPROVED**

**Boundary of this proposal.** The two terminology labels and runtime meanings from v2.4 are already frozen. This section proposes the remaining Graph/Outline controls and numerical bounds. It does not reopen Pages 00–06 or the approved media/branch controls of Page 03/Page 08.

##### 07.9.1 Default phone canvas and screen geometry

1. **Header (44–48 px):** `‹`, one-line procedure name, compact `Draft`, `···`. Back saves pending transactions or reports a save error. The menu holds `Manage phases`, `Auto-layout`, `Edit details`, `Export draft`. No mandatory Save button.
2. **Mode toolbar:** `Outline | Graph` segmented control followed by Undo and Redo buttons, 44–48 px targets. Outline is the default the first time Page 07 is opened on a phone; mode is remembered on the device thereafter. On wide screens Graph may be the preferred default after the user switches.
3. **Editing region:** Fills all remaining vertical space between toolbar and action bar. In Outline, this is a vertically scrolling graph-aware outline with canonical shared-node references. In Graph, it is a pan/zoom canvas with legible nodes and short outcome chips. Selection opens a bottom sheet on a narrow phone; the same content uses a right inspector on desktop/tablet. Only one thing is selected at a time: a node, an outcome, or a particular edge.
4. **Bottom action bar:** Two buttons, `Preview` and `Check`, each >=48 px. Preview uses frozen Page 03 Draft Preview, never Ready. Check opens Page 09; graph mistakes can link back to their exact node/edge.
5. **Density:** No tutorial text, decorative instructions, permanent mini-map or third navigation bar. Show full node titles inside inspector/Page 08, even if graph cards use an ellipsis. A contextual selection bar/sheet is not a persistent toolbar.

##### 07.9.2 Selection is explicit: node vs outcome vs edge

| Tap/click target | What selects | Phone bottom-sheet actions | Scope |
|---|---|---|---|
| Card body, except outcome chips | Exactly that node | `Edit step` (Page 08), `Insert after` where meaningful, `Duplicate`, `Delete…`; special types have `Edit outcomes` or `Edit activities` | Node contents and explicitly chosen attached connections |
| Decision's labeled outcome chip (e.g. `No →`) | One authored outcome ID | **Empty:** `Create next step`, `Go to existing step…`; **linked:** `View first step`, `Insert before`, `Change first step…`, `Disconnect…` | Only that outcome's immediate edge; other outcomes remain unchanged |
| Line between nodes | One specific edge ID | `Insert step here`, `Change connection…`, `Disconnect…` | One connection even if destination has multiple inbound lines |
| Multitask activity card | One activity within one task-set | `Edit activity`, `Add step`, `Move up`, `Move down`, `Remove activity…` | Selected activity scope; no cross-activity shortcuts |
| Multitask group header | Parent group | `Rename`, `Add activity`, `Browse activities`, `Set next after activities` | Group settings and single shared continuation |
| Empty continuation (`+`) | Exact open outlet | `Create next step`, `Go to existing step…` or `Finish activity` when valid | No global disconnected insertion |
| Empty canvas | Nothing | Dismiss selection; drag canvas to pan | Viewport only |

**Editing a connection is never phrased as editing the outcome itself.** `Go to existing step…` means route this particular open outcome to a stored, canonical step. At the end of an existing route use `Continue at existing step…` rather than changing an earlier decision's initial destination. The destination picker shows `Selecting destination for: Decision “Materials available?” / Outcome “No”` and searchable eligible nodes; illegal cycles, parallel-scope escapes, and otherwise invalid targets cannot be selected. A target used by another path is marked `Shared step`, not copied.

**Changing an assigned destination** shows `Before / After / Unchanged` with exact step names and a nonblocking `Unreachable step` warning if applicable. Buttons: `Cancel` and `Apply change`. No node is automatically deleted, modified, or copied. `Insert before` inserts on the chosen edge only; other inbound edges to the same destination remain intact.

##### 07.9.3 Graph view visual details

- **Decision:** question card with one labeled, separately tappable chip per outcome. Every chip shows its immediate destination or `+` when open. On zoomed-out canvases, use numbered chips with full labels available in the inspector/list. Outcome lines are directionally clear and anchored to stable outcome IDs.
- **Multitask activities:** one visual region/card containing the group title, required activity count and named activities. Activities are not decision outcomes. The user does not have to configure an internal join or see a `Join-All`, `ALL complete`, or `Automatic · Not editable` label. Each activity follows its own authored steps. One `Then: [next step]` continuation appears beneath the region.
- **Shared destination:** one canonical node with multiple distinct, directional arrows entering it. Show no `Shared following step`/`Shared destination` explanatory label between routes and node: the geometry of the inbound connections communicates convergence. Do not duplicate the content node for each branch. The inspector can still describe node identity when selected.
- **Large graphs:** auto-layout top to bottom, stable authored positions when available; zoom with `+`, `−`, `Fit`, `Center selection`, and a `Layout` action. Zooming never changes graph logic; optional desktop connector dragging is not required for any task. Graph renderer is lazy-loaded only on Graph/Map use so Library and Guided performance targets remain intact.
- **Long titles/labels:** short visual truncation is permitted within the canvas; full author text is always available in selection sheet and Outline. Branch labels must remain distinguishable; no merged unlabeled edges when zoomed close enough for editing.

##### 07.9.4 Large Decision and Multitask groups; numerical limits under review

**Proposed per-node limits for freeze:** `Decision` has 2–32 distinct authored outcomes when Ready; `Multitask activities` has 2–32 independently required activities when Ready. Drafts may temporarily have fewer or unlinked items, but Check blocks Ready until valid. The upper bound 32 is **not approved yet**; it is offered to reconcile usability, graph layout and predictable import validation. Earlier provisional 2–5 outcomes in historical text are superseded as a v2.5 *proposal only*.

- With small groups, Graph draws as many items as fit at readable width; on a narrow phone this is usually no more than 2–3. Never squeeze below a readable/tappable minimum.
- At **8 or more** outcomes/activities, or earlier whenever the viewport cannot fit them legibly, Graph changes to compact grouped presentation with one selected entry and at most 3 adjacent activity lanes (when screen width allows). Header shows actual total and focused index, e.g., `Activity 18 of 32` / `3 shown of 32`, never pretending hidden items do not exist.
- `Browse outcomes` and `Browse activities` open a searchable, scrollable bottom sheet showing all items with number, full label, and a short status. Choosing one focuses its slot/arm in Graph without changing other items or execution semantics.
- Outline retains a compact, expandable list for all items, without a 32-column graph. Both views offer accessible Move Up / Move Down, Rename/Edit, Add and Remove actions; drag is optional.
- If 32 becomes the approved cap, the Add button is disabled at 32 with concise `Maximum 32 reached`; previously existing items remain editable/reorderable/removable; duplicate/invalid import is rejected safely. If a larger technical limit is chosen later, the focus behavior remains the same. No artificial group split is required merely because a phone cannot show everything at once.
- There is no user-visible internal AND completion-gate card; the common following step appears once. Completing only some activities cannot reach it.

##### 07.9.5 Workflow creation examples

**Create a decision:** Tap `+` at a specific open outlet → `Make a decision` → Page 08 question + two default empty outcome entries → return to Outline/Graph → tap Yes chip → Create next step → Instruction → edit it → tap No chip → Go to existing step… or Create next step. At each point the author knows exactly which outcome's first destination is being assigned.

**Rejoin after doing work:** On the last authored step of the No route, tap its `+` normal Next outlet → `Continue at existing step…` → select a shared review node. Do NOT change No's first step at the decision to achieve a downstream rejoin. Both Yes and No routes retain their own preceding work.

**Create multitask activities:** Tap `+` → `Multitask activities` → name group and add two or more required named activities. In each activity add its own sequence (optionally with decisions and nested multitask groups). Select `Then` and author/select a single continuation. The system tracks the hidden completion barrier; the user never wires every arm to a join. Parallel changes remain independent until all activities finish.

##### 07.9.6 Destructive actions, state and acceptance

- `Disconnect` affects only the selected edge; never deletes the destination. Show the actual link being disconnected before confirming, especially if already valid/Ready. Unused nodes are marked for Check and can be reconnected or deliberately deleted.
- `Delete step` shows counts of incoming and outgoing links. For a shared node, warn which routes would break; options `Cancel` / `Delete step` (no ambiguous cascade deletion). For deleting an entire group/activity, show exactly which authored content would be removed and require confirmation. After deletion, Check may show broken paths.
- `Duplicate` creates a new stable node ID. Referenced images may be shared via asset IDs with correct retention-count garbage collection; editing duplicated content never edits original node text. Connecting an existing node is explicitly **not** duplication.
- Undo/Redo reverses locally persisted graph transactions and restores stable IDs, labels and links. Save errors show Retry/Export recovery; no false successful save. A saved Ready revision and active run snapshot are never modified by Builder Draft edits.
- **Required tests:** (a) Tap node vs outcome chip vs edge and verify different sheets; (b) change No's first destination, confirm Yes unchanged and orphan warning; (c) rejoin after No-specific work, confirm both paths retain their steps; (d) with 32 activities, focus arm 27, browse/filter all 32, preserve readable cards; (e) with 32 outcomes, tap outcome 19, assign destination, verify independent outcome links; (f) nested multitask and decision inside an activity; (g) mobile 320px width at large text and keyboard-only access; (h) save failure and Undo/Redo; (i) no JOIN gate in UI; (j) Preview/Check always reflect last successfully persisted Draft graph.

**Page 07 freeze review:** Approve or revise (1) Graph/Outline screen geometry, (2) node/outcome/edge contextual sheets, (3) compact focus behavior from eight or more entries, and (4) proposed 32-per-Decision and 32-per-Multitask-group limits. Entire Page 07 remains **NOT FROZEN** until explicitly approved.

### 07.10 Page 07 — convergence, Copy/Cut/Paste, Undo/Redo (v2.6 revision; THE CONTROL CONTRACT IS PROPOSED)

**What is approved now:** The Graph View has no `Shared following step` label; it shows actual convergence via distinct incoming arrows into the same node. The Builder must provide Copy, Cut, Paste, Undo and Redo. The exact operational details below are the current design proposal, pending the overall Page 07 freeze.

#### 07.10.1 Visual connection requirements

- **Decision** nodes retain one labeled outlet per possible outcome, each with its own stable edge ID. Edges are not merged to a single line before reaching a shared downstream node if that would obscure which distinct path leads where.
- If two routes rejoin a downstream node, draw **two distinct arrowheads at the node's incoming side**, with sensible spacing and no text inserted at the junction. The node appears **once**, not duplicated.
- No `Shared following step`, `Merge`, `Join-All`, `Automatic` or `ALL complete` explanatory text is added to the graph canvas. The Multitask activities' internal completion barrier remains implicit as already frozen; this change is visual, not executable semantics.
- At low zoom, bundles may be rendered compactly, but selecting a path shows its exact incoming/outgoing edge; use List/Outline for textual access to every route. Arrows must be distinct from any non-interactive decorative line.
- The Graph must not imply that both Decision outcomes are visited merely because their arrows converge: only the chosen outcome executes. No change to frozen Page 03.

#### 07.10.2 Toolbar hierarchy

| Situation | Visible buttons | Rationale |
|---|---|---|
| Nothing selected | `Outline/Graph`, `Undo`, `Redo`; bottom `Preview`, `Check` | Clean permanent UI; Undo/Redo are disabled when history is empty |
| Step/activity selected | Contextual `Edit`, `Copy`, `Cut`, `More` | Clipboard scope is immediately clear; no duplicate main toolbar |
| Open continuation or exact edge selected, clipboard contains graph content | `Paste here` in the target sheet/selection bar | No ambiguous paste to the global canvas |
| Clipboard empty or destination invalid | `Paste here` disabled or absent with concise reason | Prevent illegal graph connections and cycles |
| Desktop keyboard | Ctrl/Cmd+C, Ctrl/Cmd+X, Ctrl/Cmd+V, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z (also Ctrl+Y where customary) | Shortcuts apply only when canvas/Outline selection is focused; never intercept normal text input undo/copy/paste |

All touch actions target >=44 CSS px, ideally 48 px on phone. Screen-reader names expose exact scope, e.g. `Copy step: Resolve missing items` and `Paste between Continue preparation and Final review`.

#### 07.10.3 Copy vs link; copying a group

- **Copy:** Store a structured, local-only internal graph-clipboard payload. It includes authored text, decision outcomes, notes, phases, references to local media, gallery settings, and, when copying a self-contained group, edges **internal to that group**. It does not include unrelated incoming edges or automatically connect copied content to another route.
- **Paste:** Create **new stable node and edge IDs** for copies. The original and pasted content can then be edited independently. For referenced local media, retain Blob asset references safely (reference-count or equivalent); do not duplicate bytes unnecessarily. Validation checks destination scope and phase associations. All clipboard content remains on-device.
- **Go to existing step:** Does **not** copy; it creates a new connection to an already stored, canonical node ID. Label this differently from Paste in all editors.
- **Single-node Copy:** Copy its content and authored outcome labels/notes; external outgoing links are not silently inherited. Pasted Decision outcomes must receive valid destinations before Ready; a plain Instruction pasted on an existing connection inherits that connection's next step through scoped insertion.
- **Whole activity / self-contained selection:** Copy the contained graph with internal connections and nested phases. Where outside references exist, show a boundary preview and mark external outlets unresolved rather than duplicating unrelated external nodes. An arbitrary disjoint or non-self-contained multi-selection can be restricted with an actionable explanation for the first implementation.
- **Across procedures on the same device:** Local internal clipboard can transfer copied content between Drafts; imported IDs are regenerated, local media asset references retained, missing phase definitions remapped or created explicitly. Cut/move is limited to its original Draft to avoid accidental deletion across procedures; offer Copy instead.

#### 07.10.4 Cut as a safe pending move

1. Select a step or activity and press **Cut**. A small `Move pending` indicator appears; the original graph remains intact while a destination is chosen. The user can `Cancel move` at any time.
2. Select an exact outlet or connection and press **Paste here**. The UI previews **Before / After** and highlights every edge that would change, plus any routes that would become incomplete/unreachable. Other Decision outcomes are named as unaffected when applicable.
3. `Move here` validates the proposed topology (no cycle, invalid task-scope crossing, dangling required outcome or unexpected shared-node damage). On confirmation the source removal and destination insertion commit **atomically as one undoable graph change**. If the change would leave the Draft incomplete, make this explicit; do not silently repair/rewire unrelated branches.
4. If the source node has multiple incoming links, `Cut` first shows an impact sheet naming the affected routes; never silently move a shared canonical step. The author may choose a more narrowly scoped route edit instead or cancel. External inbound edges cannot be reassigned without an explicit mapping.
5. Closing the app before commit cancels the pending move, leaving the saved Draft unchanged. This protects the valid Ready revision and persistent Guided sessions.

#### 07.10.5 Paste insertion and structural transactions

- **Paste into existing edge `A → B`:** Insert the new step on that specific connection only, yielding `A → [new] → B` for a simple single-exit Instruction. If B has another inbound edge from C, `C → B` is unchanged. For Decision/Multitask group pasted content, destination mapping may require explicit choices or leave outcomes unconnected as a Draft.
- **Paste into open outlet:** Attach the pasted entry to that outlet, leaving its exit unconnected until authored. Do not infer a next step.
- **Paste into a path that has several inbound/outbound links:** Preview exactly which selected edge or outlet is replaced; no global reroute. Invalid cycles and cross-activity links are rejected before commit.
- **Copy** is not a graph mutation and does not consume an Undo entry. **Cut pending** is not a graph mutation; **Cut + confirmed Paste** is one Undo transaction. **Paste copied content**, deletion, reconnection, text edits and graph layout edits create graph history entries (with appropriate coalescing for repeated drag/typing actions).
- `Undo` restores the previous persisted graph state including node/edge IDs, positions, media references, outcome labels and connection topology. `Redo` reapplies it. A new committed graph edit after Undo clears its redo branch. History belongs to Draft edits and does not alter already Ready revisions or immutable active runs.
- Persist recent Undo/Redo history locally where practical; minimum target **30 graph transactions per Draft** (unchanged from earlier proposal), with explicit recovery after storage errors. Never display a successful-save indication before the database transaction completes.

#### 07.10.6 Acceptance tests added

1. **Convergence visual:** Two outcomes route via distinct paths to a single review node. The graph draws two separate directed inbound edges, no `Shared following step` text, and selecting either edge shows its distinct origin and destination.
2. **Copy step:** Copy an Instruction from Yes and paste into one selected connection on No. New stable node ID; Yes text/edges unchanged; Undo removes duplicate, Redo restores it.
3. **Copy vs existing reference:** Paste creates a new independently editable node. `Go to existing step` instead connects the selected outcome to the existing node without copying it.
4. **Cut and move:** Cut a nonshared node; cancel pending move, confirm nothing changed. Cut again and paste elsewhere: one atomic Undo restores original source and destination.
5. **Shared-node guard:** Cut a node with two inbound edges; show impacted routes, prohibit silent severing; no deletion on cancellation.
6. **Invalid target:** Attempt Paste that forms a cycle or crosses a forbidden Multitask boundary; block with concise reason; Draft remains unchanged.
7. **History:** Undo/Redo working across Outline/Graph switching, after local autosave and after deliberate reload (where persisted history is supported). Native text-input shortcuts continue to work normally.
8. **Large group:** Copy/paste an individual activity out of a 32-item stress-test group without the canvas shrinking, losing focus, or copying another activity by mistake.
9. **Clipboard safety:** Offline editing works without OS clipboard permissions. The internal copy buffer never uploads local graph data or media.

**Freeze status after v2.6:** The convergence visual requirement and availability of five editing operations are **approved**. The exact pending-Cut and graph clipboard contracts, the rest of the Page 07 layout, and numerical limits of Decision outcomes and Multitask activities remain **open for review**.

### 07.11 Page 07 — **FINAL FREEZE v2.7 (2026-10-28)**

**Page 07 is APPROVED/FROZEN in full.** The Outline editor is the default mobile editing surface and Graph is the synchronized pan/zoom visual editor. The number of Ready-valid Decision outcomes and Multitask activities is **2–32 per construct**. The focused 2–3-lane presentation, searchable full list and automatic layout handle dense graphs; large groups are not squeezed into unreadable cards.

- **Decisions:** Every labeled outcome has its own explicit next-step link and follows exactly one route; `Create next step`, `Go to existing step…`, `Change first step…`, `Continue at existing step…`, and `Insert step here` are location-specific actions. A change to No does not secretly rewrite Yes. Preview affected edges and newly unreachable content before committing. Shared steps retain one canonical ID.
- **Multitask activities:** All activities are required, independently paused/resumed, and order-independent; the derived internal completion gate is implicit. No visible Join-All or completion-badge node is authored. All activity arrows converge directly on the following node; if multiple arrows coincide at narrow zoom, allow focus/highlight instead of drawing a fake connector circle.
- **No intermediate `+` at convergence:** When two or more edges meet, their arrowheads terminate on the target node itself. Do **not** render the circular Plus between branches and the next step. Add-step controls appear only at an actual open continuation or on an explicitly selected edge for insertion.
- **Clipboard:** Copy makes new IDs upon Paste (with safe shared-asset references); `Go to existing step…` links instead. Cut creates a safe **pending** move, never deletes first. Paste to an exact destination opens a scope/impact preview and then commits atomically; Cancel leaves graph unchanged. Undo/Redo are visible in the main toolbar and persist with the working Draft as specified in 07.10. Native text input clipboard/undo is not overridden.
- **Complete toolset:** Both views support node/outcome/edge selection, contextual edits, add/insert/change/disconnect, focus and Browse activities, auto-layout, graph/outline switching, Preview, Check, and phase management. Draft incomplete edges remain allowed until Page 09 validation; no guessed clinical content.

**Page 07 is no longer a freeze candidate.** Older paragraphs below/above calling it proposed or using a visible `+` at convergence belong to historical design iterations and are superseded by this section.

### Page 08 — Step Editor (`/#/build/:id/step/:nodeId`) — **FULL-PAGE FROZEN v2.9 (approved 2026-10-28)**

**Purpose:** Edit the *content* of one authored node, not its position in the flowchart. Page 07 remains the principal topology editor; Page 08 may call the same **scoped destination picker** for a particular outcome or step continuation without introducing a second graph-linking model. All edits are to the working Draft only. No procedure-level Language field appears.

#### 08.1 Screen structure and visual hierarchy

**Phone layout (single scroll region):**

1. Compact top bar: `Step editor` + node's short name/number; `Preview` and `Done` actions. No bottom tab bar and no permanent instructional paragraphs.
2. Small **step type** indicator (`Instruction`, `Decision`, `Alert`, `End`) and the **Phase** dropdown. Dangerous `Change type…` lives in an overflow action rather than an easy-to-mis-tap segmented switch.
3. **Content section** (expanded): required short title/question, and optional or required body/description as dictated by type. Always display essential authored warning text by default.
4. **Outcomes section** only for a Decision: collapsed or scrolling list of labeled outcomes, read-only Path summary, and optional per-outcome note badge. `Arrange` changes answer display order only; `Add outcome` is visible until 32 outcomes. Empty destinations are explicitly `Not connected` rather than guessed.
5. **Step note section** with multiline input and `Expandable` / `Always visible` control. A critical warning cannot be placed only behind a collapsed note.
6. **Media section** with a count and the two frozen independent `Before step note` / `After step note` galleries. Image source and presentation editing are identical to the previously frozen controls, not redefined here. Empty sections collapse and do not reserve consultation space.
7. Phone `Preview` opens an on-demand full-width simulation using the **same rendering component as Page 03** and immediately reflects typed text, note behavior, gallery placement/layout and decision outcomes. On larger screens the preview may be a right-hand sticky pane. Preview cannot advance any real run.

**Top action hierarchy:** `Preview` is secondary, `Done` is primary. The browser/OS Back action is intercepted only to wait for pending writes or show a save-failure state; it is not a second prominent app-specific toolbar action. `Done` returns to the exact selected step in Page 07 once the latest IndexedDB commit succeeds. While the editor has invalid/incomplete Draft fields, `Done` still permits leaving; Page 09 blocks Ready as needed. There is no extra explicit Save button because the Draft is autosaved.

#### 08.2 Shared fields and actions

| Control | Behavior | Special condition |
|---|---|---|
| Step type indicator | Displays current node kind | `Change type…` resides in `···` and previews lost/replaced outcomes or connections before change |
| Phase | Select existing phase / None, or `+ New phase` | Inline new-phase sheet preserves the current editor state; phases are procedure-local (not Library groups) |
| Title / Question | Localized UI label; author text saved verbatim | Required for Ready; multiline questions show fully in Page 03 |
| Body / Instruction | Multiline plain text, line breaks retained | Avoid a rich HTML editor and remote dependencies in MVP |
| Step note | Optional rich-in-meaning plain text and visibility switch | `Always visible` for essential information; notes never replace an Alert |
| Media | Dual independent galleries + real-time preview | Existing FROZEN behavior, combined 32-image schema max and global configurable add-limit |
| `···` | Change type, Duplicate, Delete step | Duplicating is a graph action (Page 07 clipboard); Delete shows affected connections, cancels safely |
| Preview | Shows local draft step/step mode in Page 03 renderer | No persistent active run created or changed |
| Done | Await writes, return to Page 07 at same selection | Save failure prevents false success; retry/export options where possible |

**Autosave:** Debounce text entry; each durable edit records a coherent Draft transaction. `Done` awaits pending writes. Changing type/outcomes/destinations/moving media uses atomic structured transactions, compatible with Page 07 Undo/Redo history. The editor never changes the immutable Ready revision or a pinned Guided session. On storage quota/errors show a compact explicit error with Retry, keep unsaved in-memory text available, and allow an export/recovery route where feasible.

#### 08.3 Node-specific content panels

| Type | Main content fields | Outgoing behavior |
|---|---|---|
| Instruction | Short title + instruction text; Step note; Phase; Media | Read-only `Next: [destination]` row; tap to invoke **Page 07's scoped continuation editor**; no duplicate connection engine |
| Decision | Question; optional context; Step note; Phase; Media; Outcomes | Each authored outcome has Label, optional Outcome note, and a read-only Path summary with a graph-based Change path action; one selection follows one path |
| Alert | Alert title, **always visible warning**, optional additional text and note; Phase; Media | Optional next-step destination via same scoped picker; warnings are never behind a disclosure |
| End | Outcome type (`Completed`, `Escalation`, `Stopped`, `Neutral`), authored terminal title/body, optional note, Phase | No next step; Page 04's already-frozen terminal presentation is used. **End-node media display is not silently added to frozen Page 04**; proposing it would require separate Page 04 review |
| Start / derived multitask gate | No editable clinical content in Step Editor | Managed structurally by Page 07; hidden gates not exposed as Step Editor nodes |

Multitask activities are constructed and named in Page 07; each *actual step inside an activity* uses the ordinary Page 08 editor. A user does not have to edit a technical fork or join node. Context at top may show `Activity 2 of 3 · Equipment` to clarify what is being edited.

#### 08.4 Decision outcome rows (phone-first)

- **Collapsed row:** leading ordinal; full or wrapped label; short destination name or `Not connected`; small note indicator if note exists; trailing edit chevron. Minimum 48 px touch target. Each outcome remains a distinct stable record/edge and may share a destination with another outcome.
- **Tap row:** opens a small **Outcome editor** sheet containing only `Answer/outcome name`, `Outcome note`, and a read-only `Path: [destination]` with `Change path` / `Set path`. There is NO destination dropdown. It is never a clinical branch-selection tap while building.
- **Path action:** Opens the existing Page 07 exact-outlet/edge graph picker, focused on that decision outcome. The author **taps a target node on the actual graph** (pan/zoom; optional find-on-graph search) or chooses `Create next step` for automatic connection. Show current path and Before/After summary; confirm changes atomically. Changing No leaves Yes untouched. Do not force selection from a hundreds-row dropdown or duplicate an existing node.
- **Add outcome:** Appends a blank outcome slot; it does **not** invent Yes/No or a branch target. Draft permits empty labels and destinations; Check blocks Ready until there are 2–32 nonblank explicit outcomes. (A brand-new Decision created in Page 07 may initially have two empty slots as the frozen Builder specifies.)
- **Reorder:** One `Arrange` action on the **Outcomes section**, not inside the individual Outcome Editor. In the Arrange sheet show answer labels with accessible Move earlier / Move later controls (and optional drag handles). This changes only the visual button/branch order, while preserving **stable outcome IDs, notes, and destinations**. It does not move any graph steps or Multitask activities. Never swap a Yes branch's target onto No.
- **Remove outcome:** Confirm affected label/edge. Disconnect its single outgoing edge; do not automatically delete a potentially shared downstream step. The action is one Undo transaction.
- **Large list:** At 8+ outcomes use compact rows and an optional filter/search within the outcomes section; up to the frozen 32 limit without vertically stacking 32 expanded note forms. An active Outcome sheet edits one outcome at a time.


#### 08.4a Graph-target picking UX for long procedures (v2.8; proposed)

1. From `Decision > Outcome No`, display `Path: Resolve missing items` and `Change path`. Save authored name/note edits before switching modes.
2. Open the **Page 07 Graph canvas in Choose-destination mode**, with the current outcome and its outgoing edge highlighted, other routes subdued, and a compact header `Path for: No`. Target nodes are tapped directly; dragging a line is not required.
3. For a large graph, the author can pan/zoom, `Fit`, focus the current outcome, or use an optional `Find on graph` field. Matching nodes are highlighted and centered; the result is still selected on the graph, not from a mandatory giant dropdown. An accessible Outline jump-to-node option is a fallback for assistive technology.
4. Tapping a valid target selects but does not commit. A small preview shows `No: Resolve missing items -> Final review` and `Yes: Continue preparation (unchanged)`. Unreachable-node warnings are shown, and incompatible cycles/crossings are blocked.
5. Confirm saves a single undoable edge change and returns to the Outcome Editor or Step Editor; Cancel returns with the original connection intact. No downstream node is automatically deleted.
6. `Create next step` creates a fresh node on **this exact outcome** and opens Page 08 to edit its content; the linkage is automatic.
7. To connect **after** `Resolve missing items`, the user selects that step's **own outgoing continuation** in Page 07; changing No's initial destination would bypass the step.
8. In an Instruction/Alert editor the read-only continuation is labeled `Continues to: [destination]`; changing it uses the same scoped Graph canvas. Reorder actions for Multitask activities remain exclusively in Page 07, not Page 08.

#### 08.5 Step note and its position relative to media

The frozen consultation render order is **Instruction/question → Before-note gallery (if present) → Step note row/content (if authored) → After-note gallery (if present) → Decision outcomes or Continue**. Author may use both galleries in the same step; they are not an either/or choice. `Expandable` and `Always visible` govern only optional step-note content; any critical warning must be visible regardless. Individual **Decision outcome notes** stay attached to their specific outcome and are shown via a separate info control in Page 03, not merged with the step note or image section.

#### 08.6 Media editing and full-page preview

All Page 08 media behaviors in the frozen v1.9/v2.0 media section below remain in force, including `Add photo`/`Add URL` per section, image compression Small/Medium/High/Original (Medium default 1280 px width and target ~150–300 KB where practical), media reorder/replace/remove/move, linked GIF fallback, captions/alt text, and per-gallery Stacked/Side by side/Full width plus Compact/Medium/Large/Natural presentation. Global soft Add limit (default On=2, disablable) applies across the two sections; hard schema cap is 32 combined. Changing the limit never hides or removes existing media.

**Preview contract:** Single shared, production Page 03 rendering component with `preview=true`; in Editor it replaces run controls with non-operating visual counterparts, including the branch selector if appropriate, to avoid inadvertently navigating a saved run. Media remote failures use `Media unavailable` without preventing content editing. Per-option notes and the note disclosure can be checked in Preview without triggering a choice. Do not display placeholders for absent gallery sections.

#### 08.7 Navigation and localization

- `Done` persists to local Draft and returns to Page 07's selected node in Outline or Graph, preserving scroll/focus and viewport where possible. Re-entering Page 08 returns to the last expanded authoring section for that node if useful.
- UI language follows **global Settings**; node title, instruction, note, option wording, image captions and phase names are user-authored content and are **not automatically translated**.
- Screen-reader labels distinguish `Edit outcome No`, `Edit note for outcome No`, and `Change next step for outcome No`. Do not require dragging or color recognition; >=48 px mobile targets. Real Step Editor preview reflects the current chosen large-text preference.

#### 08.8 Full-page freeze (v2.9)

**APPROVED AND FROZEN:** The complete Page 08 Step Editor follows the revised v2.8 behavior: outcomes have **Answer**, **Outcome note**, and **Path** summary; `Change path` opens Page 07's focused graph target picker (no list of hundreds of steps), and `Arrange answers` changes only their display order. Step content, phase, note visibility, two media galleries, real-time consultation preview, change-type impact safety, and Done/autosave are approved as described. Do not interpret earlier proposed labels in historical sections as unfrozen requirements.

#### 08.9 Acceptance tests (proposed)

1. Edit an Instruction's title/body, create a procedure-local phase, add a step note and leave via `Done`; reopen with all text, phase and visibility intact. No duplicate explicit Save button is present.
2. In Decision, edit the No label and its own note, change No's target from Resolve missing items to Final review; Yes remains unchanged, no shared step copied, and impact preview marks any bypassed step as unreachable without deleting it.
3. Reorder decision outcomes and confirm their IDs, notes and edges remain associated with the right label. Undo/Redo in Page 07 reverses and reapplies the transaction.
4. Decision with 32 outcomes remains navigable on a 390 px phone; Add is disabled with a concise reason; returning to Outline/Graph retains focus.
5. Add two images Before note and two After note with the global add-limit temporarily disabled, use different gallery layouts, update the live Page 03 renderer without Save, move one image across slots without duplicating bytes. Re-enable limit On=2; all four remain visible/editable, Add disabled.
6. Compress a phone photo with Medium preset and inspect actual resulting dimensions/bytes before commit. Test linked GIF offline/404 fallback while authored decision choices remain usable.
7. Change Step type from Decision to Instruction: show a before/after summary identifying outcome edges that will be disconnected, require confirmation, and support Undo. Do not silently delete the unrelated downstream nodes.
8. End editor exposes four author-defined terminal states and never adds an unapproved Page 04 media gallery.
9. Edit in airplane mode, force-close and reopen; latest committed Draft persists, while unsaved DB errors are disclosed. Ready and active-run pinned snapshots remain unchanged.
10. Validate assistive technology labels, 200% text scaling, separate note-outcome tap targets and no accidental branch choice in Preview.

#### Page 08 dual media sections and live preview — **FROZEN 2026-10-27** (media component only)

**Step Media header:** `Media (N / 32)` with **two separate authoring sections**, `Before step note (n)` and `After step note (m)`, where `N = n + m`. Each section has `Add photo` and `Add URL` actions so the destination is explicit at creation time. Both sets of Add buttons become disabled with `Limit reached` when the configured **global soft add-limit** is enabled and `N >= limit`, or when the hard schema cap `N = 32` is reached. The two sections **share** the same 32-item total; 32 is not allowed separately in each. Editing, moving, removing, replacing, recompressing and reordering existing items remain possible when Add is disabled. If the soft limit drops below N, never hide or delete any items.

1. `Add photo` in either section: native device image selector; inspect type/size; choose Small/Medium/High/Original; show actual result dimensions/bytes and preview before saving to IndexedDB. Preserve image readability; do not store the original bytes when a compressed variant is chosen unless the user requests Original.
2. `Add URL` in either section: accept HTTPS direct image/GIF URL and optional caption/alt description; show best-effort preview, permitting explicit save even if preview fails. Never embed arbitrary HTML/iframes.
3. Media rows in each section: thumbnail or broken-link placeholder, caption, `Local` / `Linked`, byte count if local, `Replace`, `Move up`, `Move down`, `Move to Before note` / `Move to After note`, `Remove`. Moving an existing item across slots **never duplicates asset bytes and never counts as Add**, even if the step exceeds the soft limit. Its destination insertion position is deterministic (append to destination by default), and both section orders are persisted.
4. **Gallery controls per section, independently**: `Layout: Stacked / Side by side / Full width`; `Image space: Compact / Medium / Large / Natural`. Remove the former exclusive `Position: Before note / After note` control: the item belongs to one chosen section, and **both sections may be populated simultaneously**. Changes autosave to Draft presentation metadata.
5. **Live consultation preview** next to or below the controls, using the **same rendering component** as Page 03 at a selected mobile viewport width. Show actual instruction text, before gallery, step note, after gallery and outcome/Continue controls. All additions, moves, captions, reorders, gallery layouts, space presets and note expansion update in real time without a separate Save/Refresh. Desktop can offer a side pane; phone uses a collapsible Preview section/tab one tap away.
6. `Done` leaves Page 08 after autosaved changes are acknowledged. No media setting alters a published Ready revision or a pinned active run.

**Media add-limit setting (Page 10):** `Limit new media per step` [On/Off], default **On, 2**; with On, choose integer 1..32. Turning Off permits additions up to the schema cap of 32. Count images in **both** before/after sections together. Decreasing the limit affects only future Add actions, never existing items, rendering, moves between sections, earlier imports, or exports. If a step has 5 images (3 before, 2 after) and limit changes to 2, all 5 remain in place, can move between sections, and Add stays disabled until the total falls below the effective limit or the limit is raised/disabled. Show concise feedback in Settings or beside disabled Add, never tutorial copy on Page 03.

#### 07.12 / 08.10 New-step creation, early ending and unfinished routes — FROZEN v3.2

**Purpose:** Eliminate a false dependency on an existing destination step. Keep the approved Page 07 Graph/Outline and Page 08 Outcome editor: Page 08 edits content and a read-only Path summary; Page 07 creates or alters the path.

**Decision outcome — from the initial empty No/Yes outlet:**

1. The selected outlet is represented by a **real contextual `+`**, e.g. `No · +` in Graph/Outline, or `Path: Not set` > `Set path` in Page 08. This is NOT a convergence circle.
2. Tapping opens a short bottom sheet titled `What happens after "No"?` with `Create next step`, `End procedure here`, `Go to existing step`, and `Cancel / later`.
3. `Create next step` asks for Instruction, Decision, Multitask activities, Alert or End, creates a new node with a fresh ID, **links the selected outcome to it in one undoable, atomic Draft action**, then opens Page 08 for the node content. The chosen outlet alone changes; other outcomes are unaffected. If the user leaves the new step unfinished, the Draft retains it and Page 09 flags missing required content at validation.
4. `End procedure here` creates a linked End node (Completed, Stopped, Escalation, Neutral) then opens Page 08 for its required title/message. A one-tap path that deliberately terminates at Stopped is a valid, early terminal route and must NOT be classified as a dead end. Consultation transitions to frozen Page 04 when the End is reached.
5. `Go to existing step` invokes the frozen Page 07 Graph-target picking mode with pan/zoom/Find on graph; there is no mandatory list of hundreds of nodes.
6. Closing the sheet without choosing leaves `Path: Not set` as an authoring placeholder. It is allowed in an editable Draft, but a **Problem** when marking Ready (P02). Do not auto-create or guess a branch.
7. Tapping an already linked path instead offers `View step`, `Insert before`, `Change first step`, and `Disconnect` with exact scope/impact preview. Deleting/repointing an edge never automatically deletes a canonical shared node.

**Ordinary sequential Instruction/Alert outlet:** The same sheet appears at its contextual next-step `+`. Explicit End is offered. No output means an unfinished Draft, not a clinical stopping condition.

**Multitask activities — context-sensitive completion:** A newly created group contains editable activities. Each activity has its own `+ First step`/`+ Next step`; creating a step automatically links it within that activity. At a final activity outlet, offer `Add next step`, `Finish this activity`, and `Stop entire procedure` (exceptional). `Finish this activity` marks a clear terminal completion flag for **that activity only**; it does not create or display a join node and it does NOT finish the overall procedure. Once all activities are complete, the single `Next after activities` outlet offers `Create next step`, `End procedure here`, `Go to existing step`, or Leave for later, and opens only after all tasks finish. Within an activity, `Stop entire procedure` must be explicit, must select an End status of **Stopped or Escalation**, must confirm the author understands that other activities will remain incomplete, and must be represented internally as an exceptional terminate-run edge rather than ordinary successful activity completion. This early-abort exception is **USER APPROVED v3.2** and supersedes the historical proposal that any End inside an unfinished Multitask region is always invalid. No normal Completed End may bypass unfinished required activities.

**Frozen explicit completion rule v3.2:** A plain missing next target after an activity's last ordinary step is unfinished until the author chooses `Finish this activity`. The gate remains visually implicit in Graph and no `Join All`, `ALL complete`, or convergence circle is shown. This guards against accidental completion of an activity the author was still building. It amends a historical v2.2 rule that treated an unconnected last activity step as implicitly complete; it must not be implemented as approved until the user confirms.

**Graph model / invariant (proposed):** Store an outlet state that distinguishes `unassigned`, `nodeTarget`, `intentionalEnd`, `activityComplete`, `terminateProcedure`, and `brokenReference`. The latter preserves the former target ID/label if available and is a W08 warning; it is NOT an `unassigned` edge and is NOT a clinical End. Save graph edits atomically with Undo/Redo, and preserve the immutable Ready run snapshot.

**Acceptance scenarios:** (a) Start -> Decision, add Yes -> a NEW Instruction, No -> NEW Stopped End, then mark Ready once all authored content is complete; no existing node picker required. (b) Leave No unassigned, observe P02 at Check. (c) Delete/lose No's previously linked node: observe W08 and a conspicuous broken-link marker, not automatic route to End. (d) Multitask with two activities: finish each via explicit `Finish this activity`, create a NEW following step once, and verify no visible join control. (e) If the stop-entire-procedure exception is approved, author an explicit Stopped/Escalation early exit in Activity A; selecting it ends the entire run with other activities correctly marked not performed rather than incorrectly completed. (f) Back/Cut/Paste, reopening a completed activity, and editing shared destinations preserve previous frozen safety guarantees.

### Page 09 — Check & Mark Ready (`/#/build/:id/check`) — **FROZEN v3.2**

**Purpose:** Check whether a personal Draft's graph is structurally complete and offer an explicit, local `Mark Ready` transaction. A Ready procedure is user-confirmed for **personal reference** only. This is not clinical certification or an institutional approval workflow. A previously Ready revision and its active sessions remain unaffected until/unless a new revision is successfully committed.

#### 09.1 Screen layout and navigation

**Entry:** Page 07 `Check`. Run the deterministic offline validator immediately against the latest durably saved working Draft; keep revision ID and result timestamp in internal state to prevent using stale results. Leave to Page 07 via `Back to Builder`, preserving the current selection and Graph/Outline viewport. There is no new permanent bottom-navigation bar.

**Mobile content, top to bottom:**

1. Compact header: `Back to Builder`; `Check again` icon; title `Check procedure`; small procedure title and `Draft` revision context. No instructional banner or institutional approval indicator.
2. Small two-column summary: `N problems` and `M warnings`; counts re-evaluate after a fix.
3. **Problems** list (if any), above warnings. Rows contain a concise affected step/activity label, one-sentence cause and `Fix` action. Rows are never hidden solely behind a filter.
4. **Warnings** list (if any), separate, each with `Inspect`. Each warning explains the risk in context; it does not prevent marking Ready.
5. Small always-legible assurance line: `Structure checks only. Clinical correctness is not verified.` This is essential scope information rather than tutorial/marketing copy.
6. Bottom actions: `Preview draft` (secondary) and `Mark Ready` (primary). The latter is **disabled while blocking problems exist**, while a pending autosave/validation result is stale, or while the database cannot durably commit.

If there are zero problems, the Problems list compresses to `No structural problems found`; do not show a large decorative success screen. If there are no warnings, its section may be omitted. On narrow displays the content scrolls; all actions retain 48 px minimum touch targets. `Check again` must not erase uncommitted edits or alter a running procedure.

#### 09.2 Problems versus warnings — revised severity matrix v3.1 (**FROZEN v3.2**)

**Classification:** A Problem blocks `Mark Ready`; a Warning is visible but never prevents Ready. The user's approved changes move the missing-local-image case and the saved deleted-target-link case to Warnings. This deliberately permits a Ready procedure whose old link fails at runtime: the app must disclose that limitation conspicuously rather than silently treating it as an End. Any `Mark Ready` acceptance of W08 must contain the specific consequence `A path may stop if reached`. Clinical correctness is never inferred.

**Problems (must be corrected before Ready):**

| Rule | Condition | Fix target |
|---|---|---|
| P01 | Missing/duplicate Start, or no valid first assigned path | START outlet in Page 07 |
| P02 | A reachable Decision outcome is **unassigned** (author has not selected a next step or explicit End) | Exact Decision outcome `+`/Set path |
| P03 | Decision has fewer than 2 or more than 32 outcomes, unnamed/indistinguishable duplicate answer labels | Page 08 Outcomes/Arrange |
| P04 | Reachable Instruction or Alert has an unassigned continuation and is not an authored End or expressly completed activity | Exact next-step outlet |
| P05 | No authored End can be reached, or an ordinary reachable route is unassigned before End; **exclude an already flagged W08 broken historical reference from redundant P02/P04/P05 classification** | Incomplete route or End |
| P06 | Multitask has fewer than 2/more than 32 activities, an empty/unreachable required activity, or an activity without a valid completion condition | Specific activity and its outlet |
| P07 | Cross-activity jump, bypass of required tasks without a specifically authorized whole-procedure Stopped/Escalation exit, or malformed internal completion gate | Exact activity/edge |
| P08 | Cycle not supported in the initial DAG engine | Invalid connection |
| P09 | An authored non-placeholder node is unreachable from Start, even if left behind after rerouting another outcome | Highlight node for reconnect/remove |
| P10 | Required instruction/question/warning/End type, title or message is missing or malformed | Exact Page 08 field |
| P11 | Duplicate/colliding live node ID, incompatible metadata reference or unsupported enumeration, or other structural corruption **not merely an edge that points to a deleted node** | Affected record / repair |
| P12 | Invalid media schema beyond accepted missing-Blob cases: more than 32 items/step, invalid gallery slot/layout, or disallowed/unsafe URL | Exact media item |

**Warnings (do not block Ready):**

| Rule | Condition | Inspect treatment |
|---|---|---|
| W01 | Linked remote image/GIF requires internet | Aggregate by affected step |
| W02 | Remote image cannot be fetched or checked now | Show `Media unavailable`/`Not checked` |
| W03 | Large local media/storage consumption | Offer optional compression/inspection |
| W04 | Optional image accessibility description absent | Inspect media; do not flood list |
| W05 | Missing step macro-category in an otherwise phased graph | Inspect phase setting |
| W06 | Effectively identical decision outcomes including their meaning/notes, not merely shared destinations | Inspect outcomes |
| W07 | Referenced local image Blob is missing/corrupt or unreadable | Show `Image unavailable`; do not block the rest of the step |
| W08 | A saved connection targets a deleted/missing node (including preserved tombstone or imported dangling reference) | Show source/outcome and former target if known; `Path unavailable` if followed; no implicit End |

**Exact distinction:** `Not connected` is an authored-unassigned outlet and remains P02/P04. `Was linked to X, X is now missing` is a historical broken reference and is W08. The validator must not double-count the same W08 edge under P02/P04/P05. The graph displays an actual broken-destination state, not a false healthy arrow. A nurse who encounters it during Page 03 sees a non-terminal interruption with Back, Map and confirmed Exit; there is no Continue/automatic End. The current run's pinned snapshot is preserved. Repairing the Draft and publishing a new Ready revision cannot silently modify an existing run; restart with the new version is explicit.

**Intentional early stop:** A Decision outcome connected to an authored End (Stopped, Escalation, Completed, Neutral) is valid even when it terminates earlier than other outcomes. It is not an unassigned route, dead end, warning or unreachable destination. Within a Multitask activity, a whole-run early exit must explicitly declare Stopped/Escalation and the exceptional termination of other unfinished activities (proposal pending confirmation). Normal activity completion is distinct from ending the whole procedure.

**Deliberately not flagged:** Missing optional notes/photos/tags, default priority, a gallery left empty, legal shared destinations, different branch lengths, an old step with more images than the current *soft* addition limit, or a correctly modeled early terminal End. An unavailable optional image may be W07 but does not invalidate the node's authored instruction.

**Separate system error:** Failed IndexedDB write/quota or stale draft validation still disables Mark Ready independently of Problems/Warnings and must offer recovery; these are not graph defects.

#### 09.3 Fix and Inspect navigation

| Control | Exact behavior |
|---|---|
| `Back to Builder` | Return to the last Builder viewport/selected node; Draft remains intact |
| `Check again` | Recheck latest durably committed Draft offline, update issue list and totals; do not create a new revision |
| `Fix` on missing Decision path | Open Page 07 with the exact Decision outcome highlighted, ready for its approved graph-target selection workflow |
| `Fix` on empty activity | Open Page 07 with the exact activity and its `Add first step` insertion point focused |
| `Fix` on missing question or note validation | Open Page 08 at the exact field; preserve a return-to-check context |
| `Inspect` warning | Open the corresponding step/media/graph position, without marking the warning clinically resolved |
| `Preview draft` | Launch existing Draft Preview flow; never write a Ready revision, overwrite a real run, or bypass validation |
| `Mark Ready` | When 0 problems and draft has been durably saved, open confirmation (below) |

After returning from a Fix or Inspect editor, re-run checks automatically when the draft revision changed; preserve scroll/focus on the relevant issue where possible and show remaining problems. A stable issue identifier combines rule, node/edge/activity ID and location, so the user is not sent to the wrong item after reordering. The Check page can be reopened repeatedly; validation is idempotent and cannot change the graph.

#### 09.4 Mark Ready confirmation and version lifecycle

**Tap `Mark Ready` when valid -> compact confirmation sheet:**

- Title: `Mark version Ready?`
- Concise version summary: e.g. `Draft -> Ready v3` and `Previous Ready v2 stays available until the new version is saved` when editing an existing procedure.
- If warnings remain, show `N warnings remain` without forcing user to dismiss each one.
- Essential boundary: `Structure checks do not verify clinical correctness.`
- Required checkbox: `I have reviewed this procedure for my own use.`
- Buttons: `Cancel` and `Mark Ready` (disabled until checkbox checked). No account, clinical reviewer identity or cloud publication action.

**Commit:** Revalidate under the exact committed Draft revision and create the new immutable Ready snapshot plus all media references **atomically in local IndexedDB**. Mark Ready succeeds only after transaction completion. If the Draft changes between checking and commit, stop and re-run validation; never mark an older validated state by accident. On success, return to Page 02 Procedure Details for the new Ready revision; the working Draft may be cleared only once the new snapshot is safely committed. The previous Ready remains usable during editing and on failed commits; already active runs continue against their pinned older snapshot and referenced media. Garbage collection of old media is prohibited while any Ready or active-run snapshot still references them.

**Commit failures:** Keep both the working Draft and old Ready intact, retain validation context and show a compact `Couldn't mark Ready` error with Retry. When storage is full, support exporting a recovery/backup copy if local data can be read; never falsely claim success. Being online is not required.

**Ready != validation:** The `Ready` state confirms structural completeness plus a personal user acknowledgment; it is not a promise that the instructions are medically accurate, current or safe for an individual patient.

#### 09.5 Acceptance tests (pending freeze)

1. Open Check with a Decision `No` outcome lacking a destination and an empty Multitask activity: show **2 problems**, each with its exact `Fix` target; `Mark Ready` disabled; `Preview draft` available.
2. Fix only No through the Page 07 Graph target picker, return to Check: **1 problem** remains; Yes path untouched; rerun is local and deterministic.
3. Add the missing activity step and its valid required continuation: **0 problems**, new Ready action enabled. Confirm no exposed Join-All, merge pseudo-node or accidental multiple-completion route.
4. Keep a remote GIF URL that is valid but unavailable offline: show W01/W02 only; Ready remains available. A missing local Blob yields W07 with a media placeholder, not a Problem. A deleted-node target yields W08 with a broken-path indicator; if reached, the run stops on `Path unavailable` without claiming an End.
5. Tap Mark Ready with 0 problems; confirmation includes prior-Ready context, scope warning and review checkbox. Cancel preserves the Draft. Only checked confirmation commits the new Ready revision.
6. Simulate a Draft mutation after passing checks but before commit: block the publish, revalidate the new Draft, then allow confirmation only if still valid.
7. Simulate IndexedDB quota/transaction failure: no new Ready status appears; prior Ready and current Draft remain intact; provide retry/recovery path.
8. Start a Guided run on Ready v2, then commit Ready v3: the open run keeps its pinned v2 graph and media; new consultations use v3.
9. Check a nested Multitask/Decision graph with shared paths: valid DAG passes; unstructured crossing, forbidden cycles, missing arm completion and unreachable nodes fail with precise Fix targets.
10. Test language switching, keyboard/screen-reader issue links and 200% text scaling; no issue is communicated only through color or icon shape.

**v3.1 additional classification checks (FROZEN v3.2; supersedes v3.0):** (a) Repoint a Decision outcome to bypass a node; unchanged outcome remains unaffected, preview warns, final Check flags P09 until repaired. (b) Two different outcome labels both leading to the same valid node are accepted without W06, unless the authored outcomes are otherwise effectively identical. (c) A valid HTTPS URL that is offline or returns 404 yields W01/W02 only; a `javascript:` URL yields P12 while a missing local Blob yields W07. (d) An old step with five images remains valid after soft Add limit is reduced to two. (e) An ordinary Completed End reached inside an unfinished Multitask activities block cannot silently satisfy other required activities; an explicitly authored whole-procedure Stopped/Escalation exception is proposed for approval. (f) Missing optional notes, tags, group, images and one empty gallery are not warnings. (g) Simulate database write failure after zero Problems and ensure `Mark Ready` is disabled with system error not misleading new P count.

**Freeze status:** Page 09 UI, severity rules and early-stop authoring are **FROZEN on 2026-10-29**. Page 08 and all earlier approved components remain frozen.

### Page 10 — Settings (`/#/settings`) — PROPOSED v3.2 (NOT FROZEN)

**Purpose:** The compact, offline-first location for application-wide preferences and local-data controls. It is available via Page 01 `More → Settings`. Page 01's frozen compact Library layout is not modified; there is no new bottom navigation or redundant settings link on other screens. Page 06 has no per-procedure language control. User-authored step text is never automatically translated.

#### 10.1 One-screen layout (phone-first)

**Header:** `‹` (Back) and `Settings`. No tutorial paragraph and no Save button. Sections use lightweight titles and 48 px minimum-height tappable preference rows, with only the current value and a chevron. The scrollable layout is:

- **Interface:** `Language` → `English` / `Italiano`; `Text size` → `Normal` / `Large`; `Theme` → `System` / `Light` / `Dark`. All are app-global. Theme is a candidate enhancement; if dark styling is not complete, the row is omitted at ship, not a broken toggle.
- **Media:** `New image limit` → `On · 2` (or `Off`); `Photo quality` → `Medium` by default. Both are app-global *defaults for future additions*, not retrospective media mutations.
- **Local data:** `Backup & Restore` → Page 11; `Storage protection` → actual status (`Protected`, `Not granted`, or `Unavailable`) with a contextual `Request again` action only when supported/not granted; `Storage used` → approximate quantity, or `Unavailable` if the browser provides no estimate.
- **Application:** `Check for updates` → status/available-update action; optionally `Install app` only when not installed and supported; `About` → version, current network/local-storage details, and a small explanation on demand.
- **Advanced** (collapsed by default): `Reset Library layout`, `Clear local data`. Destructive controls never sit adjacent to routine toggles without separation.

No healthy-state banner, marketing copy, cloud account section, or persistent explanatory paragraph. Preserve frozen touch targets and clinical-content text sizing. Buttons and status labels must never rely on color alone.

#### 10.2 Button-by-button contracts

| Control | Tap / changed value | Persistence and edge behavior |
|---|---|---|
| Back | Return to the Library in previous scroll/filter state | No unsaved-settings prompt: preferences autosave independently; show save failure if any |
| Language | Bottom sheet: `English`, `Italiano` | Apply UI translation immediately, save `uiLocale`; do not rewrite procedure titles, authored phases, steps, notes or outcome labels; keyboard/screen reader remain usable |
| Text size | Sheet: `Normal`, `Large` | Updates application typography/line wrapping and minimum hit targets without truncating clinical instructions; respect OS scaling |
| Theme | Sheet: `System`, `Light`, `Dark` | Persist theme preference, follow OS when `System`; do not change node ribbon identity or warning semantics; row can be omitted until implemented fully |
| New image limit | Sheet: `Limit additions` On/Off and, when On, max `1..32`, default `2` | Governs **future Add** local photos and URL media per step, both before/after galleries combined. Off removes only the *soft* constraint; absolute 32 schema cap remains. Reducing below current count never hides/deletes existing media. Replacing, compressing, reordering, moving between galleries, exporting existing content remain allowed. Add is disabled if current item count >= effective limit. |
| Photo quality | Sheet: `Small`, `Medium`, `High`, `Original`; default Medium | Affects subsequent *local image imports only*. Medium starts at max 1280 px and aims for ~150–300 KB when practical; actual output depends on image legibility. Each imported photo can override preset; existing blobs and URL/GIF items are unaffected. |
| Backup & Restore | Open Page 11 | Page 11 not yet frozen; separate user-initiated export/import; no cloud data |
| Storage protection | Show actual `navigator.storage.persisted()` status; when supported and not granted, `Request` calls `navigator.storage.persist()` on explicit tap | Continue working if unsupported/denied, show actual result and ability to retry if permitted; protection does not guarantee survival of user deletion/device loss |
| Storage used | Open brief storage-details sheet when estimate available | Estimate via browser API is approximate and origin-level, not an exact IndexedDB or media-byte guarantee; unavailable state must be truthful |
| Check for updates | Check only when online and explicitly requested or when app detects an update | If update available, `Later` / `Update when idle`. Never reload an active consultation or unsaved Builder. Offline check reports unavailable, not false up-to-date status |
| Install app | Offer native install prompt when exposed; otherwise concise platform-specific install steps | Hidden when already installed; installation does not back up data |
| About | Display version and concise details only on demand | Include external URL network disclosure when relevant; remote image URLs may contact their hosts |
| Reset Library layout | Ask for confirmation, then reset sort/filter/recent-collapse/group expansion preferences only | Preserve groups, procedures, priorities, labels, recent activity records, saved sessions, and media |
| Clear local data | Open guarded flow with backup option and final destructive confirmation | Describe that Draft/Ready procedures, images, active runs, favorites/groups, settings will be deleted locally; no reversal without separately saved external backup. On success return to Page 00; on storage failure show explicit error |

**Sheet behavior:** On mobile, settings selectors open a compact bottom sheet, with one radio/segmented control and optional immediate value controls. Changes save immediately, dismiss via Back/Close; on save failure, retain or revert to last durable preference consistently and show a Retry, never a false success toast. Desktop may use anchored popovers. `New image limit` is the only preference with a toggle **and** a numerical value; support `Off` while retaining last chosen number for when re-enabled. No setting silently changes an existing procedure revision or an active-run snapshot.

#### 10.3 State, accessibility, and safety

- Read all settings from IndexedDB. Mirror UI state only after durable save when an action could affect future content; individual appearance changes may optimistically render if failure can be reverted. There is no account/cloud sync.
- Language and text-scale changes reflow every Page 03 instruction and note; `Large` cannot cause horizontal overflow or shrunk decision buttons.
- For storage, display `Protected`, `Not granted`, `Unsupported` (or `Unavailable` if detection fails), never an unsupported blanket guarantee. `Storage used` values are approximate.
- The app must not autonomously send local procedures or photos to a server. A user-opening a remote image URL can contact that third-party host; this is independent of local storage.
- Page 11 owns data-export/import and its confirmation flow. Page 10 is a navigational entry only; backup status text must not assert a file was successfully stored outside the app unless that is independently confirmed.
- Page 10 can be fully usable offline except install/update checks, remote media previews, and browser features unavailable in the environment.

#### 10.4 Acceptance tests (proposed)

1. Start in English; set Italiano, navigate to Library and Page 03, verify translated UI chrome while authored English procedure content remains unchanged. Switch back; verify persistence after reload.
2. Set Large text and device scaling; verify a 320 px phone viewport scrolls correctly with no clipped controls.
3. Create a step with five images while limit Off. Set On=2; all five persist and remain editable/exportable but Add photo/URL is unavailable. Re-enable Off; adding is permitted through 32 total, never 33.
4. Set default photo quality to Small then import one photo with per-photo High override; existing stored photos stay unchanged and all media remains local.
5. Mock browser persistence granted/denied/unsupported and quota-estimate unavailable; settings show truthful statuses with no misleading storage guarantees.
6. Follow Backup & Restore entry to Page 11 (not yet frozen); return without modifying Library position. Check updates while offline and ensure safe deferral while a pinned active run exists.
7. Reset only Library layout settings and verify all content retained. Test Clear Data final confirmation and Cancel/Export path using disposable test data; never clear live content in a prototype.

### Page 11 — Backup & Restore (`/#/data`)

**Purpose:** External backups are first-class, no-cloud UX rather than a hidden advanced menu.

**Layout:** `Backup & Restore`; compact last exported timestamp (`Never` if none); `Export All` primary; `Export One`; `Import Backup`. Exports also include user-created groups, memberships, tags/aliases, ribbon choice, priority and recent-access metadata. Active guided-run sessions are **not included by default**; an explicit `Include in-progress sessions` option may add them to a whole-library backup. Storage-protection status is available via Settings. Explain restoration implications only when relevant (import preview, replacement confirmation, error).

| Button/control | Action | Notes/edge cases |
|---|---|---|
| Export All | Build versioned JSON with groups and all procedures, revisions, phases, step/outcome notes, favorites, tags/aliases, ribbon identities, priority, last-accessed times and preferences, plus embedded local image assets and presentation choices; open device Save/Share | Show `File prepared`; cannot assert it reached an external durable location |
| Export One | Select procedure, export it as portable JSON | Includes author-defined phases, node/edge notes, step media metadata, embedded local images, and linked URLs as authored; active run not included unless separately requested |
| Import Backup | Select local JSON file; validate syntax, schema, size, links, version | Never execute imported HTML/JS |
| Review Import | Show number of procedures, export date, grouping, and conflicts before writing | Default is non-destructive |
| Add as Copies | Assign new IDs on collision; keep existing entries untouched | Imported Ready claims become Draft until locally checked again |
| Restore / Replace All | Show exact item count to be replaced; two-step confirmation | Suggest current Export All before overwrite |
| Cancel | Discard import preview; make no data change | |
| Request Storage Protection | Call `persist()` with user action if supported | May be granted/denied automatically by browser |
| Learn More | Explain that a recovery snapshot in IndexedDB is **not** an independent backup | |

**Backup format:** Versioned JSON or binary bundle with `backupFormatVersion`, `exportedAt`, `appVersion`, `groups[]`, `procedures[]`, `preferences`, `favoriteIds[]`, and optional `activeRuns[]` only with explicit user opt-in. Each procedure retains `groupId`, labels, optional aliases, priority (0/1/2), ribbon color/icon IDs and last access metadata. No passwords or patient identifiers. Embedded local image **bytes must be exported** (e.g., versioned container file or base64-encoded binary inside JSON, with verified hashes and bounds); remote linked images export **URL/metadata only**. By default active sessions and their choices are excluded. When the user explicitly opts in to include sessions, validate the embedded graph snapshots and mark them as potentially sensitive local content. Suggested file name `nurseflow-backup-YYYY-MM-DD.json`. Export and import work entirely offline after the app has been cached. On importing older backup schemas with a `category` string, offer non-destructive mapping to a matching user-created Group or `Ungrouped`; never silently discard text.

**Backup reminders:** A local backup-due flag may mark the Library `More` control after meaningful edits if last export is absent or old (proposed 7-day interval), rather than displaying a persistent banner. Details appear in the menu and Page 11; allow dismissal. Browser Save/Share cannot guarantee a durable external copy, so phrase timestamp as `Export prepared on [date]` instead of `Safe backup completed` unless verified. The app never uploads automatically.

## 6. Shared dialogs and cross-screen rules

| Dialog | Choices | Trigger |
|---|---|---|
| Exit Run | Stay / Exit run | ALWAYS triggered by Exit, even at first step; confirmed exit deletes the saved active session |
| Restart Run | Cancel / Restart | Starting a fresh run when a matching persisted run exists; never overwrite silently |
| Save Run Failed | Stay / Retry / Export Recovery | IndexedDB write fails; never navigate as if persisted |
| Save Failed | Stay / Retry Save / Export Recovery Copy / Leave Unsaved | IndexedDB write failure |
| Delete Procedure | Cancel / Export / Delete | Destructive action |
| Replace Local Library | Cancel / Export Existing / Replace | Full restore conflict |
| Import Invalid | See Problems / Cancel | Invalid schema or dangerous content |
| Revision Ready | Continue Editing / Use New Ready Revision | Validated draft + confirmation |
| Update Available | Later / Update When Idle | New static bundle cached |

## 7. Graph semantics and data model

**Node kinds:** Start (exactly one outgoing link), Instruction (one Continue edge), Decision (2-5 distinct outcome edges), Alert (visible warning, with an explicit next edge or terminal state), End (no outgoing links). Branches can merge. MVP graph must be acyclic to support bounded, meaningful step totals. Separate procedure **phases** group steps for context and never change graph edges.

**Personal procedure model (conceptual):**

```ts
type Status = 'draft' | 'ready' | 'archived';
type Locale = 'it-IT' | 'en-GB' | string; // app interface language only
type AuthoredText = { sourceText: string; optionalTranslations?: Partial<Record<Locale, string>> }; // optional, not edited in MVP
type AppSettings = {
  uiLocale: Locale;
  textSize: 'normal' | 'large';
  mediaAddLimit: { enabled: boolean; maxItems: number }; // default enabled=true, maxItems=2; bounds 1..32
}; // global, stored once per local library
type Priority = 0 | 1 | 2;
type RibbonColor = 'neutral' | 'blue' | 'teal' | 'green' | 'amber' | 'violet' | 'coral' | 'slate';
type RibbonIcon = string; // allowlisted bundled icon key, not arbitrary HTML/SVG source

type Group = {
  id: string;
  name: string;       // user-authored; language-independent
  order: number;      // user-managed ordering
  createdAt: string;
};

type Procedure = {
  schemaVersion: number;
  id: string; // UUID, not title
  title: string;
  description?: string;    // entered as-is; never automatically translated
  groupId: string | null;        // exactly one group, or Ungrouped
  tags: string[];                // multi-label, normalized for matching
  searchAliases: string[];       // alternative names, abbreviations
  priority: Priority;            // 0 = none, 1 = !, 2 = !!
  ribbon: { color: RibbonColor; icon: RibbonIcon };
  favorite: boolean;
  lastAccessedAt?: string;       // explicit opening, not background autosave
  readyRevision?: Revision;      // immutable last personally confirmed structure
  workingDraft?: Revision;       // editable independently of Ready
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type LibraryViewPreferences = {
  mode: 'groups' | 'priority' | 'recent' | 'name';
  recentCollapsed: boolean;
  collapsedGroupIds: string[];
  quickScope: 'all' | 'favorites' | 'drafts';
  // active search/filter state may also be retained locally
};

type Note = {
  content: AuthoredText;
  visibility: 'expandable' | 'always-visible';
};

type Phase = {
  id: string;
  name: AuthoredText;
  order: number;
};

// The hard schema cap is 32 media references per actionable step, independent of soft add-limit.
type MediaSource =
  | { kind: 'local'; assetId: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; byteSize: number; width: number; height: number }
  | { kind: 'remote'; url: string; expectedMimeType?: string; width?: number; height?: number };
type StepMedia = {
  id: string;
  source: MediaSource;
  caption?: AuthoredText;
  altText?: AuthoredText;
  slot: 'before-note' | 'after-note'; // each media belongs to exactly one slot
  position: number;       // stable order WITHIN selected slot
};
type MediaGallerySettings = {
  layout: 'stacked-thumbnails' | 'side-by-side' | 'full-width';
  imageSpace: 'compact' | 'medium' | 'large' | 'natural';
};
type StepMediaPresentation = {
  beforeNote: MediaGallerySettings;
  afterNote: MediaGallerySettings;
};
// Import migration: older single-gallery mediaPresentation.placement maps all existing
// media to its corresponding slot, with its former layout/space values copied to
// that slot; seed the other gallery with default values. Never discard assets.
type LocalMediaAsset = {
  assetId: string;
  blob: Blob;               // IndexedDB asset store, NOT inline inside graph JSON
  contentHash: string;
  byteSize: number;
  width: number;
  height: number;
};

type NodeKind = 'start' | 'instruction' | 'decision' | 'alert' | 'fork_all' | 'join_all' | 'end';
type Node = {
  id: string;
  kind: NodeKind;
  phaseId?: string | null;      // macro-category WITHIN procedure
  text: AuthoredText;
  note?: Note;                  // shown on this step, not inherited
  media?: StepMedia[];         // <= 32 across BOTH slots; actionable step only; can exceed current soft add-limit
  mediaPresentation?: StepMediaPresentation; // independent before/after gallery settings; shared Page 03/08 renderer
  endType?: 'neutral' | 'completed' | 'escalation' | 'stopped'; // only for End; defaults to neutral
  endHeading?: AuthoredText; // optional; terminal message uses text
  pairNodeId?: string;          // only for fork_all/join_all; matching structural mate
};

type Edge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: AuthoredText;      // decision option label OR authored AND branch name
  optionNote?: Note;            // information about this specific choice
  branchOrder?: number;         // ordered branches for fork_all; ordering is UI/scheduling, not OR choice
};

type Revision = {
  version: number;
  phases: Phase[];              // author-defined macro-categories
  layout?: { direction: 'TB'; nodePositions: Record<string, { x: number; y: number }>; layoutVersion: number }; // proposed map/editor UI metadata
  nodes: Node[];                // stable IDs + authored content/notes
  edges: Edge[];                // explicit decisions and option notes
  validationVersion: number;
  confirmedForPersonalUseAt?: string;
};

type TraversedStep = {
  nodeId: string;
  selectedEdgeId?: string;       // only for OR decision nodes
};

type RunToken = {
  tokenId: string;
  nodeId: string;               // current position for this independently required branch
  forkScope: string[];          // active (possibly nested) fork instance IDs
  sourceEdgeId?: string;        // which required branch of its parent fork created it
  history: TraversedStep[];     // actual navigation within this token, for Previous / Back
  state: 'runnable' | 'waiting_at_join' | 'consumed';
};

type ForkInstance = {
  instanceId: string;           // unique per run, not just shared node ID
  forkNodeId: string;
  joinNodeId: string;
  requiredSourceEdgeIds: string[];
  arrivedEdgeIds: string[];     // branch completion, never inferred from focus state
};

type RunEvent = {
  seq: number;
  type: 'enter_step' | 'continue' | 'choose_or' | 'fork' | 'arrive_join' | 'switch_focus' | 'back' | 'restart';
  tokenId?: string;
  nodeId?: string;
  selectedEdgeId?: string;
};

type ActiveRun = {
  runId: string;
  procedureId: string;
  mode: 'ready' | 'draft-preview';
  revisionVersion: number;
  pinnedSnapshot: Revision;      // immutable content for safe resume
  focusedTokenId: string | null; // UI focus is one token even if many are pending
  tokens: RunToken[];            // required parallel branches and one ordinary linear token
  forkInstances: ForkInstance[]; // join gates; nested forks represented as nested instances
  eventJournal: RunEvent[];     // deterministic undo and dependency invalidation
  state: 'active' | 'at-end';    // at-end persists until explicit Library handoff / Restart
  terminalNodeId?: string;      // only once all required joins completed
  updatedAt: string;
  schemaVersion: number;
};
```

A Ready snapshot must be structurally valid at creation. Imports invalidate personal-confirmation metadata by default. Recent local revisions may be retained for undo/recovery, but these live in the same browser storage and do not replace external export. Groups, tags, last-accessed timestamps and procedure identity fields are stored entirely in IndexedDB and migrated/validated on import. Priority changes and group/tag/ribbon edits change indexing and presentation only, **never the run branch logic**. Persist one active session per procedure + mode in a dedicated IndexedDB store, with atomic updates and a pinned snapshot; the session contains all branch tokens and fork/join gates. Delete only after confirmed exit or completion handoff. Sessions may contain chosen outcomes and should be protected as user-controlled local data. Step totals are derived from graph topology and the actual path, never stored as an authoritative fixed count. Optional revision-level positions are **visual metadata only**: Page 05 may read them but may not edit or persist them, and active runs use their pinned snapshot.

### Graph topology and true parallel execution — **confirmed v1.5**

- **Linear/OR:** Ordinary Instruction and Alert steps each have exactly one outgoing edge, Decision has explicit labeled exclusive outgoing edges, and an ordinary convergent destination receives the single *selected* route. A simple OR merge needs no extra structural node unless a named Merge is introduced for authoring clarity. Traversed histories from mutually exclusive alternatives are never combined.
- **AND Fork-All / Join-All:** `fork_all` has 2+ explicitly ordered outgoing required branch edges and exactly one automatically generated matching `join_all` (an internal gate, not a user-created manual connection). Each required edge spawns a separate persisted `RunToken`; every required branch must arrive at that join before any continuation is eligible. The join fires exactly once and produces one downstream continuation. A branch may itself contain exclusive decisions or properly nested Fork-All/Join-All constructs.
- **Well-formedness:** Every fork must have one internally generated, stable, reachable join and vice versa. All routes from each fork branch must reach its matching join without escaping the fork region or crossing a sibling branch. Nested scopes must be properly structured (no overlapping nonnested fork regions). Shared OR convergence within a branch is allowed, but a cross-branch merge before Join-All is invalid. A route cannot terminate at a global End while mandatory branches remain incomplete.
- **Deterministic focus:** The app displays one current step card. On fork, focus defaults to the first branch by author-defined order, and other branches remain pending; the nurse can switch to any eligible branch through a compact, as-yet-unfrozen Page 03 control. Focus changes never mark work completed or alter another branch; showing an unvisited action for the first time adds its actual visit, while merely revisiting a known step does not.
- **Step count:** `n` is the one-based position of the displayed actionable step in the run's effective, replayable visit order. Entering a new actionable step in any required branch assigns the next position; switching focus to a step already visited restores its existing position, so switching alone never invents a step. Back to an earlier step shows that earlier ordinal. When a changed decision discards downstream history, remaining ordinals are compacted consistently. `N` or `min-max` includes required parallel branches and unresolved OR choices. Structural `start`/`fork_all`/`join_all`/`end` are excluded. If topology is corrupt in a Draft preview, use `?` rather than fabricate totals.
- **Save/Back/change:** Every choice, step completion, branch focus change and join transition updates all dependent run state in one IndexedDB transaction. Branch-local history drives the Previous cue and Back. Revising an OR outcome discards only dependent downstream events, including affected fork instances, while preserving independent branches. Resume restores every token and gate from pinned revision and journal.
- **End:** A global End is shown on Page 04 only after the selected path reaches it with no outstanding required branches or unresolved join. Explicit End type, notes and persistence remain unchanged.
- **Validator tests:** Reject missing OR destination or label, empty/dead-end mandatory arm, missing/corrupt internal fork/join pairing in imported data, premature path reaching End, a branch skipping the implicit gate, cross-branch edge, cycles, and inconsistent nesting. Verify two required branches, nested AND, OR inside AND, multiple nodes converging within a branch, undo after one branch has reached the join, and offline reload before/after join.
- **Rendering independence:** Graphical positions/lines never determine OR vs AND semantics. The frozen List and Map interpret explicit node types and persisted token states and remain read-only. The List fallback must remain available if graphical layout fails.
- **Out of scope for first version:** Cycles/loops, conditional optional parallel branches, join-any/race semantics, background automation of clinical steps and machine-inferred clinical recommendations.

## 8. Localization — **global app setting confirmed v1.6**

- Language is selected **once for the application**, at Page 00 First Launch, and may be changed in Page 10 Settings. `AppSettings.uiLocale` drives UI translations for every screen, including Builder, Map, errors, confirmations and import/export menus. Bundle Italian (`it-IT`) and English (`en-GB`) locally for offline use. Never add a Language field to Page 06, a language badge to Page 02, or a per-procedure language picker.
- Titles, group names, labels, search aliases, phase headings, step/question texts, outcome labels, and notes are **user-authored content**. They remain exactly as entered when the UI language changes. Do not machine-translate, silently overwrite, or claim these clinical/operational instructions are available in a language they were not written in.
- `AuthoredText.sourceText` is mandatory where the flowchart requires text. A future optional, separately authored `optionalTranslations` map can support explicitly entered localizations of a content field without assigning a language to the whole procedure or showing a selector on procedure creation. It is not necessary to build a translation-management UI in the initial release. Absent an explicit translation, always display the original user-authored source text.
- UI localization must allow for longer strings, date/number formats, keyboard and screen-reader ordering, and future right-to-left layout extensibility. No remote translation service or language asset is fetched during offline use.

## 9. Technical and offline architecture

| Area | Proposed solution |
|---|---|
| Static hosting | GitHub Pages deployed via GitHub Actions |
| Frontend | Vite + React + TypeScript |
| PWA/offline shell | vite-plugin-pwa / Workbox; app shell and supported locales precached |
| Routing | Hash-based or verified subpath-safe router for `owner.github.io/repo/` |
| Data | IndexedDB via Dexie; transactional writes for revisions/import and crash-recoverable active run sessions |
| Persistence | `navigator.storage.persisted()` status and user-initiated `persist()`; guard unsupported APIs |
| Usage estimate | `navigator.storage.estimate()` if supported; label approximation |
| Localization | react-i18next with locally bundled catalogs |
| Graph editor | `@xyflow/react` lazy loaded on demand |
| Validator | Pure, deterministic TypeScript function + versioned JSON schema validation; acyclic graph path-length calculation |
| Fast library search | Local normalized metadata index of title, groups, tags, aliases, descriptions; optional searchable node content; reindex on local changes |
| Grouping and order | Procedure `groupId`, separate Group store, collapsed state in UI preferences; flat global priority sorting |
| Per-row identity | Bundled icon allowlist and fixed accessible color palette; icon-only assets load offline |
| Backup | Blob download + Share API when available; offline JSON import/export; active runs opt-in only |
| Security | No remote scripts, trackers, fonts or services; escape all imported text; CSP as deployment permits |

**Origin matters:** IndexedDB is scoped to the web origin/browser context; moving to another origin, browser profile or device does not move data. Import/export is the transfer mechanism. Hosting GitHub code publicly does not publish IndexedDB content. Browser/OS file picker or share destinations remain the user's own choice and may include a cloud provider outside NurseFlow; NurseFlow itself sends no data.

**Data loss caveat:** `persist()` is a request, not a guaranteed grant; even when granted, deliberate removal of app/site data or device loss remains possible. Cache API and IndexedDB are not independent backups. Temporary/quota/storage exceptions must be handled.

**Update caveat:** Service worker may load updated static code when online, but any reload to activate it is deferred until the user finishes a run or completes/safely saves editing.


### v2.6 — Convergence + clipboard/undo revision (2026-10-27)

- USER-CONFIRMED: Display real converging arrows into one shared downstream node; omit `Shared following step` explanatory canvas label.
- USER-CONFIRMED: Add Copy, Cut, Paste, Undo, Redo in Builder.
- PROPOSED: Contextual clipboard actions, pending Cut/move + atomic Paste, local graph clipboard, stable copied IDs, preservation of unaffected edges, structural undo history and shortcuts.
- OPEN: Final Page 07 layout, exact safe Cut/Paste contract, and Decision/Multitask numeric maxima. See §07.10.

### v2.5 — Page 07 complete design freeze candidate (2026-10-27)

- PROPOSED ONLY: Define a specific full-screen Graph/Outline edit workflow, node/outcome/edge sheets, 32-outcome/32-activity possible ceiling, focus presentation for large groups and safe scoped edit previews.
- FROZEN AND UNCHANGED: Core semantics and exact EN/IT Decision/Multitask terminology; Page 03 saved runs/media; Pages 00–06; Page 05 read-only; Page 08 media controls.
- OPEN: User approval of entire Page 07 and numerical limits. Earlier historical 2–5 decision-outcome target remains merely historical; version 2.5 proposes 2–32 for Ready without implying approval.

### v2.4 — User-approved terminology freeze (2026-10-27)

- USER APPROVAL: **FROZEN** `Make a decision` / `Multitask activities` as the two author-facing concepts; Italian `Prendi una decisione` / **`Attività multitasking`**. This supersedes `Tasks in any order` / `Attività in qualsiasi ordine` from the previous proposal.
- USER APPROVAL: The corresponding cross-screen terminology becomes `Decision`, `Multitask activities`, `Switch activity`, `Activity 2/3`, `Activities in progress`, `Reopen activity`, and `Browse activities`; Italian counterparts are in section 07.0. These are labels only, not altered branch/parallel execution.
- STABLE RULE: Decision selects exactly one outcome; Multitask activities requires all independent activities, with pause/resume and one implicit shared continuation after completion.
- SCOPE OF FREEZE: Page 07 **terminology and semantics only**. Full Builder screen and unresolved numeric limits remain proposed. Pages 00–06 and previously frozen Page 03/Page 08 media and navigation behavior stay frozen.

### v2.3 -- Plain-language workflow naming (2026-10-27)

- USER REQUEST / PROPOSAL: Replace developer-oriented OR/AND terminology with `Make a decision` (choose exactly one observed outcome) and `Tasks in any order` (complete all required independent tasks with resumable switching).
- PROPOSED BUILDER: distinguish Decision answer outlets from named Tasks in any order; show brief subtitles only in insertion picker, not persistent explanatory panels.
- PROPOSED CROSS-SCREEN COPY: `Switch task`, `Task 2/3`, `Tasks in progress`, `Browse tasks`; preserve the previously frozen Page 03 layout/behavior unless user explicitly approves changed wording.
- CONFIRMED FROM v2.2: implicit join remains invisible and only a shared continuation is exposed; shared end destinations do not make exclusive decisions parallel.
- STATUS: Page 07 naming and presentation pending explicit approval; all previously frozen product behavior unchanged.

### v2.2 — Clarified exclusive branching and large parallel blocks (2026-10-27)

- USER-CONFIRMED: Implicit AND join in Page 07; remove all `ALL complete` / `Automatic · Not editable` Builder UI labels. Keep internal matching completion gate for runtime only.
- CORRECTED PROPOSAL: OR executes one path; convergence is a separate property. Changing `No`'s immediate destination from `Resolve missing` to `Final review` bypasses that No work while leaving Yes unchanged. To merge after No's work, connect the last No-path step's Next to shared Final review.
- REVISED PROPOSAL: Distinct outcome destination vs path-end continuation actions. `Go to existing step…` for an empty outcome; `Continue at existing step…` at branch end; `Change first step…` with before/after impact and orphan warnings when reassigned.
- PROPOSED RESPONSIVE UX: Many-arm parallel region at 32-arm **test case** uses focused 2–3 visible lanes, searchable Browse arms, and Fit/overview. No numeric hard limit has yet been approved.
- Updated self-contained offline UX test file `nurseflow-page07-graph-prototype-v2.2.html`. Earlier v2.1 prototype and Page 07 notes are superseded where inconsistent. Page 07 still pending freeze; established Page 00–06 and Page 03/Page 08 freezes remain untouched.

### v2.1 — Graph View connection semantics and implicit AND authoring (2026-10-27)

- FROZEN baseline unchanged: Pages 00–06; Page 03 two-section media and parallel switcher; Page 08 media-management component; Page 05 read-only Map/List.
- REVISED PROPOSAL (not frozen): Page 07 canvas uses tappable, labeled per-OR-outcome connection chips. Empty outlet → Create new step / Use existing step; linked outlet → Change / Insert on this path / Disconnect. Each OR outcome has one explicit destination; a shared target remains one canonical node.
- USER-REQUESTED SIMPLIFICATION: Page 07 AND authoring joins are **implicit**. Users edit named arms and a single After-all continuation. The internal stable join gate is auto-generated; no manual Join-All creation or Finish arm wiring.
- Added a local HTML interactive Graph View prototype, explicitly illustrative rather than production.
- Page 07 remains pending explicit design approval; no claim of freeze for full Builder.

## 10. Performance and accessibility acceptance targets

These are proposed test targets, **not measured performance**.

| Test | Target |
|---|---|
| Installed PWA warm launch, mid-range phone | usable Library about 1.0 s |
| Fully cached cold launch | usable Library about 2.5 s |
| Guided decision tap -> new instruction | about 100 ms |
| Library search with 1,000 procedures | update about 100 ms |
| Recent access | Three >=48 px single-line shortcuts in one horizontal row, <=20% of post-toolbar browse height; Library uses >=80%, full recent top-20 sheet always accessible and ordering persists offline |
| Priority sorting | Sorting level 2, then 1, then 0 is deterministic and applies globally in Priority view |
| Group accordion | Toggle immediately; persist state; deleting group never deletes member procedures |
| Offline capability | Create, edit, run, persist progress, resume after reload, search, export and import in airplane mode |
| Guided context | Step counter (`n / N` or `n / min-max`), current procedure phase and compact actual previous-step cue |
| Guided persistence | Run resumption after browser/app restart; atomic path writes and no stale branch restoration |
| Notes | Step and individual outcome notes safely rendered; info tap never chooses an option |
| Map read-only | From Guided or End, highlight current/past route; returning keeps unchanged pinned run |
| Map accessibility | List View exposes all nodes, edges and notes without panning or zooming |
| Touch area | >= 48 CSS px; decision rows >= 56 px; note info button >=48 px separately |
| Accessibility | WCAG 2.2 AA target; keyboard, screen reader, large text |
| App update | No automatic interruption of active guided run / unsaved draft |

## 11. Testing and clinical-use boundaries

**MVP acceptance script:** Install app; choose locale; request persistent storage and display real result; create and rename 3 groups; put multiple nonclinical example procedures in groups and Ungrouped; assign tags, aliases, different ribbon color/symbol combinations, priorities 0/1/2; open 25 procedures in known order and verify Recent 3 shortcut order, <=20/ >=80 space on representative phone heights, group-free one-line tiles, and richer flat Recent 20; collapse/expand groups; verify full-library Priority view ranks 2→1→0 even across previously collapsed groups; search by title, group, tag, alias and optionally step content; verify filters interact predictably; create a *nonclinical example* graph with Start/Instruction/Decision/End; set 3 explicit outcomes; validate a missing edge failure; mark valid version Ready; reopen offline; traverse branches; verify phase, last visited step, route-aware `n / N` totals and notes per step/edge; restart the PWA to confirm exact local session resume; verify Exit confirmation and downstream branch truncation; edit a new Draft without corrupting Ready; export full library, groups, ribbon and recents; simulate empty device/clear **test** data; import backup and confirm identities, priorities, membership and expected nodes; manually confirm imported draft; delete a group and verify procedure preservation; test storage-full failure and recovery export; inspect a running route in Page 05 Map with highlighted actual path, test a decision outcome note in read-only inspector, return to identical run state, and switch to accessible List View without changing any branch. Also create an explicit 2-branch Fork-All/Join-All, verify that completing just one branch does not reach the join continuation, switch focus to the other branch, reload offline and recover both token states, finish both branches and reach End exactly once; reject an unpaired or unstructured fork, test a nested fork and an OR decision within one parallel branch, and confirm that revising an earlier choice discards only dependent history.

**Media acceptance extension (v1.9):** Create a Decision step with four media items (two compressed local photos `before-note`, one remote GIF and one local photo `after-note`) while the soft limit is disabled. Verify the consultation order `body -> both before images -> step note disclosure/content -> both after images -> authored decision options` at the SAME TIME. Independently switch each section among Stacked, Side-by-side, Full width and Compact/Medium/Large/Natural frame allocation; both sections must update in the **same Page 03 live renderer** without Refresh/Save. Collapse the step note: its disclosure control must remain between the galleries. Remove the step note entirely: maintain before/after ordering with no empty note placeholder. Move one existing item from after to before, verify the local blob ID is unchanged and the total remains 4; optionally reorder inside a section. Turn soft limit On=2: all four remain visible, movable, exportable and replaceable, while both sections' Add actions are disabled. Turn limit Off and verify additions across both slots stop at exactly 32. Test remote 404/offline as `Media unavailable` without blocking either branch, image zoom, no cropping of text or shrinkage of >=56px outcome buttons, compression legibility, exports/imports with slot and per-gallery settings, and pinned Ready run remaining unchanged during Draft edits. Migrate a hypothetical v1.8 `mediaPresentation.placement` field deterministically into each item's slot and the corresponding gallery settings, with no data loss.

**Clinical scope:** This is a personal reference application, not independently reviewed clinical decision-support software. Users remain responsible for authoring and verifying content against applicable professional guidance and workplace policy. If the software's intended purpose shifts toward patient-specific treatment recommendations or institutional distribution, reassess legal/regulatory, quality, safety and data protection requirements before deployment. No clinical pathway templates are included by default.

## 12. UX freeze process and next review

Requirements D-01 to D-05, D-07, D-11, D-18, D-19, D-21 through D-25 and D-28 remain CONFIRMED. **Pages 00–09 are frozen (Page 09 approved v3.2)**, including Page 01 Group dialogs, Page 06 compact form, and **Page 03's AND-only `Switch branch` selector, branch sheet and passive vertical `B n/m` marker**, approved 2026-10-27. Page 02 no longer shows procedure-level language because language was established as an app preference. Page 03 original one-step consultation, Page 04 completion, and Page 05 Map/List remain frozen. First-release OR, convergence, and AND-parallel semantics are confirmed.

**Media extension FROZEN (v2.0 approval):** The user explicitly approved and froze both independently populated and independently configured Page 03 `Before Note` / `After Note` media sections, and the corresponding Page 08 gallery-management/live-preview controls. The combined per-step schema cap is 32 media items, with a configurable and disablable soft Add limit of 2 by default. Local photo compression, HTTPS image/GIF linking, per-gallery layouts and image space, in-gallery reordering, cross-gallery moving without duplication, and graceful broken/offline fallback are included. The full Page 08 screen is now **APPROVED AND FROZEN v2.9**, including its revised outcome/path editing. **Next full-screen review: Page 09 Check & Mark Ready.**

## 13. Version changes

### v2.9 - 2026-10-28

- **USER APPROVAL / FULL FREEZE:** Page 08 is frozen with its v2.8 Outcome Editor: `Answer`, per-outcome Note, Path summary, and `Change path` through the exact-outlet Page 07 graphical target picker. The separate `Arrange answers` action changes display order, not graph logic; the two media galleries and live preview remain frozen as before.
- **NEW PROPOSAL, NOT FROZEN:** Page 09 `Check procedure` with problems/warnings summary, issue-scoped Fix/Inspect actions, deterministic offline validation, Draft Preview and an explicitly confirmed local Ready snapshot.
- **REVISION SAFETY:** Ready is an immutable version, not publication to a server. An existing Ready and pinned Guided sessions cannot change when a later Draft is edited or validated; commit uses an atomic local transaction and honest failure state.


### v2.7 — 2026-10-28

- **USER APPROVAL / FULL FREEZE:** Page 07 Flowchart Builder is FROZEN, including its complete Graph/Outline UX, labeled Decision outcome links, full contextual editing, two synchronized views, Multitask activities authoring, Copy/Paste/Undo/Redo, **safe pending Cut**, and **2–32** outcome/activity bounds for Ready-valid constructs.
- **VISUAL CORRECTION:** All convergence arrows terminate directly on their canonical shared next node. Remove any intermediate `+` connector circle or other junction icon/label; `+` remains only where a step can actually be inserted.
- **FROZEN SAFETY:** Move transaction remains pending until a destination is selected and a scoped impact confirmation is accepted; original graph remains unchanged until commit. Copy regenerates IDs; linking to an existing node does not duplicate it.
- **PROPOSED, NOT FROZEN:** Full Page 08 Step Editor layout, common and type-specific fields, Decision outcome sheet, content autosave/Preview/Done contracts and accessible form behavior. Previously frozen Page 08 media tools and Page 03 dual-gallery rendering remain approved unchanged.



### v2.0 — 2026-10-27

- USER APPROVAL: **Page 03 dual-section media rendering FROZEN**, including independent Before Note / After Note galleries, 32-item combined schema limit, global configurable soft addition limit and real-time gallery display options.
- USER APPROVAL: **Page 08 media controls FROZEN AS A COMPONENT** (local photo import/compression, URL/GIF, per-section ordering/move, independent layout and image-space settings, live Page 03 renderer preview). Page 08 as a full screen still needs design approval.
- UNCHANGED: Pages 00–06 frozen, including Page 03 persistent runs and parallel switcher, Page 05 Map + List, and Page 06 compact New Procedure.
- PROPOSED (not frozen): **Page 07 Builder** detailed Outline and Graph authoring design, explicit contextual add/connect actions, OR branching/convergence, paired AND split/join, safe node/edge edits, Preview, Check, Undo/Redo and autosave contract.

### v1.9 - 2026-10-27

- **USER REQUEST:** Replace exclusive Before/After Step Note positioning with **two simultaneously usable media sections**, `Before note` and `After note`. The step note (including its disclosure row when collapsed) lies between them.
- **PAGE 08 MEDIA CONTROLS APPROVED:** Retain local photos with Small/Medium/High/Original compression, HTTPS image/GIF URLs, per-item metadata, reorder/replace/remove, and immediate Page 03 live preview.
- **INDEPENDENT DISPLAY:** Both media sections individually choose Stacked, Side by side or Full width, and Compact/Medium/Large/Natural frame allocation. Each media item has a single section and an order within that section; a Move action changes section without duplicating an asset or counting as Add.
- **UNCHANGED LIMITS:** Up to 32 items **total across both sections**; global optional soft Add limit default 2; lowering the limit never removes, hides or prevents moving existing items.
- **MODEL AND TESTS:** Add `StepMedia.slot`, replace single `placement` with `beforeNote` / `afterNote` presentation settings, validate independent galleries, backup/migration and live consultation render equivalence.
- **FREEZE:** Page 03 navigation remains frozen. Page 08 media-management feature is approved; the expanded Page 03 two-gallery visual has been specified but not explicitly frozen as a final revised screen. Page 08 as an entire screen and Page 07 remain under design.

### v1.8 - 2026-10-27

- **USER FREEZE:** Page 03's entire AND-only branch-switching UX (explicit `Switch branch` button, bottom sheet, confirmed Reopen, and noninteractive `B 2/3` side marker) is now frozen, in addition to the original Guided Procedure layout.
- **MEDIA REQUIREMENTS:** Replace the earlier arbitrary 2-image maximum with a hard **32 per actionable step** schema cap and an independently configurable/disablable **soft add-limit** (default 2). A setting change never hides, deletes, resizes, or reorders existing media; it gates future additions only.
- **PAGE 03 PROPOSAL:** Media blocks appear between body and outcomes; author chooses before or after the Step Note; stacked thumbnails, side-by-side thumbnails, or full content width with configurable frame height; full-screen viewer; no blank placeholder when empty; remote fail/offline fallback is nonblocking.
- **PAGE 08 PROPOSAL:** `Add photo` with on-device compression (Medium default, max-width 1280px, typical 150-300 KB target) and `Add URL` image/GIF, media list with reorder/replace/remove, live Page 03 step preview updating immediately with layout and media edits.
- **ARCHITECTURE:** Stable local Blob asset IDs and revision-aware retention; remote URLs saved without binary bytes; backup/export must include local image data and layout settings; thumbnail lazy loading and aspect-ratio reservation preserve UX speed.
- **STATUS:** The new media visual extension is proposed and pending approval; the earlier frozen screens and parallel logic remain unchanged.

### v1.7 - 2026-10-27

- USER APPROVAL/FREEZE: Page 01 Group dialogs, group-management menu and Page 06 Group picker behaviors are frozen. Both Library `+ Group` and Page 06 inline creation use the same single-name dialog; deleting a group moves its procedures to Ungrouped.
- USER APPROVAL/FREEZE: Page 06 New Procedure is frozen as the minimal Name, Group, optional Labels, expandable More Details and Create draft form; application-wide locale is not repeated.
- REVISED PROPOSAL, **NOT FROZEN**: Page 03 AND-only navigation now has a clearly labeled full-width `Switch branch` BUTTON. The entire row opens a bottom sheet (mobile) or anchored popover (desktop); choosing a sheet row is the action that changes branch focus. Completed branch `Reopen` remains separately confirmed.
- REVISED PROPOSAL, **NOT FROZEN**: Inside a focused AND arm, a narrow vertical left-side marker `B 2/3` and rail remain visible adjacent to the current step and its options. It is informational, NOT a tap target. Branch ordinal differs from global STEP index and X/Y done.
- AUTHORING RESPONSIBILITY CLARIFIED: Page 07 creates graph topology and links, Page 08 authors steps and option notes, Page 09 validates and marks Ready. Detailed Page 07 workflow is offered for review, not frozen. Page 05 is strictly read-only.
- PRESERVED: Pages 00–05 original frozen controls and AND/OR/convergence semantics. No automatic treatment advice or externally generated care content; graphs remain locally authored.

### v1.6 - 2026-10-26

- USER DIRECTIVE (CONFIRMED): language is an **application-level** setting, not a procedure-level property. Removed Language from Page 06 creation and the passive locale badge/selector from Page 02 (explicitly authorized, narrowly scoped alteration to frozen Page 02). Stored author text remains exactly as written; UI labels follow global locale.
- REVISED PROPOSAL, NOT FROZEN: Page 06 simplified to Title, Group and optional Labels, with More details (ribbon/priority/aliases/description) collapsed and a single Create draft.
- GROUP UX VISUALS PROPOSED: Page 01's existing +Group opens compact New group sheet; group header More allows Rename/Move up/Move down/Delete; Page 06 Group picker contains Ungrouped, existing groups and + New group. Deletion moves member procedures to Ungrouped.
- PARALLEL CONTROL VISUAL PROPOSED: one 48px context-only `Current branch · N/M done` strip under Page 03 STEP/phase; bottom sheet lists branch statuses; switch preserves all branch state; completed-branch reopening is explicitly confirmed; hidden entirely outside AND regions.
- FROZEN unchanged: Pages 00, 01 main Library geometry, 02 actions (except language indicator), 03 single-step interaction, 04 completion, 05 Map and List. Both OR and true AND support remain first-release requirements. Group dialog and branch switcher details are **pending explicit freeze approval**.

### v1.5 - 2026-10-26

- USER APPROVAL: **Page 05 graphical Map and List View fully FROZEN.** Strictly read-only pan/zoom/current-route map and graph-aware DAG list; note inspection; shared nodes once; explicit OR/AND representation; pinned snapshot during runs.
- USER APPROVAL: **True AND-parallel Fork-All/Join-All support from the beginning**, in addition to linear, exclusive OR, and convergence. Paired join waits for *all* required branches; nested well-formed acyclic regions supported; no loops in initial scope.
- IMPLEMENTATION REQUIREMENT: Tokenized, transactional, resumable ActiveRun; strict validation; route-aware progress across all pending required branches; deterministic branch focus without automatic exclusive selection; dependency-aware Back and choice revision.
- COMPATIBILITY: Frozen Page 03 one-step card, author notes, current phase, previous cue, resume and exit confirmation preserved. Only a compact **parallel branch selector** needs detailed UI approval.
- PROPOSED (NOT FROZEN): Page 06 New Procedure minimal form, with Title, Language, Group, Labels, expandable optional metadata, Create Draft and Back; no topology chooser or redundant Cancel.

### v1.4 - 2026-10-26

- USER DIRECTIVE: **Freeze Page 05 List View** as a compact expandable **tree-like DAG outline**, not a literal tree with duplicated convergent nodes.
- FROZEN: canonical node rendered once, explicit labeled decision-outcome subrows, references for shared/convergent destinations, shallow indentation, node/edge notes, macro-category, active-route states, Jump to Current, keyboard/screen-reader access, and read-only behavior from Details, Guided, and End.
- CLARIFIED: linear, exclusive divergence and convergence are supported by the existing acyclic graph semantics; viewer can represent proposed true parallel ALL branches but actual Fork-All/Join-All execution requires new validated graph types and a multi-branch ActiveRun model.
- UNCHANGED: Page 05 graphical Map visuals remain a proposal; Pages 00–04 stay frozen and Page 03 was not modified. Cycles/loops remain out of MVP.


### v1.3 - 2026-10-26

- USER APPROVAL: **Page 04 Procedure End FROZEN** in its v1.2 composition, four authored terminal outcome variants, End note, preserved at-End session, Back to prior actual step, confirmed Restart using pinned revision, and direct Return to Library after successful session deletion.
- PROPOSED for review (NOT FROZEN): Page 05 read-only Map, minimal full-viewport mobile design, context-aware Back, Fit/Current/zoom/pan, current node and traversed-route highlights, decision/phase semantics, and inspect-only node sheet with independent step/outcome notes.
- PROPOSED: Map↔List accessibility mode, local deterministic graph layout fallback, revision-level positions as visual-only metadata, offline operation without run-state writes, pinned snapshot when accessed during a guided/terminal session.
- UNCHANGED: Pages 00, 01, 02, 03 are frozen. Next after Page 05 approval: Page 06 New Procedure.

### v1.2 - 2026-10-26

- PROPOSED for review (NOT FROZEN): Page 04 End layout, four author-defined terminal presentation types (`neutral`, `completed`, `escalation`, `stopped`), explicit terminal instructions/note, route-context row, preceding-step cue, and primary Library vs secondary Restart actions.
- PROPOSED: Page 04 Back returns to actual last visited step with atomic persistence; Restart confirms and uses identical pinned revision; Library clears only that ended session after a successful IndexedDB deletion.
- CONFIRMED compatibility: End is automatically reached from Page 03, state remains locally resumable on Page 04 until explicit handoff, and the Page 02 dynamic Resume label reopens that terminal page. No completed run history by default.
- UNCHANGED: Pages 00, 01, 02 and 03 remain FROZEN. Next after Page 04 approval: Page 05 Flowchart Map.

### v1.1 - 2026-10-26

- USER APPROVAL: **Page 03 Guided Procedure FROZEN** in the v1.0 layout and button contracts.
- FROZEN: step position with branch-aware total/range, current author-created procedure phase, compact previous-step cue showing the actual visited predecessor, step-level and per-outcome notes with independent info controls, one-tap explicit branching and atomic saved navigation.
- FROZEN: persistent local run state and Resume after app/device restart; pinned immutable graph snapshot; changing an earlier decision discards incompatible downstream path; Exit **always** requires confirmation; completion automatically advances to Page 04.
- UNCHANGED: Pages 00, 01 and 02 remain FROZEN. Page 04 Procedure End is the next screen for review. The backup-screen UX and its proposed optional session-export control remain to be reviewed with Page 11.

### v1.0 - 2026-10-26

- USER REVISION REQUEST for Page 03: show step out of possible total, current procedure macro-category, and immediately previous visited step on the left; never display future paths in that previous indicator.
- PROPOSED count rule: `n / N` for same-length remaining paths, `n / min-max` for varying branches. Counts exclude structural Start and terminal End.
- USER REQUIREMENT: persist current run position and selected path in IndexedDB after each navigation, recover after reload/app termination, and ALWAYS confirm Exit, even on initial step.
- USER REQUIREMENT: add localized note to any step and separately to any decision outcome; independent note expansion must never select a branch. Essential warnings remain visible by default.
- USER REQUIREMENT: add step-level phase/macro-category distinct from Library group; Builder and Step Editor must author phases, note content and note visibility.
- PROPOSED session compatibility: Page 02 frozen layout retained, with dynamic `Resume` primary label; one pinned immutable graph per saved session, atomic edits and explicit Restart; session backups opt-in.
- RECONFIRMED: branches never merge previously selected histories, End opens Page 04 automatically, Pages 00-02 remain FROZEN. Page 03 NOT YET FROZEN.

### v0.9 - 2026-10-26

- USER APPROVAL: **Page 02 Procedure Details FROZEN** in the v0.8 layout and complete state/button contract. Pages 00 and 01 remain FROZEN.
- PROPOSED (NOT FROZEN): Page 03 Guided Procedure one-step design with minimal top bar, step ordinal, read-only Map, full untruncated content and one-tap branching choices.
- PROPOSED: instructions use one `Continue`; decisions show 2-5 authored full-width >=56 px outcome buttons; alerts and errors are never silently hidden; End automatically opens Page 04.
- PROPOSED: Back uses **visited** path, changing an earlier decision clears incompatible downstream selections; exit confirms only after progress; run choices remain volatile and are never exported, logged or sent to cloud.
- EXPLICIT TRADEOFF: reload/OS termination can lose volatile run position, by design to avoid recording potentially patient-specific decision selections. Requires user acknowledgement before freeze.
- RECONFIRMED: no generic tutorial copy, no fake clinical completion status, no additional navigation or permanently displayed storage status.

### v0.8 — 2026-10-26

- PROPOSED (NOT FROZEN): Page 02 compact Details wireframe and full button-level action contract, consistent with frozen Library ribbons/groups/tags/priority and minimal UI rule.
- PROPOSED: three clear action states — Ready (`Start`), Draft-only (`Edit Graph`), and Ready+Draft (`Start Ready`), with immutable Ready revision preserved during draft editing.
- PROPOSED: star and More in header; ribbon/title/priority and compact metadata; primary CTA plus two useful secondary actions; `Edit Details`/Duplicate/Export/Archive/Delete only inside the More menu; no duplicated app navigation.
- RECONFIRMED: Pages 00 and 01 remain FROZEN, with no changes to their approved layout or behavior. Page 02 is FROZEN; Page 03 awaits explicit approval.

### v0.7 — 2026-10-26

- USER APPROVAL: **Page 01 Library FROZEN** in the v0.6 layout; Page 00 remains FROZEN.
- FROZEN: header `+ New` and overflow, immediate local search and filters, Favorites/Drafts, one-level collapsible personal groups, per-procedure ribbons, label search, three-level priority (`0`, `!`, `!!`), and globally sorted Priority view.
- FROZEN: Recent contains the three latest-opened procedures in one horizontal row, each displaying only a small identity marker and a one-line truncated title. Recent may use **no more than 20%** of post-toolbar browse height; unused space belongs to Library, which always has **at least 80%** in the normal browse layout.
- FROZEN: Recent `···` opens a flat chronological list of up to 20 items with fuller metadata; never group that popup into sections. Library is independently scrollable. Search/filter/collapse hides or contracts Recent and reallocates space.
- FROZEN: no bottom navigation, instructional filler, or duplicate entry points. Next design review: Page 02 Procedure Details.

### v0.6 - 2026-10-26

- USER REFINEMENT: cap Recent to <=20% of usable browse height, assign >=80% to the Library, and show the last **three** procedures directly instead of five.
- PROPOSED UI: one horizontal row of three ultra-compact one-line shortcut tiles, using only the color/symbol identity and short/truncated title. No group label or other metadata in this quick strip.
- No fixed 20% height reservation: give all unused space to Library. On narrow/zoomed screens, permit horizontal scrolling instead of stacking or shrinking accessible tap targets.
- UNCHANGED: Recent `...` opens the full list of up to 20, with full title, group label, status, priority and optional recent-access time. All other Library organization/search/group/priority functions remain.
- STATUS: Page 00 FROZEN; Page 01 v0.6 proposed, pending explicit approval.


### v0.5 — 2026-10-26

- USER REFINEMENT: Recent shortcuts must use roughly 30% of the usable browse region, leaving ~70% for independently scrollable Library content; the ratio excludes app header/search/filter bars.
- PROPOSED UI: replace five full-width Recent rows with a compact two-column by three-row grid of five one-tap shortcuts, flat chronological order, minimal fields (identity + truncated title, optional group label only if space allows).
- CONFIRMED: Recent `···` still provides a **more comprehensive** flat top-20 bottom sheet on mobile/popover on desktop, showing group as a label and additional status/priority/recency details.
- RESPONSIVE: on short screens / large text, adapt shortcut arrangement while preserving >=48 px targets and a Library-first allocation; filtering and collapsed Recent transfer space to Library.
- STATUS: Page 00 remains FROZEN; Page 01 revised proposal remains pending approval.

### v0.4 — 2026-10-26

- REQUESTED / CONFIRMED: custom collapsible groups for individual procedures (one optional group each), separate from multiple labels/tags.
- REQUESTED / CONFIRMED: full local search by title, labels, group and additional metadata; advanced local group/tag/priority/status filters.
- REQUESTED / CONFIRMED: 5 immediately visible recent procedures and Recent `···` with up to 20 items.
- REQUESTED / CONFIRMED: customizable per-procedure ribbon color and icon/symbol.
- REQUESTED / CONFIRMED: 0/1/2 priorities, respectively no mark / `!` / `!!`, with an optional priority sort.
- PROPOSED UX: five compact recent rows in a collapsible section; mobile sheet vs. desktop popover for 20; one-level group accordions; global flat priority sorting so collapsed groups cannot hide important items; contextual `+ Group` next to Library heading.
- UPDATED: Procedure Details > Edit Info, New Procedure, local model, imports/exports, accessibility, and QA tests.
- STATUS: Page 00 stays FROZEN. Page 01 is revised but NOT FROZEN until reviewed.

### v0.3 — 2026-10-26

- FROZEN: Page 00 First Launch with no introductory/marketing/privacy copy.
- FROZEN: app-wide copy/density rule: normal screens display only functional information; no duplicated actions; no healthy-state status noise.
- FROZEN: attempt storage persistence as part of the Start gesture where supported; show result only in Settings.
- PROPOSED: Page 01 compact, one toolbar, one search, one filter, dense procedure rows, no bottom navigation, single `+ New` action.
- Removed leftover repetitive explanatory text from Details, Guided Run, and Backup screens; safety-critical warnings and errors remain visible when they matter.

## 14. Reference reading

- Storage quotas and persistence: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Persistent storage request: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- WCAG 2.2: https://www.w3.org/TR/WCAG22/


## 15. v3.4 PAGE 10: SINGLE GLOBAL UI SCALE (PROPOSED; PAGE 10 BASIC LAYOUT FROZEN)

### 15.1 One scale, not separate text or density controls

- **One** visible Settings row, named `UI scale` (`Scala interfaccia`), replaces the v3.3 proposed `Procedure text size`, `UI text size` and `UI spacing` settings. Do not leave separate user-facing density controls.
- The experiment's sole slider is measured in user-visible point-equivalents: `baseTextPt = 4..48` (1pt steps), with **proposed** default `13 pt`. The stored preference is a single scalar. 1 typographic pt = 4/3 CSS px by CSS conversion, but this does not imply physical millimeters on mobile displays.
- Keep hierarchy **additive, not proportional**: App and ordinary button/body text = `baseTextPt`; major page titles = `base + 4 pt`; prominent step/question headings = `base + 3 pt`; notes/captions = `base - 1 pt`; metadata/badges = `base - 2 pt`. These exact offsets remain proposed; they are stable for all slider positions and remain positive at minimum 4pt. The content text itself is never rewritten.
- Container geometry changes with the same base: in the baseline experiment, `scale = base / 13`; ordinary button target height follows an intrinsic content-and-padding formula, with a 24 CSS px hard minimum; media/step action height is similarly content-driven. Icon dimensions, ribbons, card radius, control padding, item gaps, headers and group rows grow or shrink smoothly. No fixed-height text-bearing card.
- Discretionary spacing decreases toward **0px at 4pt**, with minimal residual border/padding for containment and input target separation. It grows with scale but is **capped by usable viewport width** for readability and to prevent giant gutters on narrow screens. Therefore a single slider controls the whole visual scale, even though geometry is not a mathematically uniform image zoom.
- No `transform: scale()` on the entire document. Scale layout tokens (CSS custom properties), recompute real layout sizes, reflow text, and allow vertical expansion as needed. Preserve browser/OS font enlargement and zoom.
- Retain an always-usable `Reset to 13pt` action in Page 10 (plus recovery affordance if the imported scale makes Settings difficult to navigate). The standalone test panel is intentionally unscaled to keep this reset usable; it is not part of the production app UI.
- **Very small text is not clinically safe by default**: `base < 9 pt` displays a contextual readability warning in Settings, not repeatedly on Guide. 4pt is a stress-test option rather than recommended practice; below 24 CSS px touch targets are forbidden in the experiment and larger targets (44-48 CSS px) should be considered for the production Guide. WCAG 2.2 AA 2.5.8 has a 24x24 CSS px target baseline with specified exceptions; 44px remains a better practical target. Production clinical testing still required.
- At 30..48pt on a narrow phone, the app may stack header buttons, expand one-column gallery cards, move the previous vertical passive activity marker into a full-width passive bar, and allow tall vertical scroll. No content overlap or horizontal bleed. The default-sized frozen Page 03 branch marker remains left vertical.
- Library Recent stays at three quick shortcuts in one horizontal scrollable row with titles truncated by design, and never forces the remaining Library offscreen. Important instructions, notes, warning labels and outcome text may NOT be silently clipped; they wrap.
- Step-specific author-chosen media layout and image compression settings remain independent; the global UI scale only affects their containing UI/chrome, not stored image bytes or graph content.

### 15.2 Settings UI controls and changes

| Element | Action |
|---|---|
| `UI scale` row | Opens a single-slider sheet, current value and live preview |
| Slider 4..48 pt | Updates the shared font and layout token set immediately, while preview remains visible |
| `Reset to 13 pt` | Restores experimental baseline for UI appearance only |
| Accessibility warning | Appears below 9pt and includes Reset affordance |
| App screens | Re-render at current scale without reloading, losing graph/session state, or modifying authored strings |

- All other frozen Page 10 settings remain: global language, theme, image-addition soft cap, compression defaults, Backup & Restore, persistent-storage information, app updates, and Advanced controls. The earlier `Normal/Large` setting is superseded by this one scale.
- The selected scale is a global app preference and is included in Settings-only and Full backup. Importing it is an ordinary settings replacement and must have prior confirmation, not an unrequested change on file selection.

### 15.3 Test acceptance and limitations

- Browser prototype: `nurseflow-ui-scaling-preview-v3.4.html`, offline with no dependencies. Preview three representative frozen screen types: Page 01 Library, Page 03 Guide, Page 10 Settings. One slider controls all visual tokens.
- Visual regression tested in headless Chromium at viewport widths **320, 390, 768 and 1280 CSS px** and values **4, 8, 13, 20, 30, 48pt**, visiting all three preview screens; script detected no horizontal overflow of active screen containers after adaptive reflow patches. Screenshots at 4, 13, 30 and 48pt were generated for visual review.
- Very high values produce very tall pages and may break long words to fit a narrow device. This is preferable to clipping but may be hard to use operationally. Final limits/defaults should be user-approved after testing real phone content.
- Production acceptance needs iOS Safari, Android Chrome, browser zoom 200%, reflow to 320px at 400% zoom, keyboard and screen readers, long localized content, optional large media, and actual touch-target usability. Do not claim WCAG conformance from one browser prototype.

## 16. v3.4 PAGE 11: BACKUP / RESTORE AND IMPORT SEVERITY (FOUR SCOPES CONFIRMED; UI PROPOSED)

### 16.1 Scope and mutation policy (THIS RULE OVERRIDES v3.3)

| Backup type | Export includes | Import commits |
|---|---|---|
| Single procedure | Selected procedure and Draft/Ready versions, graph, notes, media and its own metadata | **ADD ONLY**: create independent procedure with new IDs; never replace/delete existing procedure or rewrite existing groups |
| Full library | All current procedures, archived, groups, tags, notes, local media, favorites and versions | **ADD ONLY**: create independent copies and groups, preserve existing library exactly; same-name collisions can coexist |
| App settings only | Global language, theme, UI scale, image limits/compression, app-only preferences and optionally named profiles; no procedures/runs | **REPLACE ALLOWED** only after showing old/new values and confirming `Replace settings`. Do not change app preferences merely by choosing a file |
| Complete backup | Library + settings + saved in-progress sessions and their pinned revisions/media | Library **ADD ONLY**, imported run snapshots receive new IDs and do not overwrite active sessions, settings may optionally **REPLACE** with separate opt-in and explicit confirmation |

- Ordinary user-initiated Delete on a procedure remains governed by already-frozen Page 02; this rule protects the **import process** from destructive changes, not the entire app from intentional deletion.
- Page 11 Import detects package scope from a verified versioned manifest and previews changes. It must never guess an import category solely from the extension or file name.
- For Settings-only: show a compact **Current -> Imported** comparison table for differing fields; button `Replace settings...` opens a second confirmation dialog with `Cancel` and `Confirm replacement`. The existing inactive-profile-only behavior of v3.3 is not mandatory. Optional `Save as profile` is future scope, not required for this confirmation path.
- For Full backup: library records are added regardless, saved sessions are added as separate restored copies, and `Replace current settings` is **unchecked by default**. Turning it on shows the settings diff and requires explicit confirmation. Leave the existing settings active if it remains unchecked.
- Device-specific browser permissions (persistent-storage grant, install status, service worker registrations, OS authorizations) are not imported and must never be described as application settings that can be overwritten by a backup file.
- A settings replacement does not alter any authored procedure metadata, graph, Ready version, pictures, or ongoing run decisions. Display settings may immediately re-render the same active screen under the new global scale or theme; provide a one-action return to previous settings when practical.

### 16.2 Four-scope Page 11 screen behavior

- Header: Back, `Backup & Restore`; two modes `Export` / `Import`.
- Export: one of four categories and a procedure selector only for Single procedure; export file offline with schema/format version and self-contained binaries for local media. External URLs are saved as links only, no automatic downloads.
- Import: choose local backup; read-only validate manifest, checksums, archive paths, schema versions, and quota before commit. Show exact new procedure/group/run counts and the settings-change table if any.
- After settings-only confirmation, current Settings values are changed in a local storage transaction. On Full backup, stage library additions and sessions safely first, then apply replacement settings only if explicitly approved; if any stage fails, no false success claim and pre-existing library remains untouched.
- A procedure ID collision must remap every graph node/edge, media ref, Ready/Draft revision, linked outcome, multitask arm and pinned run snapshot. Never connect an imported graph to an unrelated existing local node.
- Detect corrupt, invalid or malicious package content without executing HTML or scripts from backup files. Guard against decompression bombs and oversized assets. Remote URLs are never fetched automatically during import.
- User intent to replace settings does not authorize replacing procedures, groups, media assets or active sessions.

### 16.3 Exact mock interactions and test matrix

1. Preview Settings-only import: show current Italiano/Light/13pt/Medium vs imported English/Dark/20pt/High; selecting `Replace settings...` opens explicit confirmation. Cancel leaves settings intact; Confirm changes only preference values. The prototype simulates this visibly.
2. Import Full with its settings checkbox OFF: adds new library copies + restored session copies; current language/theme/scale remain unchanged. ON: shows settings diff and explicit replacement prompt; library remains add-only.
3. Import same Single procedure three times: three new independent procedures; old one never modified or deleted.
4. Import Library with colliding IDs/titles, including nested graph and media refs: all new references remapped, existing graph/runs remain unchanged.
5. Settings replacement failure: maintain previous settings or recover prior snapshot, report Retry rather than success. A UI-scale import that makes navigation difficult must retain a Reset action.
6. Browser offline: export and import work; no unrequested cloud request. Import must be deliberate and clearly identify which preferences are to be replaced.
7. Visual: Page 11 itself responds to the one global UI scale, including layout reflow, accessible focus and stacked action buttons when space is limited.

### 16.4 Freeze ledger as of v3.4

- **FROZEN:** Pages 00-09; Page 10 base row-oriented layout; four export/import categories; Page 01 three Recent shortcuts; all graph semantics and Page 09 warning classifications.
- **CONFIRMED:** Library import always additive; settings import is allowed to replace ONLY with preview and explicit notice/confirmation; one slider controls both text and the geometry of the entire UI.
- **PROPOSED VALUES TO REVIEW:** `baseTextPt = 4..48`, default 13; typography offsets +4/+3/-1/-2; viewport-safe geometric scale; Page 11 precise copy and import confirmation dialogs.
- **NOT YET A PRODUCTION APP:** The linked local HTML is a self-contained UX prototype, not real ZIP/JSON import/export or IndexedDB-backed runtime.

**Reference design reading:** WCAG 2.2 Target Size https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum ; Resize Text https://www.w3.org/WAI/WCAG20/Understanding/resize-text.html ; Reflow https://www.w3.org/WAI/WCAG21/Understanding/reflow .


## 17. v3.5 APPROVED PAGE 10 FREEZE / PAGE 11 DESIGN FOR REVIEW

### 17.1 Page 10: final frozen settings scaling contract

- Page 10's Settings navigation/layout and controls are FROZEN. The user APPROVES and FREEZES the single `Scala interfaccia` / `UI scale` slider **4..48 pt (integer), default 13 pt** as demonstrated in v3.4.
- Apply a shared *base point size* to all visible app components. Fixed absolute typography offsets: major titles +4 pt, step/question heading +3 pt, normal body/control text = base, notes/captions -1 pt, metadata/badges -2 pt. No separate text size or UI density settings; do not switch to multiplicative font hierarchy.
- Padding, margin, line-height, icon/badge/card/ribbon/container dimensions, controls and whitespace respond to the same slider in a coordinated, fluid fashion. At base 4 pt discretionary whitespace is almost zero; labels and interactive touch areas still have intrinsic minimums and focus affordances. Card heights must be content-driven (not fixed). At larger scale the layout wraps, stacks and vertically scrolls rather than truncating important clinical content or bleeding offscreen.
- Provide `Reset to 13 pt` and a robust recovery path if user selected an extreme scale or imports a new one. Respect OS/browser zoom. Imported scales change only after the Settings replacement confirmation. Previously frozen content, procedures, decisions and session history remain unchanged by scaling.
- All 24 combinations from the v3.4 Chromium test (4/8/13/20/30/48 pt at 320/390/768/1280 CSS px) completed without reported horizontal overflow of the representative Library/Guide/Settings screen containers. This is mock-based testing; production requires real-device accessibility QA.

### 17.2 Page 11: layout and navigation (PROPOSED)

- Entry: Page 10 `Backup & Restore`; header Back / `Backup e importazione`; two equal-width segmented modes `Esporta` and `Importa`. No bottom navigation; no educational onboarding block.
- At top, a concise offline/local-data cue and `Ultimo file preparato` date (or `Mai`). A download/Share action cannot guarantee the user saved a safe external copy; never claim backup is securely completed.
- Export mode: four full-width, selectable rows/cards, single choice: `Una procedura`, `Tutta la libreria`, `Solo impostazioni`, `Backup completo`. Each has a short scope description and a selected state. A procedure picker appears **only** for `Una procedura` and can use search when the library is large. Show compact preview counts, approximate file size if trustworthy, local media included and remote URLs stored only as links; then `Prepara file` calls device native Save/Share/Download. File names should include type and ISO date with a unique suffix; actual format versioned and self-describing.
- Import mode: `Scegli file` uses native local file picker. Validate package format/version, manifest/integrity, references, content limits and available storage *before* showing preview. Never assign scope by file extension or filename. Preview displays package type, export timestamp, item counts, affected collections and warnings; one main button is enabled only after successful verification. `Cambia file` and `Annulla` leave state unchanged.
- In mobile UI, import review flows vertically in one scrollable column with sticky action area only when it does not occlude content. Confirmation modal/sheet is reachable by keyboard and screen reader and reflows under global 4..48pt scale.

### 17.3 Scope-specific preview and confirmation (PROPOSED)

| Package scope | Import preview text | Primary action | Protection |
|---|---|---|---|
| Single procedure | `1 procedura da aggiungere`; imported title and optional same-name badge | `Aggiungi procedura` | New self-contained procedure ID/graph/asset refs. Do not replace an existing procedure |
| Full library | `N procedure`, `G gruppi`, duplicate title count, media total | `Aggiungi alla libreria` | Add independent copies of groups and procedures; existing content unchanged |
| Settings only | Current vs imported values for changed fields: language, theme, 4..48pt UI scale, photo quality, media add limit, etc. | `Sostituisci impostazioni…` | **Second explicit confirmation** `Conferma sostituzione`/`Annulla`; no procedure mutated |
| Complete backup | Library additions + saved session copies, and Settings comparison only when opted in | `Importa backup` | Library and runs always add copies; `Sostituisci anche le impostazioni` is OFF by default and requires separate confirmation |

- When naming collides, display `Nome già presente — verrà aggiunta una copia`; avoid automatic merging and no uncontrolled overwrite. Remap imported IDs consistently across revisions, node links, outcomes, note/media, phase memberships, group membership, galleries, Ready/Draft snapshots and saved sessions. Imported procedures and sessions never silently bind to existing unrelated graph nodes.
- Treat imported broken remote image URLs as metadata and never fetch them during import; indicate remote links need connectivity at display time. Missing or corrupt local image bytes must be surfaced in preview with counts, never falsely claim media restored; if a procedure is still structurally importable, follow Page 09 W07 visibility rather than silently omitting referenced images.
- If Settings replacement is selected during Complete import, show exactly which preferences will change. `Annulla` on replacement confirmation should leave the settings unchecked and proceed with **add-only library/session import only if the user separately confirms**. Never treat dismissal as acceptance of adding records.
- Native import is offline; keep existing data intact if validation, disk capacity, or transaction fails. Stage and validate data, then commit library/session additions transactionally; apply settings changes only after explicit separate confirmation and with a recovery snapshot/rollback, avoiding partial reports.
- Importing the same file repeatedly adds another independent copy. If package contains already-authored Ready snapshots, preserve bytes and provenance but **do not claim the content has been clinically certified**. Whether exact restored Ready flags retain their status or require local re-check is a UX choice to confirm in Page 11 review, because historical text proposes a fresh local Check.

### 17.4 Safety and usability acceptance (PROPOSED)

1. Export One/Library/Settings/Complete must each include exactly their declared scope. Complete includes saved in-progress runs/pinned snapshots. Neither browser cache nor browser OS permissions can be ported.
2. Import One twice: two additional procedure records, not one replacement. Import Library: adds groups and procedures without altering existing groups, active procedures, existing media, or active sessions.
3. Select a Settings import: show a read-only comparison **before** any mutation. First replacement action opens a distinct confirmation; cancel results in no setting change; confirm changes only preferences, even if UI scale becomes 48pt.
4. Select Complete: settings replacement OFF initially; importing it adds library and run copies without changing active settings. ON shows exact diff and separate confirmation. Cancel/abort cannot result in silently changed settings.
5. Malformed manifest, ID graph corruption, missing data, unsupported future version, unsafe path or zip bomb: block or safely downgrade invalid media under the existing warning rules with clearly differentiated outcomes, report what was or was not imported, never execute embedded code.
6. End-to-end mock must not pretend to actually export/import data: simulation labels are mandatory. Production Save/Share must not assert that files were persisted externally without verification.
7. UI scale 4 and 48, 320/390px, Italian/English, oversized localized filenames, huge counts, focus and keyboard navigation: zero unintended horizontal bleeding, clipped critical text or blocked confirmation buttons.

### 17.5 Ledger after v3.5

- **FROZEN:** Pages 00–10, including exact 4..48pt single global UI scale/default 13pt and fixed typographic offsets; four import/export scopes and protected additive procedure library imports; Settings can replace after explicit warning/consent.
- **PAGE 11 UNDER REVIEW:** card layout/tabs, export/import buttons and confirmation screens, precise Ready import behavior and optional session restoration interaction.
- **NEXT:** Page 11 approve/adjust and freeze, then evaluate any remaining cross-screen consistency and implementation acceptance tasks.


## 18. v3.6 PAGE 11 SPLIT: PROCEDURES/LIBRARY VS APP BACKUPS (LATEST PRECEDENCE; UX PROPOSED)

### 18.1 Settings navigation: narrow confirmed amendment to frozen Page 10

Replace the former single `Backup & Restore` Page 10 Settings row in the `Local data` section with two distinct primary navigation rows (no nesting or extra menu):

| Settings row (Italian / English) | Opens | Scope |
|---|---|---|
| `Procedure e libreria` / `Procedures & Library` | `/#/data/procedures` — Page 11A | Export and import **individual or multiple procedures and groups / a full library** |
| `Backup app e impostazioni` / `App Backup & Settings` | `/#/data/app` — Page 11B | Export and import **Settings only / Complete backup** |

Keep Page 10's frozen ordinary settings and scaling behaviors unchanged, except for these two navigation actions. Both routes use existing Back behavior to Page 10. No bottom navigation. Full local/offline capability. On wrong-package detection, provide an explicit in-app cross-route action; don't silently import the other kind.

### 18.2 Page 11A: Export procedures and library

**Top:** Back, `Procedure e libreria`; segmented `Esporta` (default) and `Importa`; no separate settings/full backup cards. The procedure list is based on ACTUAL current Library records and includes all groups and their memberships, not an unlabeled numerical picker. The default has zero procedures preselected; the separate full-library shortcut is always clearly visible.

1. Prominent compact `Esporta tutta la libreria` button/card above the picker, offering one-tap access to all procedure/library data without manually selecting each item. If the user hits it, show the total N procedure count and export readiness/size warnings where applicable; current manual selection does not change.
2. Below is `Scegli le procedure` with the same Library search semantics as Page 01: title, aliases, keywords/tags/labels, group identity and searchable procedure text (authored step names/content when locally indexed). Give compact search input and independent `Gruppo` and `Etichetta` filter controls; all combinations are conjunctive. Search remains local and fully offline.
3. Procedures are arranged by group with readable names, Ready/Draft indicator, compact tag chips and a direct selection checkbox. Inline `Anteprima` opens read-only procedure identity, structure/map and step content (reusing frozen Page 02/05/03 read-only presentation; never run, edit or mutate a procedure from selection UI).
4. A `Seleziona gruppo` / `Deseleziona gruppo` control at each group header selects/deselects all procedures in that group, even when a current keyword/label filter hides some, and the selection count updates accordingly. A group is clearly named, and the all-group behavior is not confused with `Seleziona visibili`/`Deseleziona visibili`, which act ONLY on current filtered rows. Clarify hidden selections via `N selezionate / M visibili` count. Selecting/deselecting a filter MUST NOT reset selection.
5. Sticky mobile footer (only if it does not occlude important content): `N procedure selezionate` + `Esporta selezione` disabled at N=0. Exactly 1 -> self-describing single-procedure package, >1 -> library/collection package with only those procedures and required groups. Individual format stores complete procedure graph, notes, metadata, Ready/Draft revisions, and local media bytes; remote media remains URL metadata. Multi export includes only the selected subset and group metadata needed to retain memberships; it is not a Settings backup.
6. The full-library shortcut also includes groups and all their procedures, including current group metadata. Avoid silently exporting active saved sessions from this procedure-selection screen: sessions belong to Complete backup unless a separately user-approved session option is added later.

**Selection and filter edge cases:** Removing an applied filter reveals all previously selected procedures; a selected row that becomes hidden continues counting. If a group is empty or permissions/storage error prevents reading procedures, display a truthful empty/error state, not an apparently successful export. Group/category filtering shouldn't load thousands of choices into a single unsearchable list; use searchable filters / sheets if a library is large. `Recent` shortcuts from Page 01 do not need their own selection rows; procedures are canonical entries shown once.

### 18.3 Page 11A: Import one or multiple procedure/library files

1. `Importa` tab: native chooser `Carica uno o più file` supports selecting MULTIPLE compatible packages at once; drag and drop may be offered on desktop but is not mandatory on mobile. Files may be mixed single-procedure and library packages. The first action is read-only: load, validate, and stage import candidates without writing into existing Library/Settings.
2. Detect type using a self-describing/versioned manifest and validated content, NOT extension alone. Allow only `procedure` or `library` here. Settings-only / Complete-backup packages are REJECTED, not partially imported, and shown in-line by name with reason and button `Vai a Backup app e impostazioni`. Corrupt, invalid, unknown future schema or unreadable files are separately flagged; never call them Settings files without evidence. Each rejected file is individually described; accepted files in a multi-file batch remain available for review.
3. Successful files contribute to an aggregated list of candidate procedures, grouped sensibly by group (with source file name always available on each candidate). **All valid procedures from all successfully loaded files start SELECTED.** User can uncheck any individual procedure, entire group, or filtered visible subset; counting covers candidates across all loaded files. A newly added file adds its valid candidates selected without changing earlier selections.
4. Provide the SAME full-text search and `Gruppo` / `Etichetta` filters as Export. Search index includes authored title, aliases, local procedure text, keywords and labels as available in the parsed package. Multi-file duplicate names and apparent local title conflicts show `Nome già presente: sarà aggiunta una copia` or `Nome ripetuto nel batch`; they are NOT collapsed or merged automatically.
5. `Anteprima` is available beside every candidate, before import, whether selected or not. It opens read-only title, source package, group/tags, count, step summary, Decision/Multitask graph topology and media presence. This can invoke frozen Page 05 graph and Page 03 styled preview in read-only state; it must NOT start or overwrite an active run. The preview must be accurate to imported parsed content and not a fabricated example in production. Closing preview returns to the same filters, scroll and selection.
6. Sticky `N procedure selezionate` / `Importa le procedure selezionate`; disabled if none. Confirmation explicitly states number of new procedure records, any newly created groups, duplicate names, estimated local asset volume, and `Aggiungi come copie — nessun dato presente verrà sostituito`. Cancel leaves all data unchanged. On Confirm, remap all incoming procedure/graph/revision/media IDs and group references consistently and add new independent records only. Only groups needed by selected procedures should be created; existing local groups are NEVER modified or replaced. Keep imported groups distinct even if their visible names match existing groups; disambiguate or offer later user-initiated regrouping outside import.
7. After success, show actual imported count, skipped/excluded count and problems; offer `Vai alla Libreria` / `Importa altri file` (optional). An import of the same package again creates additional copies, never merges with previous imports. Failed transaction reports what was or was not committed; prefer atomic batch insertion when feasible, otherwise durable per-file/per-batch accounting without false all-success status. Existing library and live runs are protected even when media quota is exceeded.
8. Security: locally verify archive safety/manifest/checksums, graph and resource references; no executable user-authored HTML or JS, no remote URL fetch on file selection, guard against zip bombs, huge asset counts or memory exhaustion. Missing validly referenced image bytes follow the established W07 warning behavior if safe import is possible; do not claim image restoration succeeded. Missing graph destinations follow W08 warning only when they are truly deleted references; newly unassigned required paths are not silently forgiven. Public release must have complete integrity tests.

### 18.4 Page 11B: App Backup & Settings

This is the earlier v3.5 compact `Esporta` / `Importa` design **restricted to just two scopes**:

- **`Solo impostazioni`** export or import: language, UI scale 4–48pt, theme, media preferences and app-only settings. Before importing, show Current → Imported comparison, then a **separate explicit confirmation** to replace settings. No procedure is added, deleted or edited.
- **`Backup completo`** export or import: complete procedure library and groups/media, settings and locally saved in-progress sessions with pinned versions, excluding PWA cache and browser OS permissions. On import, library/groups/sessions are added as independent copies; `Sostituisci anche le impostazioni` remains OFF by default. If enabled, show the comparison and obtain distinct replacement consent. On cancel, settings stay as they are; do not silently proceed with additions without user confirmation.
- A `procedure` or `library` file selected here is **rejected** with a clear message and actionable `Vai a Procedure e libreria` link. Never reroute/commit silently. Each package is classified from its manifest, not name/extension only.
- Keep v3.5 transactional data-integrity and size checks. Clearly state that a backup exported to the Downloads dialog is only *prepared* until browser download/share completes.

### 18.5 Versioned file format and scope routing

Prefer documented, versioned and discoverable package kinds: `procedure` (one), `library` (one or more), `settings` and `full`; a canonical manifest field (e.g. `packageKind`) plus `formatVersion`, `exportedAt`, counts/hashes and media payload. The final format may be JSON or a binary archive depending on asset size, with explicit size/streaming caps. Suggested extension nomenclature: `.nfproc`, `.nflib`, `.nfsettings`, `.nfbackup`; extension is only a UX cue, never the source of truth. A user can choose one file from each of several exports or multiple library files in 11A. A `full` backup is NEVER accepted in 11A as a shortcut to importing just its contained procedures: do not silently split the package; show the correct destination.

**Imported Ready status NOT FROZEN:** The preceding v3.5 discussion suggested preserving imported Ready snapshots as historical provenance but requiring a fresh Page 09 `Check & Mark Ready` before using the imported procedure as Ready. The user has not yet accepted or rejected that separate behavior. Do not imply it is user-approved; review when finishing Page 11 acceptance.

### 18.6 Proposed Page 11 acceptance tests

1. Page 10 displays TWO separate storage/data rows, each reaching the correct path and Back returns to Page 10 without editing preference state.
2. Export: select one checkbox -> exactly one `.nfproc` equivalent; select a second -> multi-procedure `.nflib`; select a group and verify every procedure in that group is included even when a label filter hides some. `Select visible` affects only currently filtered rows. One-tap `Export entire library` includes all procedures independent of manual selection.
3. Load 2–3 valid procedure/library files in the same batch, import preview shows all candidate procedures selected; deselect several by individual or group, filter by text and group, open preview for a deselected row, return with selection/scroll preserved, and import only selected items.
4. Import a `.nfsettings` plus a `.nflib` into 11A: library file remains available in the staged candidates; Settings file is rejected with correct explanation and Page 11B navigation; no settings changed. Conversely `.nfproc` in 11B is rejected with Page 11A navigation.
5. Confirm same-name imported records generate independent local IDs; existing groups, Ready revisions, local media and active runs must be unchanged. Import twice adds another copy.
6. At any import confirmation, Cancel or validation failure must leave the local library identical to before. If transaction fails, do not present successful import and do not mutate existing records.
7. Global Page 10 `UI scale` applies to both 11A and 11B. At 4, 13, 30, 48pt across 320/390px widths, no uncontrolled horizontal scroll, bleeding, clipped critical labels or inaccessible footer buttons. Test localized text, long file names, huge multi-file list and keyboard-only dialog operation on production devices.
8. Full backup with settings toggle OFF adds library/run copies but retains settings; when ON, Current→Imported diff and separate consent are mandatory. A Settings-only import changes settings only after explicit confirmation.

### 18.7 Freeze ledger / artifact

- **FROZEN:** Pages 00–10 existing detailed UX and the 4..48pt global UI scale. The requested replacement of one Page 10 navigation row with two is **CONFIRMED narrow user direction**, not an invitation to revisit other Settings controls.
- **CONFIRMED DATA POLICY:** Import of procedure/library packages is always additive; Settings-only or settings portion of a full backup may replace current settings only after clear preview and explicit confirmation.
- **PAGE 11A AND 11B UI PROPOSED, NOT YET FROZEN:** Two distinct destinations, actual list selection for exports, search/filter by group/label/keyword, select all a group/visible, multi-file staging, default-all-selected candidates, individual procedure preview, rejection+cross-navigation for wrong scopes; user to review.
- **PENDING:** Imported Ready activation semantics and end-to-end physical-device validation of the new page.
- **PROTOTYPE:** `NurseFlow_Procedure_Libreria_v3.6.html`, offline static HTML interaction; all export/import operations and procedure contents shown are simulations. Do not use it as a real backup utility.


## 19. v3.7 FINAL WHOLE-APP CONSISTENCY REVIEW (UI FREEZE COMPLETE)

### 19.1 Freeze ledger — authoritative as of 2026-10-29

| Page | Status | Essential contract |
|---|---|---|
| 00 — First launch | **FROZEN** | Minimal local-first start; persistence attempt if supported |
| 01 — Library | **FROZEN** | Groups, tags/labels, search, aliases, priority and favorites; three compact Recent shortcuts |
| 02 — Details | **FROZEN** | Correct Ready vs working Draft entry points; revision-aware Map/Edit/Start |
| 03 — Guided procedure | **FROZEN** | Exactly one visible step, OR exclusive outcomes, all-required multitask arms, route history, Back and persistent pinned run |
| 04 — End | **FROZEN** | Four authored End types, including early Stopped/Escalation; no clinical safety inference |
| 05 — Map/List | **FROZEN** | Read-only graph and DAG list, correct run snapshot, no navigation side effects |
| 06 — New procedure | **FROZEN** | Create working Draft without prematurely publishing a Ready version |
| 07 — Flowchart builder | **FROZEN** | Outline + Graph, Undo/Redo, contextual insert/link, new-node creation, direct shared convergence, no visible joins |
| 08 — Step editor | **FROZEN** | Text, notes, alerts, outcomes and media, live preview; path changes via graph context, no huge destination dropdown |
| 09 — Validate & Ready | **FROZEN** | Problem vs Warning taxonomy, W07 missing local image, W08 deleted-target ref, personal check and immutable Ready |
| 10 — Settings | **FROZEN** | Language/theme/photo/media preferences; one entire-UI 4–48pt scale (13pt default); TWO data entry rows |
| 11A — Procedures & Library | **FROZEN** | Select/search/filter procedures for export; multi-file additive import with read-only preview |
| 11B — App Backup & Settings | **FROZEN** | Settings-only and Complete packages; separate explicit Settings replacement consent |

This is the **design freeze**, not proof of runtime implementation, accessibility conformance, regulated approval, or reliability. The imported Ready policy is approved for both 11A and 11B: valid, structurally loadable Ready snapshots stay usable Ready, without a compulsory local re-check.

### 19.2 End-to-end cross-screen journeys — acceptance checklist

| ID | Journey | Expected end-to-end result | Status |
|---|---|---|---|
| E2E-01 | First install → Settings → Library | App usable locally; language/theme/UI scale retained; no forced tutorial or login | Spec-consistent; implement/test |
| E2E-02 | Library → New → Builder | A new Draft is created, autosaved and visible as a Draft in Library/Details; no Start Ready action yet | Spec-consistent; implement/test |
| E2E-03 | Builder Decision outcome → `+` → `Create next step` | The new target node is created and linked atomically, then opened in Step Editor; no pre-existing step is required | Spec-consistent; implement/test |
| E2E-04 | Decision outcome → `End procedure here` → Stopped/Neutral | A real authored End is created; intentionally short routes pass validation when complete | Spec-consistent; implement/test |
| E2E-05 | Multitask two activities → `Finish this activity` per arm → one shared continuation | No visible join node; only all-required-complete reaches common Next; explicit whole-procedure Stopped/Escalation exception does not mark other arms complete | Spec-consistent; implement/test |
| E2E-06 | Draft Check → W07 / W08 vs P02/P04 → Ready | Missing local image and historical deleted destination are warnings; never treat broken target as End. Unassigned authored outlet blocks Ready. Immutable Ready is committed only on durable transaction | Spec-consistent; implement/test |
| E2E-07 | Start Ready → choose OR → Back → different outcome | New path history, count and prior-step cue update; incompatible future path discarded; active pinned run and saved state remain consistent | Spec-consistent; implement/test |
| E2E-08 | Run → Map/List → Back → Resume after app restart | Map does not mutate cursor or choices; active run resumes same immutable graph revision and progress | Spec-consistent; implement/test |
| E2E-09 | Settings UI scale 4pt → 48pt → navigation | All text, containers, cards, touch targets, badges and spacing reflow together; no overlap/clipped critical text; Reset 13pt accessible | Spec-consistent; real-device QA required |
| E2E-10 | Settings → Page 11A Export → filter/select group + hidden selections → package | Export includes exactly selected procedures regardless of current filters; one yields procedure package; several yield library package; full-library shortcut independent | Spec-consistent; implement/test |
| E2E-11 | Page 11A Import two valid files + wrong-scope file → preview → deselect → import | Invalid-scope file refused with 11B route; valid candidates default selected, deselection/filter persisted; final import adds independent copies and never edits existing records; verified imported Ready remains usable Ready | Spec-consistent; implement/test |
| E2E-12 | Page 11B Settings only or Full → compare → approve/reject settings replacement | Settings-only may replace only with explicit confirmation; Full adds procedures/groups/runs as copies and preserves valid Ready; Settings replacement OFF by default; no implicit mutation on dismiss | Spec-consistent; implement/test |
| E2E-13 | Export local image/remote URL → import → offline run | Embedded local media round-trips; remote URLs stay URLs; missing blob W07 shows unavailable placeholder, not false success | Spec-consistent; implement/test |
| E2E-14 | Saved deleted-target W08 on a Ready run | Route follows to `Path unavailable`, with Back/Map/confirmed Exit and intact pinned session, never silent skip or finished state | Spec-consistent; implement/test |
| E2E-15 | Import same names/package repeatedly, including group names | New independent graph/asset/procedure/group IDs for every imported copy; existing library unaffected; no accidental sharing of mutable references | Spec-consistent; implement/test |
| E2E-16 | Browser quota/storage transaction failure during edit, Ready, export or import | No false successful write/backup claim; existing content protected, Retry/export/recovery path appropriate to failure; report exactly what committed | Spec-consistent; implement/test |

**Audit finding:** User-approved screen flows are mutually compatible when latest precedence is applied. Several older historical paragraphs still say `Page 11 proposed`, separate text/density sliders, `Settings import as inactive profile`, or `End always invalid inside incomplete multitask`. Those are superseded by the v3.7 top-level precedence and must **not** be implemented. Developers should normalize the specification before coding instead of treating the historical change log as equal authority.

### 19.3 Final imported Ready policy — FROZEN for 11A and 11B

**User decision, confirmed 2026-10-29:** A valid imported procedure with an immutable Ready version retains **usable Ready** status immediately in BOTH Page 11A (procedure/library package) and Page 11B (complete backup). Neither import workflow forces a new manual Check & Mark Ready solely for import. An imported Draft remains Draft. A user can voluntarily open Check & Mark Ready later; this is optional.

**Prerequisites and safety boundaries:** The import must safely validate file type and version, media/archive limits, references and graph migration, and locally check whether the Ready revision is structurally loadable. Invalid, unsafe, or unsupported packages are rejected with a clear reason before any persistent changes, not accepted as implicitly approved procedures. W07 missing local image and W08 old deleted-node destination retain their approved **Warning** severity: they do not on their own downgrade an otherwise valid Ready revision; missing media show unavailable placeholders, and broken paths interrupt safely without masquerading as an End. Other blocking structural failures cannot be used as usable Ready. Import does not claim clinical correctness or third-party approval.

**Always additive for library contents:** Imported procedure, ready revision, graph and media IDs are remapped coherently into new independent copies; existing library entries and active runs are not replaced or mutated. For a complete backup, imported saved runs are also independent copies with correctly remapped pinned revision identifiers. App settings have separate opt-in replacement behavior as specified in 11B. Any user-visible `Imported` cue identifies origin and does not restrict `Start Ready`.

**Acceptance test:** Reimport a Ready procedure twice via 11A and once via 11B; three separate new entries retain usable Ready and no existing record changes. Reimport a Draft; it remains Draft. W07 and W08 remain warnings with their safe-runtime behavior; malformed or unsafe packages do not partially import. No compulsory recheck is displayed in any of those successful Ready imports.

### 19.4 Implementation-stage guardrails, not new UX proposals

1. **Source-of-truth graph revisions:** Separate working Draft, immutable Ready snapshots and pinned active-run revisions. Full backup/run copies must remap all IDs and preserve internal references. Import cannot mutate an old procedure or active run.
2. **Three route-terminal conditions:** valid authored End; explicit activity completion (internal-only, not Page 04); recoverable broken-path interruption (W08, not End). Do not conflate them.
3. **Validator precedence:** W08 existing broken historical link MUST be excluded from P02/P04/P05/P11 double-reporting; an actually unassigned authored outlet remains a Problem. W07 missing blob cannot be escalated to P12 solely because its asset is gone.
4. **No imported content execution:** Escape all display text and metadata. No user-script or external HTML execution, no unexpected network access from file selection; parse and resource-limit archives before staging.
5. **Export is not a verified remote backup:** A prepared download/Share handoff does not prove a file was saved outside browser-managed storage; label status accordingly.
6. **Offline and personal data:** Default operation requires no network and no patient identifiers; browser storage may still be evicted or unavailable. Make actual persistence state and recovery actions truthful.
7. **Scale and media:** 4–48pt global sizing is one user preference, not per-component overrides. Preserve touch/focus safety and full media/content layout under extreme sizes.

### 19.5 Next phase and freeze boundary

**Completed:** UX/UI page-by-page freeze of Pages 00–11, including Page 11A/B.

**Closed product decision:** Imported Ready activation policy is frozen for both 11A and 11B (§19.3).

**Next:** Produce an implementation-ready normalized functional specification, data schema/transaction boundaries, router state machine and prioritized automated + on-device acceptance tests. The current HTML files remain static UX demonstrations only. No production application has yet been generated by this spec revision.
