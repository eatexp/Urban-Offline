## 2026-01-29 - Avoid Inline Styles for Interactive States
**Learning:** Inline styles for hover/focus states (using `onMouseEnter`/`onMouseLeave`) create inconsistent behavior, fail to support keyboard focus visibility, and bypass high-contrast mode preferences.
**Action:** Use CSS classes (or Tailwind utilities like `hover:`, `focus-visible:`) to ensure accessibility and maintainability.
