/* @flow */

import {
  isString,
  isNull,
  isObject,
  isArray,
  isNumber,
  isDate,
  isBoolean,
  isReference,
  isDocumentPath,
  isCollectionPath
} from './types'
import type { ValueDescription, Validator, FirestoreBackupOptions } from './types'
import { promiseParallel } from './utility'

import fs from 'fs'
import mkdirp from 'mkdirp'

import stringify from 'json-stable-stringify'

export const constructReferenceUrl = (reference: Object): ValueDescription => {
  const referenceSegments = reference._referencePath.segments
  let referencePath: ?string
  if (Array.isArray(referenceSegments)) {
    referencePath = referenceSegments.join('/')
  } else if (typeof referenceSegments === 'string') {
    referencePath = referenceSegments
  }

  if (referencePath) {
    return {
      value: referencePath,
      type: 'reference'
    }
  } else {
    return {
      value: reference,
      type: 'unknown'
    }
  }
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
        documentDataToStore = Object.assign({}, documentDataToStore, {
          [key]: documentValue
        })
      } else {
        const validValue = isReference(documentData[key])
        if (validValue) {
          documentDataToStore = Object.assign({}, documentDataToStore, {
            [key]: constructReferenceUrl(documentData[key])
          })
        } else {
          documentDataToStore = {
            value: documentData[key],
            type: 'unknown'
          }
        }
        // TODO: stronger validation that we have a reference rather than being our fallback
      }
    }
  })
  return documentDataToStore
}

const defaultBackupOptions = {
  databaseStartPath: '',
  requestCountLimit: 1,
  exclude: [],
  excludePatterns: []
}

export class FirestoreBackup {
  options: FirestoreBackupOptions;

  documentRequestLimit: number;

  fileWrite: void;

  constructor(options: FirestoreBackupOptions) {
    this.options = Object.assign({}, defaultBackupOptions, options)
    this.fileWrite = options.fileWrite

    if (this.options.requestCountLimit > 1) {
      this.documentRequestLimit = 3 // 3 is the max before diminishing returns
    }
  }

  backup() {
    console.log('Starting backup...')
    if (this.options.databaseStartPath) {
      console.log('Using start path \'', this.options.databaseStartPath, '\'')
    }
    if (this.options.exclude && this.options.exclude.length > 0) {
      console.log('Excluding top level collections', this.options.exclude)
    }

    if (this.options.excludePatterns && this.options.excludePatterns.length > 0) {
      console.log('Excluding patterns', this.options.excludePatterns)
    }

    if (isDocumentPath(this.options.databaseStartPath)) {
      const databaseDocument = this.options.database.doc(this.options.databaseStartPath)
      return databaseDocument.get()
        .then((document) => {
          return this.backupDocument(document, this.options.backupPath + '/' + document.ref.path, '/')
        })
    }

    if (isCollectionPath(this.options.databaseStartPath)) {
      const databaseCollection = this.options.database.collection(this.options.databaseStartPath)
      return this.backupCollection(databaseCollection, this.options.backupPath + '/' + databaseCollection.path, '/')
    }

    return this.backupRootCollections()
  }

  excludeByPattern(fullPath: string) {
    if (this.options.excludePatterns) {
      const matchedPattern = this.options.excludePatterns.find(pattern => pattern.test(fullPath))
      return !!matchedPattern
    }
    return false
  }

  backupRootCollections() {
    return this.options.database.getCollections()
      .then((collections) => {
        return promiseParallel(collections, (collection) => {
          if (this.options.exclude.includes(collection.id)) {
            return Promise.resolve()
          }
          return this.backupCollection(collection, this.options.backupPath + '/' + collection.id, '/')
        }, 1)
      })
  }

  backupCollection(collection: Object, backupPath: string, logPath: string) {
    const logPathWithCollection = logPath + collection.id
    if (this.excludeByPattern('/' + collection.path)) {
      console.log('Excluding Collection \'' + logPathWithCollection + '\' (/' + collection.path + ')')
      return Promise.resolve()
    }
    console.log('Backing up Collection \'' + logPathWithCollection + '\'')
    if (!this.fileWrite) {
      try {
        mkdirp.sync(backupPath)
      } catch (error) {
        throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error)
      }
    }

    return collection.get()
      .then((documentSnapshots) => documentSnapshots.docs)
      .then((docs) => {
        return promiseParallel(docs, (document) => {
          return this.backupDocument(document, backupPath + '/' + document.id, logPathWithCollection + '/')
        }, this.options.requestCountLimit)
      })
  }

  backupDocument(document: Object, backupPath: string, logPath: string) {
    const logPathWithDocument = logPath + document.id
    if (this.excludeByPattern('/' + document.ref.path)) {
      console.log('Excluding Document \'' + logPathWithDocument + '\' (/' + document.ref.path + ')')
      return Promise.resolve()
    }
    console.log('Backing up Document \'' + logPathWithDocument + '\'')
    if (!this.fileWrite) {
      try {
        mkdirp.sync(backupPath)
      } catch (error) {
        throw new Error('Unable to create backup path for Document \'' + document.id + '\': ' + error)
      }
    }

    let fileContents: string
    try {
      const documentData = document.data()
      const keys = Object.keys(documentData)
      var documentDataToStore = {}
      documentDataToStore = Object.assign({}, constructDocumentValue(documentDataToStore, keys, documentData))
      if (this.prettyPrintJSON === true) {
        fileContents = stringify(documentDataToStore, null, 2)
      } else {
        fileContents = stringify(documentDataToStore)
      }
    } catch (error) {
      throw new Error('Unable to serialize Document \'' + document.id + '\': ' + error)
    }
    if (!this.fileWrite) {
      try {
        fs.writeFileSync(backupPath + '/' + document.id + '.json', fileContents)
      } catch (error) {
        throw new Error('Unable to write Document \'' + document.id + '\': ' + error)
      }
    } else {
      this.fileWrite((backupPath + '/' + document.id), fileContents)
    }

    return document.ref.getCollections()
      .then((collections) => {
        return promiseParallel(collections, (collection) => {
          return this.backupCollection(collection, backupPath + '/' + collection.id, logPathWithDocument + '/')
        }, this.documentRequestLimit)
      })
  }
}
