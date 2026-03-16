import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutProvider } from '@/context/LayoutContext';
import { LayoutContainer } from '../LayoutContainer';
import { MenuPane } from '../MenuPane';
import { ListPane } from '../ListPane';
import { BrowserRouter } from 'react-router-dom';

// Mock navigation data
vi.mock('@/data/navigation', () => ({
  featureAreas: []
}));

describe('CollapseToggle Visual Behavior', () => {
  it('applies smooth transition classes to layout container', () => {
    const { container } = render(
      <BrowserRouter>
        <LayoutProvider>
          <LayoutContainer
            menuPane={<MenuPane />}
            listPane={<div>List Content</div>}
          >
            <div>Work Content</div>
          </LayoutContainer>
        </LayoutProvider>
      </BrowserRouter>
    );
    
    // Check that transition classes are applied
    const layoutContainer = container.querySelector('.grid');
    expect(layoutContainer).toHaveClass('transition-all');
    expect(layoutContainer).toHaveClass('duration-300');
    expect(layoutContainer).toHaveClass('ease-in-out');
  });

  it('menu pane has transition classes for smooth collapse', () => {
    const { container } = render(
      <BrowserRouter>
        <LayoutProvider>
          <MenuPane />
        </LayoutProvider>
      </BrowserRouter>
    );
    
    // Check that menu pane has transition classes
    const menuPane = container.querySelector('aside');
    expect(menuPane).toHaveClass('transition-all');
    expect(menuPane).toHaveClass('duration-300');
    expect(menuPane).toHaveClass('ease-in-out');
  });

  it('collapse toggle button has transition classes', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <LayoutProvider>
          <MenuPane />
        </LayoutProvider>
      </BrowserRouter>
    );
    
    // Get the collapse toggle button specifically by its aria-label
    const button = screen.getByRole('button', { name: /hide menu/i });
    
    // Check that button has transition classes
    expect(button).toHaveClass('transition-all');
    expect(button).toHaveClass('duration-200');
    expect(button).toHaveClass('ease-in-out');
  });

  it('maintains consistent animation timing across all panes', () => {
    const { container } = render(
      <BrowserRouter>
        <LayoutProvider>
          <LayoutContainer
            menuPane={<MenuPane />}
            listPane={<div>List Content</div>}
          >
            <div>Work Content</div>
          </LayoutContainer>
        </LayoutProvider>
      </BrowserRouter>
    );
    
    // All panes should use consistent animation timing (300ms)
    const menuPane = container.querySelector('aside');
    const layoutContainer = container.querySelector('.grid');
    
    expect(menuPane).toHaveClass('duration-300');
    expect(layoutContainer).toHaveClass('duration-300');
  });
});
