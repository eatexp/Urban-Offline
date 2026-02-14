
import React from 'react';
import { render } from '@testing-library/react';
import MessageBubble from './MessageBubble';
import { describe, it, expect } from 'vitest';

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
});
