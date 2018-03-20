// TODO: Flow coverage

// TODO: Remove in favor of `promiseParallel`
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
 * Iterate over an array using the given mapper function to resolve a list of promises.
 *
 * @param {Array} input - The array to be mapped.
 * @param {function:Promise} mapper - A function to be called on each array element.
 * @param {number} [concurrency=1] - Limits the number of Promises created.
 * @returns {Promise}
 */
export const promiseParallel = (input, mapper, concurrency = 1) => {
  const results = Array.from({ length: input.length })
  let offset = 0

  function dowork() {
    return (offset >= input.length) ?
      Promise.resolve() :
      Promise.resolve(offset++)
      .then(ix => mapper(input[ix]).then(result => { results[ix] = result }))
      .then(() => dowork())
  }

  return Promise.all(Array.from({ length: concurrency }, dowork))
    .then(() => results)
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
