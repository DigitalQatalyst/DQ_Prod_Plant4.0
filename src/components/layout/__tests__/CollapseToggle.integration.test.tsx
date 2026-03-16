import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutProvider } from '@/context/LayoutContext';
import { CollapseToggle } from '../CollapseToggle';
import { useLayout } from '@/context/LayoutContext';

// Test component that uses the layout context
function TestComponent({ pane }: { pane: 'menu' | 'list' | 'pop' }) {
  const { layoutState, setMenuPaneCollapsed, setListPaneCollapsed, setPopPaneVisible } = useLayout();
  
  const isCollapsed = pane === 'menu' 
    ? layoutState.menuPaneCollapsed 
    : pane === 'list' 
    ? layoutState.listPaneCollapsed 
    : !layoutState.popPaneVisible;
  
  const onToggle = pane === 'menu'
    ? setMenuPaneCollapsed
    : pane === 'list'
    ? setListPaneCollapsed
    : (collapsed: boolean) => setPopPaneVisible(!collapsed);
  
  return (
    <div>
      <CollapseToggle
        pane={pane}
        isCollapsed={isCollapsed}
        onToggle={onToggle}
      />
      <div data-testid="state">
        {pane === 'menu' && `Menu: ${layoutState.menuPaneCollapsed ? 'collapsed' : 'expanded'}`}
        {pane === 'list' && `List: ${layoutState.listPaneCollapsed ? 'collapsed' : 'expanded'}`}
        {pane === 'pop' && `Pop: ${layoutState.popPaneVisible ? 'visible' : 'hidden'}`}
      </div>
    </div>
  );
}

describe('CollapseToggle Integration', () => {
  it('toggles menu pane state in layout context', async () => {
    const user = userEvent.setup();
    
    render(
      <LayoutProvider>
        <TestComponent pane="menu" />
      </LayoutProvider>
    );
    
    // Initial state - menu should be expanded
    expect(screen.getByTestId('state')).toHaveTextContent('Menu: expanded');
    
    // Click to collapse
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Should be collapsed now
    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('Menu: collapsed');
    });
    
    // Click to expand
    await user.click(button);
    
    // Should be expanded again
    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('Menu: expanded');
    });
  });

  it('toggles list pane state in layout context', async () => {
    const user = userEvent.setup();
    
    render(
      <LayoutProvider>
        <TestComponent pane="list" />
      </LayoutProvider>
    );
    
    // Initial state - list should be expanded
    expect(screen.getByTestId('state')).toHaveTextContent('List: expanded');
    
    // Click to collapse
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Should be collapsed now
    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('List: collapsed');
    });
    
    // Click to expand
    await user.click(button);
    
    // Should be expanded again
    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('List: expanded');
    });
  });

  it('toggles pop pane visibility in layout context', async () => {
    const user = userEvent.setup();
    
    render(
      <LayoutProvider>
        <TestComponent pane="pop" />
      </LayoutProvider>
    );
    
    // Initial state - pop should be hidden (popPaneVisible defaults to false)
    expect(screen.getByTestId('state')).toHaveTextContent('Pop: hidden');
    
    // The button shows "Show Details" when collapsed (hidden)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show Details');
  });

  it('persists menu pane state to localStorage', async () => {
    const user = userEvent.setup();
    
    render(
      <LayoutProvider>
        <TestComponent pane="menu" />
      </LayoutProvider>
    );
    
    // Click to collapse
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Wait for state to update
    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('Menu: collapsed');
    });
    
    // Check localStorage (preferences should be saved)
    const stored = localStorage.getItem('layout-preferences');
    expect(stored).toBeTruthy();
    
    if (stored) {
      const preferences = JSON.parse(stored);
      expect(preferences.menuPaneCollapsed).toBe(true);
    }
  });
});
