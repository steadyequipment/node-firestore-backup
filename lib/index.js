const Firebase = require('firebase-admin')
const path = require('path')
const fs = require('then-fs')
const mkdirp = require('mkdirp-promise')
const eachPromise = require('each-promise')

function firebaseMap (list, iterator) {
	const result = []
	list.forEach((item) => result.push(iterator(item)))
	return result
}

function backupDocument ({ document, backupDirectory, parentPath, prettyPrintJSON }) {
	const itemPath = path.join(parentPath, document.id)
	const backupItemPath = path.join(backupDirectory, itemPath)
	const backupFilePath = path.join(backupItemPath, `${document.id}.json`)
	// console.log(`Backing up document ${itemPath}...`)
	return mkdirp(backupItemPath)
		.catch((error) => Promise.reject(
			new Error(`Unable to create backup directory for document ${itemPath} at ${backupItemPath}: ${error}`)
		))
		.then(() => {
			if (prettyPrintJSON === true) {
				return JSON.stringify(document.data(), null, 2)
			} else {
				return JSON.stringify(document.data())
			}
		})
		.catch((error) => Promise.reject(
			new Error(`Unable to serialize document ${itemPath}: ${error}`)
		))
		.then((fileContents) =>
			fs.writeFile(backupFilePath, fileContents)
		)
		.catch((error) => Promise.reject(
			new Error(`Unable to write document ${itemPath} at ${backupFilePath}: ${error}`)
		))
		.then(() =>
			document.ref.getCollections().then((collections) =>
				eachPromise.serial(
					collections.map((collection) =>
						() => backupCollection({
							collection,
							prettyPrintJSON,
							parentPath: itemPath,
							backupDirectory
						})
					)
				)
			)
		)
}

function backupCollection ({ collection, backupDirectory, parentPath, prettyPrintJSON }) {
	const itemPath = path.join(parentPath, collection.id)
	const backupItemPath = path.join(backupDirectory, itemPath)
	console.log(`Backing up collection ${itemPath}...`)
	let i = 0, n = 0
	const timer = setInterval(function () {
		if (n !== 0) console.log(`Backing up collection ${itemPath} - ${i + 1}/${n} done`)
	}, 1000)
	return mkdirp(backupItemPath)
		.catch((error) => Promise.reject(
			new Error(`Unable to create backup directory for collection ${itemPath} at ${backupItemPath}: ${error}`)
		))
		.then(() =>
			collection.get().then((documentSnapshots) => {
				return eachPromise.parallel(
					firebaseMap(documentSnapshots, (document) =>
						() => backupDocument({
							document,
							prettyPrintJSON,
							parentPath: itemPath,
							backupDirectory
						})
					),
					{
						// concurrency: 50, // this can be any value, but 50 seems to work well, otherwise it seems not all documents get in the "done" output
						afterEach (item, index, arr) {
							if (index > i) {
								i = index
								n = arr.length
							}
						}
					}
				)
			})
		)
		.catch((error) => {
			clearInterval(timer)
			return Promise.reject(error)
		})
		.then(() => {
			clearInterval(timer)
			// add a little delay in case not all afterEach has finished
			return new Promise(function (resolve, reject) {
				setTimeout(function () {
					if (n !== i + 1) {
						reject(new Error(
							`Backup of collection ${itemPath} only backed up ${i + 1}/${n} documents`
						))
					}
					else {
						console.log(`Backed up collection ${itemPath} - ${i + 1}/${n}`)
						resolve()
					}
				}, 1000)
			})
		})
}

module.exports = function ({ accountCredentials, backupDirectory, prettyPrintJSON }) {
	return Promise.resolve()
		.then(() => {
			console.log('Applying account credentials...')
			if (typeof accountCredentials === 'string') {
				return fs.readFile(accountCredentials)
					.then((contents) => JSON.parse(contents.toString()))
					.catch((error) =>
						Promise.reject(
							new Error(`Unable to read account credential file ${accountCredentials}: ${error}`)
						)
					)
			}
			else if (typeof accountCredentials === 'object') {
				return accountCredentials
			}
			else {
				return Promise.reject(
					new Error('No account credentials provided')
				)
			}
		})
		.then((accountCredentials) => {
			console.log('Initialising firebase app...')
			return Firebase.initializeApp({
				credential: Firebase.credential.cert(accountCredentials)
			})
		})
		.then((app) => {
			console.log('Intialising backup path...')
			return mkdirp(backupDirectory).catch((error) => Promise.reject(
				new Error(`Unable to create backup path ${backupDirectory}: ${error}`)
			))
		})
		.then(() => {
			console.log(`Backing up to ${backupDirectory}...`)
			return Firebase.firestore().getCollections().then((collections) =>
				eachPromise.serial(
					collections.map((collection) =>
						() => backupCollection({
							collection,
							prettyPrintJSON,
							backupDirectory,
							parentPath: ''
						})
					)
				)
			)
		})
}