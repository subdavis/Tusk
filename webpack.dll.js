var path = require("path");
var webpack = require("webpack");

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
            "jquery",
            "json-formatter-js",
            "kdbxweb",
            "materialize-css",
            "pako",
            "vue",
            "vue-simple-spinner",
            "webdav-client",
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
        new webpack.optimize.UglifyJsPlugin()
    ]
};