import * as path from 'path';
import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

import ModuleLogger from './plugins/moduleLogger';

const config: webpack.Configuration = {
    mode: 'production',
    entry: {
        root: './src/pages/root.tsx',
        root2: './src/pages/root2.tsx',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "buffer": require.resolve("buffer"),
            "stream": false,
        },
    },
    node: false,
    externals: {
        "crypto-browserify": 'crypto-browserify',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new ModuleLogger(),
        new StatoscopeWebpackPlugin({
            saveStatsTo: 'stats.json',
            saveOnlyStats: false,
            statsOptions: { all: true, source: false },
            open: false,
        }),
    ],


};

export default config;