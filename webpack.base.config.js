var path = require('path')
var merge = require('webpack-merge');
var ExtractTextPlugin = require("extract-text-webpack-plugin")
var UglifyJSPlugin = require('uglifyjs-webpack-plugin')
var webpack = require('webpack')

module.exports = {
  entry: {
    'popup': './src/popup.js',
    'options': './src/options.js',
    'background': './background/background.js',
    'inject': './background/inject.js',
    'popup_page': './html/popup.html',
    'options_page': './html/options.html',
    'argon2.wasm': './lib/argon2.wasm'
  },
  output: {
    publicPath: '/',
    filename: '[name].build.js'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader?indentedSyntax'
        ],
      },
      {
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
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.wasm$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]'
        }
      },
      {
        test: /\.html$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]'.replace('_page', '')
        }
      },
      {
        test: /manifest\.json$/,
        loader: 'file-loader',
        options: {
          name: 'manifest.json'
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: "css-loader"
        })
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000',
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '$lib': path.resolve(__dirname, 'lib/'),
      '$services': path.resolve(__dirname, 'services/'),
      '$bwr': path.resolve(__dirname, 'bower_components/'),
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
      filename:  (getPath) => {
        return getPath('css/[name].css').replace('css', 'css');
      }
    }),
  ],
  devtool: '#source-map'
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
