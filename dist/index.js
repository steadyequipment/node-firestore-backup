'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (accountCredentials, backupPath, prettyPrintJSON) {
  var accountCredentialsContents = void 0;
  if (typeof accountCredentials === 'string') {
    try {
      var accountCredentialsBuffer = _fs2.default.readFileSync(accountCredentials);
      accountCredentialsContents = JSON.parse(accountCredentialsBuffer.toString());
    } catch (error) {
      throw new Error('Unable to read account credential file \'' + accountCredentials + '\': ' + error);
    }
  } else if ((typeof accountCredentials === 'undefined' ? 'undefined' : _typeof(accountCredentials)) === 'object') {
    accountCredentialsContents = accountCredentials;
  } else {
    throw new Error('No account credentials provided');
  }

  _firebaseAdmin2.default.initializeApp({
    credential: _firebaseAdmin2.default.credential.cert(accountCredentialsContents)
  });

  try {
    _mkdirp2.default.sync(backupPath);
  } catch (error) {
    throw new Error('Unable to create backup path \'' + backupPath + '\': ' + error);
  }

  var database = _firebaseAdmin2.default.firestore();
  return (0, _firestore.backupRootCollections)(database, backupPath, prettyPrintJSON);
};

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _firestore = require('./firestore');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }