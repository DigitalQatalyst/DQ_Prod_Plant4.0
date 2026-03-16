import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkPane } from '../WorkPane';
import { ReactNode } from 'react';

describe('WorkPane', () => {
    const tabs1 = [
        { id: 'tab1', label: 'Tab 1', content: <div data-testid="content1">Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div data-testid="content2">Content 2</div> },
    ];

    const tabs2 = [
        { id: 'overview', label: 'Overview', content: <div data-testid="overview">Overview Content</div> },
        { id: 'detail', label: 'Detail', content: <div data-testid="detail">Detail Content</div> },
    ];

    it('renders the first tab by default', () => {
        render(<WorkPane title="Test Title" tabs={tabs1} />);
        expect(screen.getByTestId('content1')).toBeInTheDocument();
        expect(screen.queryByTestId('content2')).not.toBeInTheDocument();
    });

    it('switches tabs when clicked', () => {
        render(<WorkPane title="Test Title" tabs={tabs1} />);
        fireEvent.click(screen.getByText('Tab 2'));
        expect(screen.getByTestId('content2')).toBeInTheDocument();
        expect(screen.queryByTestId('content1')).not.toBeInTheDocument();
    });

    it('updates active tab when tabs prop changes and current tab is missing', () => {
        const { rerender } = render(<WorkPane title="Test Title" tabs={tabs1} />);

        // Initially Tab 1 is active
        expect(screen.getByTestId('content1')).toBeInTheDocument();

        // Change tabs to tabs2 (Tab 1 no longer exists)
        rerender(<WorkPane title="Test Title" tabs={tabs2} />);

        // Should now show Overview Content (first tab of new tabs)
        expect(screen.getByTestId('overview')).toBeInTheDocument();
        expect(screen.queryByTestId('content1')).not.toBeInTheDocument();
    });

    it('preserves active tab if it still exists in new tabs', () => {
        const tabs3 = [
            { id: 'tab2', label: 'Tab 2 New', content: <div data-testid="content2">Content 2 New</div> },
            { id: 'tab3', label: 'Tab 3', content: <div data-testid="content3">Content 3</div> },
        ];

        const { rerender } = render(<WorkPane title="Test Title" tabs={tabs1} />);

        // Click Tab 2
        fireEvent.click(screen.getByText('Tab 2'));
        expect(screen.getByTestId('content2')).toBeInTheDocument();

        // Rerender with tabs3 (tab2 still exists)
        rerender(<WorkPane title="Test Title" tabs={tabs3} />);

        // Should still show Tab 2 (Content 2 New)
        expect(screen.getByTestId('content2')).toBeInTheDocument();
        expect(screen.getByText('Content 2 New')).toBeInTheDocument();
    });
});
