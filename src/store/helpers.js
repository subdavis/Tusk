function validate(validators, objects) {
	Object.keys(objects).forEach(key => {
		validators[key](objects[key])
	})
}

export {
	validate,
}
