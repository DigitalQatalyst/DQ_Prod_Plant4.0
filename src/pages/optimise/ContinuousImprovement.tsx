import { useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { EmptyStates } from "@/components/shared/EmptyState";
import { NavigationErrorHandler } from "@/lib/errorHandling";
import { CIProjects } from "./ci/CIProjects";
import { RCA } from "./ci/RCA";
import { Countermeasures } from "./ci/Countermeasures";
import { ImpactTracking } from "./ci/ImpactTracking";
import { CIReports } from "./ci/CIReports";

interface ContinuousImprovementProps {
  subFeature?: string;
}

export function ContinuousImprovement({ subFeature }: ContinuousImprovementProps) {
  const location = useLocation();
  
  // Determine which sub-feature to show based on URL or prop with error handling
  const getCurrentSubFeature = () => {
    try {
      if (subFeature) return subFeature;
      
      const path = location.pathname;
      if (path.includes('/ci/projects')) return 'projects';
      if (path.includes('/ci/rca')) return 'rca';
      if (path.includes('/ci/countermeasures')) return 'countermeasures';
      if (path.includes('/ci/impact')) return 'impact';
      if (path.includes('/ci/reports')) return 'reports';
      
      // Default to projects if no specific sub-feature
      return 'projects';
    } catch (error) {
      NavigationErrorHandler.handleRouteNotFound(location.pathname);
      return 'projects'; // Safe fallback
    }
  };

  const currentSubFeature = getCurrentSubFeature();

  // Render the appropriate sub-component with error boundaries
  return (
    <ErrorBoundary
      onError={(error) => {
        NavigationErrorHandler.handleNavigationFailure(error, "/optimise/ci");
      }}
    >
      {(() => {
        switch (currentSubFeature) {
          case 'rca':
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="RCA Component Error"
                    description="Unable to load Root Cause Analysis component."
                    action={{
                      label: "Go to CI Projects",
                      onClick: () => window.location.href = "/optimise/ci/projects",
                      variant: "outline",
                    }}
                  />
                }
              >
                <RCA />
              </ErrorBoundary>
            );
          case 'countermeasures':
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Countermeasures Component Error"
                    description="Unable to load Countermeasures component."
                    action={{
                      label: "Go to CI Projects",
                      onClick: () => window.location.href = "/optimise/ci/projects",
                      variant: "outline",
                    }}
                  />
                }
              >
                <Countermeasures />
              </ErrorBoundary>
            );
          case 'impact':
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Impact Tracking Component Error"
                    description="Unable to load Impact Tracking component."
                    action={{
                      label: "Go to CI Projects",
                      onClick: () => window.location.href = "/optimise/ci/projects",
                      variant: "outline",
                    }}
                  />
                }
              >
                <ImpactTracking />
              </ErrorBoundary>
            );
          case 'reports':
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="CI Reports Component Error"
                    description="Unable to load CI Reports component."
                    action={{
                      label: "Go to CI Projects",
                      onClick: () => window.location.href = "/optimise/ci/projects",
                      variant: "outline",
                    }}
                  />
                }
              >
                <CIReports />
              </ErrorBoundary>
            );
          case 'projects':
          default:
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="CI Projects Component Error"
                    description="Unable to load CI Projects component."
                    action={{
                      label: "Refresh Page",
                      onClick: () => window.location.reload(),
                      variant: "outline",
                    }}
                  />
                }
              >
                <CIProjects />
              </ErrorBoundary>
            );
        }
      })()}
    </ErrorBoundary>
  );
}