/**
 * Safe Data Access Utilities
 * 
 * This module provides type guards and safe wrapper functions for defensive programming.
 * All functions handle undefined, null, and invalid types gracefully without throwing errors.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.3, 5.4, 5.5
 */

// ============================================================================
// Type Guard Functions
// ============================================================================

/**
 * Type guard to check if a value is a valid number (not NaN)
 * @param value - The value to check
 * @returns True if value is a number and not NaN
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Type guard to check if a value is a string
 * @param value - The value to check
 * @returns True if value is a string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Type guard to check if a value is an array
 * @param value - The value to check
 * @returns True if value is an array
 */
export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

/**
 * Type guard to check if a value is a non-empty array
 * @param value - The value to check
 * @returns True if value is an array with at least one element
 */
export const isNonEmptyArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

// ============================================================================
// Safe Numeric Formatting Functions
// ============================================================================

/**
 * Safely formats a number with toFixed(), returning a default if value is not a number
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string or default value
 */
export const safeToFixed = (value: unknown, decimals: number = 1): string => {
  if (!isNumber(value)) {
    return '0.' + '0'.repeat(decimals);
  }
  return value.toFixed(decimals);
};

/**
 * Safely formats a number as a percentage
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string or default value
 */
export const safePercentage = (value: unknown, decimals: number = 1): string => {
  if (!isNumber(value)) {
    return '0.' + '0'.repeat(decimals) + '%';
  }
  return `${value.toFixed(decimals)}%`;
};

/**
 * Safely converts a value to a number, returning a default if conversion fails
 * @param value - The value to convert
 * @param defaultValue - Default value to return if conversion fails (default: 0)
 * @returns Number or default value
 */
export const safeNumber = (value: unknown, defaultValue: number = 0): number => {
  if (isNumber(value)) {
    return value;
  }
  const parsed = Number(value);
  return isNumber(parsed) ? parsed : defaultValue;
};

// ============================================================================
// Safe String Operations
// ============================================================================

/**
 * Safely calls string replace(), returning empty string if value is not a string
 * @param value - The value to perform replace on
 * @param searchValue - The string or regex to search for
 * @param replaceValue - The replacement string
 * @returns Replaced string or empty string
 */
export const safeReplace = (
  value: unknown,
  searchValue: string | RegExp,
  replaceValue: string
): string => {
  if (!isString(value)) {
    return '';
  }
  return value.replace(searchValue, replaceValue);
};

/**
 * Safely converts a value to a string, returning a default if value is not a string
 * @param value - The value to convert
 * @param defaultValue - Default value to return if value is not a string (default: '')
 * @returns String or default value
 */
export const safeString = (value: unknown, defaultValue: string = ''): string => {
  if (!isString(value)) {
    return defaultValue;
  }
  return value;
};

/**
 * Safely calls string toLowerCase()
 * @param value - The value to convert to lowercase
 * @param defaultValue - Default value to return if value is not a string (default: '')
 * @returns Lowercase string or default value
 */
export const safeToLowerCase = (value: unknown, defaultValue: string = ''): string => {
  if (!isString(value)) {
    return defaultValue;
  }
  return value.toLowerCase();
};

/**
 * Safely calls string toUpperCase()
 * @param value - The value to convert to uppercase
 * @param defaultValue - Default value to return if value is not a string (default: '')
 * @returns Uppercase string or default value
 */
export const safeToUpperCase = (value: unknown, defaultValue: string = ''): string => {
  if (!isString(value)) {
    return defaultValue;
  }
  return value.toUpperCase();
};

// ============================================================================
// Safe Array Operations
// ============================================================================

/**
 * Safely iterates over an array with forEach, doing nothing if value is not an array
 * @param array - The array to iterate over
 * @param callback - The callback function to execute for each element
 */
export const safeForEach = <T>(
  array: unknown,
  callback: (item: T, index: number) => void
): void => {
  if (!isArray(array)) {
    return;
  }
  array.forEach(callback as (item: unknown, index: number) => void);
};

/**
 * Safely maps over an array, returning empty array if value is not an array
 * @param array - The array to map over
 * @param callback - The callback function to execute for each element
 * @returns Mapped array or empty array
 */
export const safeMap = <T, R>(
  array: unknown,
  callback: (item: T, index: number) => R
): R[] => {
  if (!isArray(array)) {
    return [];
  }
  return array.map(callback as (item: unknown, index: number) => R);
};

/**
 * Safely reduces an array, returning initial value if value is not an array
 * @param array - The array to reduce
 * @param callback - The reducer callback function
 * @param initialValue - The initial accumulator value
 * @returns Reduced value or initial value
 */
export const safeReduce = <T, R>(
  array: unknown,
  callback: (acc: R, item: T) => R,
  initialValue: R
): R => {
  if (!isArray(array)) {
    return initialValue;
  }
  return array.reduce(callback as (acc: R, item: unknown) => R, initialValue);
};

/**
 * Safely filters an array, returning empty array if value is not an array
 * @param array - The array to filter
 * @param predicate - The filter predicate function
 * @returns Filtered array or empty array
 */
export const safeFilter = <T>(
  array: unknown,
  predicate: (item: T, index: number) => boolean
): T[] => {
  if (!isArray(array)) {
    return [];
  }
  return array.filter(predicate as (item: unknown, index: number) => boolean) as T[];
};

/**
 * Safely gets the length of an array, returning 0 if value is not an array
 * @param array - The array to get length from
 * @returns Array length or 0
 */
export const safeLength = (array: unknown): number => {
  if (!isArray(array)) {
    return 0;
  }
  return array.length;
};

// ============================================================================
// Safe Property Access
// ============================================================================

/**
 * Safely accesses a nested property using a path string
 * @param obj - The object to access
 * @param path - The property path (e.g., 'user.profile.name')
 * @param defaultValue - Default value to return if property doesn't exist
 * @returns Property value or default value
 */
export const safeGet = <T = unknown>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined => {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
};
