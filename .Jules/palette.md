## 2024-05-22 - Fixed Positioning in Transformed Containers
**Learning:** `ProtocolView` uses `fixed` positioning but is rendered inside a `div` with `animate-slide-up` (which uses `transform`). This causes the fixed element to be positioned relative to the container, not the viewport. This led to click interception issues in Playwright where the container's parent (`main`) was receiving clicks instead of the overlay.
**Action:** When using full-screen overlays, ensure they are rendered via React Portals to `document.body` to escape the stacking context of transformed ancestors.
