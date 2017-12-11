#!/usr/bin/env node

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

commander.version('1.0.1')
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

var firestoreBackup = require('../dist/index.js')
try {
  firestoreBackup.default(accountCredentialsPath, backupPath, prettyPrint)
} catch (error) {
  console.log(colors.red(error))
  process.exit(1)
}
