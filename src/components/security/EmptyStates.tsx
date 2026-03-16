import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity, 
  FileText, 
  Database,
  Search,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Database, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            action.variant === 'secondary'
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Specific empty states for security features
export function NoAlertsEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={Shield}
      title="No Security Alerts"
      description="No security alerts found for this tenant. This is good news - your upstream systems are secure!"
      action={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh,
        variant: 'secondary'
      } : undefined}
    />
  );
}

export function NoUsersEmptyState({ onAddUser }: { onAddUser?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No Users Found"
      description="No users have been configured for this tenant. Add users to manage access to upstream systems."
      action={onAddUser ? {
        label: "Add User",
        onClick: onAddUser
      } : undefined}
    />
  );
}

export function NoIncidentsEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No Security Incidents"
      description="No security incidents have been recorded for this tenant. Your upstream operations are running smoothly."
      action={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh,
        variant: 'secondary'
      } : undefined}
    />
  );
}

export function NoAssetsEmptyState({ onDiscover }: { onDiscover?: () => void }) {
  return (
    <EmptyState
      icon={Activity}
      title="No OT Assets Found"
      description="No operational technology assets have been discovered for this tenant. Run asset discovery to populate your inventory."
      action={onDiscover ? {
        label: "Discover Assets",
        onClick: onDiscover
      } : undefined}
    />
  );
}

export function NoSitesEmptyState({ onAddSite }: { onAddSite?: () => void }) {
  return (
    <EmptyState
      icon={Activity}
      title="No Sites Configured"
      description="No upstream sites have been configured for this tenant. Add sites to manage your well pads, platforms, and facilities."
      action={onAddSite ? {
        label: "Add Site",
        onClick: onAddSite
      } : undefined}
    />
  );
}

export function NoSearchResultsEmptyState({ 
  searchQuery, 
  onClearSearch 
}: { 
  searchQuery: string; 
  onClearSearch: () => void; 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description={`No results found for "${searchQuery}". Try adjusting your search terms or clearing the search to see all items.`}
      action={{
        label: "Clear Search",
        onClick: onClearSearch,
        variant: 'secondary'
      }}
    />
  );
}

export function NoDataEmptyState({ 
  title = "No Data Available",
  description = "No data is available for the current selection. Try selecting a different tenant or refreshing the page.",
  onRefresh 
}: { 
  title?: string;
  description?: string;
  onRefresh?: () => void; 
}) {
  return (
    <EmptyState
      icon={Database}
      title={title}
      description={description}
      action={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh,
        variant: 'secondary'
      } : undefined}
    />
  );
}

// Loading states
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  className = '' 
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Error states
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong",
  description = "An error occurred while loading data. Please try again.",
  onRetry,
  className = '' 
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

// Network error state
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  );
}

// Offline state
export function OfflineState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-warning" />
      </div>
      <h3 className="text-lg font-semibold mb-2">You're Offline</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        You're currently offline. Some features may not be available until you reconnect to the internet.
      </p>
    </div>
  );
}