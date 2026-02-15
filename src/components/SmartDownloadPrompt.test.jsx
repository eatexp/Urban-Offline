import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SmartDownloadPrompt from './SmartDownloadPrompt';
import { AIModelManager } from '../services/ai/AIModelManager';
import { TRANSFORMERS_MODELS } from '../services/ai/TransformersEngine';

// Mock dependencies
vi.mock('../services/ai/AIModelManager', () => ({
  AIModelManager: {
    init: vi.fn(),
    getAvailableModels: vi.fn(),
    downloadModel: vi.fn(),
    cancelDownload: vi.fn(),
  },
}));

vi.mock('../services/ai/TransformersEngine', () => ({
  TRANSFORMERS_MODELS: {
    'tinyllama': {
      id: 'tinyllama',
      name: 'TinyLlama 1.1B',
      description: 'Balanced speed and quality',
      size: 500 * 1024 * 1024,
      sizeDisplay: '500 MB',
      isInstalled: false,
    },
    'qwen-0.5b': {
      id: 'qwen-0.5b',
      name: 'Qwen 0.5B',
      description: 'Fast and capable',
      size: 350 * 1024 * 1024,
      sizeDisplay: '350 MB',
      isInstalled: false,
    },
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  Download: () => <div data-testid="icon-download" />,
  Wifi: () => <div data-testid="icon-wifi" />,
  Battery: () => <div data-testid="icon-battery" />,
  HardDrive: () => <div data-testid="icon-hard-drive" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
}));

describe('SmartDownloadPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AIModelManager.getAvailableModels.mockResolvedValue([]);
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
        const closeButton = screen.getByRole('button', { name: /Dismiss/i });
        expect(closeButton).toBeInTheDocument();
    });
  });

  it('renders model options as radio buttons', async () => {
    render(<SmartDownloadPrompt forceShow={true} />);

    await waitFor(() => {
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
      expect(radios[0]).toHaveAttribute('aria-checked', 'true'); // Default selected
    });
  });

  it('shows progress bar with correct role when downloading', async () => {
    AIModelManager.downloadModel.mockImplementation((id, onProgress) => {
      onProgress(50, 'Downloading...');
      return new Promise(() => {}); // Pending promise to keep loading state
    });

    render(<SmartDownloadPrompt forceShow={true} />);

    await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Download'));

    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });
  });
});
