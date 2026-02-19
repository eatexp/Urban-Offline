import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProtocolView from './ProtocolView';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    X: () => <div data-testid="icon-x" />,
    Volume2: () => <div data-testid="icon-volume" />,
    RotateCw: () => <div data-testid="icon-rotate" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
}));

// Mock SpeechSynthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn().mockReturnValue([]);

Object.defineProperty(window, 'speechSynthesis', {
    value: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: mockGetVoices,
    },
    writable: true,
});

// Mock SpeechSynthesisUtterance
globalThis.SpeechSynthesisUtterance = vi.fn();

describe('ProtocolView', () => {
    const mockProtocol = {
        scenarioName: 'Test Protocol',
        steps: [
            { text: 'Step 1: Check airway', context: 'Tilt head back' },
            { text: 'Step 2: Check breathing', context: 'Look, listen, feel' },
        ],
    };

    it('renders protocol steps correctly', () => {
        render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

        expect(screen.getByText('Test Protocol')).toBeInTheDocument();
        expect(screen.getByText('Step 1: Check airway')).toBeInTheDocument();
        expect(screen.getByText('Step 2: Check breathing')).toBeInTheDocument();
    });

    it('toggles step completion when clicking the checkbox', () => {
        render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

        const checkbox = screen.getByLabelText(/Step 1: Check airway/i);
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it('toggles step completion when clicking the step row text', () => {
        render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

        const checkbox = screen.getByLabelText(/Step 1: Check airway/i);
        const stepText = screen.getByText('Step 1: Check airway');

        // Initial state
        expect(checkbox).not.toBeChecked();

        // Click the text (part of the row)
        fireEvent.click(stepText);

        // Verify it toggles
        expect(checkbox).toBeChecked();

        // Click again to untoggle
        fireEvent.click(stepText);
        expect(checkbox).not.toBeChecked();
    });

    it('does not toggle step when clicking the voice button', () => {
        render(<ProtocolView protocol={mockProtocol} onClose={() => {}} />);

        const checkbox = screen.getByLabelText(/Step 1: Check airway/i);
        const voiceButtons = screen.getAllByLabelText('Read step aloud');
        const firstVoiceButton = voiceButtons[0];

        expect(checkbox).not.toBeChecked();

        // Click the voice button
        fireEvent.click(firstVoiceButton);

        // Should NOT be checked
        expect(checkbox).not.toBeChecked();

        // Verify voice was triggered
        expect(mockSpeak).toHaveBeenCalled();
    });
});
