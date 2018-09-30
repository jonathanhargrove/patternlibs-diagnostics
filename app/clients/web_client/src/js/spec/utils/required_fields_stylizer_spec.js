define(function (require) {
  require('spec/spec_helper');
  const RequiredFieldsStylizer = require('utils/required_fields_stylizer');

  describe('RequiredFieldsStylizer', function () {
    beforeEach(function () {
      const model = {
        validations: {
          fieldA: {
            required: true
          },
          fieldB: {}
        }
      };

      this.$el = $(`\
<label>Field A \
<input name="fieldA"/> \
</label> \
<label>Field B \
<input name="fieldB"/> \
</label>\
`);

      new RequiredFieldsStylizer(model, this.$el).style();

      this.fieldALabel = this.$el.find('input[name=fieldA]').parent();
      this.fieldBLabel = this.$el.find('input[name=fieldB]').parent();
    });

    describe('#style', function () {
      it('adds an asterisk next to the required field\'s label', function () {
        expect(this.fieldALabel.text()).toContain('*');
        expect(this.fieldBLabel.text()).not.toContain('*');
      });

      it('adds a title to the field\'s label', function () {
        expect(this.fieldALabel.attr('title')).toBe('Field A is required');
        expect(this.fieldBLabel.attr('title')).toBe(undefined);
      });
    });
  });
});
