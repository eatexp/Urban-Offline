## 2024-05-23 - SmartDownloadPrompt missing aria-label
**Learning:** Dismiss button in `SmartDownloadPrompt` had no aria-label, which is critical for icon-only buttons for screen readers to convey meaning.
**Action:** Always verify icon-only buttons have an `aria-label` or `title` in React components during UX/a11y passes.
