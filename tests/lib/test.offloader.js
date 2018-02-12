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
					if (token === 'networkToken' && key === 'LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=')
						done() 
					return Promise.resolve()
				},
				getToken: function(){
					return Promise.resolve("networkToken");
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
	});

	describe("Encrypting and decrypting with a key/value server", function(){
		it("should decrypt if the key is still in remote cache", function(done){
			var mockLambda = function(){
				var keystore = {};
				this.save = (key, value, ttl, token) => {
					console.log(key, value, token)
					keystore[key] = value;
					return Promise.resolve();
				}
				this.get = (key, token) => {
					return Promise.resolve(keystore[key]);
				}
			}
			var offloader = new Offloader(settingsWithToken,new mockLambda());
			offloader.encrypt("foo", "bar", (new Date()).getTime()).then(encB64 => {
				offloader.decrypt("foo", encB64).then(decString => {
					if (decString === "bar")
						done();
				})
			})
		})
	})
});