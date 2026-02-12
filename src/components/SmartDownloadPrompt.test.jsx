import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import { AIModelManager } from '../services/ai/AIModelManager';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';

// Mock dependencies
vi.mock('../services/ai/AIModelManager', () => ({
    AIModelManager: {
        init: vi.fn(),
        getAvailableModels: vi.fn(() => Promise.resolve([{ id: 'tinyllama', isInstalled: false }])),
        downloadModel: vi.fn(() => Promise.resolve({ success: true })),
        cancelDownload: vi.fn(),
    }
}));

vi.mock('../services/ai/TransformersEngine', () => ({
    TRANSFORMERS_MODELS: {
        'tinyllama': {
            id: 'tinyllama',
            name: 'TinyLlama 1.1B',
            description: 'Fast, efficient chat model',
            sizeDisplay: '600 MB'
        },
        'phi-2': {
            id: 'phi-2',
            name: 'Phi-2',
            description: 'More capable reasoning',
            sizeDisplay: '1.4 GB'
        }
    }
}));

vi.mock('../utils/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn()
    })
}));

describe('SmartDownloadPrompt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear localStorage
        localStorage.clear();
    });

    it('renders with correct ARIA attributes when visible', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        // Wait for the component to render content
        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeTruthy();
        });

        // Check for close button label
        const closeButton = screen.getByLabelText('Dismiss prompt');
        expect(closeButton).toBeTruthy();

        // Check for radiogroup
        const radioGroup = screen.getByRole('radiogroup');
        expect(radioGroup).toBeTruthy();

        const labelId = radioGroup.getAttribute('aria-labelledby');
        expect(labelId).toBeTruthy();

        const labelElement = screen.getByText('Choose AI model:');
        expect(labelElement.id).toBe(labelId);

        // Check for radio buttons
        const radioButtons = screen.getAllByRole('radio');
        expect(radioButtons).toHaveLength(2);

        // Check default selection
        const tinyLlamaButton = radioButtons[0];
        expect(tinyLlamaButton.getAttribute('aria-checked')).toBe('true');
    });

    it('updates aria-checked when selecting a model', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeTruthy();
        });

        const radioButtons = screen.getAllByRole('radio');
        const phi2Button = radioButtons[1];

        expect(phi2Button.getAttribute('aria-checked')).toBe('false');

        fireEvent.click(phi2Button);

        expect(phi2Button.getAttribute('aria-checked')).toBe('true');
        expect(radioButtons[0].getAttribute('aria-checked')).toBe('false');
    });

    it('renders progress bar with correct ARIA attributes during download', async () => {
        // We need to simulate download state.
        // Since download is triggered by a button click and we mocked downloadModel,
        // we can trigger the download and wait for the progress bar.

        // Mock downloadModel to call the progress callback
        AIModelManager.downloadModel.mockImplementation((modelId, onProgress) => {
            onProgress(50, 'Downloading...');
            return new Promise(() => {}); // Never resolve to keep it in downloading state for a bit
        });

        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Download')).toBeTruthy();
        });

        fireEvent.click(screen.getByText('Download'));

        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeTruthy();
        });

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar.getAttribute('aria-valuenow')).toBe('50');
        expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
        expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
        expect(progressBar.getAttribute('aria-label')).toBe('Download progress');
    });
});
