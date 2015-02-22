var memory = {};
var disk = {};
var chrome = {
  identity: {
  },
  runtime: {
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
var settings = {
  getDiskCacheFlag: function() {
    return Promise.resolve(true);
  }
};
function mockBackgroundPage() {
  chrome.runtime.connect = function(obj) {
    var cb;
    return {
      onMessage: {
        addListener: function(callback) {
          cb = callback;
        }
      },
      postMessage: function(obj) {
        switch(obj.action) {
          case 'clear':
            memory = {};
            break;
          case 'save':
            memory[obj.key] = obj.value;
            break;
          case 'get':
            cb(memory[obj.key]);
            break;
          default:
            throw new Error('unrecognized action ' + obj.action)
            break;
        }
      }
    };
  }
}

var protectedMemory = new ProtectedMemory();

describe('SecureCache on disk', function() {
  beforeEach(function() {
    memory = {}; disk = {};
    chrome.identity.getAuthToken = function(options, callback) {
      //mock success
      callback("1234sdfsdffds56");
    }
  });

  it('should be ready eventually', function() {
    //(5).should.be.exactly(5).and.be.a.Number;
    //sinon.stub(chrome.identity, "getAuthToken");
    var cache = new SecureCacheDisk(protectedMemory, null, settings);
    var ready = cache.ready();

    return ready.then(function(val) {
      val.should.be.true;
    })
  });

  it('should save something encrypted', function() {
    var cache = new SecureCacheDisk(protectedMemory, null, settings);
    return cache.save('key1', 'some data').then(function() {
      var m = protectedMemory.hydrate(disk['secureCache.key1']);
      m.should.not.equal('some data');
      m.should.not.equal(undefined);
    });
  })

  it('should return unencrypted data', function() {
    var cache = new SecureCacheDisk(protectedMemory, null, settings);
    return cache.save('key1', 'some data').then(function() {
      return cache.get('key1');
    }).then(function(data) {
      data.should.equal('some data');
    });
  })

  it('should fallback to in-memory when turned off', function() {
    settings.getDiskCacheFlag = function() {
      return Promise.resolve(false);
    };
    mockBackgroundPage();

    var memoryCache = new SecureCacheMemory(protectedMemory);
    var cache = new SecureCacheDisk(protectedMemory, memoryCache, settings);
    return cache.save('key1', 'some data').then(function() {
      var m = memory['secureCache.key1'];
      m.should.not.equal('some data');
      m.should.not.equal(undefined);
    });
  })
});

describe('SecureCache fallback to in-memory', function() {
  beforeEach(function() {
    memory = {}; disk = {};
    chrome.identity.getAuthToken = function(options, callback) {
      //mock 3rd party secret not available
      callback();
    }

    //mock the way the background page responds
    mockBackgroundPage();
  })

  it ('should be ready eventually', function() {
    var memoryCache = new SecureCacheMemory(protectedMemory);
    var cache = new SecureCacheDisk(protectedMemory, memoryCache, settings);
    var ready = cache.ready();

    return ready.then(function(val) {
      val.should.be.true;
    })
  });

  it('should save something', function() {
    var memoryCache = new SecureCacheMemory(protectedMemory);
    var cache = new SecureCacheDisk(protectedMemory, memoryCache, settings);
    return cache.save('key1', 'some data').then(function() {
      var m = memory['secureCache.key1'];
      m.should.not.equal('some data');
      m.should.not.equal(undefined);
    });
  })

  it('should return unencrypted data', function() {
    var memoryCache = new SecureCacheMemory(protectedMemory);
    var cache = new SecureCacheDisk(protectedMemory, memoryCache, settings);
    return cache.save('key1', 'some data').then(function() {
      return cache.get('key1');
    }).then(function(data) {
      data.should.equal('some data');
    });
  })

});
