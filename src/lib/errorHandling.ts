/**
 * Comprehensive error handling utilities for the cognitive structure navigation system
 * Provides error recovery, logging, and graceful degradation functionality
 * 
 * Requirements: All requirements (error handling support)
 */

export interface ErrorContext {
  component?: string;
  feature?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackValue?: any;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export class NavigationError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: ErrorContext,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "NavigationError";
  }
}

export class ContentLoadingError extends Error {
  constructor(
    message: string,
    public contentType: string,
    public context?: ErrorContext,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "ContentLoadingError";
  }
}

export class TemplateIntegrationError extends Error {
  constructor(
    message: string,
    public templateType: string,
    public context?: ErrorContext,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "TemplateIntegrationError";
  }
}

export class StateManagementError extends Error {
  constructor(
    message: string,
    public stateType: string,
    public context?: ErrorContext,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "StateManagementError";
  }
}

/**
 * Enhanced error logger with context and categorization
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: string }> = [];
  private isProcessing = false;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(error: Error, context: ErrorContext = {}) {
    const errorEntry = {
      error,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      timestamp: new Date().toISOString(),
    };

    // Add to queue for batch processing
    this.errorQueue.push(errorEntry);

    // Log immediately to console in development
    if (process.env.NODE_ENV === "development") {
      this.logToConsole(errorEntry);
    }

    // Process queue
    this.processErrorQueue();
  }

  private logToConsole(errorEntry: { error: Error; context: ErrorContext; timestamp: string }) {
    const { error, context } = errorEntry;
    
    console.group(`🚨 ${error.name || "Error"} - ${context.component || "Unknown Component"}`);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Context:", context);
    console.groupEnd();
  }

  private async processErrorQueue() {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // In production, batch send errors to monitoring service
      // Example: await errorMonitoringService.sendBatch(this.errorQueue);
      
      // Clear processed errors
      this.errorQueue = [];
    } catch (err) {
      console.error("Failed to process error queue:", err);
    } finally {
      this.isProcessing = false;
    }
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    fallbackValue,
    onRetry,
    onMaxRetriesReached,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        onMaxRetriesReached?.(lastError);
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        throw lastError;
      }

      onRetry?.(attempt + 1);

      // Exponential backoff with jitter
      const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Safe async function wrapper with error handling
 */
export function safeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ErrorContext = {}
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      const logger = ErrorLogger.getInstance();
      logger.logError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      return null;
    }
  };
}

/**
 * Navigation error recovery utilities
 */
export class NavigationErrorHandler {
  static handleNavigationFailure(error: Error, fallbackPath: string = "/"): void {
    const logger = ErrorLogger.getInstance();
    
    logger.logError(new NavigationError(
      `Navigation failed: ${error.message}`,
      "NAVIGATION_FAILURE",
      {
        component: "NavigationSystem",
        action: "navigate",
        additionalData: { fallbackPath }
      }
    ));

    // Attempt fallback navigation
    try {
      window.history.pushState(null, "", fallbackPath);
      window.location.reload();
    } catch (fallbackError) {
      // If fallback fails, go to root
      window.location.href = "/";
    }
  }

  static handleRouteNotFound(path: string): void {
    const logger = ErrorLogger.getInstance();
    
    logger.logError(new NavigationError(
      `Route not found: ${path}`,
      "ROUTE_NOT_FOUND",
      {
        component: "Router",
        action: "route_resolution",
        additionalData: { path }
      }
    ));
  }
}

/**
 * Content loading error recovery utilities
 */
export class ContentErrorHandler {
  static handleContentLoadingFailure(
    contentType: string,
    error: Error,
    retryFn?: () => void
  ): void {
    const logger = ErrorLogger.getInstance();
    
    logger.logError(new ContentLoadingError(
      `Failed to load ${contentType}: ${error.message}`,
      contentType,
      {
        component: "ContentLoader",
        action: "load_content",
        additionalData: { hasRetryFunction: !!retryFn }
      }
    ));
  }

