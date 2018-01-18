/* @flow */

import Firebase from 'firebase-admin'

import fs from 'fs'
import mkdirp from 'mkdirp'

export default function (accountCredentials: string | Object, backupPath: string, prettyPrintJSON: boolean) {
  // Returns if a value is a string
  const isString = (value) => {
    if (typeof value === 'string' || value instanceof String) {
      return {
        value,
        typeof: 'string'
      }
    }
    return false
  }

  // Returns if a value is really a number
  const isNumber = (value) => {
    if (typeof value === 'number' && isFinite(value)) {
      return {
        value,
        typeof: 'number'
      }
    }
    return false
  }

  // Returns if a value is an array
  const isArray = (value) => {
    if (value && typeof value === 'object' && value.constructor === Array) {
      return {
        value,
        typeof: 'array'
      }
    }
    return false
  }

  // Returns if a value is an object
  const isObject = (value) => {
    if (value && typeof value === 'object' && value.constructor === Object) {
      return {
        value,
        typeof: 'object'
      }
    }
    return false
  }

  // Returns if a value is null
  const isNull = (value) => {
    if (value === null) {
      return {
        value,
        typeof: 'null'
      }
    }
    return false
  }

  // Returns if a value is undefined
  const isUndefined = (value) => {
    if (typeof value === 'undefined') {
      return {
        value,
        typeof: 'undefined'
      }
    }
    return false
  }

  // Returns if a value is a boolean
  const isBoolean = (value) => {
    if (typeof value === 'boolean') {
      return {
        value,
        typeof: 'boolean'
      }
    }
    return false
  }

  // Returns if value is a date object
  const isDate = (value) => {
    if (value instanceof Date) {
      return {
        value,
        typeof: 'date'
      }
    }
    return false
  }

  const constructReferenceUrl = (reference) => {
    var referencePath = ''
    Object.keys(reference).forEach(key => {
      Object.keys(reference[key]).forEach(subKey => {
        if (subKey === 'segments') {
          const pathArray = reference[key][subKey]
          pathArray.forEach(pathKey => { referencePath = referencePath ? `${referencePath}/${pathKey}` : pathKey })
        }
      })
    })
    return referencePath ? { value: referencePath, typeof: 'reference' } : referencePath
  }

  const constructDocumentValue = (documentDataToStore = {}, keys, documentData) => {
    keys.forEach(key => {
      // Boolean - boolean
      // Reference - reference
      // Integer - number
      // Array - array
      // Object - object
      // Float - number
      // Geographical Point - todo
      // Map = todo
      // Null - null
      // String - string
      if (isBoolean(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: isBoolean(documentData[key]) })
      } else if (isDate(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: isDate(documentData[key]) })
      } else if (isNumber(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: isNumber(documentData[key]) })
      } else if (isArray(documentData[key])) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], { typeof: 'array' })
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], constructDocumentValue({}, Object.keys(documentData[key]), documentData[key]))
      } else if (isObject(documentData[key])) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], { typeof: 'object' })
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], constructDocumentValue({}, Object.keys(documentData[key]), documentData[key]))
      } else if (isNull(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: isNull(documentData[key]) })
      } else if (isString(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: isString(documentData[key]) })
      } else {
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: constructReferenceUrl(documentData[key]) })
      }
    })
    return documentDataToStore
  }

  // from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
  const promiseSerial = (funcs) => {
    return funcs.reduce(
      (promise, func) => {
        return promise.then((result) => {
          return func().then(() => {
            return Array.prototype.concat.bind(result)
          })
        })
      }, Promise.resolve([]))
  }

  const backupDocument = (document: Object, backupPath: string, logPath: string): Promise<void> => {
    console.log('Backing up Document \'' + logPath + document.id + '\'')
    try {
      mkdirp.sync(backupPath)
    } catch (error) {
      throw new Error('Unable to create backup path for Document \'' + document.id + '\': ' + error)
    }

    let fileContents: string
    try {
      const documentData = document.data()
      const keys = Object.keys(documentData)
      var documentDataToStore = {}
      documentDataToStore = Object.assign({}, constructDocumentValue(documentDataToStore, keys, documentData))
      if (prettyPrintJSON === true) {
        fileContents = JSON.stringify(documentDataToStore, null, 2)
      } else {
        fileContents = JSON.stringify(documentDataToStore)
      }
    } catch (error) {
      throw new Error('Unable to serialize Document \'' + document.id + '\': ' + error)
    }
    try {
      fs.writeFileSync(backupPath + '/' + document.id + '.json', fileContents)
    } catch (error) {
      throw new Error('Unable to write Document \'' + document.id + '\': ' + error)
    }

    return document.ref.getCollections()
      .then((collections) => {
        return promiseSerial(collections.map((collection) => {
          return () => {
            return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/')
          }
        }))
      })
  }

  const backupCollection = (collection: Object, backupPath: string, logPath: string): Promise<void> => {
    console.log('Backing up Collection \'' + logPath + collection.id + '\'')
    try {
      mkdirp.sync(backupPath)
    } catch (error) {
      throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error)
    }

    return collection.get()
      .then((snapshots) => {
        const backupFunctions = []
        snapshots.forEach((document) => {
          backupFunctions.push(() => {
            return backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/')
          })
        })
        return promiseSerial(backupFunctions)
      })
  }

  let accountCredentialsContents: Object
  if (typeof accountCredentials === 'string') {
    try {
      const accountCredentialsBuffer = fs.readFileSync(accountCredentials)
      accountCredentialsContents = JSON.parse(accountCredentialsBuffer.toString())
    } catch (error) {
      throw new Error('Unable to read account credential file \'' + accountCredentials + '\': ' + error)
    }
  } else if (typeof accountCredentials === 'object') {
    accountCredentialsContents = accountCredentials
  } else {
    throw new Error('No account credentials provided')
  }

  Firebase.initializeApp({
    credential: Firebase.credential.cert(accountCredentialsContents)
  })

  try {
    mkdirp.sync(backupPath)
  } catch (error) {
    throw new Error('Unable to create backup path \'' + backupPath + '\': ' + error)
  }

  const database = Firebase.firestore()
  database.getCollections()
    .then((collections) => {
      return promiseSerial(collections.map((collection) => {
        return () => {
          return backupCollection(collection, backupPath + '/' + collection.id, '/')
        }
      }))
    })
}
