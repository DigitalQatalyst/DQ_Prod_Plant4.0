import { useEffect } from 'react';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSectorSwitching, type SectorSwitchNotification } from '@/hooks/use-sector-switching';

interface SectorSwitchNotificationProps {
  notification: SectorSwitchNotification;
  onClose: () => void;
}

function SectorSwitchNotificationComponent({ 
  notification, 
  onClose 
}: SectorSwitchNotificationProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg transition-all duration-300",
      getBgColor()
    )}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", getTextColor())}>
            {notification.message}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-transparent"
          onClick={onClose}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Global notification component for sector switching feedback
 * Should be placed at the app level to show notifications across all pages
 */
export function SectorSwitchNotificationProvider() {
  const { notification, clearNotification } = useSectorSwitching();

  if (!notification) {
    return null;
  }

  return (
    <SectorSwitchNotificationComponent
      notification={notification}
      onClose={clearNotification}
    />
  );
}

export default SectorSwitchNotificationProvider;