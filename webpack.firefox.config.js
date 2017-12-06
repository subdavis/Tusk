const webpack = require('webpack');
const path = require('path')
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.config.js');

module.exports = merge(baseConfig, {
	output: {
		path: path.resolve(__dirname, './dist-firefox')
	},
	entry: {
		'manifest': './firefox.manifest.json'
	}
})