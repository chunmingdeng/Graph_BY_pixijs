const path = require('path');
const webpackBaseConfig = require('./webpack.base.config.js');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const isDev = process.env.NODE_ENV === 'development';

module.exports = merge(webpackBaseConfig, {
    mode: 'production',
    devtool: 'source-map',
    devServer: {
    },
    entry: {
        graphZ:'./src/index.js',
    },
    output: {
        path: path.resolve(__dirname, '../dist/'),
        filename: '[name].js',
        library: "graphz",
        libraryTarget: 'umd',
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, '../static/font/*'),
                to: path.join(__dirname, '../dist/')
            },
            {
                from: path.join(__dirname, '../static/layouter.wasm'),
                to: path.join(__dirname, '../dist/static')
            },
            {
                from: path.join(__dirname, '../types/**/*'),
                to: path.join(__dirname, '../dist/')
            },
        ]),
    ]
});
