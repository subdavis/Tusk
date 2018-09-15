var path = require("path");
var webpack = require("webpack");
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    context: process.cwd(),
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.less', '.css'],
        modules: [__dirname, 'node_modules']
    },
    entry: {
        library: [
            "axios",
            "babel-regenerator-runtime",
            "base64-arraybuffer",
            "case",
            "json-formatter-js",
            "kdbxweb",
            "materialize-css",
            "pako",
            "vue/dist/vue.runtime.esm.js",
            "vue-simple-spinner",
            "webdav",
            "xmldom",
        ]
    },
    output: {
        path: path.join(__dirname, "dll"),
        filename: "dll.[name].js",
        library: "[name]"
    },
    plugins: [
        new webpack.DllPlugin({
            path: path.join(__dirname, "dll", "[name]-manifest.json"),
            name: "[name]",
        }),
        new UglifyJSPlugin({}),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        })
    ]
};