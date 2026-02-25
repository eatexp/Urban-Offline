import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import { AIModelManager } from '../services/ai/AIModelManager';

// Mock AIModelManager
vi.mock('../services/ai/AIModelManager', () => ({
    AIModelManager: {
        init: vi.fn(),
        getAvailableModels: vi.fn().mockResolvedValue([]),
        downloadModel: vi.fn().mockResolvedValue({ success: true }),
        cancelDownload: vi.fn(),
    }
}));

// Mock TransformersEngine
vi.mock('../services/ai/TransformersEngine', () => ({
    TRANSFORMERS_MODELS: {
        'tinyllama': {
            id: 'tinyllama',
            name: 'TinyLlama 1.1B',
            description: 'Balanced speed and quality',
            sizeDisplay: '500 MB',
            modelUrl: 'https://example.com/model'
        },
        'qwen': {
            id: 'qwen',
            name: 'Qwen 0.5B',
            description: 'Fast and capable',
            sizeDisplay: '350 MB',
            modelUrl: 'https://example.com/qwen'
        }
    }
}));

describe('SmartDownloadPrompt Accessibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render with correct accessibility attributes when forced to show', async () => {
        // Setup initial state: no models installed
        AIModelManager.getAvailableModels.mockResolvedValue([
            { id: 'tinyllama', isInstalled: false },
            { id: 'qwen', isInstalled: false }
        ]);

        render(<SmartDownloadPrompt forceShow={true} />);

        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // 1. Check Main Region/Dialog accessibility
        // Ideally it should be a region or dialog
        expect(screen.getByRole('region', { name: /AI Download Prompt/i })).toBeInTheDocument();

        // 2. Check Close Button accessibility
        // The close button (X) should have an aria-label
        const closeBtn = screen.getByLabelText(/Dismiss download prompt/i);
        expect(closeBtn).toBeInTheDocument();

        // 3. Check Model Selection accessibility
        // The buttons should act as toggle buttons in a group
        const tinyLlamaBtn = screen.getByText('TinyLlama 1.1B').closest('button');
        expect(tinyLlamaBtn).toHaveAttribute('aria-pressed', 'true');

        // 4. Simulate download to check progress bar accessibility
        // Mock download to simulate progress
        let resolveDownload;
        const downloadPromise = new Promise(resolve => { resolveDownload = resolve; });

        AIModelManager.downloadModel.mockImplementation(async (modelId, onProgress) => {
             onProgress(50, "Downloading...");
             await downloadPromise;
             return { success: true };
        });

        const downloadBtn = screen.getByText('Download');
        fireEvent.click(downloadBtn);

        await waitFor(() => {
            expect(screen.getByText(/Downloading/)).toBeInTheDocument();
        });

        // The progress bar should be accessible and show 50%
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');

        // Finish download
        resolveDownload();
    });
});
