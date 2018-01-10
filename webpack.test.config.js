var path = require('path')

module.exports = {
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
        exclude: /node_modules/
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