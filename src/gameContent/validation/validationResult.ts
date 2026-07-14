export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function ok(): ValidationResult {
  return { valid: true, errors: [] }
}

export function fail(errors: string[]): ValidationResult {
  return { valid: false, errors }
}

export function combine(results: readonly ValidationResult[]): ValidationResult {
  const errors = results.flatMap((result) => result.errors)
  return errors.length > 0 ? fail(errors) : ok()
}

export function requireNonEmptyString(value: unknown, field: string): string[] {
  return typeof value === 'string' && value.length > 0 ? [] : [`${field} must be a non-empty string`]
}

export function requireStringFields<T extends object>(record: T, fields: readonly (keyof T)[]): ValidationResult {
  const asRecord = record as unknown as Record<string, unknown>
  const errors = fields.flatMap((field) => requireNonEmptyString(asRecord[field as string], String(field)))
  return errors.length > 0 ? fail(errors) : ok()
}
