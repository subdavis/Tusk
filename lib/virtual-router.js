module.exports = function() {
	this.routes = []
	this.routeStack = []

	this.registerRoutes = routes => {
		this.routes.push(...routes)
	}

	this.route = (path) => {
		let parsed = this.parse(path)
		if (parsed !== false) {
			this.routeStack.push(parsed)
			this.show(parsed._path)
		} else {
			console.error(path + " is not a valid path.")
		}
	}

	this.processHash = (hash) => {
		/* 
			Returns a path provided it will parse
		*/
		if (hash.length <= 1)
			return false;
		if (hash.indexOf('#/') !== 0)
			return false;
		let hashroute = hash.substring(1)
		let parsed = this.parse(hashroute)
		if (parsed)
			return hashroute;
		return false;
	}

	this.goBack = () => {
		let current = this.routeStack.pop()
		if (this.routeStack.length) {
			let last = this.routeStack[this.routeStack.length - 1]
			this.show(last._path)
		}
	}

	this.getRoute = () => {
		if (this.routeStack.length >= 1)
			return this.routeStack[this.routeStack.length - 1]
		return null
	}

	this.isActive = (path) => {
		if (this.routeStack.length >= 1) {
			let last = this.routeStack[this.routeStack.length - 1]
			return last._path === path
		}
		return false
	}

	/* Given a path an a list of path templates, 
	   Decide whether or not the path is valid. 

	   If the url is valid, return object with keys
	    else, return false

	    Examples: 
	    parse('/foo/bar', ['/a','/b/c','/foo/:key']) => { key: 'bar', _path: '/foo/:key' }
	    parse('/foo/bar', ['/a','/b/c']) => false
	*/
	this.parse = (path) => {
		let paths = this.routes
		let path_parts = path.split('/')
		for (let paths_index = 0; paths_index < paths.length; paths_index++) {
			let candidate_parts = paths[paths_index].route.split('/')
			if (candidate_parts.length === path_parts.length) {
				let keys = {
					_path: paths[paths_index].route
				}
				for (let cp_i = 0; cp_i < candidate_parts.length; cp_i++) {
					if (candidate_parts[cp_i].indexOf(':') === 0) {
						let key = candidate_parts[cp_i].substring(1)
						let val = path_parts[cp_i]
						keys[key] = val
					} else if (candidate_parts[cp_i] !== path_parts[cp_i]) {
						break
					}

					if (cp_i === candidate_parts.length - 1)
						return keys
				}
			}
		}
		return false
	}

	this.show = path => {
		this.routes.forEach(r => {
			if (r.route !== path)
				r.var.visible = false
			else
				r.var.visible = true
		})
	}

	return this
}