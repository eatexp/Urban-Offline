import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtocolView from './ProtocolView';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  Volume2: () => <div data-testid="icon-volume" />,
  RotateCw: () => <div data-testid="icon-rotate" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
}));

describe('ProtocolView', () => {
  const mockProtocol = {
    scenarioName: 'Test Protocol',
    steps: [
      { text: 'Step 1 description', context: 'Context 1' },
      { text: 'Step 2 description', context: 'Context 2' },
    ],
  };

  beforeEach(() => {
    // Mock SpeechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: vi.fn().mockReturnValue([]),
        cancel: vi.fn(),
        speak: vi.fn(),
      },
      writable: true
    });
    window.SpeechSynthesisUtterance = vi.fn();
  });

  it('toggles step when checkbox is clicked', () => {
    render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

    const checkbox = screen.getByLabelText(/Step 1: Step 1 description/i);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('toggles step when text description is clicked', () => {
    render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

    const checkbox = screen.getByLabelText(/Step 1: Step 1 description/i);
    const textElement = screen.getByText('Step 1 description');

    expect(checkbox).not.toBeChecked();

    // Clicking the text should toggle the checkbox if wrapped in label correctly
    fireEvent.click(textElement);
    expect(checkbox).toBeChecked();

    fireEvent.click(textElement);
    expect(checkbox).not.toBeChecked();
  });

  it('does not toggle step when voice button is clicked', () => {
    render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

    const checkbox = screen.getByLabelText(/Step 1: Step 1 description/i);
    const voiceButtons = screen.getAllByLabelText('Read step aloud');
    const firstVoiceButton = voiceButtons[0];

    expect(checkbox).not.toBeChecked();

    fireEvent.click(firstVoiceButton);
    expect(checkbox).not.toBeChecked(); // Should remain unchecked
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });
});
