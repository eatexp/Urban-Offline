## 2025-04-18 - Icon-Only Button ARIA Labels
**Learning:** Icon-only buttons without `aria-label`s are a common accessibility issue. Adding them significantly improves screen reader support without changing visual layout.
**Action:** Always scan for `<button>` elements containing only `<svg>` or icon components and ensure they have descriptive `aria-label`s.
