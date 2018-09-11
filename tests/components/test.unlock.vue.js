import Vue from 'vue'
import Unlock from '@/components/Unlock'
import { SecureCacheMemory } from '$services/secureCacheMemory.js'

/*
PROPS
  unlockedState: Object,
	secureCache: Object,
	settings: Object,
	keepassService: Object,
	links: Object
*/

chrome.runtime = {
	getManifest() {
		return {
			version: "1.0.0"
		}
	}
}

function unlockMounter (propsData) {
  const constructor = Vue.extend(Unlock)
  const ul = new constructor({ propsData: propsData })
  return ul;
}

describe('Unlock.vue', function(done) {

	it('has an unlock function', () => {
    Unlock.methods.unlock.should.be.a.Function()
  })

  it('sets the correct default values', () => {
  	let data = Unlock.data()
  	data.rememberPeriod.should.equal(0)
  	data.busy.should.be.False()
  	data.appVersion.should.equal("1.0.0")
  })

  it('should try to show cached entries', (done) => {
  	let mockEntries = [1, 2, 3, 4]
  	let unlock = unlockMounter({
  		unlockedState: {
				cache: {
					allEntries: undefined // locked...
				},
				getTabDetails: function() {
					return Promise.resolve()
				},
				sitePermission: true
  		},
  		secureCache: {
  			'get': function () {
  				return Promise.resolve(mockEntries)
  			}
  		},
  		settings: {},
  		keepassService: {},
  		links: {}
  	})
  	unlock.$router = {
	  	getRoute: function() {
	  		return {
	  			title: "title"
	  		}
	  	}
	  }
	  unlock.showResults = (entries) => {
	  	entries.should.equal(mockEntries)
  		done();
  	}
  	unlock.$mount()
  })

  it('should try to auto_unlock if the cache is empty', function(done){
  	let mockEntries = [];
  	let unlock = unlockMounter({
  		unlockedState: {
				cache: {
					allEntries: undefined // locked...
				},
				getTabDetails: function() {
					return Promise.resolve()
				},
				sitePermission: true
  		},
  		secureCache: {
  			'get': function () {
  				return Promise.resolve(mockEntries)
  			}
  		},
  		settings: {
  			getKeyFiles: function() {
  				return Promise.resolve([])
  			},
  			getSetDefaultRememberPeriod: function() {
  				return Promise.resolve(1440)
  			},
  			getCurrentDatabaseUsage: function() {
  				return Promise.resolve({
  					requiresPassword: true,
  					requiresKeyfile: false,
  					passwordKey: "not_undefined",
  					keyFileName: undefined
  				})
  			}
  		},
  		keepassService: {},
  		links: {}
  	})
  	unlock.unlock = function(password){
  		password.should.equal("not_undefined")
  		unlock.rememberPeriod.should.equal(1440)
  		unlock.rememberPeriodText.should.equal("Remember for 24 hours.")
  		done()
  	}
  	unlock.$mount()
  })

})