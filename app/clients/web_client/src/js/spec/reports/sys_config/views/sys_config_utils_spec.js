import {
  selectOptionsForAttributes
} from 'reports/sys_config/views/sys_config_utils';

require('spec/spec_helper');

describe('sys_config_utils', function () {
  it('selectOptionsForAttributes transforms attributes', function () {
    let attributesDouble = ['fake_attribute'];
    let expected = {
      collection: [
        {
          label: 'Fake Attribute',
          value: 'fake_attribute'
        }
      ],
      defaultOption: {label: 'Choose one...', value: null}
    };
    let actual = selectOptionsForAttributes(attributesDouble);
    expect(actual).toEqual(expected);
  });
});
