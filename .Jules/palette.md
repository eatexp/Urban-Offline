## 2026-01-28 - Accessibility in High-Stress UI
**Learning:** In emergency triage interfaces, icon-only buttons (like "Back" or "Restart") can be dangerously ambiguous without explicit labels. Users under stress may have reduced cognitive capacity or use assistive tech.
**Action:** Always verify that critical navigation controls in emergency flows have redundant `aria-label` and `title` attributes, even if the icon seems obvious.
