# Palette's Design Journal

## 2024-05-24 - Large Touch Targets in High-Stress UI
**Learning:** In emergency situations (ProtocolView), users experience reduced fine motor control and cognitive tunneling. Small touch targets (like 24px checkboxes) become significant usability barriers.
**Action:** Always make the entire container clickable for binary choices in high-stress UI components. Use `cursor-pointer` and hover states on the row, not just the control.
