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
