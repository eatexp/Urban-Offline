import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import { AIModelManager } from '../services/ai/AIModelManager';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';

// Mock dependencies
vi.mock('../services/ai/AIModelManager', () => ({
  AIModelManager: {
    init: vi.fn().mockResolvedValue({}),
    getAvailableModels: vi.fn().mockResolvedValue([
      { id: 'tinyllama', isInstalled: false },
      { id: 'qwen-0.5b', isInstalled: false }
    ]),
    downloadModel: vi.fn(),
    cancelDownload: vi.fn()
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
      isInstalled: false
    },
    'qwen-0.5b': {
        id: 'qwen-0.5b',
        name: 'Qwen 0.5B',
        description: 'Fast and capable',
        sizeDisplay: '350 MB',
        isInstalled: false
    }
  },
  default: {
    getInstance: () => ({
      initialize: vi.fn(),
      isModelCached: vi.fn().mockResolvedValue(false)
    })
  }
}));

vi.mock('../utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  })
}));

describe('SmartDownloadPrompt Accessibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock return for getAvailableModels
        AIModelManager.getAvailableModels.mockResolvedValue([
            { id: 'tinyllama', isInstalled: false },
            { id: 'qwen-0.5b', isInstalled: false }
        ]);
    });

    afterEach(() => {
        cleanup();
    });

    it('renders main container with accessible label', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // Should have a region role with a label
        const region = screen.getByRole('region', { name: /AI Download Prompt/i });
        expect(region).toBeInTheDocument();
    });

    it('has accessible close button', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // The close button should have aria-label="Close"
        const closeButton = screen.getByRole('button', { name: /Close/i });
        expect(closeButton).toBeInTheDocument();
    });

    it('uses radiogroup for model selection', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // Should have a radiogroup
        const radioGroup = screen.getByRole('radiogroup');
        expect(radioGroup).toBeInTheDocument();

        // Should have radio options
        const radios = screen.getAllByRole('radio');
        expect(radios.length).toBeGreaterThan(0);

        // One should be checked
        const checkedRadio = radios.find(r => r.getAttribute('aria-checked') === 'true');
        expect(checkedRadio).toBeInTheDocument();
    });

    it('uses progressbar role during download', async () => {
        // Mock download start
        let progressCallback;
        AIModelManager.downloadModel.mockImplementation((id, onProgress) => {
             progressCallback = onProgress;
             return new Promise(() => {}); // Never resolves to keep in downloading state
        });

        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // Click download
        const downloadButton = screen.getByText('Download');
        fireEvent.click(downloadButton);

        // Manually trigger progress update to ensure state change
        if (progressCallback) {
            React.act(() => {
                progressCallback(50, 'Downloading...');
            });
        }

        await waitFor(() => {
            expect(screen.getByText(/Downloading/i)).toBeInTheDocument();
        });

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow', '50');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
});
