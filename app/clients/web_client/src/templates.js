import _ from 'underscore';
const r = require.context('./js/app', true, /\/templates\/[^/]+\.hbs/);

function basename (path) {
  return path.split(/[\\/]/).pop().split('.').shift();
}

module.exports = _.reduce(r.keys(), function (result, key) {
  let templateName = basename(key);
  result[templateName] = r(key);
  return result;
}, {});
