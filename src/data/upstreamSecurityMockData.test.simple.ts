import { describe, it, expect } from 'vitest';
import { upstreamSecurityMockData } from './upstreamSecurityMockData';

describe('Simple test', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
  
  it('should load mock data', () => {
    expect(upstreamSecurityMockData).toBeDefined();
  });
});