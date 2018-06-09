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

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

var defaultBackupOptions = {
  databaseStartPath: '',
  requestCountLimit: 1,
  exclude: [],
  excludePatterns: []
};

var FirestoreBackup = exports.FirestoreBackup = function () {
  function FirestoreBackup(options) {
    _classCallCheck(this, FirestoreBackup);

    this.options = Object.assign({}, defaultBackupOptions, options);

    if (this.options.requestCountLimit > 1) {
      this.documentRequestLimit = 3; // 3 is the max before diminishing returns
    }
  }

  _createClass(FirestoreBackup, [{
    key: 'backup',
    value: function backup() {
      var _this = this;

      console.log('Starting backup...');
      if (this.options.databaseStartPath) {
        console.log('Using start path \'', this.options.databaseStartPath, '\'');
      }
      if (this.options.exclude && this.options.exclude.length > 0) {
        console.log('Excluding top level collections', this.options.exclude);
      }

      if (this.options.excludePatterns && this.options.excludePatterns.length > 0) {
        console.log('Excluding patterns', this.options.excludePatterns);
      }

      if ((0, _types.isDocumentPath)(this.options.databaseStartPath)) {
        var databaseDocument = this.options.database.doc(this.options.databaseStartPath);
        return databaseDocument.get().then(function (document) {
          return _this.backupDocument(document, _this.options.backupPath + '/' + document.ref.path, '/');
        });
      }

      if ((0, _types.isCollectionPath)(this.options.databaseStartPath)) {
        var databaseCollection = this.options.database.collection(this.options.databaseStartPath);
        return this.backupCollection(databaseCollection, this.options.backupPath + '/' + databaseCollection.path, '/');
      }

      return this.backupRootCollections();
    }
  }, {
    key: 'excludeByPattern',
    value: function excludeByPattern(fullPath) {
      if (this.options.excludePatterns) {
        var matchedPattern = this.options.excludePatterns.find(function (pattern) {
          return pattern.test(fullPath);
        });
        return !!matchedPattern;
      }
      return false;
    }
  }, {
    key: 'backupRootCollections',
    value: function backupRootCollections() {
      var _this2 = this;

      return this.options.database.getCollections().then(function (collections) {
        return (0, _utility.promiseParallel)(collections, function (collection) {
          if (_this2.options.exclude.includes(collection.id)) {
            return Promise.resolve();
          }
          return _this2.backupCollection(collection, _this2.options.backupPath + '/' + collection.id, '/');
        }, 1);
      });
    }
  }, {
    key: 'backupCollection',
    value: function backupCollection(collection, backupPath, logPath) {
      var _this3 = this;

      var logPathWithCollection = logPath + collection.id;
      if (this.excludeByPattern('/' + collection.path)) {
        console.log('Excluding Collection \'' + logPathWithCollection + '\' (/' + collection.path + ')');
        return Promise.resolve();
      }
      console.log('Backing up Collection \'' + logPathWithCollection + '\'');
      try {
        _mkdirp2.default.sync(backupPath);
      } catch (error) {
        throw new Error('Unable to create backup path for Collection \'' + collection.id + '\': ' + error);
      }

      return collection.get().then(function (documentSnapshots) {
        return documentSnapshots.docs;
      }).then(function (docs) {
        return (0, _utility.promiseParallel)(docs, function (document) {
          return _this3.backupDocument(document, backupPath + '/' + document.id, logPathWithCollection + '/');
        }, _this3.options.requestCountLimit);
      });
    }
  }, {
    key: 'backupDocument',
    value: function backupDocument(document, backupPath, logPath) {
      var _this4 = this;

      var logPathWithDocument = logPath + document.id;
      if (this.excludeByPattern('/' + document.ref.path)) {
        console.log('Excluding Document \'' + logPathWithDocument + '\' (/' + document.ref.path + ')');
        return Promise.resolve();
      }
      console.log('Backing up Document \'' + logPathWithDocument + '\'');
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
        if (this.options.prettyPrintJSON === true) {
          fileContents = (0, _jsonStableStringify2.default)(documentDataToStore, {space: 2});
        } else {
          fileContents = (0, _jsonStableStringify2.default)(documentDataToStore);
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
        return (0, _utility.promiseParallel)(collections, function (collection) {
          return _this4.backupCollection(collection, backupPath + '/' + collection.id, logPathWithDocument + '/');
        }, _this4.documentRequestLimit);
      });
    }
  }]);

  return FirestoreBackup;
}();