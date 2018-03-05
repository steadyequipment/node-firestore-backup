'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FirestoreBackup = exports.constructDocumentValue = exports.constructReferenceUrl = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _types = require('./types');

var _utility = require('./utility');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var backupDocumentConcurrency = 3; // 3 is the max before diminishing returns
var defaultBackupOptions = {
  databaseStartPath: '',
  requestCountLimit: 1
};

var constructReferenceUrl = exports.constructReferenceUrl = function constructReferenceUrl(reference) {
  var referenceSegments = reference._referencePath.segments;
  var referencePath = void 0;
  if (Array.isArray(referenceSegments)) {
    referencePath = referenceSegments.join('/');
  } else if (typeof referenceSegments === 'string') {
    referencePath = referenceSegments;
  }

  if (referencePath) {
    return {
      value: referencePath,
      type: 'reference'
    };
  } else {
    return {
      value: reference,
      type: 'unknown'
    };
  }
};

var testValidDocumentValue = function testValidDocumentValue(key, documentData, validators) {
  var validValue = void 0;

  for (var index = 0; index < validators.length; index++) {
    var testValidValue = validators[index](documentData[key]);
    if (typeof testValidValue !== 'boolean') {
      validValue = testValidValue;
      break;
    }
  }

  if (validValue) {
    return validValue;
  }
  return false;
};

var constructDocumentValue = exports.constructDocumentValue = function constructDocumentValue() {
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
    var objectTypeValidators = [_types.isArray, _types.isObject];

    var documentValue = testValidDocumentValue(key, documentData, objectTypeValidators);
    if (documentValue) {
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], { type: documentValue.type });
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], constructDocumentValue({}, Object.keys(documentData[key]), documentData[key]));
    } else {
      var basicTypeValidators = [_types.isBoolean, _types.isDate, _types.isNumber, _types.isNull, _types.isString];

      var _documentValue = testValidDocumentValue(key, documentData, basicTypeValidators);
      if (_documentValue) {
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, _documentValue));
      } else {
        var validValue = (0, _types.isReference)(documentData[key]);
        if (validValue) {
          documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, constructReferenceUrl(documentData[key])));
        } else {
          documentDataToStore = {
            value: documentData[key],
            type: 'unknown'
          };
        }
        // TODO: stronger validation that we have a reference rather than being our fallback
      }
    }
  });
  return documentDataToStore;
};

/*export const backupDocument = (document: Object, backupPath: string, logPath: string, prettyPrintJSON: boolean) => {
  console.log('Backing up Document \'' + logPath + document.id + '\'')
  try {
    mkdirp.sync(backupPath)
  } catch (error) {
    throw new Error('Unable to create backup path for Document \'' + document.id + '\': ' + error)
  }

  let fileContents: string
  try {
    const documentData = document.data()
    const keys = Object.keys(documentData)
    var documentDataToStore = {}
    documentDataToStore = Object.assign({}, constructDocumentValue(documentDataToStore, keys, documentData))
    if (prettyPrintJSON === true) {
      fileContents = JSON.stringify(documentDataToStore, null, 2)
    } else {
      fileContents = JSON.stringify(documentDataToStore)
    }
  } catch (error) {
    throw new Error('Unable to serialize Document \'' + document.id + '\': ' + error)
  }
  try {
    fs.writeFileSync(backupPath + '/' + document.id + '.json', fileContents)
  } catch (error) {
    throw new Error('Unable to write Document \'' + document.id + '\': ' + error)
  }

  return Promise.resolve(document.ref.getCollections())
    .map((collection) => {
      return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/', prettyPrintJSON)
    }, { concurrency: backupDocumentConcurrency })
}*/

/*export const backupCollection = (collection: Object, backupPath: string, logPath: string, prettyPrintJSON: boolean) => {
  console.log('Backing up Collection \'' + logPath + collection.id + '\'')
  try {
    mkdirp.sync(backupPath)
  } catch (error) {
    throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error)
  }

  return Promise.resolve(collection.get())
    .then((documentSnapshots) => documentSnapshots.docs)
    .map((document) => {
      return backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/', prettyPrintJSON)
    }, { concurrency: backupCollectionConcurrency })
}*/

/*export const backupRootCollections = (database: Object, backupPath: string, prettyPrintJSON: boolean) => {
  return database.getCollections()
    .then((collections) => {
      return promiseSerial(collections.map((collection) => {
        return () => {
          return backupCollection(collection, backupPath + '/' + collection.id, '/', prettyPrintJSON)
        }
      }))
    })
}*/

var FirestoreBackup = exports.FirestoreBackup = function () {
  function FirestoreBackup(options) {
    _classCallCheck(this, FirestoreBackup);

    this.options = Object.assign({}, defaultBackupOptions, options);
    Object.assign(this, this.options);

    // backupCollectionConcurrency = this.requestCountLimit
  }

  _createClass(FirestoreBackup, [{
    key: 'backup',
    value: function backup() {
      var _this = this;

      if ((0, _types.isDocumentPath)(this.databaseStartPath)) {
        var databaseDocument = this.database.doc(this.databaseStartPath);
        return databaseDocument.get().then(function (document) {
          return _this.backupDocument(document, _this.backupPath + '/' + document.ref.path, '/', _this.prettyPrintJSON);
        });
      }

      if ((0, _types.isCollectionPath)(this.databaseStartPath)) {
        var databaseCollection = this.database.collection(this.databaseStartPath);
        return this.backupCollection(databaseCollection, this.backupPath + '/' + databaseCollection.path, '/', this.prettyPrintJSON);
      }

      return this.backupRootCollections();
    }
  }, {
    key: 'backupRootCollections',
    value: function backupRootCollections() {
      var _this2 = this;

      return this.database.getCollections().then(function (collections) {
        return (0, _utility.promiseSerial)(collections.map(function (collection) {
          return function () {
            return _this2.backupCollection(collection, _this2.backupPath + '/' + collection.id, '/');
          };
        }));
      });
    }
  }, {
    key: 'backupCollection',
    value: function backupCollection(collection, backupPath, logPath) {
      var _this3 = this;

      // return backupCollection(collection, backupPath, logPath, this.prettyPrintJSON)
      console.log('Backing up Collection \'' + logPath + collection.id + '\'');
      try {
        _mkdirp2.default.sync(backupPath);
      } catch (error) {
        throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error);
      }

      return _bluebird2.default.resolve(collection.get()).then(function (documentSnapshots) {
        return documentSnapshots.docs;
      }).map(function (document) {
        return _this3.backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/', _this3.prettyPrintJSON);
      }, { concurrency: this.requestCountLimit });
    }
  }, {
    key: 'backupDocument',
    value: function backupDocument(document, backupPath, logPath) {
      var _this4 = this;

      // return backupDocument(document, backupPath, logPath, this.prettyPrintJSON)
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
        if (this.prettyPrintJSON === true) {
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

      return _bluebird2.default.resolve(document.ref.getCollections()).map(function (collection) {
        return _this4.backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/', _this4.prettyPrintJSON);
      }, { concurrency: backupDocumentConcurrency });
    }
  }]);

  return FirestoreBackup;
}();