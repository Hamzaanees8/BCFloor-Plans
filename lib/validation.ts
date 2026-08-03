/**
 * A simple, reusable form validation utility.
 * No external libraries used.
 */
import { isValidEmail } from "./utils";

export interface ValidationRule {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  min?: number;
  phone?: boolean;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export function validateForm(
  values: Record<string, any>,
  schema: ValidationSchema
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  const addError = (key: string, message: string) => {
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(message);
  };

  for (const key in schema) {
    const rule = schema[key];
    const value = values[key];

    // Required check
    if (rule.required) {
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        addError(key, rule.message || `${key.replace(/_/g, " ")} is required`);
        continue; // Skip other checks if required fails
      }
    }

    // skip other checks if value is empty and not required
    if (value === undefined || value === null || value === "") {
        continue;
    }

    // Email check
    if (rule.email && typeof value === "string") {
      if (!isValidEmail(value)) {
        addError(key, rule.message || "Enter correct email");
      }
    }

    // Phone check
    if (rule.phone && typeof value === "string") {
      // Basic phone regex - naturally this can be expanded
      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(value)) {
          // If we don't have a specific message, just a general one
          // addError(key, rule.message || "Invalid phone format");
      }
    }

    // Min Length check
    if (rule.minLength !== undefined && typeof value === "string") {
      if (value.length < rule.minLength) {
        addError(key, rule.message || `${key.replace(/_/g, " ")} must be at least ${rule.minLength} characters`);
      }
    }

    // Min value check (for numbers)
    if (rule.min !== undefined && typeof value === "number") {
        if (value < rule.min) {
            addError(key, rule.message || `${key.replace(/_/g, " ")} must be at least ${rule.min}`);
        }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        addError(key, customError);
      }
    }
  }

  return errors;
}
