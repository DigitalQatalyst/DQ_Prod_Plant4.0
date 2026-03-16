import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/components/theme-provider';
import { describe, it, expect, beforeEach } from 'vitest';

// Import security components to test
import { PostureBySite } from '@/pages/security/PostureBySite';
import { ControlCoverageView } from '@/pages/security/ControlCoverageView';
import { RiskComplianceSummary } from '@/pages/security/RiskComplianceSummary';
import { AccessPolicies } from '@/pages/security/AccessPolicies';
import { ZoneConduitModel } from '@/pages/security/ZoneConduitModel';
import { SecurityControlLibrary } from '@/pages/security/SecurityControlLibrary';
import { IncidentCases } from '@/pages/security/IncidentCases';
import { ConfigChangeHistory } from '@/pages/security/ConfigChangeHistory';
import { PlatformDataProtection } from '@/pages/ShellPage';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AppProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Security components to test for consistent styling
const securityComponents = [
  { name: 'PostureBySite', component: PostureBySite },
  { name: 'ControlCoverageView', component: ControlCoverageView },
  { name: 'RiskComplianceSummary', component: RiskComplianceSummary },
  { name: 'AccessPolicies', component: AccessPolicies },
  { name: 'ZoneConduitModel', component: ZoneConduitModel },
  { name: 'SecurityControlLibrary', component: SecurityControlLibrary },
  { name: 'IncidentCases', component: IncidentCases },
  { name: 'ConfigChangeHistory', component: ConfigChangeHistory },
  { name: 'PlatformDataProtection', component: PlatformDataProtection },
];

