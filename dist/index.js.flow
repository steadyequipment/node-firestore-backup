/* @flow */

import Firebase from 'firebase-admin'

import fs from 'fs'
import mkdirp from 'mkdirp'

import { backupRootCollections } from './firestore'

export default function (accountCredentials: string | Object, backupPath: string, prettyPrintJSON: boolean) {
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
  return backupRootCollections(database, backupPath, prettyPrintJSON)
}
