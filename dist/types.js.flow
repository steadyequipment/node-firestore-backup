/* @flow */

export type ValueDescription = {
    value: any,
    typeof: string
}

export type ValidationResult = ValueDescription | false;

// Returns if a value is a string
export const isString = (value: any): ValidationResult => {
  if (typeof value === 'string' || value instanceof String) {
    return {
      value,
      typeof: 'string'
    }
  }
  return false
}

// Returns if a value is really a number
export const isNumber = (value: any): ValidationResult => {
  if (typeof value === 'number' && isFinite(value)) {
    return {
      value,
      typeof: 'number'
    }
  }
  return false
}

// Returns if a value is an array
export const isArray = (value: any): ValidationResult => {
  if (value && typeof value === 'object' && value.constructor === Array) {
    return {
      value,
      typeof: 'array'
    }
  }
  return false
}

// Returns if a value is an object
export const isObject = (value: any): ValidationResult => {
  if (value && typeof value === 'object' && value.constructor === Object) {
    return {
      value,
      typeof: 'object'
    }
  }
  return false
}

// Returns if a value is null
export const isNull = (value: any): ValidationResult => {
  if (value === null) {
    return {
      value,
      typeof: 'null'
    }
  }
  return false
}

// Returns if a value is undefined
export const isUndefined = (value: any): ValidationResult => {
  if (typeof value === 'undefined') {
    return {
      value,
      typeof: 'undefined'
    }
  }
  return false
}

// Returns if a value is a boolean
export const isBoolean = (value: any): ValidationResult => {
  if (typeof value === 'boolean') {
    return {
      value,
      typeof: 'boolean'
    }
  }
  return false
}

// Returns if value is a date object
export const isDate = (value: any): ValidationResult => {
  if (value instanceof Date) {
    return {
      value,
      typeof: 'date'
    }
  }
  return false
}
