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
}

/**
 * parseUrl creates an anchor element from a url string
 * @param {String} url
 * @returns {HTMLHyperlinkElementUtils} 
 */
const parseUrl = url => {
	// Default to http, unencrypted if not specified.
	if (!url) {
		return null
	}
	if (url && !url.indexOf('http') == 0){
		url = 'http://' + url
	}	
	// from https://gist.github.com/jlong/2428561
	var parser = document.createElement('a');
	parser.href = url;

	/**
	 * parser.protocol; // => "http:"
	 * parser.hostname; // => "example.com"
	 * parser.port;     // => "3000"
	 * parser.pathname; // => "/pathname/"
	 * parser.search;   // => "?search=test"
	 * parser.hash;     // => "#hash"
	 * parser.host;     // => "example.com:3000"
	 * parser.origin    // => "http://example.com:3000"
	 */

	return parser;
}

const guid = () => {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * function to tell if the element can be seen by a human.
 * @param el DOM element
 * @returns booleans
 */
const isVisible = el => {
	return el.offsetWidth > 0 && 
		el.offsetHeight > 0 &&
		parseFloat(window.getComputedStyle(el).getPropertyValue('opacity')) > .1
}

const isFirefox = () => {
	return "browser" in window;
}

const shallowCopy = obj => {
	const clone = {};
	clone.prototype = obj.prototype
	Object.keys(obj).forEach(property => {
		clone[property] = obj[property];
	})
	return clone;
}

// https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object#728694
const deepCopy = (obj) => {
	var copy;
	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;
	// Handle Date
	if (obj instanceof Date) {
			copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
	}
	// Handle Array
	if (obj instanceof Array) {
			copy = [];
			for (var i = 0, len = obj.length; i < len; i++) {
					copy[i] = clone(obj[i]);
			}
			return copy;
	}
	// Handle Object
	if (obj instanceof Object) {
			copy = {};
			for (var attr in obj) {
					if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
			}
			return copy;
	}
	throw new Error("Unable to copy obj! Its type isn't supported.");
};

const objectDestroy = (obj) => {
	for (var prop in obj) {
		var property = obj[prop];
		if (property != null && typeof (property) == 'object') {
			destroy(property);
		} else {
			obj[prop] = null;
		}
	}
};

export {
	getValidTokens,
	parseUrl,
	urlencode,
	guid,
	isVisible,
	isFirefox,
	shallowCopy,
	deepCopy,
	objectDestroy,
}