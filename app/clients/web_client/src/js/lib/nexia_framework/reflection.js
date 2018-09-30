/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('underscore');

class Reflection {
  static initClass () {
    if (Function.prototype.name === undefined) {
      this.getClassName = obj => obj.constructor.toString().match(/^function\s(.+)\(/)[1];
    }
  }
  static getClassName (obj) {
    return obj.constructor.name;
  }

  static evaluate (functionOrValue, context) {
    if (typeof functionOrValue === 'function') {
      if (context) {
        return functionOrValue.call(context);
      } else {
        return functionOrValue();
      }
    } else {
      return functionOrValue;
    }
  }

  static getAncestorClasses (klass) {
    const results = [];
    while (true) {
      klass = (klass != null) ? klass.__super__ : undefined;
      if (!klass) { break; }
      results.push(klass);
      klass = klass.constructor;
    }
    return results.reverse();
  }

  static getPrototypeOption (obj, key) {
    return Reflection.evaluate(obj[key]);
  }

  static getInheritedPrototypeOption (obj, key) {
    const values = [];
    const ancestors = Reflection.getAncestorClasses(obj.constructor);
    for (let klass of Array.from(ancestors)) {
      const value = klass[key];
      if (value) {
        values.push(value);
      }
    }
    if (obj[key]) {
      values.push(Reflection.evaluate(obj[key]));
    }
    if (_.isEmpty(values)) {
      return null;
    } else {
      return _.extend.apply(_, [{}].concat([...Array.from(values)]));
    }
  }

  static flatten (obj, into, prefix) {
    if (!into) { into = {}; }
    if (!prefix) { prefix = ''; }
    _.each(obj, function (val, key) {
      if (obj.hasOwnProperty(key)) {
        if (val && (typeof val === 'object') && !(val instanceof Date || val instanceof RegExp)) {
          return Reflection.flatten(val, into, prefix + key + '.');
        } else {
          into[prefix + key] = val;
        }
      }
    });
    return into;
  }
}
Reflection.initClass();

module.exports = Reflection;
