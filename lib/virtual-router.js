module.exports = function(routes) {
    this.routes = routes
    this.routeStack = []
    
    this.route = path => {
        let parsed = parse(path, this.paths)
        if (parsed !== false){
            this.routeStack.push(parsed)
            show(parsed._path)
        } else {
            console.error(path + " is not a valid path.")
        }
    }

    this.goBack = () => {
        let current = this.routeStack.pop()
        if (this.routeStack.length){
            let last = this.routeStack[this.routeStack.length - 1]
            show(last._path)
        }
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
        for(let paths_index = 0; paths_index < paths.length; paths_index++){
            let candidate_parts = paths[paths_index].split('/')
            if (candidate_parts.length === path_parts.length){
                let keys = {
                    _path: paths[paths_index]
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

    let show = path => {
        let elem = document.getElementById(path)
        if (elem !== undefined)
            elem.style.display = 'block'
        if (this.currentRoute !== undefined){
            let elem = document.getElementById(this.currentRoute)
            if (elem !== undefined)
                elem.style.display = 'none'
        }
    }

    return this
}