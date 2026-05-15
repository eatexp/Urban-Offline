## 2023-10-27 - SmartDownloadPrompt dismiss button lacked ARIA label
**Learning:** Dismiss buttons with just an `X` icon in modals/prompts often lack accessible names, breaking standard screen reader navigation.
**Action:** Always ensure floating, dismissible UI components like `SmartDownloadPrompt` include explicit `aria-label`s on their close actions.