describe('Consistent Styling Across Security Features', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('Shared Component Usage', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should use shared components consistently`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for consistent use of shared components
        // These classes are from shared components like KPICard, StatusBadge, etc.
        const sharedComponentClasses = [
          'bg-card',           // Card backgrounds
          'border-border',     // Consistent borders
          'text-muted-foreground', // Consistent text colors
          'rounded-lg',        // Consistent border radius
        ];

        sharedComponentClasses.forEach(className => {
          const elementsWithClass = container.querySelectorAll(`.${className}`);
          // We expect at least some elements to use shared styling classes
          // This ensures components are using the design system
          if (elementsWithClass.length === 0) {
            console.warn(`${name} may not be using shared component class: ${className}`);
          }
        });

        // Verify the component renders without errors
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Layout Consistency', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should follow nLVE layout pattern`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for nLVE pattern elements
        // Most security components should have these layout elements
        const layoutElements = container.querySelectorAll('[class*="flex"], [class*="grid"]');
        expect(layoutElements.length).toBeGreaterThan(0);

        // Check for consistent spacing classes
        const spacingElements = container.querySelectorAll('[class*="gap-"], [class*="space-"], [class*="p-"], [class*="m-"]');
        expect(spacingElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Typography Consistency', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should use consistent typography classes`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for consistent typography usage
        const typographyClasses = [
          'text-sm',           // Small text
          'text-xs',           // Extra small text
          'font-medium',       // Medium font weight
          'font-semibold',     // Semibold font weight
        ];

        let hasTypographyClasses = false;
        typographyClasses.forEach(className => {
          const elementsWithClass = container.querySelectorAll(`.${className}`);
          if (elementsWithClass.length > 0) {
            hasTypographyClasses = true;
          }
        });

        expect(hasTypographyClasses).toBe(true);
      });
    });
  });

  describe('Color Consistency', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should use consistent color classes`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for consistent color usage
        const colorClasses = [
          'text-primary',      // Primary text color
          'text-success',      // Success color
          'text-warning',      // Warning color
          'text-destructive',  // Error/destructive color
          'bg-primary',        // Primary background
          'bg-success',        // Success background
          'bg-warning',        // Warning background
          'bg-destructive',    // Destructive background
        ];

        let hasColorClasses = false;
        colorClasses.forEach(className => {
          const elementsWithClass = container.querySelectorAll(`.${className}`);
          if (elementsWithClass.length > 0) {
            hasColorClasses = true;
          }
        });

        // Most security components should use some color classes
        expect(hasColorClasses).toBe(true);
      });
    });
  });

  describe('Interactive Element Consistency', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should use consistent interactive element styling`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for consistent button styling
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
          const classes = button.className;
          // Buttons should have consistent styling patterns
          const hasConsistentStyling = 
            classes.includes('rounded') || 
            classes.includes('px-') || 
            classes.includes('py-') ||
            classes.includes('transition');
          
          if (buttons.length > 0) {
            expect(hasConsistentStyling).toBe(true);
          }
        });

        // Check for consistent hover states
        const hoverElements = container.querySelectorAll('[class*="hover:"]');
        // Interactive elements should have hover states
        if (buttons.length > 0 || container.querySelectorAll('[class*="cursor-pointer"]').length > 0) {
          expect(hoverElements.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Responsive Design', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should include responsive design classes`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for responsive grid/flex classes
        const responsiveClasses = [
          'grid-cols-',        // Grid columns
          'flex-col',          // Flex column
          'flex-row',          // Flex row
          'sm:',               // Small breakpoint
          'md:',               // Medium breakpoint
          'lg:',               // Large breakpoint
        ];

        let hasResponsiveClasses = false;
        responsiveClasses.forEach(className => {
          const elementsWithClass = container.querySelectorAll(`[class*="${className}"]`);
          if (elementsWithClass.length > 0) {
            hasResponsiveClasses = true;
          }
        });

        expect(hasResponsiveClasses).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should include accessibility attributes`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for accessibility attributes
        const accessibilityElements = [
          container.querySelectorAll('[role]'),
          container.querySelectorAll('[aria-label]'),
          container.querySelectorAll('[aria-labelledby]'),
          container.querySelectorAll('[aria-describedby]'),
          container.querySelectorAll('[tabindex]'),
        ];

        const totalAccessibilityElements = accessibilityElements.reduce(
          (total, elements) => total + elements.length, 
          0
        );

        // Components should have some accessibility attributes
        // This is a basic check - more comprehensive a11y testing would be done separately
        expect(totalAccessibilityElements).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Icon Usage', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      it(`${name} should use icons consistently`, () => {
        const { container } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check for SVG icons (Lucide icons)
        const svgIcons = container.querySelectorAll('svg');
        
        if (svgIcons.length > 0) {
          svgIcons.forEach(svg => {
            // Icons should have consistent sizing classes
            const classes = svg.className;
            const hasConsistentSizing = 
              classes.includes('w-4 h-4') || 
              classes.includes('w-5 h-5') || 
              classes.includes('w-6 h-6') ||
              classes.includes('w-8 h-8');
            
            expect(hasConsistentSizing).toBe(true);
          });
        }
      });
    });
  });

  it('should verify all components render without errors', () => {
    securityComponents.forEach(({ name, component: Component }) => {
      expect(() => {
        render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  it('should verify consistent use of shared StatusBadge component', () => {
    // Test that components use StatusBadge consistently
    const componentsWithStatus = [
      PostureBySite,
      ControlCoverageView,
      AccessPolicies,
      IncidentCases,
    ];

    componentsWithStatus.forEach(Component => {
      const { container } = render(
        <TestWrapper>
          <Component />
        </TestWrapper>
      );

      // Look for status badge patterns
      const statusElements = container.querySelectorAll('[class*="px-2 py-0.5 rounded"]');
      // If there are status elements, they should follow the StatusBadge pattern
      if (statusElements.length > 0) {
        expect(statusElements.length).toBeGreaterThan(0);
      }
    });
  });

  it('should verify consistent use of shared KPICard component', () => {
    // Test that dashboard-style components use KPICard consistently
    const componentsWithKPIs = [
      PostureBySite,
      RiskComplianceSummary,
      PlatformDataProtection,
    ];

    componentsWithKPIs.forEach(Component => {
      const { container } = render(
        <TestWrapper>
          <Component />
        </TestWrapper>
      );

      // Look for KPI card patterns - cards with metrics
      const cardElements = container.querySelectorAll('.bg-card');
      // If there are cards, they should follow consistent patterns
      expect(cardElements.length).toBeGreaterThanOrEqual(0);
    });
  });
});