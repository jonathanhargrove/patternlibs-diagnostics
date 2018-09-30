/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class Cookies {} // Adapted from: https://developer.mozilla.org/en-US/docs/DOM/document.cookie
if (!document.cookie) { document.cookie = ''; }

Cookies.get = key =>
  unescape(document.cookie.replace(new RegExp('(?:(?:^|.*;\\s*)' +
  escape(key).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*)|.*'), '$1')) || null
;

Cookies.set = function (key, value, end, path, domain, secure) {
  if (!key || /^(?:expires|max-age|path|domain|secure)$/i.test(key)) { return false; }
  let expires = '';
  if (end) {
    switch (end.constructor) {
      case Number:
        expires = (end === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : `; max-age=${end}`);
        break;
      case String:
        expires = `; expires=${end}`;
        break;
      case Date:
        expires = `; expires=${end.toGMTString()}`;
        break;
    }
  }
  document.cookie = escape(key) + '=' + escape(value) + expires +
    ((domain ? `; domain=${domain}` : ''))   +
    ((path ? `; path=${path}` : '')) +
    ((secure ? '; secure' : ''));
  return true;
};

Cookies.delete = function (key, path, forceDelete) {
  const noKey        = !(key  && Cookies.hasKey(key));
  const keyProtected = (Cookies.protected.indexOf(key) > -1);
  const undeleteable = noKey || (keyProtected && !forceDelete);
  if (undeleteable) { return false; }
  document.cookie = escape(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + ((path ? `; path=${path}` : ''));
  return true;
};

Cookies.clear = forceDelete =>
  Array.from(Cookies.keys()).map((key) =>
    Cookies.delete(key, null, forceDelete))
;

Cookies.hasKey = key => (new RegExp(`(?:^|;\\s*)${escape(key).replace(/[-.+*]/g, '\\$&')}\\s*\\=`)).test(document.cookie);

Cookies.keys = function () {
  let keys = document.cookie.replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:=[^;]*)?;\s*/);
  keys = _.without(keys, '');
  let idx = 0;
  while (idx < keys.length) {
    keys[idx] = unescape(keys[idx]);
    idx++;
  }
  keys = _.without(keys, ...Array.from(Cookies.ignored));
  return keys;
};

Cookies.protected = ['stream_id'];

Cookies.ignored = ['_ga'];

Cookies.uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    })
;

Cookies.setStreamId = function () {
  if (Cookies.hasKey('stream_id')) { return; }

  return this.set('stream_id', Cookies.uuid());
};

module.exports = Cookies;
