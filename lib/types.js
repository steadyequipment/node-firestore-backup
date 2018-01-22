// Returns if a value is a string
export const isString = (value) => {
  if (typeof value === 'string' || value instanceof String) {
    return {
      value,
      typeof: 'string'
    }
  }
  return false
}

// Returns if a value is really a number
export const isNumber = (value) => {
  if (typeof value === 'number' && isFinite(value)) {
    return {
      value,
      typeof: 'number'
    }
  }
  return false
}

// Returns if a value is an array
export const isArray = (value) => {
  if (value && typeof value === 'object' && value.constructor === Array) {
    return {
      value,
      typeof: 'array'
    }
  }
  return false
}

// Returns if a value is an object
export const isObject = (value) => {
  if (value && typeof value === 'object' && value.constructor === Object) {
    return {
      value,
      typeof: 'object'
    }
  }
  return false
}

// Returns if a value is null
export const isNull = (value) => {
  if (value === null) {
    return {
      value,
      typeof: 'null'
    }
  }
  return false
}

// Returns if a value is undefined
export const isUndefined = (value) => {
  if (typeof value === 'undefined') {
    return {
      value,
      typeof: 'undefined'
    }
  }
  return false
}

// Returns if a value is a boolean
export const isBoolean = (value) => {
  if (typeof value === 'boolean') {
    return {
      value,
      typeof: 'boolean'
    }
  }
  return false
}

// Returns if value is a date object
export const isDate = (value) => {
  if (value instanceof Date) {
    return {
      value,
      typeof: 'date'
    }
  }
  return false
}
