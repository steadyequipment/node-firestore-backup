# firestore-backup
A Google Firebase Firestore backup tool.

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
