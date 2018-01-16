#!/usr/bin/env node

const commander = require('commander')
const colors = require('colors')

const process = require('process')
const fs = require('fs')
const path = require('path')

const version = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString()).version

const accountCredentialsPathParamKey = 'accountCredentials'
const accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file'

const backupPathParamKey = 'backupPath'
const backupPathParamDescription = 'Path to store backup.'

const prettyPrintParamKey = 'prettyPrint'
const prettyPrintParamDescription = 'JSON backups done with pretty-printing.'

commander.version(version)
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

const prettyPrintJSON = commander[prettyPrintParamKey] != null

require('./index.js')({
	accountCredentials: accountCredentialsPath,
	backupDirectory: path.resolve(backupPath),
	prettyPrintJSON
})
	.then(() => {
		console.log(colors.bold(colors.green('All done 💫')))
	})
	.catch((error) => {
		console.log(colors.red(error))
		process.exit(1)
	})
