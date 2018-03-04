// TODO: Flow coverage
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
