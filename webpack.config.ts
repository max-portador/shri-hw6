import * as path from 'path'
import * as webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ModuleLogger from './plugins/moduleLogger'
import StatoscopeWebpackPlugin from '@statoscope/webpack-plugin'
const TerserPlugin = require("terser-webpack-plugin")



const webpackPlugins = [
    // new HtmlWebpackPlugin({
    //     filename: './src/index.html'
    // }),
    new ModuleLogger({
        directories: [path.join(__dirname, 'src')],
        root: __dirname,
        exclude: [path.join(__dirname, 'src', 'index.html')]
    }),
    new StatoscopeWebpackPlugin({
        saveStatsTo: 'stats.json',
        saveOnlyStats: false,
        open: false,
    })
]

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
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            'buffer': require.resolve("buffer"),
            'stream': false,
        },
    },
    externals: {
        'crypto-browserify': 'crypto-browserify',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
    },
    plugins: webpackPlugins,
    devtool: "eval-source-map",
    node: {
        global: false,
    },
}

export default config