# firestore-backup
A Google Firebase Firestore backup tool.

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

### Relax:
That's it! ✨🌈

## Contributions
Feel free to report bugs and make feature requests in the [Issue Tracker](https://github.com/steadyequipment/node-firestore-backup/issues), fork and create pull requests!
