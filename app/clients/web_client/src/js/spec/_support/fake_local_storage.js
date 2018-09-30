require('spec/spec_helper');

class FakeLocalStorage {
  constructor (attributes) {
    if (attributes == null) { attributes = {}; }
    this.values = _.defaults({}, attributes);
  }

  setItem (key, value) {
    this.values[key] = value;
  }

  getItem (key) {
    return this.values[key];
  }

  removeItem (key) {
    delete this.values[key];
  }
}

module.exports = FakeLocalStorage;
