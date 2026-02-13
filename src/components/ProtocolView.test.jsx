import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProtocolView from './ProtocolView';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock speech synthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: mockSpeak,
    cancel: mockCancel,
    getVoices: vi.fn().mockReturnValue([]),
  },
  writable: true,
});

// Mock SpeechSynthesisUtterance
globalThis.SpeechSynthesisUtterance = vi.fn();

const sampleProtocol = {
  scenarioName: 'Test Protocol',
  steps: [
    { text: 'Step 1', context: 'Context 1' },
    { text: 'Step 2' }
  ]
};

describe('ProtocolView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles step when clicking the row container', () => {
    render(<ProtocolView protocol={sampleProtocol} onClose={() => {}} />);

    // Find the first step row.
    // The row contains "Step 1" text.
    const stepText = screen.getByText('Step 1');
    // We need to find the container div. It's an ancestor of the text.
    // In the current implementation, it's the div with class "flex items-start gap-4..."
    const rowContainer = stepText.closest('div.flex.items-start');

    expect(rowContainer).not.toBeNull();

    // Initial state: checkbox unchecked
    // The checkbox label is "Step 1: Step 1" based on current code: `Step ${index + 1}: ${step.text}`
    const checkbox = screen.getByLabelText('Step 1: Step 1');
    expect(checkbox.checked).toBe(false);

    // Click the row container
    fireEvent.click(rowContainer);

    // Expect checkbox to be checked.
    // If the row is not clickable, this will fail (checkbox remains unchecked)
    expect(checkbox.checked).toBe(true);
  });

  it('has accessible voice buttons with specific labels', () => {
    render(<ProtocolView protocol={sampleProtocol} onClose={() => {}} />);
    // This is expected to fail currently as the label is just "Read step aloud"
    // Using queryByLabelText to avoid error throwing if not found, to check assertion
    const voiceButton = screen.queryByLabelText('Read step 1 aloud');

    // If not found (current state), this expectation will fail if we expect it to be truthy.
    // However, currently it is NOT there, so it SHOULD be null if we search for the new label.
    // But we want the test to fail if the feature is not implemented.
    expect(voiceButton).toBeTruthy();
  });

  it('has a progress bar with correct role', () => {
    render(<ProtocolView protocol={sampleProtocol} onClose={() => {}} />);
    // This is expected to fail currently
    const progressBar = screen.queryByRole('progressbar');
    expect(progressBar).toBeTruthy();
  });
});
