import templates from 'templates';
import Framework from 'nexia_framework';
import ShutdownDeviceItemView from './shutdown_device_item_view';

export default Framework.CollectionView.extend({
  template: templates['shutdown_devices'],

  events: {
    'click [data-js="add-shutdown-device"]': 'addShutdownDevice'
  },

  initialize (options) {
    this.state = options.state;
    this.listenTo(this.collection, 'change', this.maybeRender);
    this.listenTo(this.collection, 'remove', this.render);
  },

  itemContainer: '[data-js="shutdown-devices-list"]',

  itemView (model) {
    return new ShutdownDeviceItemView({
      collection: this.collection,
      model: model,
      state: this.state
    });
  },

  templateContext () {
    return {
      state: this.state.attributes
    };
  },

  // Render on change so that selecting an options will rerender the "other"
  // dropdowns correctly, but don't render if the change event is coming from
  // stickit bindings for the "other" text boxes, since that will blow away
  // (and so unfocus) the input that the user is typing in
  maybeRender (model, options = {}) {
    if (options.stickitChange && (/^other/.test(options.stickitChange.observe))) {
      return;
    }
    return this.render();
  },

  addShutdownDevice () {
    this.collection.add({});
  }
});
