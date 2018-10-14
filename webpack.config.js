var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    main: './src/client/js/client.js'
  },
  output: {
    path: path.resolve('./dist/client/js'),
    filename: 'client.js'
  },
  module: {
    loaders: [{loader: 'babel-loader'}]
  },
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ],
  resolve: {
    root: __dirname,
    modulesDirectories: ['node_modules/tone', 'node_modules']
  }
};
