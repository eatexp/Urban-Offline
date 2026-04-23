## 2024-05-18 - [Model Card Accessibility Fix]
**Learning:** Icon-only buttons (like the `X` and `Trash2` icons in ModelCardEnhanced.jsx) must have `aria-label` attributes to be accessible to screen readers, especially when used in critical paths like delete confirmations.
**Action:** Added `aria-label="Cancel delete"` and `aria-label="Delete model"` to the respective motion.button components.
