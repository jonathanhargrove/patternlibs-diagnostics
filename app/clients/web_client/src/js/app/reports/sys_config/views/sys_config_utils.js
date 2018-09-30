import HandlebarHelpers from 'template_helpers';
import _ from 'underscore';

const helpers = new HandlebarHelpers();

export const selectOptionsForAttributes = (attributes, defaultLabel = 'Choose one...') => {
  return {
    collection: _.map(attributes, (a) => ({
      label: helpers.friendlySystemConfig(a),
      value: a
    })),
    defaultOption: {label: defaultLabel, value: null}
  };
};
