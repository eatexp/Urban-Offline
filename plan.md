1. **Target**: `src/components/features/map/OfflineMap.jsx`
2. **Action**: Add `aria-label` and `title` to the icon-only buttons for map controls.
   - Locate user button (`Navigation2` icon) at line 356. Needs `aria-label="Locate me"` and `title="Locate me"`.
   - Zoom in button (`Plus` icon) at line 364. Needs `aria-label="Zoom in"` and `title="Zoom in"`.
   - Zoom out button (`Minus` icon) at line 367. Needs `aria-label="Zoom out"` and `title="Zoom out"`.

3. **Target**: `src/components/features/clawdBot/ClawdBotFAB.jsx`
4. **Action**: Add `aria-label` and `title` to the dismiss button.
   - Dismiss proactive message button (`X` icon) at line 128. Needs `aria-label="Dismiss message"` and `title="Dismiss message"`.
   - FAB button itself at line 153. Needs `aria-label={hasProactive ? "Open ClawdBot, new message available" : "Open ClawdBot"}` and `title="Open ClawdBot"`.

Wait, the prompt says "pick the BEST opportunity". I should choose ONE.
Let's add `aria-label` and `title` to the OfflineMap controls.

Plan step 1: Use `replace_with_git_merge_diff` to modify `src/components/features/map/OfflineMap.jsx` and add ARIA attributes to the 3 icon-only map control buttons.
Plan step 2: Run `pnpm lint` and `pnpm test` (or equivalent test commands, I should probably check `package.json` for test commands). Wait, I'm just supposed to do `pnpm lint` and whatever.
Plan step 3: Complete pre commit steps.
Plan step 4: Submit PR.
