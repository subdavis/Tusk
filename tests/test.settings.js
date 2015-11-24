describe('Settings', function () {
	"use strict";
	
	chrome.p = {
		storage: {
			local: {
				'set': function(storageObject) {
					return new Promise(function(resolve, reject) {
						for(let key in storageObject) {
							storage[key] = storageObject[key];
						}
						resolve(true);
					})
				},
				'get': function(key) {
					return new Promise(function(resolve, reject) {
						var result = {};
						if (Array.isArray(key)) {
							key.forEach(function(singleKey) {
								result[singleKey] = storage[singleKey];
							})
						} else {
							result[key] = storage[key];
						}

						resolve(result);
					})
				}
			}
		}
	}

	let storage = {};
	let settings = new Settings();

	afterEach(function() {
		storage = {};
	});

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

		it('should support update of remembered time', function() {
			let time1 = new Date();
			let time2 = new Date() + 1;
			return settings.setForgetTime('test', time1).then(function() {
				return settings.setForgetTime('test', time2)
			}).then(function() {
				return settings.getForgetTime('test')
			}).then(function(returnedTime) {
				returnedTime.should.equal(time2);
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
	
});
