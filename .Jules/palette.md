## 2026-02-04 - Icon-Only Buttons
**Learning:** Icon-only buttons (like 'X' for close) are a frequent accessibility trap. They are visually clear to sighted users but invisible to screen readers without explicit labels.
**Action:** Always check `onClick` handlers on icon components to ensure they have an `aria-label` or `title` wrapper.
