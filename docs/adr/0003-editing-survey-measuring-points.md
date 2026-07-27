# Editing CSAT survey: measuring points, edit definition, and Intercom-owned gating

We show an editing-experience CSAT survey when a user who made at least one Content Edit (see CONTEXT.md) ends that editing burst — by successfully publishing/scheduling the page, or by navigating anywhere else within Studio. Three deliberate choices, made 2026-07, that would break period-over-period comparability if changed mid-measurement:

1. **Discarded edits count.** A Content Edit registers the moment `previewPageState.content` diverges, even if the user later discards. We are measuring the *experience* of editing, not whether the artifact changed — users who tried and gave up are the most informative cohort. Rejected alternative: counting only persisted saves (`updatePageBlob` success), which reads cleaner but silently drops that cohort. Raw JSON mode is excluded in code (staff-only surface, not the experience under measurement).

2. **Intercom owns "once per user per Measuring Period".** The client fires two events — `published-after-editing` (on successful publish or schedule mutation) and `left-editor-after-editing` (on in-app route change away from the editor) — and the Intercom survey's audience/frequency rules enforce display frequency. Rejected alternatives: the existing localStorage `triggerSurveyOnce` pattern (per-browser, period changes require a deploy) and a server-side flag (new infrastructure for no gain). The survey must be configured in Intercom to trigger on *either* event, and the Measuring Period lives only in Intercom's frequency settings.

3. **Window/tab close is deliberately unmeasured.** No `beforeunload` tracking — users who edit then close the window fire no event, by design (conflicts with the other measuring points and is a hostile survey moment).

Consequence: each editing burst emits exactly one event (the flag resets on fire and re-arms on the next Content Edit), so the publish and leave cohorts are disjoint per burst.
