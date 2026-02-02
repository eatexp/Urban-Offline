# Palette's Journal

This journal records CRITICAL UX and accessibility learnings. It is not a daily log.

## Format
`## YYYY-MM-DD - [Title]
**Learning:** [UX/a11y insight]
**Action:** [How to apply next time]`


## 2026-02-02 - Ephemeral UI Accessibility
**Learning:** Ephemeral components like `SmartDownloadPrompt` often escape initial accessibility audits because they only appear under specific conditions (WiFi + Charging + Storage).
**Action:** When reviewing conditional UI components, explicitly check for icon-only buttons (like close 'X' buttons) and verify they have `aria-label` attributes, as automated tools might miss them if the component isn't rendered.
