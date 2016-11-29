describe('StreamCipher', function () {

	var cipher;

	beforeEach(inject(function ($injector) {
		cipher = new StreamCipher()
		cipher.setKey(new Uint8Array([0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 
			0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 
			0x20, 0x21]))
	}));

	afterEach(function() {
		
	});

	describe('EncryptString', function () {

		it('should advance position after encrypting a string', function () {
			cipher.position.should.equal(0);
			let enc = cipher.encryptString('bla')
			cipher.position.should.equal(3);
		});

		it('should decrypt to same value', function () {
			cipher.position.should.equal(0);
			let enc = cipher.encryptString('bla')
			let dec = cipher.getDecryptedFieldValue({protectedData: {
				password: {data: enc, position: 0}
			}}, 'password')

			dec.should.equal('bla')
		});

		it('should decrypt to same value after initial position', function () {
			cipher.position.should.equal(0);
			cipher.encryptString('foo')
			let pos = cipher.position
			let enc = cipher.encryptString('bar')
			let dec = cipher.getDecryptedFieldValue({protectedData: {
				password: {data: enc, position: pos}
			}}, 'password')

			dec.should.equal('bar')
		});
	});
});
