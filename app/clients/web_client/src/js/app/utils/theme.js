const templates       = require('templates');

const THEMES = {
  nexia: {
    productName: 'Nexia™ Diagnostics',
    favicon: 'img/favicon.ico'
  },
  trane: {
    productName: 'Trane™ Commercial',
    favicon: 'img/favicon_trane_logo.ico'
  }
};

class Theme {
  static set (theme) {
    if (theme === 'trane') {
      $('body').attr('data-theme', 'trane');
      $('#trane-legal-footer').html(templates['trane_legal_footer']);
    } else if (theme === 'nexia') {
      $('body').attr('data-theme', 'nexia');
    } else {
      console.error(`Theme '${theme}' doesn't exist`);
      return;
    }

    const $favicon = $(`<link rel='shortcut icon' href='${THEMES[theme].favicon}' />`);
    $('head').append($favicon);

    return $('title').html(THEMES[theme].productName);
  }

  static productName () {
    const name = $('body').attr('data-theme');
    return THEMES[name].productName;
  }

  static current () {
    return $('body').attr('data-theme');
  }

  static isNexia () {
    return $('body').attr('data-theme') === 'nexia';
  }

  static isTrane () {
    return $('body').attr('data-theme') === 'trane';
  }
};

module.exports = Theme;
