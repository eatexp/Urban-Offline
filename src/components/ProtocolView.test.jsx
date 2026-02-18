import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtocolView from './ProtocolView';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Volume2: () => <span data-testid="icon-volume">Volume</span>,
  RotateCw: () => <span data-testid="icon-rotate">Rotate</span>,
  CheckCircle2: () => <span data-testid="icon-check">Check</span>,
}));

// Mock SpeechSynthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn().mockReturnValue([]);

beforeEach(() => {
  vi.clearAllMocks();
  // Mock window.speechSynthesis
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: mockGetVoices,
      paused: false,
      pending: false,
      speaking: false,
    },
    writable: true
  });

  global.SpeechSynthesisUtterance = vi.fn();
});

const mockProtocol = {
  scenarioName: 'Test Protocol',
  steps: [
    { text: 'Step 1: Do this', context: 'Context 1' },
    { text: 'Step 2: Do that', context: 'Context 2' },
  ],
};

describe('ProtocolView Interaction', () => {
  it('toggles step when clicking the checkbox', () => {
    render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

    const checkbox = screen.getByLabelText(/Step 1: Do this/i);
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('toggles step when clicking the row text (container click)', () => {
    render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

    const stepText = screen.getByText('Step 1: Do this');
    // Clicking the text should bubble up to the container
    fireEvent.click(stepText);

    const checkbox = screen.getByLabelText(/Step 1: Do this/i);
    expect(checkbox).toBeChecked();
  });

  it('does NOT toggle step when clicking the voice button', () => {
    render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

    const voiceButtons = screen.getAllByLabelText('Read step aloud');
    const firstVoiceButton = voiceButtons[0];

    fireEvent.click(firstVoiceButton);

    const checkbox = screen.getByLabelText(/Step 1: Do this/i);
    expect(checkbox).not.toBeChecked();
    // Verify voice was triggered
    expect(mockSpeak).toHaveBeenCalled();
  });
});
