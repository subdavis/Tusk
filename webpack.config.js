var path = require('path')
var ExtractTextPlugin = require("extract-text-webpack-plugin")
var UglifyJSPlugin = require('uglifyjs-webpack-plugin')
var webpack = require('webpack')

module.exports = {
    entry: {
        'popup': './src/popup.js',
        'options': './src/options.js',
        'background': './background/background.js',
        'inject': './background/inject.js'
    },
    output: {
        publicPath: '/build/',
        path: path.resolve(__dirname, './build'),
        filename: '[name].build.js'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                'vue-style-loader',
                'css-loader',
                'sass-loader'
            ],
        }, {
            test: /\.sass$/,
            use: [
                'vue-style-loader',
                'css-loader',
                'sass-loader?indentedSyntax'
            ],
        }, {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
                loaders: {
                    // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
                    // the "scss" and "sass" values for the lang attribute to the right configs here.
                    // other preprocessors should work out of the box, no loader config like this necessary.
                    'scss': [
                        'vue-style-loader',
                        'css-loader',
                        'sass-loader'
                    ],
                    'sass': [
                        'vue-style-loader',
                        'css-loader',
                        'sass-loader?indentedSyntax'
                    ]
                }
                // other vue-loader options go here
            }
        }, {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [ path.join(__dirname, './src'), path.join(__dirname, './lib'), path.join(__dirname, './services'), path.join(__dirname, './background') ],
        }, {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: "css-loader"
            })
        }, {
            test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url-loader?limit=10000',
        }]
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.runtime.esm.js',
            '$lib': path.resolve(__dirname, 'lib/'),
            '$services': path.resolve(__dirname, 'services/'),
            '$bwr': path.resolve(__dirname, 'bower_components/'),
            '$assets': path.resolve(__dirname, 'assets/'),
            '@': path.resolve(__dirname, 'src/'),
        },
        extensions: ['*', '.js', '.vue', '.json']
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true,
        overlay: true
    },
    performance: {
        hints: false
    },
    plugins: [
        new ExtractTextPlugin({
            filename: (getPath) => {
                return getPath('css/[name].css').replace('css', 'css');
            }
        }),
        new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require('./dll/library-manifest.json')
        }),
		],
    devtool: undefined,
    node: { fs: 'empty' },
}

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = undefined
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new UglifyJSPlugin({
            sourceMap: true
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ])
    // module.exports.entry = merge({
    //   'popup_page': './html/popup.html',
    //   'options_page': './html/options.html',
    // }, module.exports.entry)
}