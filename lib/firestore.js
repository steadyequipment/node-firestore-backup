/* @flow */

import { isString, isNull, isObject, isArray, isNumber, isDate, isBoolean } from './types'
import type { ValueDescription, Validator } from './types'
import { promiseSerial } from './utility'

import fs from 'fs'
import mkdirp from 'mkdirp'

export const constructReferenceUrl = (reference: Object): ValueDescription => {
  let referencePath: string = ''
  Object.keys(reference).forEach(key => {
    Object.keys(reference[key]).forEach(subKey => {
      if (subKey === 'segments') {
        const pathArray = reference[key][subKey]
        pathArray.forEach(pathKey => {
          referencePath = referencePath ? `${referencePath}/${pathKey}` : pathKey
        })
      }
    })
  })
  return referencePath ? { value: referencePath, type: 'reference' } : { value: reference, type: 'unknown' }
}

const testValidDocumentValue = (
    key: string,
    documentData: Object,
    validators: Array<Validator>) => {
  let validValue: ?ValueDescription

  for (let index = 0; index < validators.length; index++) {
    const testValidValue = validators[index](documentData[key])
    if (typeof testValidValue !== 'boolean') {
      validValue = testValidValue
      break
    }
  }

  if (validValue) {
    return validValue
  }
  return false
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
    const objectTypeValidators: Array<Validator> = [
      isArray,
      isObject
    ]

    const documentValue = testValidDocumentValue(key, documentData, objectTypeValidators)
    if (documentValue) {
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], { type: documentValue.type })
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], constructDocumentValue({}, Object.keys(documentData[key]), documentData[key]))
    } else {
      const basicTypeValidators: Array<Validator> = [
        isBoolean,
        isDate,
        isNumber,
        isNull,
        isString
      ]

      const documentValue = testValidDocumentValue(key, documentData, basicTypeValidators)
      if (documentValue) {
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: documentValue })
      } else {
          // TODO: stronger validation that we have a reference rather than being our fallback
        documentDataToStore = Object.assign({}, documentDataToStore, { [key]: constructReferenceUrl(documentData[key]) })
      }
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
