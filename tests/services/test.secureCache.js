const should = require('should')

import { ProtectedMemory } from '$services/protectedMemory.js'
import { SecureCacheMemory } from '$services/secureCacheMemory.js'

var memory = {};
var disk = {};
window.chrome.tabs =  {
  query: function(query, callback) {
    callback([{id: 1}]);
  }
}
window.chrome.storage = {
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

describe('SecureCache', function() {

	describe('SecureCacheMemory', function(){
		
		beforeEach(function() {
	    memory = {}; disk = {};

	    //mock the way the background page responds
	    mockBackgroundPage();
	  })

	  it ('should be ready eventually', function() {
	    var memoryCache = new SecureCacheMemory(protectedMemory);
	    var ready = memoryCache.ready();

	    return ready.then(function(val) {
	      val.should.be.true;
	    })
	  });

	  it('should save something', function() {
	    var memoryCache = new SecureCacheMemory(protectedMemory);
	    return memoryCache.save('key1', 'some data').then(function() {
	      var m = memory['key1'];
	      m.should.not.equal('some data');
	      m.should.not.equal(undefined);
	    });
	  })

	  it('should return unencrypted data', function() {
	    var memoryCache = new SecureCacheMemory(protectedMemory);
	    return memoryCache.save('key1', 'some data').then(function() {
	      return memoryCache.get('key1');
	    }).then(function(data) {
	      data.should.equal('some data');
	    });
	  })

	})

});
