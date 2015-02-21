memory = {};
chrome = {
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
        memory = items;
        callback();
      },
      get: function(key, callback) {
        callback(memory);
      }
    }
  }
}
var protectedMemory = new ProtectedMemory();

describe('SecureCache on disk', function() {
  beforeEach(function() {
    chrome.identity.getAuthToken = function(options, callback) {
      //mock success
      callback("1234sdfsdffds56");
    }
  });

  it('should be ready eventually', function() {
    //(5).should.be.exactly(5).and.be.a.Number;
    //sinon.stub(chrome.identity, "getAuthToken");
    var cache = new SecureCacheDisk();
    var ready = cache.ready();

    return ready.then(function(val) {
      val.should.be.true;
    })
  });

  it('should save something encrypted', function() {
    var cache = new SecureCacheDisk(protectedMemory);
    return cache.save('key1', 'some data').then(function() {
      var m = protectedMemory.hydrate(memory['secureCache.key1']);
      m.should.not.equal('some data');
      m.should.not.equal(undefined);
    });
  })

  it('should return unencrypted data', function() {
    var cache = new SecureCacheDisk(protectedMemory);
    return cache.save('key1', 'some data').then(function() {
      return cache.get('key1');
    }).then(function(data) {
      data.should.equal('some data');
    });
  })
});

describe('SecureCache fallback to in-memory', function() {
  beforeEach(function() {
    chrome.identity.getAuthToken = function(options, callback) {
      //mock 3rd party secret not available
      callback();
    }

    //mock the way the background page responds
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
  })

  it ('should be ready eventually', function() {
    var memoryCache = new SecureCacheMemory(protectedMemory);
    var cache = new SecureCacheDisk(protectedMemory, memoryCache);
    var ready = cache.ready();

    return ready.then(function(val) {
      val.should.be.true;
    })
  });

  it('should save something', function() {
    var memoryCache = new SecureCacheMemory(protectedMemory);
    var cache = new SecureCacheDisk(protectedMemory, memoryCache);
    return cache.save('key1', 'some data').then(function() {
      var m = memory['secureCache.key1'];
      m.should.not.equal('some data');
      m.should.not.equal(undefined);
    });
  })

  it('should return unencrypted data', function() {
    var memoryCache = new SecureCacheMemory(protectedMemory);
    var cache = new SecureCacheDisk(protectedMemory, memoryCache);
    return cache.save('key1', 'some data').then(function() {
      return cache.get('key1');
    }).then(function(data) {
      data.should.equal('some data');
    });
  })
});
