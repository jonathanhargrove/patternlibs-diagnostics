const Handlebars = require('handlebars');
const _ = require('underscore');

class TemplateUtils {
  static templateNamespace () {
    return window.HandlebarsTemplates || window.JST;
  }

  static renderTemplate (template, context, helpers) {
    return template(context, {
      'helpers': _.extend({}, Handlebars.helpers, helpers)
    });
  }

  static assignTemplates (classNamespace, templateBasePath) {
    if (this.templateNamespace() == null) { return; }

    for (let klassName in classNamespace) {
      const klass = classNamespace[klassName];
      const templateName = _.underscored(klassName);
      if (templateBasePath) {
        if (!_.endsWith(templateBasePath, '/')) { templateBasePath += '/'; }
      } else {
        templateBasePath = '';
      }

      if (!klass.prototype.template) {
        klass.prototype.template = this.templateNamespace()[`${templateBasePath}${templateName}`];
      }
    }
  }
}

module.exports = TemplateUtils;
