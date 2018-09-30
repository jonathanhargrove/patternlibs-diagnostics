require('nexia_framework');
require('vendor/foundation');
require('templates');
require('modernizr');

const Backbone = require('backbone');
const Highcharts = require('highstock');

module.exports = function () {
  // Don't initialize MainRouter until DOMReady
  require('routers/main_router').instance();

  // Google Analytics setup
  /* TODO: This variable isn't used, but it probably should be
  const GA_ENV = {
    'qa-diagnostics': '14',
    'staging-diagnostics': '15',
    'diagnostics': '16'
  };
  */

  Highcharts.setOptions({
    global: {
      useUTC: false
    }
  });

  const env = window.location.host.split(':')[0].split('.')[0];
  if (env === 'localhost') {
    window.ga = function () {};
    //     NOTE: the code below is for local testing of Google Analytics
    //     Make sure you use the correct UA-* code if you're going to use it in the ga('create') call.
    //      `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    //      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    //      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    //      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    //      `
    //      ga('create', 'UA-23039567-13', 'cookieDomain': 'none')
    //      ga('set', 'location', 'https://qa-diagnostics.mynexia.com')
  } else {
    /* eslint-disable */
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-23039567-16', 'auto');
    ga('require', 'linkid');
    ga('send', 'pageview');
    ga('set', 'location', `https://${env}.mynexia.com`);
    /* eslint-enable */
  }

  Backbone.history.start({pushState: true, root: '/'});
};
