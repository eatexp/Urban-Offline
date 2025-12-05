import { Story } from 'inkjs';

class InkService {
    constructor() {
        this.story = null;
        this.storyCache = new Map();
    }

    async loadStory(filename) {
        if (this.storyCache.has(filename)) {
            this.story = new Story(this.storyCache.get(filename));
            return true;
        }

        try {
            // In Capacitor/Vite, assets are served from root
            const response = await fetch(`/assets/ink/${filename}`);
            if (!response.ok) {
                console.error(`Ink story not found: ${filename}`);
                return false;
            }
            const json = await response.json();
            this.storyCache.set(filename, json);
            this.story = new Story(json);
            return true;
        } catch (e) {
            console.error(`Failed to load Ink story: ${e.message}`);
            return false;
        }
    }

    reset() {
        if (this.story) {
            this.story.ResetState();
        }
    }

    continue() {
        if (!this.story) return null;

        const textArr = [];
        while (this.story.canContinue) {
            textArr.push(this.story.Continue());
        }

        // Split text by newlines if needed, or join
        const currentText = textArr.join('\\n');

        const currentChoices = this.story.currentChoices.map((c, i) => ({
            index: c.index,
            text: c.text
        }));

        return {
            text: currentText,
            choices: currentChoices,
            tags: this.story.currentTags,
            canContinue: this.story.canContinue || currentChoices.length > 0
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
}

export const inkService = new InkService();
