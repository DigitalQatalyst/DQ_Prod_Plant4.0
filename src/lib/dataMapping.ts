/**
 * Data Mapping Utilities
 * 
 * Provides functions to map database records (usually snake_case) 
 * to frontend interfaces (usually camelCase).
 */

/**
 * Convert snake_case string to camelCase
 */
export function snakeToCamel(s: string): string {
    if (s === 'level') return 'securityLevel';
    return s.replace(/(_\w)/g, (m) => m[1].toUpperCase());
}

/**
 * recursively map keys of an object or array of objects
 */
export function mapKeys<T>(data: any, mapper: (key: string) => string): T {
    if (Array.isArray(data)) {
        return data.map((item) => mapKeys(item, mapper)) as any;
    }

    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
        const result: any = {};
        Object.keys(data).forEach((key) => {
            const mappedKey = mapper(key);
            result[mappedKey] = mapKeys(data[key], mapper);
        });
        return result;
    }

    return data;
}

/**
 * Map snake_case object keys to camelCase
 */
export function toCamelCase<T>(data: any): T {
    return mapKeys<T>(data, snakeToCamel);
}
