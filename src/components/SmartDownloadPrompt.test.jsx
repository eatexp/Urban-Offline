import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import { AIModelManager } from '../services/ai/AIModelManager';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';

// Mock dependencies
vi.mock('../services/ai/AIModelManager', () => ({
    AIModelManager: {
        init: vi.fn().mockResolvedValue({ aiAvailable: true }),
        getAvailableModels: vi.fn(),
        downloadModel: vi.fn(),
        cancelDownload: vi.fn()
    }
}));

vi.mock('../services/ai/TransformersEngine', () => ({
    TRANSFORMERS_MODELS: {
        'tinyllama': {
            id: 'tinyllama',
            name: 'TinyLlama 1.1B',
            description: 'Fastest model for basic tasks',
            sizeDisplay: '638 MB'
        },
        'phi3': {
            id: 'phi3',
            name: 'Phi-3 Mini',
            description: 'Best balance of speed/quality',
            sizeDisplay: '1.2 GB'
        }
    }
}));

// Mock logger
vi.mock('../utils/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    })
}));

describe('SmartDownloadPrompt', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mocks
        AIModelManager.getAvailableModels.mockResolvedValue([
            { id: 'tinyllama', isInstalled: false },
            { id: 'phi3', isInstalled: false }
        ]);

        // Mock navigator properties
        Object.defineProperty(globalThis.navigator, 'connection', {
            value: { type: 'wifi', effectiveType: '4g' },
            writable: true
        });
        Object.defineProperty(globalThis.navigator, 'getBattery', {
            value: () => Promise.resolve({ charging: true }),
            writable: true
        });
        Object.defineProperty(globalThis.navigator, 'storage', {
            value: { estimate: () => Promise.resolve({ quota: 10e9, usage: 1e9 }) },
            writable: true
        });
    });

    it('renders when forceShow is true', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });
    });

    it('has accessible close button', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // This should fail initially as aria-label is missing
        const closeButton = screen.getByLabelText(/dismiss/i);
        expect(closeButton).toBeInTheDocument();
    });

    it('has accessible model selection as radiogroup', async () => {
        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // These should fail initially
        const radioGroup = screen.getByRole('radiogroup');
        expect(radioGroup).toBeInTheDocument();
        expect(radioGroup).toHaveAttribute('aria-label', 'Select AI Model');

        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(2);
        expect(radios[0]).toHaveAttribute('aria-checked', 'true'); // tinyllama is default
    });

    it('has accessible progress bar during download', async () => {
        // Setup mock to simulate download start
        AIModelManager.downloadModel.mockImplementation((id, onProgress) => {
            // Simulate progress immediately
            onProgress(10, 'Downloading...');
            return new Promise(() => {}); // Never resolves for this test
        });

        render(<SmartDownloadPrompt forceShow={true} />);

        await waitFor(() => {
            expect(screen.getByText('Enhance Your Assistant')).toBeInTheDocument();
        });

        // Click download
        fireEvent.click(screen.getByText('Download'));

        // Check for progress bar
        await waitFor(() => {
            expect(screen.getByText('10%')).toBeInTheDocument();
        });

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow', '10');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
});
