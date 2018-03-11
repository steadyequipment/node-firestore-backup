// TODO: Flow coverage

import { isFunction } from './types'

// from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
export const promiseSerial = (funcs) => {
  return funcs.reduce(
    (promise, func) => {
      return promise.then((result) => {
        return func().then(() => {
          return Array.prototype.concat.bind(result)
        })
      })
    }, Promise.resolve([]))
}

/**
 * Splits a string into path segments, using slashes as separators.
 *
 * @param {string} relativePath - The path to split.
 * @returns {Array.<string>} - The split path segments.
 */
export const getSegments = (relativePath) => {
  // We may have an empty segment at the beginning or end if they had a
  // leading or trailing slash (which we allow).
  return relativePath.split('/').filter(segment => segment.length > 0)
}

const map = (basePromise: Object, fn: Function, options: Object) => {
  return basePromise.then((value) => {
    return promiseSerial(value.map((value) => {
      return () => {
        return fn(value)
      }
    }))
  })
}

/**
 * Adds the method 'map' to the prototype of an object.
 *
 * @param {object} obj - The object to receive the 'map' method.
 */
export const addMapFunction = (obj: Object) => {
  if (!isFunction(obj.map)) {
    obj.prototype.map = function(fn: Function, options: Object) {
      return map(this, fn, options)
    }
  }

  return obj
}
