# Windows Development Workflow

Since you are developing on Windows but targeting mobile (iOS/Android), this workflow bridges the gap using "Vibe Coding" and GitHub Actions.

## 1. The "Vibe Coding" Loop
> **Concept**: You code locally on Windows, pushing changes frequently. The cloud builds the binaries you can't build locally.

### Steps
1.  **Code**: Make changes in VS Code on Windows.
2.  **Verify Web**: Run `npm run dev` to test UI/Logic in Chrome (Mobile View).
    - *Note*: AI features NOW WORK on Windows (we unblocked them!), so you can test the full RAG pipeline locally.
3.  **Push**: `git push origin main`

## 2. Automated Android Builds
We have set up a GitHub Action (`.github/workflows/android-build.yml`) that runs on every push.

1.  Go to your GitHub Repository -> **Actions** tab.
2.  Click on the latest **Android Build** workflow run.
3.  Once finished (approx. 3-5 mins), scroll down to **Artifacts**.
4.  Download **app-debug.apk**.
5.  Send to your Android phone (USB or Google Drive) and install.

## 3. iOS Testing (Limitation)
Since we cannot build iOS on Windows or standard GitHub Actions (without paid Developer Account secrets for signing), iOS verification relies on:
1.  **Web Validation**: Safari on Desktop (closest proxy).
2.  **Mac Access**: Periodically syncing repo on a Mac if available to build.
3.  **Experimental**: We can add an iOS Playground action later if you have a valid Apple Developer Certificate.

## 4. Troubleshooting
- **"AI Not working"**: Ensure you have run `npm install` if `node_modules` seems stale.
- **"Gradle Build Failed"**: Check the Actions logs. Usually typical of missing assets or sync issues.
      - Fix: Run `npx cap sync` locally before pushing to ensure `android/` folder state is consistent.
