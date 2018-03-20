'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isCollectionPath = exports.isDocumentPath = exports.isReference = exports.isDate = exports.isBoolean = exports.isUndefined = exports.isNull = exports.isFunction = exports.isObject = exports.isArray = exports.isNumber = exports.isString = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _utility = require('./utility');

// Returns if a value is a string
var isString = exports.isString = function isString(value) {
  if (typeof value === 'string' || value instanceof String) {
    return {
      value: value,
      type: 'string'
    };
  }
  return false;
};

// Returns if a value is really a number
var isNumber = exports.isNumber = function isNumber(value) {
  if (typeof value === 'number' && isFinite(value)) {
    return {
      value: value,
      type: 'number'
    };
  }
  return false;
};

// Returns if a value is an array
var isArray = exports.isArray = function isArray(value) {
  if (Array.isArray(value)) {
    return {
      value: value,
      type: 'array'
    };
  }
  return false;
};

var isObjectOfType = function isObjectOfType(value, type, typeName) {
  if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === type) {
    return {
      value: value,
      type: typeName
    };
  }
  return false;
};

// Returns if a value is an object
var isObject = exports.isObject = function isObject(value) {
  return isObjectOfType(value, Object, 'object');
};

// Returns if a value is a function
var isFunction = exports.isFunction = function isFunction(value) {
  return isObjectOfType(value, Function, 'function');
};

// Returns if a value is null
var isNull = exports.isNull = function isNull(value) {
  if (value === null) {
    return {
      value: value,
      type: 'null'
    };
  }
  return false;
};

// Returns if a value is undefined
var isUndefined = exports.isUndefined = function isUndefined(value) {
  if (typeof value === 'undefined') {
    return {
      value: value,
      type: 'undefined'
    };
  }
  return false;
};

// Returns if a value is a boolean
var isBoolean = exports.isBoolean = function isBoolean(value) {
  if (typeof value === 'boolean') {
    return {
      value: value,
      type: 'boolean'
    };
  }
  return false;
};

// Returns if value is a date object
var isDate = exports.isDate = function isDate(value) {
  if (value instanceof Date) {
    return {
      value: value,
      type: 'date'
    };
  }
  return false;
};

var isReference = exports.isReference = function isReference(value) {
  if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && _typeof(value._firestore) === 'object' && _typeof(value._referencePath) === 'object') {
    return {
      value: value,
      type: 'reference'
    };
  }
  return false;
};

/**
 * Indicates whether this ResourcePath points to a document.
 */
var isDocumentPath = exports.isDocumentPath = function isDocumentPath(value) {
  var segments = (0, _utility.getSegments)(value);
  if (segments.length > 0 && segments.length % 2 === 0) {
    return {
      value: value,
      type: 'DocumentPath'
    };
  }
  return false;
};

/**
 * Indicates whether this ResourcePath points to a collection.
 */
var isCollectionPath = exports.isCollectionPath = function isCollectionPath(value) {
  var segments = (0, _utility.getSegments)(value);
  if (segments.length % 2 === 1) {
    return {
      value: value,
      type: 'CollectionPath'
    };
  }
  return false;
};