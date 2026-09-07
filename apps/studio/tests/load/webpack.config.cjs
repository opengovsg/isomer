const path = require("node:path")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const GlobEntries = require("webpack-glob-entries")

module.exports = {
  entry: GlobEntries(path.join(__dirname, "*.test.ts")),
  externals: /^(k6|https?:\/\/)(\/.*)?(?!-trpc)/,
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-typescript"],
            plugins: [
              "@babel/plugin-transform-class-properties",
              "@babel/plugin-transform-object-rest-spread",
            ],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    // Don't minimize, as it's not used in the browser
    minimize: false,
  },
  output: {
    filename: "[name].js",
    libraryTarget: "commonjs",
    path: path.join(__dirname, "build"),
  },
  plugins: [new CleanWebpackPlugin()],
  resolve: {
    extensions: [".ts", ".js"],
  },
  stats: {
    colors: true,
  },
}
