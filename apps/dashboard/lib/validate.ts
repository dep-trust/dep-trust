export class ValidationError extends Error {
  readonly field: string

  constructor(field: string, message: string) {
    super(`${field}: ${message}`)
    this.name = 'ValidationError'
    this.field = field
  }
}

type FieldSpec =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | { type: 'string' | 'number' | 'boolean' | 'array' | 'object'; optional?: boolean }

type Shape = Record<string, FieldSpec>

type Infer<T extends Shape> = {
  [K in keyof T]: T[K] extends { type: infer U; optional: true }
    ? U extends 'string'
      ? string | undefined
      : U extends 'number'
        ? number | undefined
        : U extends 'boolean'
          ? boolean | undefined
          : unknown | undefined
    : T[K] extends { type: infer U }
      ? U extends 'string'
        ? string
        : U extends 'number'
          ? number
          : U extends 'boolean'
            ? boolean
            : unknown
      : T[K] extends 'string'
        ? string
        : T[K] extends 'number'
          ? number
          : T[K] extends 'boolean'
            ? boolean
            : unknown
}

export function validate<T extends Shape>(shape: T, value: unknown): Infer<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError('body', 'expected an object')
  }

  const obj = value as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, spec] of Object.entries(shape)) {
    const expectedType = typeof spec === 'string' ? spec : spec.type
    const optional = typeof spec === 'object' && spec.optional === true
    const raw = obj[key]

    if (raw === undefined || raw === null) {
      if (optional) {
        result[key] = undefined
        continue
      }
      throw new ValidationError(key, 'required')
    }

    if (expectedType === 'array') {
      if (!Array.isArray(raw)) throw new ValidationError(key, `expected array, got ${typeof raw}`)
    } else if (typeof raw !== expectedType) {
      throw new ValidationError(key, `expected ${expectedType}, got ${typeof raw}`)
    }

    result[key] = raw
  }

  return result as Infer<T>
}
