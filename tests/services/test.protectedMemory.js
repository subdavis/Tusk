const should = require('should')

import { ProtectedMemory } from '$services/protectedMemory.js'

describe('Protected Memory', function() {

	describe('setData()', function() {
		it('should deserialize a string', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', 'some value').then(function() {
				mem.getData('some key').then(function(value) {
					value.should.equal('some value');
				});
			});
		})

		it('should persist an object', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', {
				'foo': 'bar'
			}).then(function() {
				mem.getData('some key').then(function(value) {
					value.foo.should.equal('bar');
				});
			});
		})

		it('should persist a Number', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', Number(77)).then(function() {
				mem.getData('some key').then(function(value) {
					value.should.equal(77);
				});
			});
		})

		it('should persist a function', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', function() {
				return 'some value';
			}).then(function() {
				mem.getData('some key').then(function(value) {
					eval(value).should.equal('some value');
				}, function(err) {
					err.message.should.equal('Unexpected end of JSON input');
				});
			});
		})

		it('should persist an array', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', [1, 2, 3]).then(function() {
				mem.getData('some key').then(function(value) {
					value[0].should.equal(1);
					value[1].should.equal(2);
					value[2].should.equal(3);
				});
			});
		})

		//ArrayBuffer, Uint8Array???

		it('should persist undefined', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', undefined).then(function() {
				mem.getData('some key').then(function(value) {
					(value === undefined).should.be.true
				}, function(err) {
					err.message.should.equal('Unexpected end of JSON input');
				});
			});
		})

		it('should persist null', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', null).then(function() {
				mem.getData('some key').then(function(value) {
					(value === null).should.be.true
				});
			});
		})
	})

	describe('getData()', function() {
		it('should return undefined if the key does not exist', function() {
			var mem = new ProtectedMemory();
			mem.getData('does not exist').then(function(value) {
				(value === undefined).should.be.true
			});
		})
	})

	describe('clearData()', function() {
		it('should remove all keys that have been set', function() {
			var mem = new ProtectedMemory();
			mem.setData('some key', 'some value').then(function() {
				mem.clearData().then(function() {
					mem.getData('some key').then(function(value) {
						(value === undefined).should.be.true
					});
				});
			});
		})
	})

	describe('serialize()', function() {
		var mem = new ProtectedMemory();

		it('should base64 encode a string', function() {
			mem.serialize('some value').should.equal('InNvbWUgdmFsdWUi');
		})

		it('should base64 encode an object', function() {
			mem.serialize({
				'foo': 'bar'
			}).should.equal('eyJmb28iOiJiYXIifQ==');
		})

		it('should base64 encode a Number', function() {
			mem.serialize(77).should.equal('Nzc=');
		})

		it('should not base64 encode a function', function() {
			mem.serialize(function() {
				return 'some value';
			}).should.equal('');
		})

		it('should base64 encode an array', function() {
			mem.serialize([1, 2, 3]).should.equal('WzEsMiwzXQ==');
		})

		it('should not base64 encode undefined', function() {
			mem.serialize(undefined).should.equal('');
		})

		it('should base64 encode null', function() {
			mem.serialize(null).should.equal('bnVsbA==');
		})
	})

	describe('deserialize()', function() {
		var mem = new ProtectedMemory();

		it('should base64 decode a string', function() {
			mem.deserialize('InNvbWUgdmFsdWUi').should.equal('some value');
		})

		it('should not base64 decode an empty string', function() {
			try {
				mem.deserialize('');
			} catch (err) {
				err.message.should.equal('Unexpected end of JSON input');
			}
		})

		it('should base64 decode an object', function() {
			var obj = mem.deserialize('eyJmb28iOiJiYXIifQ==')
			obj.foo.should.equal('bar');
		})

		it('should base64 decode a Number', function() {
			mem.deserialize('Nzc=').should.equal(77);
		})

		it('should not base64 decode a function', function() {
			try {
				mem.deserialize('');
			} catch (err) {
				err.message.should.equal('Unexpected end of JSON input');
			}
		})

		it('should base64 decode an array', function() {
			var arr = mem.deserialize('WzEsMiwzXQ==');
			arr[0].should.equal(1);
			arr[1].should.equal(2);
			arr[2].should.equal(3);
		})

		it('should not base64 decode undefined', function() {
			try {
				mem.deserialize('');
			} catch (err) {
				err.message.should.equal('Unexpected end of JSON input');
			}
		})

		it('should base64 decode null', function() {
			(mem.deserialize('bnVsbA==') == null).should.be.true;
		})
	})
})
