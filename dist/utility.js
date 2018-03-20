'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// TODO: Flow coverage

// TODO: Remove in favor of `promiseParallel`
// from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
var promiseSerial = exports.promiseSerial = function promiseSerial(funcs) {
  return funcs.reduce(function (promise, func) {
    return promise.then(function (result) {
      return func().then(function () {
        return Array.prototype.concat.bind(result);
      });
    });
  }, Promise.resolve([]));
};

/**
 * Iterate over an array using the given mapper function to resolve a list of promises.
 *
 * @param {Array} input - The array to be mapped.
 * @param {function:Promise} mapper - A function to be called on each array element.
 * @param {number} [concurrency=1] - Limits the number of Promises created.
 * @returns {Promise}
 */
var promiseParallel = exports.promiseParallel = function promiseParallel(input, mapper) {
  var concurrency = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

  var results = Array.from({ length: input.length });
  var offset = 0;

  function dowork() {
    return offset >= input.length ? Promise.resolve() : Promise.resolve(offset++).then(function (ix) {
      return mapper(input[ix]).then(function (result) {
        results[ix] = result;
      });
    }).then(function () {
      return dowork();
    });
  }

  return Promise.all(Array.from({ length: concurrency }, dowork)).then(function () {
    return results;
  });
};

/**
 * Splits a string into path segments, using slashes as separators.
 *
 * @param {string} relativePath - The path to split.
 * @returns {Array.<string>} - The split path segments.
 */
var getSegments = exports.getSegments = function getSegments(relativePath) {
  // We may have an empty segment at the beginning or end if they had a
  // leading or trailing slash (which we allow).
  return relativePath.split('/').filter(function (segment) {
    return segment.length > 0;
  });
};