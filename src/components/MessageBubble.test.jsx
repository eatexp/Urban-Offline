
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble from './MessageBubble';
import { describe, it, expect, vi } from 'vitest';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('MessageBubble Markdown Rendering', () => {
    it('renders tables correctly', () => {
        const markdown = `
| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |
`;
        const message = { role: 'assistant', content: markdown };
        const { container } = render(<MessageBubble message={message} />);

        const content = container.querySelector('.msg-bubble__content');
        const html = content ? content.innerHTML : '';

        expect(html).toContain('<table');
        expect(html).toContain('msg-bubble__table');
        expect(html).toContain('Header 1');
        expect(html).toContain('Cell 1');
    });

    it('renders lists correctly', () => {
        const markdown = `
- Item 1
- Item 2
`;
        const message = { role: 'assistant', content: markdown };
        const { container } = render(<MessageBubble message={message} />);

        const content = container.querySelector('.msg-bubble__content');
        const html = content ? content.innerHTML : '';

        expect(html).toContain('<ul');
        expect(html).toContain('msg-bubble__list');
        expect(html).toContain('Item 1');
    });

    it('sanitizes input', () => {
        const markdown = 'Scan <script>alert("xss")</script> complete';
        const message = { role: 'assistant', content: markdown };
        const { container } = render(<MessageBubble message={message} />);

        const html = container.innerHTML;
        expect(html).not.toContain('<script>');
        expect(html).toContain('Scan');
    });

    it('renders code blocks with copy button', () => {
        const markdown = '```js\nconsole.log("test");\n```';
        const message = { role: 'assistant', content: markdown };
        render(<MessageBubble message={message} />);

        // Check for code wrapper
        const wrapper = document.querySelector('.msg-bubble__code-wrapper');
        expect(wrapper).toBeInTheDocument();

        // Check for copy button
        const button = screen.getByLabelText('Copy code');
        expect(button).toBeInTheDocument();

        // Check for code content
        expect(screen.getByText('console.log("test");')).toBeInTheDocument();
    });

    it('copies code to clipboard when button clicked', async () => {
        const code = 'console.log("test");';
        const markdown = '```js\n' + code + '\n```';
        const message = { role: 'assistant', content: markdown };
        render(<MessageBubble message={message} />);

        const button = screen.getByLabelText('Copy code');
        fireEvent.click(button);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code + '\n');

        // Should show "Copied" state (checked via aria-label change or icon presence)
        // In our implementation, aria-label changes to "Copied"
        expect(await screen.findByLabelText('Copied')).toBeInTheDocument();
    });
});
