/* @flow */

import { isString, isNull, isObject, isArray, isNumber, isDate, isBoolean } from './types'
import { promiseSerial } from './utility'

import fs from 'fs'
import mkdirp from 'mkdirp'

export const constructReferenceUrl = (reference: Object) => {
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

export const constructDocumentValue = (documentDataToStore: Object = {}, keys: Array<string>, documentData: Object) => {
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

export const backupDocument = (document: Object, backupPath: string, logPath: string, prettyPrintJSON: boolean) => {
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
          return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/', prettyPrintJSON)
        }
      }))
    })
}

export const backupCollection = (collection: Object, backupPath: string, logPath: string, prettyPrintJSON: boolean) => {
  console.log('Backing up Collection \'' + logPath + collection.id + '\'')
  try {
    mkdirp.sync(backupPath)
  } catch (error) {
    throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error)
  }

  return collection.get()
    .then((documentSnapshots) => {
      const backupFunctions = []
      documentSnapshots.forEach((document) => {
        backupFunctions.push(() => {
          return backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/', prettyPrintJSON)
        })
      })
      return promiseSerial(backupFunctions)
    })
}

export const backupRootCollections = (database: Object, backupPath: string, prettyPrintJSON: boolean) => {
  return database.getCollections()
    .then((collections) => {
      return promiseSerial(collections.map((collection) => {
        return () => {
          return backupCollection(collection, backupPath + '/' + collection.id, '/', prettyPrintJSON)
        }
      }))
    })
}
