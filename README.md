# firestore-backup
A Google Firebase Firestore backup tool.

[![codebeat badge](https://codebeat.co/badges/febdaccc-2648-4a74-9596-57b00c3f7af8)](https://codebeat.co/projects/github-com-steadyequipment-node-firestore-backup-master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b7e94350eba84ec198f83c05c3a10bd0)](https://www.codacy.com/app/Steadyequipment/node-firestore-backup?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=steadyequipment/node-firestore-backup&amp;utm_campaign=Badge_Grade)
[![David badge](https://david-dm.org/steadyequipment/node-firestore-backup.svg)](https://david-dm.org/steadyequipment/node-firestore-backup)
[![Known Vulnerabilities](https://snyk.io/test/github/steadyequipment/node-firestore-backup/badge.svg)](https://snyk.io/test/github/steadyequipment/node-firestore-backup)


## Installation
Install using [__npm__](https://www.npmjs.com/).

```sh
npm install -g firestore-backup
```

 or [__yarn__](https://yarnpkg.com/en/)

```sh
yarn global add firestore-backup
```

Alternatively download the source.

```sh
git clone https://github.com/steadyequipment/node-firestore-backup.git
```

### Retrieving Google Cloud Account Credentials

1. Visit the [Firebase Console](https://console.firebase.google.com)
1. Select your project
1. Navigate to __Project Settings__ (at the time of writing the __gear__ icon button at the top left of the page).
1. Navigate to __Service Accounts__
1. Click _Generate New Private Key_

This downloaded json file contains the proper credentials needed for __firestore-backup__ to authenticate.


## Usage

### Backup:
* `-a`, `--accountCredentials` `<path>` - Google Cloud account credentials JSON file.
* `-B`, `--backupPath` `<path>`- Path to store the backup.

Example:
```sh
firestore-backup --accountCredentials path/to/credentials/file.json --backupPath /backups/myDatabase
```

### Backup with pretty printing:
* `-P`, `--prettyPrint` - JSON backups done with pretty-printing.

Example:
```sh
firestore-backup --accountCredentials path/to/credentials/file.json --backupPath /backups/myDatabase --prettyPrint
```

### Backup from a starting path:
* `-S`, `--databaseStartPath` `<path>` - The database collection or document path to begin backup.

Example:
```sh
firestore-backup --accountCredentials path/to/credentials/file.json --backupPath /backups/myDatabase --databaseStartPath /myCollection/document_3
```

### Limit number of requests:
* `-L`, `--requestCountLimit` `<number>` - The maximum number of requests to be made in parallel.

Example:
```sh
firestore-backup --accountCredentials path/to/credentials/file.json --backupPath /backups/myDatabase --requestCountLimit 2
```

### Exclude top level collections from backup:
* `-E`, `--excludeCollections` `<id>` - Top level collection id(s) to exclude from backing up.

_Note_: because of how the command line parsing library works multiple collection ids must be specified as separate parameters.

Example:
```sh
firestore-backup --accountCredentials path/to/credentials/file.json --backupPath /backups/myDatabase --excludeCollections myFirstAnnoyingCollection --excludeCollections mySecondAnnoyingCollection
```

### Exclude paths by regex:
* `--excludePattern` `<regex>` - Patterns to match against paths to exclude from the backup. All subpaths of matched paths will also be excluded.

These patterns can support excluding several different sections of trees, e.g.:
- Exclude top level collection: ^/collectionToIgnore
- Exclude sub collections of all documents in a collection: ^/organizations/[^/]*/subcollectionToIgnore
- Exclude sub collections at a given level: ^/[^/]*/[^/]*/subcollectionToIgnore
- Exclude a particular document: ^/organizations/organizationToIgnore

_Note_: when combining excludePattern with databaseStartPath, the patterns are tested against the full path of the document off the root of database (with a leading slash).

_Note_: because of how the command line parsing library works multiple exclude patterns must be specified as separate parameters.

Example:
```sh
firestore-backup --accountCredentials path/to/credentials/file.json --backupPath /backups/myDatabase --excludePattern '^/collectionToIgnore' --excludePattern '^/[^/]*/[^/]*/subcollectionToIgnore'
```

### Relax:
That's it! ✨🌈

## Contributions
This project has been made much better by it's [contributors](https://github.com/steadyequipment/node-firestore-backup/graphs/contributors), feel free to report bugs and make feature requests in the [Issue Tracker](https://github.com/steadyequipment/node-firestore-backup/issues), fork and create pull requests!
