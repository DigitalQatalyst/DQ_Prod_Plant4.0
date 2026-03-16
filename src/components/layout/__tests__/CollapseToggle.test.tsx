import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapseToggle } from '../CollapseToggle';

describe('CollapseToggle', () => {
  it('renders with correct icon for menu pane when collapsed', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="menu"
        isCollapsed={true}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with correct icon for menu pane when expanded', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="menu"
        isCollapsed={false}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders with correct icon for list pane when collapsed', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={true}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button', { name: /show list/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with correct icon for list pane when expanded', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button', { name: /hide list/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with correct icon for pop pane when collapsed', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="pop"
        isCollapsed={true}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button', { name: /show details/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with correct icon for pop pane when expanded', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="pop"
        isCollapsed={false}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button', { name: /hide details/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onToggle with opposite state when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle with opposite state when collapsed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={true}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('renders with custom label when provided', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
        label="Custom Label"
      />
    );
    
    const button = screen.getByRole('button', { name: /custom label/i });
    expect(button).toBeInTheDocument();
  });

  it('shows label text when showLabel is true', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
        showLabel={true}
      />
    );
    
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('shows custom label text when showLabel is true and label is provided', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
        showLabel={true}
        label="Toggle Sidebar"
      />
    );
    
    expect(screen.getByText('Toggle Sidebar')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
        className="custom-class"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    const onToggle = vi.fn();
    render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'list-pane');
  });

  it('updates aria-expanded when collapsed state changes', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <CollapseToggle
        pane="list"
        isCollapsed={false}
        onToggle={onToggle}
      />
    );
    
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    rerender(
      <CollapseToggle
        pane="list"
        isCollapsed={true}
        onToggle={onToggle}
      />
    );
    
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
