'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

// Returns if a value is an object
var isObject = exports.isObject = function isObject(value) {
  if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Object) {
    return {
      value: value,
      type: 'object'
    };
  }
  return false;
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