  static async loadWithFallback<T>(
    primaryLoader: () => Promise<T>,
    fallbackLoader: () => Promise<T>,
    contentType: string
  ): Promise<T> {
    try {
      return await primaryLoader();
    } catch (primaryError) {
      const logger = ErrorLogger.getInstance();
      
      logger.logError(new ContentLoadingError(
        `Primary loader failed for ${contentType}, attempting fallback`,
        contentType,
        {
          component: "ContentLoader",
          action: "fallback_loading",
          additionalData: { primaryError: primaryError.message }
        }
      ));

      try {
        return await fallbackLoader();
      } catch (fallbackError) {
        logger.logError(new ContentLoadingError(
          `Fallback loader also failed for ${contentType}`,
          contentType,
          {
            component: "ContentLoader",
            action: "fallback_failed",
            additionalData: { 
              primaryError: primaryError.message,
              fallbackError: fallbackError.message
            }
          }
        ));
        throw fallbackError;
      }
    }
  }
}

/**
 * Template integration error recovery utilities
 */
export class TemplateErrorHandler {
  static handleTemplateLoadingFailure(
    templateType: string,
    error: Error,
    fallbackComponent?: React.ComponentType
  ): React.ComponentType | null {
    const logger = ErrorLogger.getInstance();
    
    logger.logError(new TemplateIntegrationError(
      `Template loading failed: ${templateType}`,
      templateType,
      {
        component: "TemplateLoader",
        action: "load_template",
        additionalData: { hasFallback: !!fallbackComponent }
      }
    ));

    return fallbackComponent || null;
  }

  static validateTemplateProps(
    props: Record<string, any>,
    requiredProps: string[],
    templateType: string
  ): boolean {
    const missingProps = requiredProps.filter(prop => !(prop in props));
    
    if (missingProps.length > 0) {
      const logger = ErrorLogger.getInstance();
      
      logger.logError(new TemplateIntegrationError(
        `Missing required props for template: ${missingProps.join(", ")}`,
        templateType,
        {
          component: "TemplateValidator",
          action: "validate_props",
          additionalData: { missingProps, providedProps: Object.keys(props) }
        }
      ));
      
      return false;
    }
    
    return true;
  }
}

/**
 * State management error recovery utilities
 */
export class StateErrorHandler {
  static handleStateCorruption(
    stateType: string,
    corruptedState: any,
    defaultState: any
  ): any {
    const logger = ErrorLogger.getInstance();
    
    logger.logError(new StateManagementError(
      `State corruption detected in ${stateType}`,
      stateType,
      {
        component: "StateManager",
        action: "corruption_recovery",
        additionalData: { 
          corruptedState: JSON.stringify(corruptedState),
          defaultState: JSON.stringify(defaultState)
        }
      }
    ));

    return defaultState;
  }

  static validateState(
    state: any,
    validator: (state: any) => boolean,
    stateType: string
  ): boolean {
    try {
      return validator(state);
    } catch (error) {
      const logger = ErrorLogger.getInstance();
      
      logger.logError(new StateManagementError(
        `State validation failed for ${stateType}`,
        stateType,
        {
          component: "StateValidator",
          action: "validate_state",
          additionalData: { 
            validationError: error instanceof Error ? error.message : String(error)
          }
        }
      ));
      
      return false;
    }
  }
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandling(): void {
  const logger = ErrorLogger.getInstance();

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logger.logError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      {
        component: "GlobalErrorHandler",
        action: "unhandled_rejection",
        additionalData: { reason: event.reason }
      }
    );
  });

  // Handle uncaught errors
  window.addEventListener("error", (event) => {
    logger.logError(
      new Error(`Uncaught error: ${event.message}`),
      {
        component: "GlobalErrorHandler",
        action: "uncaught_error",
        additionalData: { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    );
  });
}

// Initialize global error handling
if (typeof window !== "undefined") {
  setupGlobalErrorHandling();
}