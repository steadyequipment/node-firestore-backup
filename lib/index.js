/* @flow */

import Firebase from 'firebase-admin'

import fs from 'fs'
import mkdirp from 'mkdirp'

export default function(accountCredentials: string | Object, backupPath: string, prettyPrintJSON: boolean) {
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
      if (prettyPrintJSON === true) {
        fileContents = JSON.stringify(document.data(), null, 2)
      } else {
        fileContents = JSON.stringify(document.data())
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
