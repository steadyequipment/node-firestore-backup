/* @flow */

import commander from 'commander'
import colors from 'colors'

import process from 'process'
import fs from 'fs'
import Firebase from 'firebase-admin'
import mkdirp from 'mkdirp'

const accountCredentialsPathParamKey = 'accountCredentials'
const accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file'

const backupPathParamKey = 'backupPath'
const backupPathParamDescription = 'Path to store backup.'

const prettyPrintParamKey = 'prettyPrint'
const prettyPrintParamDescription = 'JSON backups done with pretty-printing.'

commander.version('1.0.0')
.option('-a, --' + accountCredentialsPathParamKey + ' <path>', accountCredentialsPathParamDescription)
.option('-B, --' + backupPathParamKey + ' <path>', backupPathParamDescription)
.option('-P, --' + prettyPrintParamKey, prettyPrintParamDescription)
  .parse(process.argv)

const accountCredentialsPath = commander[accountCredentialsPathParamKey]
if (!accountCredentialsPath) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(accountCredentialsPathParamKey) + ' - ' + accountCredentialsPathParamDescription)
  commander.help()
  process.exit(1)
}

if (!fs.existsSync(accountCredentialsPath)) {
  console.log(colors.bold(colors.red('Account credentials file does not exist: ')) + colors.bold(accountCredentialsPath))
  commander.help()
  process.exit(1)
}

const backupPath = commander[backupPathParamKey]
if (!backupPath) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(backupPathParamKey) + ' - ' + backupPathParamDescription)
  commander.help()
  process.exit(1)
}

const prettyPrint = commander[prettyPrintParamKey] !== undefined && commander[prettyPrintParamKey] !== null

try {
  const accountCredentialsBuffer = fs.readFileSync(accountCredentialsPath)

  const accountCredentials = JSON.parse(accountCredentialsBuffer.toString())
  Firebase.initializeApp({
    credential: Firebase.credential.cert(accountCredentials)
  })
} catch (error) {
  console.log(colors.bold(colors.red('Unable to read: ')) + colors.bold(accountCredentialsPath) + ' - ' + error)
  process.exit(1)
}

try {
  mkdirp.sync(backupPath)
} catch (error) {
  console.log(colors.bold(colors.red('Unable to create backup path: ')) + colors.bold(backupPath) + ' - ' + error)
  process.exit(1)
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

const backupDocument = (document: Object, backupPath: string, logPath: string): Promise<any> => {
  console.log('Backing up Document \'' + logPath + document.id + '\'')
  try {
    mkdirp.sync(backupPath)
    let fileContents: string
    if (prettyPrint === true) {
      fileContents = JSON.stringify(document.data(), null, 2)
    } else {
      fileContents = JSON.stringify(document.data())
    }
    fs.writeFileSync(backupPath + '/' + document.id + '.json', fileContents)

    return document.ref.getCollections()
    .then((collections) => {
      return promiseSerial(collections.map((collection) => {
        return () => {
          return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/')
        }
      }))
    })
  } catch (error) {
    console.log(colors.bold(colors.red('Unable to create backup path or write file, skipping backup of Document \'' + document.id + '\': ')) + colors.bold(backupPath) + ' - ' + error)
      //   process.exit(1)
  }
}

const backupCollection = (collection: Object, backupPath: string, logPath: string): Promise<void> => {
  console.log('Backing up Collection \'' + logPath + collection.id + '\'')
  try {
    mkdirp.sync(backupPath)

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
  } catch (error) {
    console.log(colors.bold(colors.red('Unable to create backup path, skipping backup of Collection \'' + collection.id + '\': ')) + colors.bold(backupPath) + ' - ' + error)
  }
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
