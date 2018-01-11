var disk = {};
window.chrome = {
  identity: {
  },
  runtime: {
  },
  extension: {
  },
  tabs: {
    query: function(query, callback) {
      callback([{id: 1}]);
    }
  },
  storage: {
    local: {
      set: function(items, callback) {
        disk = items;
        callback();
      },
      get: function(key, callback) {
        callback(disk);
      }
    }
  }
};
require('./services/test.keepassReference.js')
require('./services/test.protectedMemory.js')
require('./services/test.secureCache.js')
require('./services/test.settings.js')