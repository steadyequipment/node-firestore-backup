/* @flow */

export type ValueDescription = {
    value: any,
    type: string
}

export type ValidationResult = ValueDescription | false;

// Returns if a value is a string
export const isString = (value: any): ValidationResult => {
  if (typeof value === 'string' || value instanceof String) {
    return {
      value,
      type: 'string'
    }
  }
  return false
}

// Returns if a value is really a number
export const isNumber = (value: any): ValidationResult => {
  if (typeof value === 'number' && isFinite(value)) {
    return {
      value,
      type: 'number'
    }
  }
  return false
}

// Returns if a value is an array
export const isArray = (value: any): ValidationResult => {
  if (Array.isArray(value)) {
    return {
      value,
      type: 'array'
    }
  }
  return false
}

// Returns if a value is an object
export const isObject = (value: any): ValidationResult => {
  if (value && typeof value === 'object' && value.constructor === Object) {
    return {
      value,
      type: 'object'
    }
  }
  return false
}

// Returns if a value is null
export const isNull = (value: any): ValidationResult => {
  if (value === null) {
    return {
      value,
      type: 'null'
    }
  }
  return false
}

// Returns if a value is undefined
export const isUndefined = (value: any): ValidationResult => {
  if (typeof value === 'undefined') {
    return {
      value,
      type: 'undefined'
    }
  }
  return false
}

// Returns if a value is a boolean
export const isBoolean = (value: any): ValidationResult => {
  if (typeof value === 'boolean') {
    return {
      value,
      type: 'boolean'
    }
  }
  return false
}

// Returns if value is a date object
export const isDate = (value: any): ValidationResult => {
  if (value instanceof Date) {
    return {
      value,
      type: 'date'
    }
  }
  return false
}
