#!/usr/bin/env node

/* @flow */

var commander = require('commander')
var colors = require('colors')

var process = require('process')
var fs = require('fs')

var accountCredentialsPathParamKey = 'accountCredentials'
var accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file'

var backupPathParamKey = 'backupPath'
var backupPathParamDescription = 'Path to store backup.'

var prettyPrintParamKey = 'prettyPrint'
var prettyPrintParamDescription = 'JSON backups done with pretty-printing.'

var databaseStartPathParamKey = 'databaseStartPath'
var databaseStartPathParamDescription = 'The database collection or document path to begin backup.'

var requestCountLimitParamKey = 'requestCountLimit'
var requestCountLimitParamDescription = 'The maximum number of requests to be made in parallel.'

var excludeParamKey = 'exclude'
var excludeParamDescription = 'Collection(s) to exclude from backing up.'

// This allows taking an array of collections to exclude, e.g. `firestore-backup -E logs -E events`
function collectAllExcludeValues(str, memo) {
  memo.push(str)
  return memo
}

commander.version('1.0.1')
  .option('-a, --' + accountCredentialsPathParamKey + ' <path>', accountCredentialsPathParamDescription)
  .option('-B, --' + backupPathParamKey + ' <path>', backupPathParamDescription)
  .option('-P, --' + prettyPrintParamKey, prettyPrintParamDescription)
  .option('-S, --' + databaseStartPathParamKey + ' <path>', databaseStartPathParamDescription)
  .option('-L, --' + requestCountLimitParamKey + ' <number>', requestCountLimitParamDescription)
  .option('-E', '--' + excludeParamKey, excludeParamDescription, collectAllExcludeValues, [])
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

const prettyPrintJSON = commander[prettyPrintParamKey] !== undefined && commander[prettyPrintParamKey] !== null

const databaseStartPath = (commander[databaseStartPathParamKey] || '').replace(/^\//, '')

const requestCountLimit = parseInt(commander[requestCountLimitParamKey] || '1', 10)

const exclude = commander[excludeParamKey] || []

var firestoreBackup = require('../dist/index.js')
try {
  console.time('backuptime')
  firestoreBackup.default({
    accountCredentials: accountCredentialsPath,
    databaseStartPath,
    backupPath,
    prettyPrintJSON,
    requestCountLimit,
    exclude
  })
    .then(() => {
      console.log(colors.bold(colors.green('All done 💫')))
      console.timeEnd('backuptime')
    })
} catch (error) {
  console.log(colors.red(error))
  process.exit(1)
}
