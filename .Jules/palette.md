## 2025-02-12 - Clickable Rows with Interactive Children
**Learning:** When making a list row fully clickable (Fitts's Law), nested interactive elements (buttons, inputs) must explicitly stop propagation. For checkboxes inside labels, stopping propagation on the `input`'s `onClick` prevents double-toggling while maintaining the native `label`->`input` interaction.
**Action:** Always test nested interactive elements when implementing clickable containers. Add `onClick={(e) => e.stopPropagation()}` to nested inputs/buttons.
