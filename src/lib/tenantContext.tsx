import { useApp } from '../context/AppContext';

/**
 * Hook to access the current tenant context.
 * This wraps the global AppContext to provide a focused tenant interface
 * for components that specifically need tenant information.
 */
export function useTenant() {
    const { currentTenant } = useApp();

    return {
        tenant: currentTenant
    };
}
