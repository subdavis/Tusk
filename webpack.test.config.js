var path = require('path')

module.exports = {
	entry: {
		'bundle': './tests/test.js'
	},
	output: {
      publicPath: '/tests/',
      path: path.resolve(__dirname, './tests'),
      filename: '[name].build.js'
  },
	module: {
    rules: [{
	      test: /test\.js$/,
	      use: 'mocha-loader',
	      exclude: /node_modules/,
    }, {
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
        exclude: /node_modules/
    }, {
        test: /\.(png|jpg|gif|svg|kdbx)$/,
        exclude: '/.*/',
        loader: 'ignore-loader'
    }, {
        test: /\.html$/,
        loader: 'file-loader',
        options: {
            name: '[name].[ext]'.replace('_page', '')
        }
    }]
  },
  externals: {
	  fs: '{}'
	},
	resolve: {
      alias: {
          'vue$': 'vue/dist/vue.esm.js',
          '$lib': path.resolve(__dirname, 'lib/'),
          '$services': path.resolve(__dirname, 'services/'),
          '$bwr': path.resolve(__dirname, 'bower_components/'),
          '$assets': path.resolve(__dirname, 'assets/'),
          '@': path.resolve(__dirname, 'src/'),
      },
      extensions: ['*', '.js', '.vue', '.json']
  },
}