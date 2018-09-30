const ExtractTextPlugin             = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin             = require('html-webpack-plugin');
const UglifyJSPlugin                = require('uglifyjs-webpack-plugin');
const path                          = require('path');
const {DefinePlugin, ProvidePlugin} = require('webpack');
const {getIfUtils, removeEmpty}     = require('webpack-config-utils');

const ALARM_DESCRIPTIONS_SCHEMA = require('./etc/alarm-descriptions-schema');

const _                         = require('underscore');
const underscoreString          = require('underscore.string');
_.mixin(underscoreString.exports());

const fs                        = require('fs');

const apiVersion = _.strip(fs.readFileSync(path.resolve(__dirname, '../../config/api_version')));

module.exports = (env = 'development') => {
  const {ifProduction, ifTest} = getIfUtils(env);

  return {
    amd: { jQuery: true },
    context: path.resolve(__dirname, 'src'),
    devtool: ifProduction('source-map', 'inline-source-map'),

    entry: {
      main: [
        './webpack-init.js',
        './styles/app-styles.scss'
      ]
    },

    output: {
      path: path.resolve(__dirname, 'bin'),
      filename: 'js/[name].bundle.js',
      publicPath: '/'
    },

    module: {
      // Don't parse require statements in these
      // see https://github.com/webpack/webpack/issues/198#issuecomment-104688430
      noParse: [/moment.js/, /sinon.js/],
      rules: [
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            use: [{
              loader: 'css-loader',
              options: {
                minimize: ifProduction(),
                root: path.resolve(__dirname, 'src')
              }
            }, 'postcss-loader', 'sass-loader'],
            fallback: 'style-loader'
          })
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: 'fonts/[name].[ext]'
            }
          }
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: {
            loader: 'file-loader',
            query: {
              name: 'img/[name].[ext]'
            }
          }
        },
        {
          test: /\.hbs$/,
          use: {
            loader: 'handlebars-loader'
          }
        },
        {
          test: require.resolve('backbone'),
          use: 'imports-loader?this=>{jQuery: require("jquery")}'
        },
        {
          test: /jquery\.simplePagination\.js/,
          use: 'imports-loader?jQuery=>require("jquery")'
        },
        {
          test: /\.js$/,
          exclude: /(node_modules|\/src\/js\/vendor)/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\/vendor\/custom.modernizr.js$/,
          use: 'imports-loader?this=>window,html5=>window.html5'
        },
        {
          test: /\.ya?ml/,
          use: [
            'json-loader',
            {
              loader: 'yaml-loader',
              options: {
                schema: ALARM_DESCRIPTIONS_SCHEMA
              }
            }
          ]
        }
      ]
    },

    plugins: removeEmpty([
      new ExtractTextPlugin('styles/[name].bundle.css'),
      new HtmlWebpackPlugin({
        inject: 'head',
        template: path.resolve(__dirname, './views/index.hbs'),
        hash: ifProduction(),
        isProduction: ifProduction()
      }),
      new HtmlWebpackPlugin({
        filename: 'maintenance.html',
        template: path.resolve(__dirname, './views/maintenance.hbs'),
        hash: ifProduction(),
        inject: false
      }),
      new DefinePlugin({
        CLIENT_VERSION: `"${apiVersion}"`,
        RACK_ENV: (process.env.RACK_ENV ? `"${process.env.RACK_ENV}"` : '"development"')
      }),
      ifProduction(new UglifyJSPlugin({sourceMap: true})),
      ifTest(new ProvidePlugin({sinon: 'sinon'}))
    ]),

    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        static_data: path.resolve(__dirname, '../../adapters/persistence/static_data'),

        // node_modules
        handlebars: path.resolve(__dirname, './node_modules/handlebars/runtime.js'),
        highstock: path.resolve(__dirname, './node_modules/highstock-release/highstock.js'),
        'foundation-datepicker': path.resolve(__dirname, './node_modules/foundation-datepicker/js/foundation-datepicker.js'),
        jquery: path.resolve(__dirname, './node_modules/jquery/dist/jquery.js'),
        sinon: path.resolve(__dirname, './node_modules/sinon/pkg/sinon.js'),

        // src
        alarm_history: path.resolve(__dirname, './src/js/app/reports/alarm_history'),
        alarms: path.resolve(__dirname, './src/js/app/reports/alarms'),
        alerts: path.resolve(__dirname, './src/js/app/alerts'),
        app: path.resolve(__dirname, './src/js/app'),
        current_status: path.resolve(__dirname, './src/js/app/reports/current_status'),
        customers: path.resolve(__dirname, './src/js/app/customers'),
        dashboard: path.resolve(__dirname, './src/js/app/dashboard'),
        dealers: path.resolve(__dirname, './src/js/app/dealers'),
        devices: path.resolve(__dirname, './src/js/app/devices'),
        notification_recipients: path.resolve(__dirname, './src/js/app/notification_recipients'),
        infrastructure: path.resolve(__dirname, './src/js/app/infrastructure'),
        lib: path.resolve(__dirname, './src/js/lib'),
        nexia_framework: path.resolve(__dirname, './src/js/lib/nexia_framework'),
        notifications: path.resolve(__dirname, './src/js/app/notifications'),
        reports: path.resolve(__dirname, './src/js/app/reports'),
        restrictions: path.resolve(__dirname, './src/js/app/restrictions'),
        root: path.resolve(__dirname, './src/js/app/root'),
        routers: path.resolve(__dirname, './src/js/app/root/routers'),
        runtime_history: path.resolve(__dirname, './src/js/app/reports/runtime_history'),
        site_messages: path.resolve(__dirname, './src/js/app/site_messages'),
        spiders: path.resolve(__dirname, './src/js/app/spiders'),
        sys_components: path.resolve(__dirname, './src/js/app/reports/sys_components'),
        sys_config: path.resolve(__dirname, './src/js/app/reports/sys_config'),
        systems: path.resolve(__dirname, './src/js/app/systems'),
        template_helpers: path.resolve(__dirname, './src/js/app/template/handlebars_helpers.js'),
        templates: path.resolve(__dirname, './src/templates.js'),
        utils: path.resolve(__dirname, './src/js/app/utils'),
        spec: path.resolve(__dirname, './src/js/spec'),
        spec_unit: path.resolve(__dirname, './src/js/spec/unit'),
        spec_integration: path.resolve(__dirname, './src/js/spec/integration'),

        // vendor
        vendor: path.resolve(__dirname, './src/js/vendor'),
        modernizr: path.resolve(__dirname, './src/js/vendor/custom.modernizr.js'),
        q: path.resolve(__dirname, './src/js/vendor/q.js'),
        simple_pagination: path.resolve(__dirname, './src/js/vendor/jquery.simplePagination.js'),
        rate_limit: path.resolve(__dirname, './src/js/vendor/underscore-ratelimit.js')
      }
    }
  };
};
