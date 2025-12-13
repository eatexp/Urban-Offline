import { Story } from 'inkjs';
import { saveInkState, getInkState, clearInkState } from './db';

class InkService {
    constructor() {
        this.story = null;
        this.storyCache = new Map();
        this.currentStoryId = null;
        this.autoSave = true; // Enable auto-save by default
    }

    // Generate a stable ID for the story file
    getStoryId(filename) {
        return filename.replace(/[^a-zA-Z0-9]/g, '_');
    }

    async loadStory(filename, options = {}) {
        const { resumeFromSaved = true } = options;
        this.currentStoryId = this.getStoryId(filename);

        // Load story JSON (from cache or fetch)
        let storyJson;
        if (this.storyCache.has(filename)) {
            storyJson = this.storyCache.get(filename);
        } else {
            try {
                // In Capacitor/Vite, assets are served from root
                const response = await fetch(`/assets/ink/${filename}`);
                if (!response.ok) {
                    console.error(`Ink story not found: ${filename}`);
                    return false;
                }
                storyJson = await response.json();
                this.storyCache.set(filename, storyJson);
            } catch (e) {
                console.error(`Failed to load Ink story: ${e.message}`);
                return false;
            }
        }

        // Create new story instance
        this.story = new Story(storyJson);

        // Try to restore saved state if requested
        if (resumeFromSaved) {
            const savedState = await this.loadSavedState();
            if (savedState) {
                try {
                    this.story.state.LoadJson(savedState);
                    console.log(`Restored saved state for story: ${filename}`);
                    return true;
                } catch (e) {
                    console.warn('Failed to restore saved state, starting fresh:', e);
                    // State was corrupted or incompatible, start fresh
                    this.story = new Story(storyJson);
                }
            }
        }

        return true;
    }

    // Check if there's saved progress for a story
    async hasSavedProgress(filename) {
        const storyId = this.getStoryId(filename);
        const savedState = await getInkState(storyId);
        return savedState !== null;
    }

    // Save current state
    async saveState() {
        if (!this.story || !this.currentStoryId) return false;

        try {
            const stateJson = this.story.state.toJson();
            await saveInkState(this.currentStoryId, stateJson);
            return true;
        } catch (e) {
            console.error('Failed to save Ink state:', e);
            return false;
        }
    }

    // Load saved state
    async loadSavedState() {
        if (!this.currentStoryId) return null;

        try {
            return await getInkState(this.currentStoryId);
        } catch (e) {
            console.error('Failed to load Ink state:', e);
            return null;
        }
    }

    // Clear saved state (call when story is completed or user explicitly resets)
    async clearSavedState() {
        if (!this.currentStoryId) return;

        try {
            await clearInkState(this.currentStoryId);
        } catch (e) {
            console.error('Failed to clear Ink state:', e);
        }
    }

    async reset() {
        if (this.story) {
            this.story.ResetState();
            // Clear saved state on reset
            await this.clearSavedState();
        }
    }

    continue() {
        if (!this.story) return null;

        const textArr = [];
        while (this.story.canContinue) {
            textArr.push(this.story.Continue());
        }

        const currentText = textArr.join('\n');

        const currentChoices = this.story.currentChoices.map((c) => ({
            index: c.index,
            text: c.text
        }));

        const isAtEnd = !this.story.canContinue && currentChoices.length === 0;

        // Auto-save state after each continue (unless at end)
        if (this.autoSave && !isAtEnd) {
            this.saveState();
        }

        // If we reached the end, clear saved state
        if (isAtEnd) {
            this.clearSavedState();
        }

        return {
            text: currentText,
            choices: currentChoices,
            tags: this.story.currentTags,
            canContinue: this.story.canContinue || currentChoices.length > 0,
            isComplete: isAtEnd
        };
    }

    choose(index) {
        if (!this.story) return null;
        this.story.ChooseChoiceIndex(index);
        return this.continue();
    }

    getVariable(name) {
        if (!this.story) return null;
        return this.story.variablesState[name];
    }

    setVariable(name, value) {
        if (!this.story) return;
        this.story.variablesState[name] = value;
        // Auto-save after variable change
        if (this.autoSave) {
            this.saveState();
        }
    }

    // Get current story progress info (for UI display)
    getProgressInfo() {
        if (!this.story) return null;

        return {
            storyId: this.currentStoryId,
            canContinue: this.story.canContinue,
            hasChoices: this.story.currentChoices.length > 0,
            currentTags: this.story.currentTags
        };
    }
}

export const inkService = new InkService();
