## 2026-05-04 - Accessible Progress Bars and Regions
**Learning:** The `SmartDownloadPrompt` container lacked a distinct semantic region or name, and its progress visual was merely a styled div with no screen reader announcements. Icon-only dismiss buttons need `title` tags to show visual tooltips alongside `aria-label`s for screen readers.
**Action:** Add `role="region"` and an `aria-label` to overlay prompts for better context tracking. Always enhance visual progress bars with `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
