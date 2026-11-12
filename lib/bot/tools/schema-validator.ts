import { BotToolDeclaration, BotToolSchemaProperty } from '../types';

export interface SchemaValidationResult {
  valid: boolean;
  sanitizedArgs: Record<string, any>;
  errors: string[];
}

function validateValue(
  key: string,
  val: any,
  prop: BotToolSchemaProperty,
  errors: string[]
): any {
  switch (prop.type) {
    case 'string': {
      if (typeof val !== 'string') {
        errors.push(`"${key}" must be a string (received ${typeof val}).`);
        return val;
      }
      const trimmed = val.trim();
      if (prop.minLength !== undefined && trimmed.length < prop.minLength) {
        errors.push(`"${key}" must be at least ${prop.minLength} character(s).`);
      }
      if (prop.maxLength !== undefined && trimmed.length > prop.maxLength) {
        errors.push(`"${key}" exceeds maximum length of ${prop.maxLength} characters.`);
      }
      if (prop.enum && !prop.enum.includes(trimmed)) {
        errors.push(`"${key}" must be one of: ${prop.enum.join(', ')}.`);
      }
      if (prop.pattern) {
        try {
          const re = new RegExp(prop.pattern);
          if (!re.test(trimmed)) {
            errors.push(`"${key}" does not match required format.`);
          }
        } catch {
          // Ignore invalid schema pattern definition
        }
      }
      return trimmed;
    }

    case 'integer':
    case 'number': {
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        errors.push(`"${key}" must be a finite ${prop.type}.`);
        return val;
      }
      if (prop.type === 'integer' && !Number.isInteger(val)) {
        errors.push(`"${key}" must be an integer.`);
      }
      if (prop.minimum !== undefined && val < prop.minimum) {
        errors.push(`"${key}" must be >= ${prop.minimum}.`);
      }
      if (prop.maximum !== undefined && val > prop.maximum) {
        errors.push(`"${key}" must be <= ${prop.maximum}.`);
      }
      return val;
    }

    case 'boolean': {
      if (typeof val !== 'boolean') {
        errors.push(`"${key}" must be a boolean.`);
      }
      return val;
    }

    case 'array': {
      if (!Array.isArray(val)) {
        errors.push(`"${key}" must be an array.`);
        return val;
      }
      if (prop.items) {
        return val.map((item, idx) =>
          validateValue(`${key}[${idx}]`, item, prop.items!, errors)
        );
      }
      return val;
    }

    case 'object': {
      if (!val || typeof val !== 'object' || Array.isArray(val)) {
        errors.push(`"${key}" must be an object.`);
      }
      return val;
    }

    default:
      errors.push(`Unsupported schema type "${(prop as any).type}" for "${key}".`);
      return val;
  }
}

export function validateToolArguments(
  schema: BotToolDeclaration['parameters'],
  rawArgs: any
): SchemaValidationResult {
  const errors: string[] = [];

  if (!rawArgs || typeof rawArgs !== 'object' || Array.isArray(rawArgs)) {
    return {
      valid: false,
      sanitizedArgs: {},
      errors: ['Tool arguments must be a JSON object.'],
    };
  }

  // Handle raw unparsed string fallback from malformed streamed JSON
  if (typeof (rawArgs as any).raw === 'string' && !schema.properties?.raw) {
    return {
      valid: false,
      sanitizedArgs: {},
      errors: ['Malformed JSON tool arguments received from model.'],
    };
  }

  const sanitizedArgs: Record<string, any> = {};
  const properties = schema.properties || {};
  const required = schema.required || [];

  for (const reqKey of required) {
    if (
      rawArgs[reqKey] === undefined ||
      rawArgs[reqKey] === null ||
      (typeof rawArgs[reqKey] === 'string' && rawArgs[reqKey].trim() === '')
    ) {
      errors.push(`Missing required parameter "${reqKey}".`);
    }
  }

  for (const [key, value] of Object.entries(rawArgs)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      errors.push(`Disallowed property name "${key}".`);
      continue;
    }

    const propSchema = properties[key];
    if (!propSchema) {
      if (schema.additionalProperties === false) {
        errors.push(`Unexpected parameter "${key}" is not allowed.`);
      }
      continue;
    }

    if (value === undefined || value === null) {
      if (required.includes(key)) {
        errors.push(`Parameter "${key}" cannot be null or undefined.`);
      }
      continue;
    }

    sanitizedArgs[key] = validateValue(key, value, propSchema, errors);
  }

  return {
    valid: errors.length === 0,
    sanitizedArgs,
    errors,
  };
}

/**
 * Produces a clean OpenAPI/JSON-Schema subset compatible with Gemini, OpenAI, and Anthropic
 * function calling declarations (strips runtime-only validation keys like minLength/pattern/additionalProperties).
 */
export function toProviderParametersSchema(
  parameters: BotToolDeclaration['parameters']
): { type: 'object'; properties: Record<string, any>; required?: string[] } {
  const cleanProps: Record<string, any> = {};

  const sanitizeProp = (prop: BotToolSchemaProperty): Record<string, any> => {
    const out: Record<string, any> = {
      type: prop.type,
    };
    if (prop.description) out.description = prop.description;
    if (prop.enum) out.enum = prop.enum;
    if (prop.items) out.items = sanitizeProp(prop.items);
    return out;
  };

  for (const [key, prop] of Object.entries(parameters.properties || {})) {
    cleanProps[key] = sanitizeProp(prop);
  }

  const schema: { type: 'object'; properties: Record<string, any>; required?: string[] } = {
    type: 'object',
    properties: cleanProps,
  };

  if (parameters.required && parameters.required.length > 0) {
    schema.required = parameters.required;
  }

  return schema;
}
