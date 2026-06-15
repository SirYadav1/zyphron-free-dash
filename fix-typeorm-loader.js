const Module = require('module');
const path = require('path');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'typeorm') {
    return path.resolve(__dirname, 'node_modules/typeorm/index.js');
  }
  return origResolve.apply(this, arguments);
};
