const urlencode = function(str) {
	// https://stackoverflow.com/questions/10896807/javascript-encodeuricomponent-doesnt-encode-single-quotes?foo=%27%27
	return encodeURIComponent(str).replace(/[!'()*]/g, escape);
}

export {
	urlencode
}