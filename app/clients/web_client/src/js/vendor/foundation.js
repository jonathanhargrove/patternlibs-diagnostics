var r = require.context('./foundation', true, /\/foundation\.\w+\.js/);

function basename(path) {
  return path.split(/[\\/]/).pop().split('.').shift();
}

require('imports-loader?this=>window,jQuery=jquery!./foundation/foundation.js');

_.each(r.keys(), function(file) {
    r(file);
});
