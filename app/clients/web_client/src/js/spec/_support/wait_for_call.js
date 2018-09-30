require('spec/spec_helper');
const Q = require('q');

const waitForCall = function (object, method) {
  const deferred = Q.defer();

  sinon.stub(object, method).callsFake(function () {
    object[method].restore();
    const result = object[method].apply(this, arguments);
    // If the result is a promise, then wait for it to be resolved
    // before resolving the deferred
    deferred.resolve();

    return result;
  });

  return deferred.promise;
};

module.exports = waitForCall;
