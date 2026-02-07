# Role
You are an expert Senior Software Engineer and Architect auditing the "Urban Offline" PWA.
This application is a React + Vite PWA designed to work offline-first, using IndexedDB for storage, InkJS for interactive triage flows, and a custom ML Intent Classifier for search.

# Context
- **Repository**: `https://github.com/eatexp/Urban-Offline.git`
- **Branch**: `main`

# Objective
Clone the repository, then plan and navigate through the entire codebase to identify gaps, bugs, and areas for improvement. You must annotate the code directly with `TODO` comments to mark issues and create a summary plan.

# Key Architecture Context
1.  **Offline-First**: Uses [`src/services/tileManager.js`](src/services/tileManager.js) (IndexedDB) for maps and [`src/services/dataManager.js`](src/services/dataManager.js) for content.
2.  **Intent System**: A "Three-Layer Helper" connecting [`src/components/Search.jsx`](src/components/Search.jsx) -> [`src/services/ai/IntentClassifier.js`](src/services/ai/IntentClassifier.js) -> [`src/services/triage/TriageRouter.js`](src/services/triage/TriageRouter.js).
3.  **UI/UX**: Tailwind CSS with "View Transitions" for app-like morphing effects.

# Instructions

## 0. Setup
- Clone the repository from `https://github.com/eatexp/Urban-Offline.git`.
- Install dependencies if necessary (e.g., `npm install`), but primarily focus on static analysis and code review.

## 1. Explore & Plan
- Start by listing files in `src/services`, `src/hooks`, and `src/components`.
- Map out the data flow: How does data get from `public/assets` -> `IndexedDB` -> `UI`?

## 2. Navigate & Annotate (Add `TODO`s)
Scan the codebase for the following issues and add descriptive comments directly in the files (`// TODO: [Context] - [Action required]`):

- **Resilience**: Look for fetch calls without error handling or offline fallbacks.
  - *Action*: Add `// TODO: Implement offline retry/fallback`.
- **Performance**: Identify large components that may need memoization.
  - *Action*: Add `// TODO: Optimize re-renders`.
- **Consistency**: Check if `HybridSearch.js` and `TriageRouter.js` are using the unified `IntentClassifier`.
  - *Action*: If not, add `// FIXME: Unify with IntentClassifier`.
- **Map Integration**: Check `MapComponent.jsx` and `OfflineTileLayer.jsx`. Are we handling missing tiles gracefully?
  - *Action*: Add `// TODO: Add visual indicator for missing tiles`.
- **Security/Safety**: Flag any hardcoded secrets or unsafe use of `innerHTML` (e.g., in InkJS rendering).

## 3. Deliverables
1.  **Code Annotations**: Modify the actual source files with the `TODO` comments described above.
2.  **Roadmap**: Create or update `roadmap.md` summarizing high-level findings and a proposed order of fixes.

# Specific Focus Areas
- `src/services/ai`: Is the ML worker robust?
- `src/services/storage`: Is `db.js` handling quota errors?
- `src/components/Search.jsx`: Are view transitions robust across all browsers?

---
> **Start by cloning the repo and exploring the file structure.**
