const should = require('should')

import { KeepassReference } from '$services/keepassReference.js'

describe('Keepass References', function () {

	// http://keepass.info/help/base/fieldrefs.html

	var refService = KeepassReference();
	var entry = {
		id: "1",
		title: 'Sample Title',
		userName: 'UserX',
		url: 'http://keepass.info/',
		notes: 'Some notes',
		password: 'Some password',
		emailAddress: 'something@keepass.info',
		keys: ['emailAddress'],
		protectedData: {
			password: {
				salt: [110, 94, 37, 39, 147, 236, 128, 161],
				value: [62, 63, 86, 84, 228, 131, 242, 197]
			}
		}
	};
	var entry2 = {
		id: "2b",
		title: 'Sample Title2',
		userName: 'UserX2',
		url: 'http://keepass.info/2',
		notes: 'Some notes2',
		password: 'Some password2',
		emailAddress: 'something2@keepass.info',
		keys: ['emailAddress'],
		protectedData: {
			password: {
				salt: [110, 94, 37, 39, 147, 236, 128, 161],
				value: [62, 63, 86, 84, 228, 131, 242, 197]
			}
		}
	};
	var entry3 = {
		id: 3,
		title: 'Sample Title3',
		userName: 'UserX3',
		url: 'http://keepass.info/3',
		notes: 'Some notes3',
		password: 'Some password3',
		emailAddress: 'something3@keepass.info',
		keys: ['emailAddress'],
		protectedData: {
			password: {
				salt: [110, 94, 37, 39, 147, 236, 128, 161],
				value: [62, 63, 86, 84, 228, 131, 242, 197]
			}
		}
	};
	var entries = [entry, entry2, entry3];

	describe('Current Entry', function() {

		it('should resolve title', function() {
			refService.resolveReference('{TITLE}', entry, entries).should.equal(entry.title);
		});
		it('should resolve username', function() {
			refService.resolveReference('{USERNAME}', entry, entries).should.equal(entry.userName);
		});
		it('should resolve url', function() {
			refService.resolveReference('{URL}', entry, entries).should.equal(entry.url);
		});
		it('should resolve password', function() {
			refService.resolveReference('{PASSWORD}', entry, entries).should.equal(entry.password);
		});
		it('should resolve notes', function() {
			refService.resolveReference('{NOTES}', entry, entries).should.equal(entry.notes);
		});
		it('should not be case-sensitive', function() {
			refService.resolveReference('{notes}', entry, entries).should.equal(entry.notes);
		});
		it('should return the expression back if not able to evaluate', function() {
			refService.resolveReference('{sdaads}', entry, entries).should.equal('{sdaads}');
		})
		it('should support a custom field name', function() {
			refService.resolveReference('{S:EmailAddress}', entry, entries).should.equal(entry.emailAddress);
		})
	})

	describe('All entries', function() {
		it('should resolve wanted title', function() {
			refService.resolveReference('{REF:T@I:2B}', entry, entries).should.equal(entry2.title);
		})
		it('should resolve wanted username', function() {
			refService.resolveReference('{REF:U@I:2B}', entry, entries).should.equal(entry2.userName);
		})
		it('should resolve wanted url', function() {
			refService.resolveReference('{REF:A@I:2b}', entry, entries).should.equal(entry2.url);
		})
		it('should resolve wanted password', function() {
			refService.resolveReference('{REF:P@I:2b}', entry, entries).should.equal("Password");
		})
		it('should resolve wanted notes', function() {
			refService.resolveReference('{REF:N@I:2b}', entry, entries).should.equal(entry2.notes);
		})
		it('should resolve wanted id', function() {
			refService.resolveReference('{REF:I@I:2B}', entry, entries).should.equal(entry2.id);
		})
		it('should return expression back when unknown wanted field', function() {
			refService.resolveReference('{REF:Z@I:2b}', entry, entries).should.equal('{REF:Z@I:2b}');
		})
		it('should return expression back when unmatched text', function() {
			refService.resolveReference('{REF:Z@I:3333}', entry, entries).should.equal('{REF:Z@I:3333}');
		})

		it('should search in title', function() {
			refService.resolveReference('{REF:I@T:' + entry2.title + '}', entry, entries).should.equal(entry2.id);
		})
		it('should search in user name', function() {
			refService.resolveReference('{REF:I@U:' + entry2.userName + '}', entry, entries).should.equal(entry2.id);
		})
		it('should search in password', function() {
			refService.resolveReference('{REF:I@P:' + entry2.password + '}', entry, entries).should.equal(entry2.id);
		})
		it('should search in url', function() {
			refService.resolveReference('{REF:I@A:' + entry2.url + '}', entry, entries).should.equal(entry2.id);
		})
		it('should search in notes', function() {
			refService.resolveReference('{REF:I@N:' + entry2.notes + '}', entry, entries).should.equal(entry2.id);
		})
		it('should search in id', function() {
			refService.resolveReference('{REF:I@I:' + entry2.id + '}', entry, entries).should.equal(entry2.id);
		})
		it('should return expression back when unknown search field', function() {
			refService.resolveReference('{REF:I@Z:2b}', entry, entries).should.equal('{REF:I@Z:2b}');
		})
		it('should return expression back when unmatched text', function() {
			refService.resolveReference('{REF:I@I:3333}', entry, entries).should.equal('{REF:I@I:3333}');
		})

		it('should search in custom strings', function() {
			refService.resolveReference('{REF:I@O:' + entry2.emailAddress + '}', entry, entries).should.equal(entry2.id);
		})

	})

	describe('checking if field has references', function() {
		it('should return true if has simple reference', function() {
			refService.hasReferences('{REF:I@O:something}', entry, entries).should.be.true;
		})		
		it('should return true if has embedded simple reference', function() {
			refService.hasReferences('something {TITLE} something', entry, entries).should.be.true;
		})		
		it('should return false if no reference', function() {
			refService.hasReferences('something something', entry, entries).should.be.false;
		})		
	})

	describe('interpolating multiple references', function() {
		it('should work with a simple reference', function() {
			refService.processAllReferences(3, '{TITLE}', entry, entries).should.equal(entry.title);
		})
		it('should work with a reference at the start', function() {
			refService.processAllReferences(3, '{TITLE} ', entry, entries).should.equal(entry.title + ' ');
		})
		it('should work with a reference at the end', function() {
			refService.processAllReferences(3, ' {TITLE}', entry, entries).should.equal(' ' + entry.title);
		})
		it('should work with a reference in the middle', function() {
			refService.processAllReferences(3, ' {TITLE} ', entry, entries).should.equal(' ' + entry.title + ' ');
		})
		it('should work with multiple references', function() {
			refService.processAllReferences(3, ' {TITLE} {TITLE} ', entry, entries).should.equal(' ' + entry.title + ' ' + entry.title + ' ');
		})
		it('should return the given for no references', function() {
			refService.processAllReferences(3, 'something', entry, entries).should.equal('something');
		})
		it('should return unrecognized expressions as-is', function() {
			refService.processAllReferences(3, ' {TITLE} {nothing} ', entry, entries).should.equal(' ' + entry.title + ' {nothing} ');
		})
	})

})
