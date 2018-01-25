import { Settings } from '$services/settings'
const should = require('should')
var disk = {};

window.chrome.storage.local = {
	'set': function(data, callback) {
		disk = data;
		callback();
	},
	'get': function(key, callback) {
		callback(disk);
	},
	'remove': function(key, callback) {
		delete disk[key];
		callback()
	}
}
describe('Settings', function () {
	"use strict";

	let settings = new Settings();

	beforeEach(function() {
    disk = {};
  })

	describe('forget times', function() {
		
		it('should set a simple time', function() {
			return settings.setForgetTime(new Date());
		});

		it('should get back the time it sets', function() {
			var time = new Date();
			return settings.setForgetTime('test', time).then(function() {
				return settings.getForgetTime('test')
			}).then(function(returnedTime) {
				returnedTime.should.equal(time);
			});
		})

		it('should return undefined for invalidKey', function() {
			return settings.getForgetTime('test').then(function(value) {
				(value === undefined).should.be.true;
			})
		})

		it('should not update remembered time if it exists', function() {
			let time1 = new Date();
			let time2 = new Date() + 100000;
			return settings.setForgetTime('test', time1).then(function() {
				return settings.setForgetTime('test', time2)
			}).then(function() {
				return settings.getForgetTime('test')
			}).then(function(returnedTime) {
				returnedTime.should.equal(time1);
			});
		})

		it('should support multiple remembered times', function() {
			let time1 = new Date();
			let time2 = time1 + 1;
			return settings.setForgetTime('test1', time1).then(function() {
				return settings.setForgetTime('test2', time2);
			}).then(function() {
				return settings.getForgetTime('test2')
			}).then(function(returnedTime2) {
				returnedTime2.should.equal(time2);
			}).then(function() {
				return settings.getForgetTime('test1')
			}).then(function(returnedTime1) {
				returnedTime1.should.equal(time1);
			})
		})

		it('should support getting multiple at same time', function() {
			let time1 = new Date();
			let time2 = time1 + 1;
			return settings.setForgetTime('test1', time1).then(function() {
				return settings.setForgetTime('test2', time2);
			}).then(function() {
				return settings.getAllForgetTimes();
			}).then(function(allTimes) {
				allTimes.test1.should.equal(time1);
				allTimes.test2.should.equal(time2);
			})
		})

		it('should support deleting a key', function() {
			var time = new Date();
			return settings.setForgetTime('test', time).then(function() {
				return settings.clearForgetTimes(['test'])
			}).then(function() {
				return settings.getAllForgetTimes()
			}).then(function(allTimes) {
				(allTimes.test === undefined).should.be.true;
			});			
		})

		it('should not error on deleting invalid key', function() {
			return settings.clearForgetTimes(['invalidKey'])
		})
	})

	describe("Remember Options", function() {
		
		it('should support setting default remember period', function() {
			let rememberPeriod = 1234;
			return settings.getSetDefaultRememberPeriod(rememberPeriod).then(function() {
				return settings.getSetDefaultRememberPeriod().then(period => {
					period.should.equal(rememberPeriod).which.is.a.Number();
				})
			})
		})

		it('should support setting the clipboard expire interval', function() {
			let expireInterval = 8;
			return settings.getSetClipboardExpireInterval(expireInterval).then(function(){
				return settings.getSetClipboardExpireInterval().then(interval => {
					interval.should.equal(expireInterval).which.is.a.Number();
				})
			})
		})
	
	})
	
});
