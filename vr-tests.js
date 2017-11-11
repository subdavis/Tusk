const vr = require('./lib/virtual-router.js');

let a = new vr([
	'/foo/bar',
	'/baz',
	'/bing/:bang',
	'/bing/:bang/billyyy',
	'/:shit/:is/cray'
])

console.log(a.parse('/asdf'))
console.log(a.parse('/baz'))
console.log(a.parse('/bing/boooooom'))
console.log(a.parse('/bing/biff/billyyy'))
console.log(a.parse('/that/be/cray'))
console.log(a.parse('/foo/bar/baz'))