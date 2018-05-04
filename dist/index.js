'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FirestoreBackup = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (_options) {
  var options = Object.assign({}, _options, { databaseStartPath: '' });

  var accountCredentialsContents = void 0;
  if (typeof options.accountCredentials === 'string') {
    try {
      var accountCredentialsBuffer = _fs2.default.readFileSync(options.accountCredentials);
      accountCredentialsContents = JSON.parse(accountCredentialsBuffer.toString());
    } catch (error) {
      throw new Error('Unable to read account credential file \'' + options.accountCredentials + '\': ' + error);
    }
  } else if (_typeof(options.accountCredentials) === 'object') {
    accountCredentialsContents = options.accountCredentials;
  } else {
    throw new Error('No account credentials provided');
  }

  _firebaseAdmin2.default.initializeApp({
    credential: _firebaseAdmin2.default.credential.cert(accountCredentialsContents)
  });

  try {
    _mkdirp2.default.sync(options.backupPath);
  } catch (error) {
    throw new Error('Unable to create backup path \'' + options.backupPath + '\': ' + error);
  }

  options.database = _firebaseAdmin2.default.firestore();
  var backupClient = new _firestore.FirestoreBackup(options);
  return backupClient.backup();
};

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _firestore = require('./firestore');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Export FirestoreBackup so that this can be run programatically with a custom
// firestore database.
exports.FirestoreBackup = _firestore.FirestoreBackup;