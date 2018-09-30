// require all modules ending in "test" or "spec" from the
// current directory and all subdirectories, expect files beginning with an
// underscore (a la SCSS or Handlebars partials)
var testsContext = require.context('.', true, /^[^_].+(test|spec)$/);
testsContext.keys().forEach(testsContext);
