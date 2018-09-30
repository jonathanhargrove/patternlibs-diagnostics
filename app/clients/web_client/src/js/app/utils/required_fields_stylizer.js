class RequiredFieldsStylizer {
  constructor (model, el) {
    this.model = model;
    this.el = el;
  }

  style () {
    _.each(this.model.validations, (settings, name) => {
      if (settings.required) {
        const $field = $(this.el).find(`input[name=${name}]`);
        const label = $field.parent().text().trim();
        $field.before('<strong> *</strong>');
        $field.parents('label').attr('title', label + ' is required');
      }
    });
  }
}

module.exports = RequiredFieldsStylizer;
