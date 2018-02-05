const should = require('should')
import { Offloader } from '$lib/offloader.js';

describe('Offloader lib', function () {

	var settingsWithToken = {
		getSetOffloaderToken: function(thing) {
			return Promise.resolve("localToken")
		}
	}
	var settingsNoToken = {
		getSetOffloaderToken: function(thing) {
			if (thing !== undefined)
				return Promise.resolve(thing);
			return Promise.resolve(null)
		}
	}
	
	describe("Fetching new tokens", function(){ 
		it("should try to get the token from local storage", function(done){
			var mockLambda = {
				save: function(key, val, ttl, token) {
					console.log(key, val, ttl, token)
					if (token === 'localToken' && key === 'LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=')
						done()
					return Promise.resolve()
				}
			}
			var offloader = new Offloader(settingsWithToken, mockLambda)
			offloader.encrypt("foo", "bar", (new Date()).getTime())
		})

		it("should try to get a new token from the network when local fails", function(done){
			var mockLambda = {
				save: function(key, val, ttl, token) {
					console.log(key, val, ttl, token)
					if (token === 'networkToken' && key === 'LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=')
						done() 
					return Promise.resolve()
				},
				getToken: function(){
					return Promise.resolve({
						data: {
							id: "networkToken"
						}
					})
				}
			}
			var offloader = new Offloader(settingsNoToken, mockLambda)
			offloader.encrypt("foo", "bar", (new Date()).getTime())
		})

		it("should all fail if there is a network error", function(done){
			var mockLambda = {
				getToken: function(){
					return Promise.reject('failed')
				}
			}
			var offloader = new Offloader(settingsNoToken, mockLambda)
			offloader.encrypt("foo", "bar", (new Date()).getTime()).catch(err => {
				if (err === 'failed')
					done()
			})
		})
	})
})