const should = require('should')
const utils = require("$lib/utils.js")

describe("Utils.js", function(){
	it("should be able to decrypt that which was encrypted", function(done){
		utils.encrypt("foobar").then(values => {
			let encrypted = values[0];
			let keyData = values[1];
			utils.decrypt(JSON.stringify(keyData), encrypted).then(decrypted => {
				if (decrypted === "foobar")
					done()
			})
		})
	})
});