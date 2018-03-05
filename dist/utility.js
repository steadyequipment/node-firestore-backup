'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// TODO: Flow coverage
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