'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (accountCredentials, backupPath, prettyPrintJSON) {
  // Returns if a value is a string
  var isString = function isString(value) {
    if (typeof value === 'string' || value instanceof String) {
      return {
        value: value,
        typeof: 'string'
      };
    }
    return false;
  };

  // Returns if a value is really a number
  var isNumber = function isNumber(value) {
    if (typeof value === 'number' && isFinite(value)) {
      return {
        value: value,
        typeof: 'number'
      };
    }
    return false;
  };

  // Returns if a value is an array
  var isArray = function isArray(value) {
    if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Array) {
      return {
        value: value,
        typeof: 'array'
      };
    }
    return false;
  };

  // Returns if a value is an object
  var isObject = function isObject(value) {
    if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Object) {
      return {
        value: value,
        typeof: 'object'
      };
    }
    return false;
  };

  // Returns if a value is null
  var isNull = function isNull(value) {
    if (value === null) {
      return {
        value: value,
        typeof: 'null'
      };
    }
    return false;
  };

  // Returns if a value is undefined
  var isUndefined = function isUndefined(value) {
    if (typeof value === 'undefined') {
      return {
        value: value,
        typeof: 'undefined'
      };
    }
    return false;
  };

  // Returns if a value is a boolean
  var isBoolean = function isBoolean(value) {
    if (typeof value === 'boolean') {
      return {
        value: value,
        typeof: 'boolean'
      };
    }
    return false;
  };

  // Returns if value is a date object
  var isDate = function isDate(value) {
    if (value instanceof Date) {
      return {
        value: value,
        typeof: 'date'
      };
    }
    return false;
  };

  var constructReferenceUrl = function constructReferenceUrl(reference) {
    var referencePath = '';
    Object.keys(reference).forEach(function (key) {
      Object.keys(reference[key]).forEach(function (subKey) {
        if (subKey === 'segments') {
          var pathArray = reference[key][subKey];
          pathArray.forEach(function (pathKey) {
            referencePath = referencePath ? referencePath + '/' + pathKey : pathKey;
          });
        }
      });
    });
    return referencePath ? { value: referencePath, typeof: 'reference' } : referencePath;
  };

  var constructDocumentValue = function constructDocumentValue() {
    var documentDataToStore = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var keys = arguments[1];
    var documentData = arguments[2];

    keys.forEach(function (key) {
      // Boolean - boolean
      // Reference - reference
      // Integer - number
      // Array - array
      // Object - object
      // Float - number
      // Geographical Point - todo
      // Map = todo
      // Null - null
      // String - string
      if (isBoolean(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, isBoolean(documentData[key])));
      } else if (isDate(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, isDate(documentData[key])));
      } else if (isNumber(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, isNumber(documentData[key])));
      } else if (isArray(documentData[key])) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], { typeof: 'array' });
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], constructDocumentValue({}, Object.keys(documentData[key]), documentData[key]));
      } else if (isObject(documentData[key])) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], { typeof: 'object' });
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], constructDocumentValue({}, Object.keys(documentData[key]), documentData[key]));
      } else if (isNull(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, isNull(documentData[key])));
      } else if (isString(documentData[key])) {
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, isString(documentData[key])));
      } else {
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, constructReferenceUrl(documentData[key])));
      }
    });
    return documentDataToStore;
  };

  // from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
  var promiseSerial = function promiseSerial(funcs) {
    return funcs.reduce(function (promise, func) {
      return promise.then(function (result) {
        return func().then(function () {
          return Array.prototype.concat.bind(result);
        });
      });
    }, Promise.resolve([]));
  };

  var backupDocument = function backupDocument(document, backupPath, logPath) {
    console.log('Backing up Document \'' + logPath + document.id + '\'');
    try {
      _mkdirp2.default.sync(backupPath);
    } catch (error) {
      throw new Error('Unable to create backup path for Document \'' + document.id + '\': ' + error);
    }

    var fileContents = void 0;
    try {
      var documentData = document.data();
      var keys = Object.keys(documentData);
      var documentDataToStore = {};
      documentDataToStore = Object.assign({}, constructDocumentValue(documentDataToStore, keys, documentData));
      if (prettyPrintJSON === true) {
        fileContents = JSON.stringify(documentDataToStore, null, 2);
      } else {
        fileContents = JSON.stringify(documentDataToStore);
      }
    } catch (error) {
      throw new Error('Unable to serialize Document \'' + document.id + '\': ' + error);
    }
    try {
      _fs2.default.writeFileSync(backupPath + '/' + document.id + '.json', fileContents);
    } catch (error) {
      throw new Error('Unable to write Document \'' + document.id + '\': ' + error);
    }

    return document.ref.getCollections().then(function (collections) {
      return promiseSerial(collections.map(function (collection) {
        return function () {
          return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/');
        };
      }));
    });
  };

  var backupCollection = function backupCollection(collection, backupPath, logPath) {
    console.log('Backing up Collection \'' + logPath + collection.id + '\'');
    try {
      _mkdirp2.default.sync(backupPath);
    } catch (error) {
      throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error);
    }

    return collection.get().then(function (documentSnapshots) {
      var backupFunctions = [];
      documentSnapshots.forEach(function (document) {
        backupFunctions.push(function () {
          return backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/');
        });
      });
      return promiseSerial(backupFunctions);
    });
  };

  var backupRootCollections = function backupRootCollections(database) {
    return database.getCollections().then(function (collections) {
      return promiseSerial(collections.map(function (collection) {
        return function () {
          return backupCollection(collection, backupPath + '/' + collection.id, '/');
        };
      }));
    });
  };

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
  return backupRootCollections(database);
};

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }