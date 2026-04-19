## 2024-05-19 - ARIA Labels for Icon-Only Buttons
**Learning:** Icon-only buttons (like delete buttons using `<Trash2 />`) without text labels are inherently inaccessible to screen readers as they provide no context about their function.
**Action:** Always add descriptive `aria-label` and `title` attributes to all icon-only buttons to ensure they are accessible via screen readers and provide visual tooltips for mouse users.
