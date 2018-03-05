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
import type { ValueDescription, Validator, BackupOptions } from './types'
import { promiseSerial } from './utility'

import fs from 'fs'
import mkdirp from 'mkdirp'
import Promise from 'bluebird'

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
  requestCountLimit: 1
}

export class FirestoreBackup {
  options: BackupOptions;

  constructor(options: BackupOptions) {
    this.options = Object.assign({}, defaultBackupOptions, options)
    Object.assign(this, this.options)

    if (this.requestCountLimit > 1) {
      this.documentRequestLimit = 3 // 3 is the max before diminishing returns
    }
  }

  backup() {
    if (isDocumentPath(this.databaseStartPath)) {
      const databaseDocument = this.database.doc(this.databaseStartPath)
      return databaseDocument.get()
        .then((document) => {
          return this.backupDocument(document, this.backupPath + '/' + document.ref.path, '/', this.prettyPrintJSON)
        })
    }

    if (isCollectionPath(this.databaseStartPath)) {
      const databaseCollection = this.database.collection(this.databaseStartPath)
      return this.backupCollection(databaseCollection, this.backupPath + '/' + databaseCollection.path, '/', this.prettyPrintJSON)
    }

    return this.backupRootCollections()
  }

  backupRootCollections() {
    return this.database.getCollections()
      .then((collections) => {
        return promiseSerial(collections.map((collection) => {
          return () => {
            return this.backupCollection(collection, this.backupPath + '/' + collection.id, '/')
          }
        }))
      })
  }

  backupCollection(collection: Object, backupPath: string, logPath: string) {
    console.log('Backing up Collection \'' + logPath + collection.id + '\'')
    try {
      mkdirp.sync(backupPath)
    } catch (error) {
      throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error)
    }

    return Promise.resolve(collection.get())
      .then((documentSnapshots) => documentSnapshots.docs)
      .map((document) => {
        return this.backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/', this.prettyPrintJSON)
      }, { concurrency: this.requestCountLimit })
  }

  backupDocument(document: Object, backupPath: string, logPath: string) {
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
      if (this.prettyPrintJSON === true) {
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

    return Promise.resolve(document.ref.getCollections())
      .map((collection) => {
        return this.backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/', this.prettyPrintJSON)
      }, { concurrency: this.documentRequestLimit })
  }
}
