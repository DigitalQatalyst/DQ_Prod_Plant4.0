import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaneResizer } from '../PaneResizer';

describe('PaneResizer', () => {
  const defaultProps = {
    pane: 'list' as const,
    currentWidth: 320,
    minWidth: 280,
    maxWidth: 500,
    onResize: vi.fn(),
  };

  it('renders resize handle with proper accessibility attributes', () => {
    render(<PaneResizer {...defaultProps} />);
    
    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('aria-label', 'Resize list pane');
    expect(separator).toHaveAttribute('aria-valuenow', '320');
    expect(separator).toHaveAttribute('aria-valuemin', '280');
    expect(separator).toHaveAttribute('aria-valuemax', '500');
  });

  it('shows resize cursor on hover', () => {
    const { container } = render(<PaneResizer {...defaultProps} />);
    
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('cursor-col-resize');
  });

  it('calls onResize with constrained width during drag', () => {
    const onResize = vi.fn();
    render(<PaneResizer {...defaultProps} onResize={onResize} />);
    
    const separator = screen.getByRole('separator');
    
    // Start drag
    fireEvent.mouseDown(separator, { clientX: 320 });
    
    // Move mouse to resize
    fireEvent.mouseMove(document, { clientX: 370 }); // +50px
    
    // Should call onResize with new width
    expect(onResize).toHaveBeenCalled();
    const lastCall = onResize.mock.calls[onResize.mock.calls.length - 1];
    expect(lastCall[0]).toBe(370); // 320 + 50
    
    // End drag
    fireEvent.mouseUp(document);
  });

  it('enforces minimum width constraint', () => {
    const onResize = vi.fn();
    render(<PaneResizer {...defaultProps} onResize={onResize} />);
    
    const separator = screen.getByRole('separator');
    
    // Start drag
    fireEvent.mouseDown(separator, { clientX: 320 });
    
    // Try to resize below minimum
    fireEvent.mouseMove(document, { clientX: 200 }); // Would be 200px, below min of 280
    
    // Should clamp to minimum
    expect(onResize).toHaveBeenCalled();
    const lastCall = onResize.mock.calls[onResize.mock.calls.length - 1];
    expect(lastCall[0]).toBe(280); // Clamped to minWidth
    
    fireEvent.mouseUp(document);
  });

  it('enforces maximum width constraint', () => {
    const onResize = vi.fn();
    render(<PaneResizer {...defaultProps} onResize={onResize} />);
    
    const separator = screen.getByRole('separator');
    
    // Start drag
    fireEvent.mouseDown(separator, { clientX: 320 });
    
    // Try to resize above maximum
    fireEvent.mouseMove(document, { clientX: 900 }); // Would be 900px, above max of 500
    
    // Should clamp to maximum
    expect(onResize).toHaveBeenCalled();
    const lastCall = onResize.mock.calls[onResize.mock.calls.length - 1];
    expect(lastCall[0]).toBe(500); // Clamped to maxWidth
    
    fireEvent.mouseUp(document);
  });

  it('calls onResizeStart when drag begins', () => {
    const onResizeStart = vi.fn();
    render(<PaneResizer {...defaultProps} onResizeStart={onResizeStart} />);
    
    const separator = screen.getByRole('separator');
    fireEvent.mouseDown(separator, { clientX: 320 });
    
    expect(onResizeStart).toHaveBeenCalledTimes(1);
    
    fireEvent.mouseUp(document);
  });

  it('calls onResizeEnd when drag ends', () => {
    const onResizeEnd = vi.fn();
    render(<PaneResizer {...defaultProps} onResizeEnd={onResizeEnd} />);
    
    const separator = screen.getByRole('separator');
    
    fireEvent.mouseDown(separator, { clientX: 320 });
    fireEvent.mouseMove(document, { clientX: 370 });
    fireEvent.mouseUp(document);
    
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
  });

  it('handles pop pane resize direction correctly', () => {
    const onResize = vi.fn();
    render(
      <PaneResizer
        {...defaultProps}
        pane="pop"
        currentWidth={450}
        minWidth={400}
        maxWidth={600}
        onResize={onResize}
      />
    );
    
    const separator = screen.getByRole('separator');
    
    // Start drag
    fireEvent.mouseDown(separator, { clientX: 800 });
    
    // Move mouse left (should increase width for pop pane)
    fireEvent.mouseMove(document, { clientX: 770 }); // -30px from start = +30px width
    
    expect(onResize).toHaveBeenCalled();
    const lastCall = onResize.mock.calls[onResize.mock.calls.length - 1];
    expect(lastCall[0]).toBe(480); // 450 + 30
    
    fireEvent.mouseUp(document);
  });
});
