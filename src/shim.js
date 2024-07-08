// import 'node-libs-react-native/globals.js';
// Polyfill Buffer
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Polyfill btoa
if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.alloc(str.length, str, 'binary').toString('base64');
  };
}

// Polyfill atob
if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return Buffer.alloc(
      Buffer.from(b64Encoded, 'base64').length,
      Buffer.from(b64Encoded, 'base64'),
      'binary'
    ).toString('binary');
  };
}

global.process = require('process');
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
global.process.version = 'v9.40';
