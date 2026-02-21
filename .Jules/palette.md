## 2024-05-23 - Accessibility in Conditional Prompts
**Learning:** Conditional prompts like `SmartDownloadPrompt` that appear based on system state (WiFi, Battery) can trap screen reader users if they lack proper ARIA roles (`region`, `alert`, or `dialog`) and labels.
**Action:** Always wrap such prompts in a region with a descriptive label and ensure all interactive elements inside have accessible names.
