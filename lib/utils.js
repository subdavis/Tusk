const urlencode = function(str) {
	// https://stackoverflow.com/questions/10896807/javascript-encodeuricomponent-doesnt-encode-single-quotes?foo=%27%27
	return encodeURIComponent(str).replace(/[!'()*]/g, escape);
}

const getValidTokens = tokenString => {
	if (!tokenString)
		return []
	else
		return tokenString.toLowerCase().split(/\.|\s|\//).filter(t => {
			return (t && t !== "com" && t !== "www" && t.length > 1)
		})
} // end getValidTokens

const parseUrl = url => {
	if (url && !url.indexOf('http') == 0)
		url = 'http://' + url
	//from https://gist.github.com/jlong/2428561
	var parser = document.createElement('a')
	parser.href = url
	return parser
} // end parseUrl

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export {
	getValidTokens,
	parseUrl,
	urlencode,
	guid
}