/**
 * Input validation utilities
 */

import { ZodSchema, ZodError } from 'zod';

export interface InputValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function validateInput<T>(schema: ZodSchema<T>, data: unknown): InputValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

export function parseList(value: unknown, separator = ','): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    return value.split(separator).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function parseIntOptional(value: unknown, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

export function parseBool(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
}