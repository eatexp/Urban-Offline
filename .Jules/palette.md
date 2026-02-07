## 2026-02-05 - [Triage Screen Accessibility & UX]
**Learning:** Emergency views like `TriageScreen` must render navigation headers (Close/Reload) *outside* of conditional loading/error states. Otherwise, users can get stuck in an error state without a way to exit or reload the view.
**Action:** When refactoring components with conditional rendering (loading/error), always ensure critical navigation controls are in the parent container or rendered unconditionally.

**Learning:** `InkService.loadStory` returns `false` on failure instead of throwing. Consumer components must check the return value to handle errors correctly, otherwise they may get stuck in a loading state if they rely on `try...catch` alone.
**Action:** Always check the return value of async service methods in addition to `try...catch` blocks.

**Learning:** Inline styles for interactive states (hover/focus) using JS events (`onMouseEnter`) are brittle and harder to maintain than CSS classes.
**Action:** Replace inline JS styles with CSS classes (e.g., `.triage-choice-button`) using pseudo-classes (`:hover`, `:focus-visible`) for better performance and maintainability.
