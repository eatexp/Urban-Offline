// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import { AIModelManager } from '../services/ai/AIModelManager';

// Mock AIModelManager
vi.mock('../services/ai/AIModelManager', () => ({
    AIModelManager: {
        init: vi.fn().mockResolvedValue({}),
        getAvailableModels: vi.fn().mockResolvedValue([]),
        downloadModel: vi.fn(),
        cancelDownload: vi.fn()
    }
}));

// Mock TransformersEngine
vi.mock('../services/ai/TransformersEngine', () => ({
    TRANSFORMERS_MODELS: {
        'tinyllama': {
            id: 'tinyllama',
            name: 'TinyLlama',
            description: 'Balanced',
            sizeDisplay: '500MB'
        },
        'qwen': {
            id: 'qwen',
            name: 'Qwen',
            description: 'Fast',
            sizeDisplay: '350MB'
        }
    }
}));

describe('SmartDownloadPrompt Accessibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have accessible close button', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        // Wait for component to render
        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).not.toBeNull();
        });

        // Check for close button with aria-label
        const closeButton = screen.queryByLabelText(/close/i); // queryByLabelText uses aria-label
        expect(closeButton).not.toBeNull();
    });

    it('should use radiogroup for model selection', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).not.toBeNull();
        });

        // Check for radiogroup
        const radioGroup = screen.queryByRole('radiogroup');
        expect(radioGroup).not.toBeNull();
        expect(radioGroup.getAttribute('aria-label')).toBe('Select AI model');

        // Check for radio buttons
        const radioButtons = screen.queryAllByRole('radio');
        expect(radioButtons).toHaveLength(2);

        // Check selection state
        expect(radioButtons[0].getAttribute('aria-checked')).toBe('true');
        expect(radioButtons[1].getAttribute('aria-checked')).toBe('false');

        // Check tabindex (roving tabindex)
        expect(radioButtons[0].getAttribute('tabindex')).toBe('0');
        expect(radioButtons[1].getAttribute('tabindex')).toBe('-1');
    });
});
