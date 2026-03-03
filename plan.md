# Palette's UX Enhancement Plan

## Discovery
In `src/pages/AIChat.jsx`, there are several icon-only buttons in the header that lack `aria-label` attributes and `title` tooltips. This is an accessibility issue because screen readers won't know what these buttons do, and standard users won't get a tooltip on hover explaining the icons.

Specifically, these buttons:
1. `Menu` (hamburger) button to open chat history
2. `Cpu` button to navigate to AI models
3. `Activity` button to toggle visualizations
4. `Settings` button to open dataset settings

## Plan
1.  *Add accessibility and tooltips to icon buttons in AIChat.jsx*
    - Add `aria-label="Chat history"` and `title="Chat history"` to the Menu button.
    - Add `aria-label="AI Models"` and `title="AI Models"` to the Cpu button.
    - Add `aria-label="Toggle visualizations"` and `title="Toggle visualizations"` to the Activity button.
    - Add `aria-label="Dataset settings"` and `title="Dataset settings"` to the Settings button.

2.  *Verify changes*
    - Run `pnpm lint` to ensure code quality.
    - Run `pnpm build` to verify the build still succeeds.

3.  *Pre-commit checks*
    - Ensure proper testing, verifications, reviews and reflections are done.

4.  *Submit PR*
    - Commit with a descriptive message and title.
