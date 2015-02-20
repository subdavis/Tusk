memory = {};
chrome = {
  identity: {
    getAuthToken: function(options, callback) {
      callback("1234sdfsdffds56");
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

describe('SecureCache', function() {
  it('should be ready eventually', function() {
    //(5).should.be.exactly(5).and.be.a.Number;
    //sinon.stub(chrome.identity, "getAuthToken");
    var cache = new SecureCache();
    var ready = cache.ready();

    return ready.then(function(val) {
      val.should.be.true;
    })
  });

  it('should save something encrypted', function() {
    var cache = new SecureCache(protectedMemory);
    return cache.save('key1', 'some data').then(function() {
      var m = protectedMemory.hydrate(memory.key1);
      m.should.not.equal('some data');
      m.should.not.equal(undefined);
    });
  })

  it('should return unencrypted data', function() {
    var cache = new SecureCache(protectedMemory);
    return cache.save('key1', 'some data').then(function() {
      return cache.get('key1');
    }).then(function(data) {
      data.should.equal('some data');
    });
  })
});
